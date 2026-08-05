import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

const mode = document.body.dataset.game || "cs",
  $ = (s) => document.querySelector(s),
  keys = {},
  touch = { x: 0, y: 0 };
const scene = new THREE.Scene();
scene.background = new THREE.Color(
  mode === "zombie" ? 0x07120c : mode === "city" ? 0x87b7d9 : 0x071018,
);
scene.fog = new THREE.Fog(scene.background, 35, 150);
const camera = new THREE.PerspectiveCamera(
    70,
    innerWidth / innerHeight,
    0.1,
    300,
  ),
  renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xbde6ff, 0x243020, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(25, 40, 15);
sun.castShadow = true;
scene.add(sun);
const mat = (c) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.72 });
const box = (x, y, z, c, sx = 1, sy = 1, sz = 1) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(c));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
};
const ground = box(
  0,
  -0.6,
  0,
  mode === "zombie" ? 0x1c3524 : mode === "city" ? 0x315f35 : 0x303940,
  150,
  1,
  150,
);
const obstacles = [];
for (let i = 0; i < (mode === "city" ? 34 : 20); i++) {
  const x = (Math.random() - 0.5) * 120,
    z = (Math.random() - 0.5) * 120,
    w = 3 + Math.random() * 8,
    h = mode === "city" ? 5 + Math.random() * 17 : 2 + Math.random() * 5,
    d = 3 + Math.random() * 8;
  if (Math.hypot(x, z) < 10) continue;
  obstacles.push(
    box(x, h / 2 - 0.1, z, mode === "city" ? 0x59636b : 0x39423d, w, h, d),
  );
}
const player = new THREE.Group(),
  body = box(0, 1, 0, 0x278ce8, 1.1, 2, 1.1);
scene.remove(body);
player.add(body);
scene.add(player);
let yaw = 0,
  pitch = 0,
  hp = 100,
  score = 0,
  wave = 1,
  ammo = 30,
  reserve = 120,
  cool = 0,
  playing = false,
  inCar = false,
  dash = 0;
const enemies = [],
  bullets = [];
function enemy(boss = false) {
  const g = new THREE.Group(),
    b = box(
      0,
      boss ? 1.8 : 1,
      0,
      mode === "zombie" ? (boss ? 0x8b2635 : 0x4c7b45) : 0xb43838,
      boss ? 2.4 : 1.1,
      boss ? 3.6 : 2,
      boss ? 2.4 : 1.1,
    );
  scene.remove(b);
  g.add(b);
  const a = Math.random() * Math.PI * 2,
    r = 35 + Math.random() * 30;
  g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  g.userData = {
    hp: boss ? 450 + wave * 60 : 45 + wave * 10,
    boss,
    speed: boss ? 2.2 : 3 + wave * 0.12,
  };
  scene.add(g);
  enemies.push(g);
}
function spawnWave() {
  const n = mode === "city" ? Math.min(10, wave + 2) : 4 + wave * 2;
  for (let i = 0; i < n; i++) enemy(false);
  if (mode === "zombie" && wave % 5 === 0) enemy(true);
  $("#wave").textContent = (mode === "city" ? "PROCURA " : "ONDA ") + wave;
}
function shoot() {
  if (!playing || cool || !ammo) return;
  ammo--;
  cool = 0.13;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const b = box(
    camera.position.x,
    camera.position.y - 0.12,
    camera.position.z,
    0xffd65a,
    0.12,
    0.12,
    0.45,
  );
  b.userData = { v: dir.multiplyScalar(48), life: 1.5 };
  bullets.push(b);
}
function hitWalls(pos) {
  return obstacles.some(
    (o) =>
      Math.abs(pos.x - o.position.x) < o.scale.x + 1 &&
      Math.abs(pos.z - o.position.z) < o.scale.z + 1,
  );
}
function update(dt) {
  cool = Math.max(0, cool - dt);
  dash = Math.max(0, dash - dt);
  let x =
      (keys.KeyD || keys.ArrowRight ? 1 : 0) -
      (keys.KeyA || keys.ArrowLeft ? 1 : 0) +
      touch.x,
    z =
      (keys.KeyS || keys.ArrowDown ? 1 : 0) -
      (keys.KeyW || keys.ArrowUp ? 1 : 0) +
      touch.y;
  if (x || z) {
    const n = Math.hypot(x, z),
      speed = (keys.ShiftLeft ? 11 : 6) * (dash > 1.15 ? 2.4 : 1),
      f = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)),
      r = new THREE.Vector3(f.z, 0, -f.x),
      next = player.position
        .clone()
        .addScaledVector(f, (-z / n) * speed * dt)
        .addScaledVector(r, (x / n) * speed * dt);
    if (!hitWalls(next)) player.position.copy(next);
  }
  if (mode === "city" && inCar) body.scale.set(2.4, 0.6, 1.5);
  else body.scale.set(1, 1, 1);
  player.rotation.y = yaw;
  for (const b of bullets) {
    b.position.addScaledVector(b.userData.v, dt);
    b.userData.life -= dt;
    for (const e of enemies)
      if (
        e.userData.hp > 0 &&
        b.position.distanceTo(e.position) < (e.userData.boss ? 2.3 : 1.1)
      ) {
        e.userData.hp -= mode === "cs" ? 34 : 28;
        b.userData.life = 0;
        if (e.userData.hp <= 0) {
          score += e.userData.boss ? 1000 : 100;
          scene.remove(e);
        }
      }
  }
  for (let i = bullets.length - 1; i >= 0; i--)
    if (bullets[i].userData.life <= 0) {
      scene.remove(bullets[i]);
      bullets.splice(i, 1);
    }
  for (const e of enemies)
    if (e.userData.hp > 0) {
      const d = player.position.clone().sub(e.position);
      d.y = 0;
      if (d.length() < 1.6) {
        hp -= 22 * dt;
        if (hp <= 0) end();
      } else e.position.addScaledVector(d.normalize(), e.userData.speed * dt);
    }
  for (let i = enemies.length - 1; i >= 0; i--)
    if (enemies[i].userData.hp <= 0) enemies.splice(i, 1);
  if (!enemies.length) {
    wave++;
    reserve += 20;
    spawnWave();
  }
  camera.position.lerp(
    player.position
      .clone()
      .add(new THREE.Vector3(-Math.sin(yaw) * 8, 6, -Math.cos(yaw) * 8)),
    0.12,
  );
  camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1.3, 0)));
  $("#hp").textContent = Math.max(0, Math.ceil(hp));
  $("#score").textContent = score;
  $("#ammo").textContent = `${ammo} / ${reserve}`;
}
function end() {
  playing = false;
  document.exitPointerLock?.();
  $("#menu").classList.remove("hide");
  $("#menu h1").textContent = "FIM DE JOGO";
  $("#menu p").textContent = `Pontos ${score} · Onda ${wave}`;
  $("#play").textContent = "JOGAR NOVAMENTE";
}
let last = performance.now();
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min((t - last) / 1000, 0.04);
  last = t;
  if (playing) update(dt);
  renderer.render(scene, camera);
}
function start() {
  for (const e of enemies) scene.remove(e);
  enemies.length = 0;
  player.position.set(0, 0, 0);
  hp = 100;
  score = 0;
  wave = 1;
  ammo = 30;
  reserve = 120;
  playing = true;
  $("#menu").classList.add("hide");
  $("#hud").classList.remove("hide");
  spawnWave();
  renderer.domElement.requestPointerLock?.();
}
addEventListener("keydown", (e) => {
  keys[e.code] = 1;
  if (e.code === "KeyR" && ammo < 30 && reserve) {
    const n = Math.min(30 - ammo, reserve);
    ammo += n;
    reserve -= n;
  }
  if (e.code === "Space" && dash <= 0) dash = 1.5;
  if (e.code === "KeyE" && mode === "city") inCar = !inCar;
  if (e.code === "KeyQ") shoot();
});
addEventListener("keyup", (e) => (keys[e.code] = 0));
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement) {
    yaw -= e.movementX * 0.0024;
    pitch = Math.max(-1, Math.min(1, pitch - e.movementY * 0.002));
  }
});
addEventListener("mousedown", (e) => {
  if (e.button === 0) shoot();
});
for (const b of document.querySelectorAll("[data-key]")) {
  const set = (v) => {
    keys[b.dataset.key] = v;
    b.classList.toggle("on", v);
  };
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    set(1);
  });
  b.addEventListener("pointerup", () => set(0));
  b.addEventListener("pointercancel", () => set(0));
}
$("#fire")?.addEventListener("pointerdown", shoot);
$("#play").onclick = start;
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
renderer.setSize(innerWidth, innerHeight);
loop(last);
