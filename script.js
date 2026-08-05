(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    canvas = $("game"),
    ctx = canvas.getContext("2d"),
    mini = $("mapa"),
    mctx = mini.getContext("2d");
  const mapa = [
      "1111111111111111",
      "1000000000000001",
      "1011100010111001",
      "1000100000100001",
      "1000101110100001",
      "1000001000000001",
      "1011001000110101",
      "1000000000010001",
      "1010110010010101",
      "1000010000000001",
      "1010010111100101",
      "1000000000000001",
      "1001110001110001",
      "1000010000010001",
      "1000000000000001",
      "1111111111111111",
    ],
    W = 16,
    H = 16,
    FOV = Math.PI / 3;
  const arsenal = {
    rifle: {
      nome: "RIFLE",
      max: 30,
      reserva: 120,
      dano: 34,
      head: 80,
      cd: 0.12,
      reload: 1250,
    },
    smg: {
      nome: "SMG",
      max: 40,
      reserva: 160,
      dano: 22,
      head: 52,
      cd: 0.07,
      reload: 1050,
    },
    shotgun: {
      nome: "SHOTGUN",
      max: 8,
      reserva: 48,
      dano: 75,
      head: 110,
      cd: 0.55,
      reload: 1450,
    },
  };
  let j,
    bots,
    teclas = {},
    jogando = false,
    pausado = false,
    recarregando = false,
    ultimo = 0,
    onda = 1,
    pontos = 0,
    tremor = 0,
    abates = 0,
    tempo = 180,
    dash = 0;
  const parede = (x, y) => mapa[Math.floor(y)]?.[Math.floor(x)] !== "0",
    mostrar = (id, sim) => $(id).classList.toggle("oculto", !sim);
  function aviso(t) {
    $("mensagem").textContent = t;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => ($("mensagem").textContent = ""), 1800);
  }
  function redimensionar() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
  }
  function travarMouse() {
    try {
      const p = canvas.requestPointerLock?.();
      p?.catch?.(() => aviso("Clique na tela para ativar o mouse"));
    } catch {
      aviso("Clique na tela para ativar o mouse");
    }
  }
  function iniciar() {
    const tipo = $("arma")?.value || "rifle",
      w = arsenal[tipo];
    j = {
      x: 1.7,
      y: 1.7,
      a: 0,
      vida: 100,
      balas: w.max,
      reserva: w.reserva,
      cooldown: 0,
      nome: $("nome").value.trim() || "Agente",
      w,
      tipo,
      skin: $("skin")?.value || "#3e474e",
    };
    bots = [];
    onda = 1;
    pontos = 0;
    abates = 0;
    tempo = 180;
    dash = 0;
    jogando = true;
    pausado = false;
    recarregando = false;
    mostrar("menu", false);
    mostrar("fim", false);
    mostrar("pausa", false);
    mostrar("hud", true);
    $("agente").textContent = j.nome.toUpperCase();
    $("armaHud").textContent = w.nome;
    criarOnda();
    hud();
    travarMouse();
    ultimo = performance.now();
    requestAnimationFrame(loop);
  }
  function criarOnda() {
    const livres = [];
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++)
        if (!parede(x + 0.5, y + 0.5) && Math.hypot(x - j.x, y - j.y) > 5)
          livres.push([x + 0.5, y + 0.5]);
    for (let i = 0; i < 3 + onda * 2; i++) {
      const p = livres[(Math.random() * livres.length) | 0];
      bots.push({
        x: p[0],
        y: p[1],
        vida: 70 + onda * 12,
        max: 70 + onda * 12,
        vel: 0.55 + onda * 0.035,
        ataque: Math.random(),
        vivo: true,
        flash: 0,
      });
    }
    j.reserva = Math.min(180, j.reserva + 30);
    $("onda").textContent = `ONDA ${onda}`;
    aviso(`Onda ${onda}: ${bots.length} inimigos`);
  }
  function mover(dx, dy) {
    const r = 0.22;
    if (!parede(j.x + dx + Math.sign(dx) * r, j.y)) j.x += dx;
    if (!parede(j.x, j.y + dy + Math.sign(dy) * r)) j.y += dy;
  }
  function atualizar(dt) {
    if (!jogando || pausado) return;
    tempo = Math.max(0, tempo - dt);
    dash = Math.max(0, dash - dt);
    if (!tempo) {
      encerrar();
      return;
    }
    j.cooldown = Math.max(0, j.cooldown - dt);
    tremor *= Math.pow(0.02, dt);
    let f = (teclas.KeyW ? 1 : 0) - (teclas.KeyS ? 1 : 0),
      l = (teclas.KeyD ? 1 : 0) - (teclas.KeyA ? 1 : 0),
      v = (teclas.ShiftLeft ? 3.65 : 2.35) * dt;
    if (f || l) {
      const n = Math.hypot(f, l);
      f /= n;
      l /= n;
      mover(
        (Math.cos(j.a) * f + Math.cos(j.a + Math.PI / 2) * l) * v,
        (Math.sin(j.a) * f + Math.sin(j.a + Math.PI / 2) * l) * v,
      );
    }
    for (const b of bots) {
      if (!b.vivo) continue;
      b.flash = Math.max(0, b.flash - dt);
      b.ataque -= dt;
      const dx = j.x - b.x,
        dy = j.y - b.y,
        d = Math.hypot(dx, dy);
      if (d > 0.7) {
        const s = b.vel * dt,
          nx = b.x + (dx / d) * s,
          ny = b.y + (dy / d) * s;
        if (!parede(nx, b.y)) b.x = nx;
        if (!parede(b.x, ny)) b.y = ny;
      }
      if (d < 1.05 && b.ataque <= 0) {
        dano(7 + onda * 2);
        b.ataque = 0.65 + Math.random() * 0.5;
      }
    }
    if (bots.length && bots.every((b) => !b.vivo)) {
      bots = [];
      onda++;
      tempo = Math.min(180, tempo + 15);
      setTimeout(() => jogando && criarOnda(), 900);
    }
    hud();
  }
  function dano(n) {
    j.vida = Math.max(0, j.vida - n);
    tremor = 7;
    $("dano").classList.remove("pisca");
    void $("dano").offsetWidth;
    $("dano").classList.add("pisca");
    if (!j.vida) encerrar();
  }
  function recarregar() {
    if (recarregando || j.balas === j.w.max || !j.reserva || !jogando) return;
    recarregando = true;
    aviso("Recarregando...");
    setTimeout(() => {
      if (!jogando) return;
      const n = Math.min(j.w.max - j.balas, j.reserva);
      j.balas += n;
      j.reserva -= n;
      recarregando = false;
      hud();
    }, j.w.reload);
  }
  function visivel(tx, ty) {
    const d = Math.hypot(tx - j.x, ty - j.y),
      n = Math.ceil(d * 12);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (parede(j.x + (tx - j.x) * t, j.y + (ty - j.y) * t)) return false;
    }
    return true;
  }
  function atirar() {
    if (!jogando || pausado || recarregando || j.cooldown) return;
    if (!j.balas) {
      aviso("Sem munição — pressione R");
      recarregar();
      return;
    }
    j.balas--;
    j.cooldown = j.w.cd;
    tremor = j.tipo === "shotgun" ? 5 : 2;
    let alvo = null,
      dist = 99,
      headshot = false;
    for (const b of bots) {
      if (!b.vivo) continue;
      let a = Math.atan2(b.y - j.y, b.x - j.x) - j.a;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      const d = Math.hypot(b.x - j.x, b.y - j.y),
        cabeca = Math.abs(a) < 0.018 + 0.07 / d,
        abertura = j.tipo === "shotgun" ? 0.1 : 0.045;
      if (Math.abs(a) < abertura + 0.16 / d && d < dist && visivel(b.x, b.y)) {
        alvo = b;
        dist = d;
        headshot = cabeca;
      }
    }
    if (alvo) {
      alvo.vida -= headshot ? j.w.head : j.w.dano;
      alvo.flash = 0.08;
      if (alvo.vida <= 0) {
        alvo.vivo = false;
        abates++;
        pontos += (headshot ? 220 : 100) + onda * 20;
        if (abates % 5 === 0) {
          j.vida = Math.min(100, j.vida + 20);
          j.reserva += Math.ceil(j.w.max * 0.75);
          aviso("Bônus: vida e munição");
        } else aviso(headshot ? "HEADSHOT!" : "Inimigo eliminado!");
      } else pontos += headshot ? 40 : 15;
    }
    hud();
  }
  function raio(a) {
    let x = j.x,
      y = j.y,
      d = 0;
    while (d < 24) {
      x += Math.cos(a) * 0.025;
      y += Math.sin(a) * 0.025;
      d += 0.025;
      if (parede(x, y)) break;
    }
    return { d, x, y };
  }
  function render() {
    const w = canvas.width,
      h = canvas.height,
      s = (Math.random() - 0.5) * tremor * devicePixelRatio;
    ctx.save();
    ctx.translate(s, s);
    let g = ctx.createLinearGradient(0, 0, 0, h / 2);
    g.addColorStop(0, "#172331");
    g.addColorStop(1, "#526779");
    ctx.fillStyle = g;
    ctx.fillRect(-10, -10, w + 20, h / 2 + 10);
    g = ctx.createLinearGradient(0, h / 2, 0, h);
    g.addColorStop(0, "#30343a");
    g.addColorStop(1, "#111418");
    ctx.fillStyle = g;
    ctx.fillRect(-10, h / 2, w + 20, h / 2 + 10);
    const z = new Float32Array(w);
    for (let x = 0; x < w; x += 2) {
      const a = j.a - FOV / 2 + (x / w) * FOV,
        r = raio(a),
        d = r.d * Math.cos(a - j.a),
        alt = Math.min(h * 1.4, h / d),
        lum = Math.max(25, 180 - d * 8),
        c = (Math.floor(r.x * 2) + Math.floor(r.y * 2)) & 1 ? lum : lum * 0.82;
      ctx.fillStyle = `rgb(${c * 0.62},${c * 0.72},${c * 0.78})`;
      ctx.fillRect(x, h / 2 - alt / 2, 2, alt);
      z[x] = z[x + 1] = d;
    }
    for (const o of bots
      .filter((b) => b.vivo)
      .map((b) => ({ b, d: Math.hypot(b.x - j.x, b.y - j.y) }))
      .sort((a, b) => b.d - a.d)) {
      let a = Math.atan2(o.b.y - j.y, o.b.x - j.x) - j.a;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(a) > FOV * 0.7 || !visivel(o.b.x, o.b.y)) continue;
      const sx = (a / FOV + 0.5) * w,
        t = Math.min(h * 0.9, (h / o.d) * 0.82),
        left = sx - t * 0.28;
      if (z[Math.max(0, Math.min(w - 1, sx | 0))] < o.d) continue;
      bot(left, h / 2 - t * 0.48, t * 0.56, t, o.b);
    }
    arma(w, h);
    ctx.restore();
    minimapa();
  }
  function bot(x, y, w, h, b) {
    ctx.fillStyle = b.flash ? "#fff" : "#242a30";
    ctx.fillRect(x + w * 0.18, y + h * 0.28, w * 0.64, h * 0.5);
    ctx.fillStyle = b.flash ? "#fff" : "#bd8e67";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.2, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#15191c";
    ctx.fillRect(x, y + h * 0.34, w * 0.2, h * 0.48);
    ctx.fillRect(x + w * 0.8, y + h * 0.34, w * 0.2, h * 0.48);
    ctx.fillRect(x + w * 0.2, y + h * 0.75, w * 0.22, h * 0.25);
    ctx.fillRect(x + w * 0.58, y + h * 0.75, w * 0.22, h * 0.25);
    ctx.fillStyle = "#d32f2f";
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = "#52d273";
    ctx.fillRect(x, y - 8, w * Math.max(0, b.vida / b.max), 4);
  }
  function arma(w, h) {
    ctx.fillStyle = "#15191d";
    ctx.beginPath();
    ctx.moveTo(w * 0.58, h);
    ctx.lineTo(w * 0.53, h * 0.72);
    ctx.lineTo(w * 0.68, h * 0.69);
    ctx.lineTo(w * 0.78, h);
    ctx.fill();
    ctx.fillStyle = j.skin;
    ctx.fillRect(w * 0.555, h * 0.68, w * 0.11, h * 0.08);
    if (j.cooldown > j.w.cd * 0.55) {
      ctx.fillStyle = "#ffd35a";
      ctx.beginPath();
      ctx.arc(w * 0.61, h * 0.65, h * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function minimapa() {
    const s = mini.width / W;
    mctx.fillStyle = "#071015";
    mctx.fillRect(0, 0, 150, 150);
    mctx.fillStyle = "#6c7b84";
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (mapa[y][x] === "1") mctx.fillRect(x * s, y * s, s, s);
    mctx.fillStyle = "#ef4242";
    for (const b of bots)
      if (b.vivo) mctx.fillRect(b.x * s - 2, b.y * s - 2, 4, 4);
    mctx.fillStyle = "#52e089";
    mctx.beginPath();
    mctx.arc(j.x * s, j.y * s, 4, 0, Math.PI * 2);
    mctx.fill();
  }
  function hud() {
    $("vida").textContent = Math.ceil(j.vida);
    $("vidaBarra").style.width = j.vida + "%";
    $("balas").textContent = String(j.balas).padStart(2, "0");
    $("reserva").textContent = j.reserva;
    $("pontos").textContent = String(pontos).padStart(6, "0");
    const m = Math.floor(tempo / 60),
      s = Math.floor(tempo % 60);
    $("tempo").textContent = `${m}:${String(s).padStart(2, "0")}`;
  }
  function encerrar() {
    if (!jogando) return;
    jogando = false;
    document.exitPointerLock?.();
    const perfil = JSON.parse(localStorage.miniCSPerfil || "{}");
    let rank = JSON.parse(localStorage.miniCSRanking || "[]");
    rank.push({ nome: j.nome, pontos, abates, arma: j.w.nome });
    rank.sort((a, b) => b.pontos - a.pontos);
    rank = rank.slice(0, 5);
    localStorage.miniCSRanking = JSON.stringify(rank);
    const rec = Math.max(+(localStorage.miniCSRecorde || 0), pontos);
    localStorage.miniCSRecorde = rec;
    $("resultado").innerHTML =
      `Pontos: <b>${pontos}</b><br>Abates: <b>${abates}</b><br>Onda: <b>${onda}</b><br>Recorde: <b>${rec}</b><br><br>TOP LOCAL<br>${rank.map((r, i) => `${i + 1}. ${r.nome} — ${r.pontos}`).join("<br>")}`;
    mostrar("fim", true);
    mostrar("hud", false);
  }
  function loop(t) {
    if (!jogando) return;
    const dt = Math.min((t - ultimo) / 1000, 0.05);
    ultimo = t;
    atualizar(dt);
    render();
    requestAnimationFrame(loop);
  }
  addEventListener("resize", redimensionar);
  addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    if (e.code === "KeyR") recarregar();
    if (e.code === "Space" && jogando && !pausado && !dash) {
      mover(Math.cos(j.a) * 1.5, Math.sin(j.a) * 1.5);
      dash = 1.8;
      aviso("DASH!");
    }
  });
  addEventListener("keyup", (e) => (teclas[e.code] = false));
  addEventListener("mousemove", (e) => {
    if (jogando && !pausado && document.pointerLockElement === canvas)
      j.a += e.movementX * 0.0022;
  });
  addEventListener("mousedown", (e) => {
    if (e.button === 0) atirar();
  });
  document.addEventListener("pointerlockchange", () => {
    if (jogando) {
      pausado = document.pointerLockElement !== canvas;
      mostrar("pausa", pausado);
    }
  });
  $("salvarPerfil").onclick = () => {
    const perfil = {
      nome: $("nome").value.trim() || "Agente",
      email: $("email").value.trim(),
      arma: $("arma").value,
      skin: $("skin").value,
    };
    localStorage.miniCSPerfil = JSON.stringify(perfil);
    aviso("Perfil salvo neste navegador");
  };
  const perfil = JSON.parse(localStorage.miniCSPerfil || "null");
  if (perfil) {
    $("nome").value = perfil.nome || "Agente";
    $("email").value = perfil.email || "";
    $("arma").value = perfil.arma || "rifle";
    $("skin").value = perfil.skin || "#3e474e";
  }
  $("jogar").onclick = iniciar;
  $("reiniciar").onclick = iniciar;
  $("voltar").onclick = travarMouse;
  redimensionar();
})();
