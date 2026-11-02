import * as THREE from 'three';
import { L } from './city.js';

const EYE = 1.72;
const RADIUS = 0.42;

export class Controls {
  constructor(camera, canvas, city) {
    this.cam = camera;
    this.canvas = canvas;
    this.city = city;
    this.blocks = city.blocks;
    this.colliders = city.colliders;

    this.mode = 'walk';
    this.yaw = Math.PI / 2 - 0.22;
    this.pitch = -0.03;
    this.pos = new THREE.Vector3(26, L.slab + EYE, 8.4);
    this.vel = new THREE.Vector3();
    this.keys = new Set();
    this.locked = false;
    this.speed = 6.5;
    this.flyY = 22;

    this.touch = { active: false, id: null, x: 0, y: 0, dx: 0, dy: 0, lookId: null, lx: 0, ly: 0 };

    this._bind();
    this.tour = buildTour();
    this.tourT = 0;
    this.setMode('walk');
  }

  _bind() {
    const el = this.canvas;
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'KeyC') this.cycleMode();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    el.addEventListener('click', () => {
      if (this.mode !== 'tour' && !this.locked) el.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === el;
      document.getElementById('crosshair')?.classList.toggle('on', this.locked);
    });
    document.addEventListener('mousemove', e => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0020, -1.35, 1.35);
    });

    // arrastar para olhar (mouse sem lock / toque)
    let dragging = false, lastX = 0, lastY = 0;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointermove', e => {
      if (!dragging || this.locked || e.pointerType === 'touch') return;
      this.yaw -= (e.clientX - lastX) * 0.0045;
      this.pitch = THREE.MathUtils.clamp(this.pitch - (e.clientY - lastY) * 0.0035, -1.35, 1.35);
      lastX = e.clientX; lastY = e.clientY;
    });

    // toque
    const stick = document.getElementById('stick');
    const knob = stick?.querySelector('i');
    const lookpad = document.getElementById('lookpad');
    if (stick) {
      stick.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        this.touch.active = true; this.touch.id = t.identifier;
        this.touch.cx = stick.getBoundingClientRect().left + stick.offsetWidth / 2;
        this.touch.cy = stick.getBoundingClientRect().top + stick.offsetHeight / 2;
        e.preventDefault();
      }, { passive: false });
      window.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) {
          if (t.identifier === this.touch.id) {
            const dx = t.clientX - this.touch.cx, dy = t.clientY - this.touch.cy;
            const m = Math.min(1, Math.hypot(dx, dy) / 46);
            const a = Math.atan2(dy, dx);
            this.touch.dx = Math.cos(a) * m; this.touch.dy = Math.sin(a) * m;
            if (knob) knob.style.transform = `translate(${Math.cos(a) * m * 30}px,${Math.sin(a) * m * 30}px)`;
          }
          if (t.identifier === this.touch.lookId) {
            this.yaw -= (t.clientX - this.touch.lx) * 0.006;
            this.pitch = THREE.MathUtils.clamp(this.pitch - (t.clientY - this.touch.ly) * 0.005, -1.35, 1.35);
            this.touch.lx = t.clientX; this.touch.ly = t.clientY;
          }
        }
      }, { passive: true });
      window.addEventListener('touchend', e => {
        for (const t of e.changedTouches) {
          if (t.identifier === this.touch.id) {
            this.touch.active = false; this.touch.id = null; this.touch.dx = this.touch.dy = 0;
            if (knob) knob.style.transform = 'translate(0,0)';
          }
          if (t.identifier === this.touch.lookId) this.touch.lookId = null;
        }
      });
    }
    if (lookpad) {
      lookpad.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        this.touch.lookId = t.identifier; this.touch.lx = t.clientX; this.touch.ly = t.clientY;
      }, { passive: true });
    }
  }

  cycleMode() {
    const order = ['walk', 'fly', 'tour'];
    this.setMode(order[(order.indexOf(this.mode) + 1) % 3]);
    document.dispatchEvent(new CustomEvent('modechange', { detail: this.mode }));
  }

  setMode(mode) {
    this.mode = mode;
    document.getElementById('crosshair')?.classList.toggle('on', mode !== 'tour');
    if (mode === 'tour') {
      this.tourT = 0;
      document.exitPointerLock?.();
    }
    if (mode === 'fly') this.flyY = Math.max(this.pos.y + EYE, 18);
    document.querySelectorAll('.seg.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  }

  groundAt(x, z) {
    for (const b of this.blocks) {
      if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return L.slab;
    }
    return 0;
  }

  collide(p) {
    for (const c of this.colliders) {
      const cx = THREE.MathUtils.clamp(p.x, c.x0, c.x1);
      const cz = THREE.MathUtils.clamp(p.z, c.z0, c.z1);
      const dx = p.x - cx, dz = p.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < RADIUS * RADIUS) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          p.x = cx + (dx / d) * RADIUS;
          p.z = cz + (dz / d) * RADIUS;
        } else {
          // dentro da caixa: empurra pelo eixo mais curto
          const l = p.x - c.x0, r = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z;
          const m = Math.min(l, r, t, b);
          if (m === l) p.x = c.x0 - RADIUS;
          else if (m === r) p.x = c.x1 + RADIUS;
          else if (m === t) p.z = c.z0 - RADIUS;
          else p.z = c.z1 + RADIUS;
        }
      }
    }
  }

  update(dt) {
    if (this.mode === 'tour') return this.updateTour(dt);

    const k = this.keys;
    const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const strafe = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let up = (k.has('Space') ? 1 : 0) - (k.has('ControlLeft') || k.has('KeyQ') ? 1 : 0);

    const tx = this.touch.dx, ty = this.touch.dy;
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');

    let mx = strafe - tx;
    let mz = fwd - ty;
    const mag = Math.hypot(mx, mz);
    if (mag > 1) { mx /= mag; mz /= mag; }

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // frente da câmera = (-sin, -cos); direita = (cos, -sin)
    const dirX = mx * cos - mz * sin;
    const dirZ = -mx * sin - mz * cos;

    const base = this.mode === 'walk' ? this.speed * (sprint ? 1.9 : 1) : 26 * (sprint ? 2.2 : 1);
    const accel = this.mode === 'walk' ? 34 : 60;

    this.vel.x += (dirX * base - this.vel.x) * Math.min(1, accel * dt / 10);
    this.vel.z += (dirZ * base - this.vel.z) * Math.min(1, accel * dt / 10);

    if (this.mode === 'walk') {
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      this.collide(this.pos);
      const g = this.groundAt(this.pos.x, this.pos.z);
      this.pos.y = THREE.MathUtils.damp(this.pos.y, g + EYE, 12, dt);
    } else {
      this.vel.y += (up * 26 - this.vel.y) * Math.min(1, 6 * dt);
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      this.pos.y += this.vel.y * dt;
      this.pos.y = THREE.MathUtils.clamp(this.pos.y, 2, 240);
      this.pos.x = THREE.MathUtils.clamp(this.pos.x, -420, 420);
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, -420, 420);
    }

    this.cam.position.copy(this.pos);
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  updateTour(dt) {
    this.tourT = (this.tourT + dt * 0.016) % 1;
    const t = this.tourT;
    const p = this.tour.path.getPointAt(t);
    const look = this.tour.look.getPointAt((t + 0.045) % 1);
    this.cam.position.copy(p);
    this.cam.lookAt(look);
    this.pos.copy(p);
    this.yaw = this.cam.rotation.y;
    this.pitch = this.cam.rotation.x;
  }
}

function buildTour() {
  const pts = [
    new THREE.Vector3(-150, 42, 60),
    new THREE.Vector3(-90, 26, 34),
    new THREE.Vector3(-30, 9, 14),
    new THREE.Vector3(0, 3.0, 5),
    new THREE.Vector3(46, 3.0, -6),
    new THREE.Vector3(96, 14, -22),
    new THREE.Vector3(140, 30, -46),
    new THREE.Vector3(60, 46, -110),
    new THREE.Vector3(-40, 38, -120),
    new THREE.Vector3(-130, 30, -70),
  ];
  const look = [
    new THREE.Vector3(-40, 8, 0),
    new THREE.Vector3(-20, 6, 0),
    new THREE.Vector3(0, 4, 0),
    new THREE.Vector3(30, 4, -2),
    new THREE.Vector3(80, 6, -12),
    new THREE.Vector3(120, 12, -30),
    new THREE.Vector3(60, 10, -80),
    new THREE.Vector3(-20, 8, -90),
    new THREE.Vector3(-90, 6, -60),
    new THREE.Vector3(-140, 14, -20),
  ];
  return {
    path: new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.4),
    look: new THREE.CatmullRomCurve3(look, true, 'catmullrom', 0.4),
  };
}
