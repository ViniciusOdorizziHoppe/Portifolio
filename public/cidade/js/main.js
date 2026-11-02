import * as THREE from 'three';
import { loadAll, loadCars, setProgress, registry } from './assets.js';
import { buildCity, mulberry, L } from './city.js';
import { Sky } from './sky.js';
import { Traffic, lightState } from './traffic.js';
import { Life } from './life.js';
import { Controls } from './controls.js';
import { CitySound } from './sound.js';

/* ---------------- renderer ---------------- */
const canvas = document.getElementById('c');
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: !isMobile, powerPreference: 'high-performance', alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.25, 1400);

/* ---------------- estado ---------------- */
const state = {
  hour: localHour(),
  speed: 600,           // multiplicador do tempo
  running: true,
  life: true,
  fps: 0,
  lastApplyNight: -1,
};

function localHour() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/* ---------------- boot ---------------- */
let sky, city, traffic, life, controls;
const sound = new CitySound();
const rng = mulberry(20261102);

const bar = document.getElementById('bar');
const ltext = document.getElementById('ltext');

setProgress((p, name) => {
  bar.style.width = `${Math.round(p * 100)}%`;
  if (name) ltext.textContent = name.replace(/-/g, ' ');
});

(async () => {
  await loadAll();
  const cars = await loadCars();
  const carReg = new Map();
  for (const [k, v] of Object.entries(cars)) {
    carReg.set(k, v);
  }

  sky = new Sky(scene, renderer);
  city = buildCity(scene, rng);
  traffic = new Traffic(scene, city, cars, rng);
  life = new Life(scene, city, rng);
  controls = new Controls(camera, canvas, city);

  // água do rio refletindo o céu
  city.water.material.envMap = null;

  const s0 = sky.setTime(state.hour);
  applyNight(s0.night);

  document.getElementById('loader').classList.add('hide');
  window.__CIDADE__ = { scene, camera, renderer, city, traffic, life, controls, sky, state, registry };
  window.__READY__ = true;
  bindUI();
  loop();
})();

/* ---------------- noite ---------------- */
let lastNightBucket = -1;
function applyNight(night) {
  const on = night > 0.35;
  city.winMesh.visible = on;
  city.glowMesh.visible = night > 0.25;
  city.glowMesh.material.opacity = Math.min(1, night * 1.15) * 0.55;
  if (traffic) traffic.setNight(night);
  city.water.material.color.setHex(night > 0.4 ? 0x101e2c : 0x2d6d86);
  city.water.material.metalness = night > 0.4 ? 0.75 : 0.55;
}

/* ---------------- HUD ---------------- */
function bindUI() {
  const slider = document.getElementById('timeSlider');
  const clock = document.getElementById('clock');
  const dateEl = document.getElementById('date');

  slider.value = state.hour.toFixed(2);
  let dragging = false;
  slider.addEventListener('input', () => {
    dragging = true;
    state.hour = parseFloat(slider.value);
  });
  slider.addEventListener('change', () => { dragging = false; });
  document.getElementById('timeNow').addEventListener('click', () => {
    state.hour = localHour();
    slider.value = state.hour.toFixed(2);
  });

  document.querySelectorAll('[data-speed]').forEach(b => {
    b.addEventListener('click', () => {
      state.speed = parseFloat(b.dataset.speed);
      document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('active', x === b));
    });
  });
  document.querySelectorAll('[data-mode]').forEach(b => {
    b.addEventListener('click', () => controls.setMode(b.dataset.mode));
  });
  document.getElementById('moto').addEventListener('click', (e) => {
    state.life = !state.life;
    e.target.textContent = state.life ? 'pausar vida' : 'retomar vida';
    e.target.classList.toggle('active', !state.life);
  });
  document.getElementById('sound').addEventListener('click', (e) => {
    const on = sound.toggle();
    e.target.classList.toggle('active', on);
    e.target.textContent = on ? 'som on' : 'som';
  });

  window.addEventListener('resize', onResize);
  document.addEventListener('modechange', e => {
    document.querySelectorAll('.seg.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === e.detail));
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) last = performance.now();
  });

  updateClock(state.hour);
  dateEl.textContent = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function updateClock(h) {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  const el = document.getElementById('clock');
  if (el) el.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ---------------- loop ---------------- */
let last = performance.now();
let acc = 0, frames = 0, fpsT = 0;

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;

  // tempo do mundo
  if (state.running) {
    state.hour = (state.hour + dt * state.speed / 3600) % 24;
  }

  const sim = state.running ? dt * Math.min(state.speed, 8) : 0;   // agentes aceleram até 8×
  const s = sky.setTime(state.hour);
  sound.setNight(s.night);
  sound.update(dt);

  // noite (atualiza em passos para economizar)
  const bucket = Math.round(s.night * 10) / 10;
  if (bucket !== lastNightBucket) {
    lastNightBucket = bucket;
    applyNight(s.night);
  }

  if (state.life && sim > 0) {
    traffic.update(sim, performance.now() / 1000);
    life.update(sim, performance.now() / 1000);
  } else if (state.life) {
    life.update(0.016, performance.now() / 1000);
  }

  controls.update(dt);
  sky.followShadow(controls.pos.x, controls.pos.z);

  // HUD
  updateClock(state.hour);
  const sl = document.getElementById('timeSlider');
  if (sl && document.activeElement !== sl) sl.value = state.hour.toFixed(2);

  frames++; fpsT += dt;
  if (fpsT > 0.5) {
    state.fps = Math.round(frames / fpsT);
    document.getElementById('fps').textContent = `${state.fps} fps`;
    frames = 0; fpsT = 0;
  }

  renderer.render(scene, camera);
}
