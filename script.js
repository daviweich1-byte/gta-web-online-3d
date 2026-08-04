(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const menu = $("menu");
  const hud = $("hud");
  const controles = $("controles");
  const mensagem = $("mensagem");
  const nomeInput = $("nomeInput");
  const nomeHud = $("nomeHud");
  const vidaHud = $("vidaHud");
  const dinheiroHud = $("dinheiroHud");
  const missaoHud = $("missaoHud");
  const salvarChave = "gtaWebOnline3D_save";

  let scene, camera, renderer, jogador, carro, alvoMissao;
  let jogando = false;
  let noCarro = false;
  let vida = 100;
  let dinheiro = 0;
  let nome = "Jogador";
  let missao = 1;
  const teclas = {};
  const relogio = new THREE.Clock();

  function caixa(cor, largura, altura, profundidade) {
    const material = new THREE.MeshLambertMaterial({ color: cor });
    const geometria = new THREE.BoxGeometry(largura, altura, profundidade);
    const objeto = new THREE.Mesh(geometria, material);
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    return objeto;
  }

  function iniciarCena() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87b9df);
    scene.fog = new THREE.Fog(0x87b9df, 70, 210);

    camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 500);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x4d6338, 2.2));
    const sol = new THREE.DirectionalLight(0xffffff, 2.6);
    sol.position.set(35, 60, 25);
    sol.castShadow = true;
    scene.add(sol);

    const chao = caixa(0x477d3a, 240, 1, 240);
    chao.position.y = -0.5;
    scene.add(chao);

    const rua1 = caixa(0x30343a, 220, 0.06, 15);
    rua1.position.y = 0.03;
    scene.add(rua1);
    const rua2 = caixa(0x30343a, 15, 0.07, 220);
    rua2.position.y = 0.04;
    scene.add(rua2);

    criarCidade();
    criarJogador();
    criarCarro();
    criarMissao();
    addEventListener("resize", redimensionar);
    addEventListener("keydown", aoPressionar);
    addEventListener("keyup", (e) => { teclas[e.code] = false; });
    animar();
  }

  function criarCidade() {
    for (let x = -90; x <= 90; x += 25) {
      for (let z = -90; z <= 90; z += 25) {
        if (Math.abs(x) < 13 || Math.abs(z) < 13) continue;
        const altura = 8 + Math.random() * 25;
        const predio = caixa(new THREE.Color().setHSL(0.55 + Math.random() * 0.12, 0.25, 0.32 + Math.random() * 0.2), 14, altura, 14);
        predio.position.set(x, altura / 2, z);
        scene.add(predio);
      }
    }
  }

  function criarJogador() {
    jogador = new THREE.Group();
    const corpo = caixa(0x2266dd, 1.2, 2.1, 0.8);
    corpo.position.y = 1.65;
    jogador.add(corpo);
    const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 12), new THREE.MeshLambertMaterial({ color: 0xe2ae7b }));
    cabeca.position.y = 3.05;
    jogador.add(cabeca);
    jogador.position.set(0, 0, 8);
    scene.add(jogador);
  }

  function criarCarro() {
    carro = new THREE.Group();
    const base = caixa(0xd52d2d, 4, 1, 7);
    base.position.y = 0.9;
    carro.add(base);
    const teto = caixa(0xb91f1f, 3.2, 1.1, 3.3);
    teto.position.set(0, 1.85, -0.4);
    carro.add(teto);
    carro.position.set(7, 0, 7);
    scene.add(carro);
  }

  function criarMissao() {
    if (alvoMissao) scene.remove(alvoMissao);
    const geo = new THREE.TorusGeometry(3, 0.35, 12, 40);
    alvoMissao = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffdd00 }));
    alvoMissao.rotation.x = Math.PI / 2;
    const pontos = [[45, 0.5, 0], [-45, 0.5, 0], [0, 0.5, -50], [0, 0.5, 55]];
    const p = pontos[(missao - 1) % pontos.length];
    alvoMissao.position.set(...p);
    scene.add(alvoMissao);
    missaoHud.textContent = `Missão ${missao}: vá até o círculo amarelo`;
  }

  function aoPressionar(e) {
    teclas[e.code] = true;
    if (e.code === "KeyE" && jogando) {
      const distancia = jogador.position.distanceTo(carro.position);
      if (!noCarro && distancia < 6) {
        noCarro = true;
        jogador.visible = false;
        mostrarMensagem("Você entrou no carro!");
      } else if (noCarro) {
        noCarro = false;
        jogador.visible = true;
        jogador.position.copy(carro.position).add(new THREE.Vector3(4, 0, 0));
        mostrarMensagem("Você saiu do carro.");
      }
    }
  }

  function atualizar(delta) {
    if (!jogando) return;
    const personagem = noCarro ? carro : jogador;
    let frente = 0;
    let lado = 0;
    if (teclas.KeyW || teclas.ArrowUp) frente -= 1;
    if (teclas.KeyS || teclas.ArrowDown) frente += 1;
    if (teclas.KeyA || teclas.ArrowLeft) lado -= 1;
    if (teclas.KeyD || teclas.ArrowRight) lado += 1;
    const velocidade = noCarro ? 22 : (teclas.ShiftLeft || teclas.ShiftRight ? 11 : 6);
    const movimento = new THREE.Vector3(lado, 0, frente);
    if (movimento.lengthSq()) {
      movimento.normalize().multiplyScalar(velocidade * delta);
      personagem.position.add(movimento);
      personagem.rotation.y = Math.atan2(movimento.x, movimento.z);
    }
    personagem.position.x = THREE.MathUtils.clamp(personagem.position.x, -105, 105);
    personagem.position.z = THREE.MathUtils.clamp(personagem.position.z, -105, 105);
    if (noCarro) jogador.position.copy(carro.position);

    const alvoCamera = personagem.position.clone().add(new THREE.Vector3(0, noCarro ? 8 : 6, noCarro ? 13 : 10));
    camera.position.lerp(alvoCamera, 1 - Math.pow(0.001, delta));
    camera.lookAt(personagem.position.clone().add(new THREE.Vector3(0, 1.5, 0)));

    alvoMissao.rotation.z += delta;
    if (personagem.position.distanceTo(alvoMissao.position) < 4.5) {
      dinheiro += 500;
      missao += 1;
      dinheiroHud.textContent = `$${dinheiro}`;
      mostrarMensagem("Missão completa! +$500");
      criarMissao();
      salvar();
    }
  }

  function animar() {
    requestAnimationFrame(animar);
    atualizar(Math.min(relogio.getDelta(), 0.05));
    renderer.render(scene, camera);
  }

  function comecar(dados) {
    nome = dados?.nome || nomeInput.value.trim() || "Jogador";
    dinheiro = dados?.dinheiro || 0;
    missao = dados?.missao || 1;
    vida = dados?.vida || 100;
    if (dados?.posicao) jogador.position.set(dados.posicao.x, 0, dados.posicao.z);
    nomeHud.textContent = nome;
    vidaHud.textContent = `❤️ Vida: ${vida}`;
    dinheiroHud.textContent = `$${dinheiro}`;
    criarMissao();
    menu.classList.add("oculto");
    hud.classList.remove("oculto");
    controles.classList.remove("oculto");
    jogando = true;
    salvar();
  }

  function salvar() {
    if (!jogando) return;
    const p = noCarro ? carro.position : jogador.position;
    localStorage.setItem(salvarChave, JSON.stringify({ nome, dinheiro, missao, vida, posicao: { x: p.x, z: p.z } }));
  }

  function mostrarMensagem(texto) {
    mensagem.textContent = texto;
    mensagem.classList.remove("oculto");
    clearTimeout(mensagem.timer);
    mensagem.timer = setTimeout(() => mensagem.classList.add("oculto"), 2400);
  }

  function redimensionar() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  $("jogarBtn").addEventListener("click", () => comecar());
  $("continuarBtn").addEventListener("click", () => {
    const dados = JSON.parse(localStorage.getItem(salvarChave) || "null");
    if (dados) comecar(dados);
    else mostrarMensagem("Nenhum save encontrado.");
  });
  $("apagarBtn").addEventListener("click", () => {
    localStorage.removeItem(salvarChave);
    mostrarMensagem("Save apagado.");
  });
  addEventListener("beforeunload", salvar);
  iniciarCena();
})();
