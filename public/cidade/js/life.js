import * as THREE from 'three';
import { makeChar, registry } from './assets.js';
import { L } from './city.js';
import { lightState } from './traffic.js';

const CHAR_KEYS = Array.from({ length: 6 }).flatMap((_, i) => [
  `char/character-male-${'abcdef'[i]}`, `char/character-female-${'abcdef'[i]}`,
]);

/* ---------------- pedestres ---------------- */
class Ped {
  constructor(scene, rng, mode, block, cross) {
    const key = CHAR_KEYS[Math.floor(rng() * CHAR_KEYS.length)];
    const c = makeChar(key);
    this.c = c;
    this.obj = c.obj;
    scene.add(this.obj);
    this.rng = rng;
    this.mode = mode;          // 'walk' | 'cross'
    this.cross = cross;
    this.speed = 1.15 + rng() * 0.55;
    this.wait = 0;

    if (mode === 'walk') {
      const i = L.walk * 0.66;   // meio da calçada, mais perto das fachadas
      this.path = [
        new THREE.Vector3(block.x0 + i, 0, block.z0 + i),
        new THREE.Vector3(block.x1 - i, 0, block.z0 + i),
        new THREE.Vector3(block.x1 - i, 0, block.z1 - i),
        new THREE.Vector3(block.x0 + i, 0, block.z1 - i),
      ];
      const start = Math.floor(rng() * 4);
      this.i = start;
      this.dirSign = rng() < 0.5 ? 1 : -1;
      this.obj.position.copy(this.path[this.i]);
      // não nasce colado no ponto inicial da câmera
      const p0 = new THREE.Vector3(26, 0, 8.4);
      if (this.obj.position.distanceTo(p0) < 14) {
        this.i = (start + 2) % 4;
        this.obj.position.copy(this.path[this.i]);
      }
    } else {
      const ave = L.roadsZ.find(r => r.hw > 5).hw;
      this.z0 = ave + L.walk * 0.5;
      this.z1 = -(ave + L.walk * 0.5);
      this.obj.position.set(cross.x, 0, cross.side * this.z0);
      this.state = 'wait';
      this.timer = rng() * 3;
      this.target = cross.side * this.z1;
    }
    this.obj.position.y = L.slab;
    this.mixer = c.mixer;
    this.walk = c.walk;
    this.idle = c.idle;
    this.walk.play();
    this.walk.timeScale = this.speed / 1.35;
    this.walk.time = rng() * 2;
    this.idle.play(); // liga as duas; o peso é controlado abaixo
    this.setIdle(false);
  }

  setIdle(on) {
    this.walk.setEffectiveWeight(on ? 0 : 1);
    this.idle.setEffectiveWeight(on ? 1 : 0);
  }

  update(dt, simTime) {
    this.mixer.update(dt);

    if (this.mode === 'walk') {
      const nextI = (this.i + this.dirSign + 4) % 4;
      const target = this.path[nextI];
      const p = this.obj.position;
      const dx = target.x - p.x, dz = target.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) {
        this.i = nextI;
        if (this.rng() < 0.10) { this.wait = 1 + this.rng() * 4; }
      } else {
        const step = this.speed * dt;
        p.x += (dx / d) * step;
        p.z += (dz / d) * step;
        const ang = Math.atan2(dx, dz);
        this.obj.rotation.y = lerpAngle(this.obj.rotation.y, ang, 1 - Math.pow(0.001, dt));
      }
      if (this.wait > 0) { this.wait -= dt; this.setIdle(true); }
      else this.setIdle(false);
      p.y = L.slab;
    } else {
      const p = this.obj.position;
      if (this.state === 'wait') {
        this.setIdle(true);
        this.obj.rotation.y = this.target > 0 ? 0 : Math.PI;
        if (lightState(simTime, 'X') === 'red') { this.state = 'cross'; }
      } else if (this.state === 'cross') {
        this.setIdle(false);
        const dz = this.target - p.z;
        const step = this.speed * dt;
        if (Math.abs(dz) < 0.4) {
          this.state = 'rest';
          this.timer = 1.5 + this.rng() * 5;
          this.target = -this.target;
        } else {
          p.z += Math.sign(dz) * step;
          this.obj.rotation.y = dz > 0 ? 0 : Math.PI;
        }
      } else {
        this.setIdle(true);
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'wait';
      }
      p.y = L.slab;
    }
  }
}

function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

/* ---------------- barcos ---------------- */
class Boat {
  constructor(scene, rng, key, z) {
    const r = registry.get(key);
    this.mesh = r.proto.clone(true);
    this.mesh.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(this.mesh);
    this.baseY = L.river.y + 0.35;
    this.z = z;
    this.x = (rng() - 0.5) * 380;
    this.speed = 2.5 + rng() * 4;
    this.dir = rng() < 0.5 ? 1 : -1;
    this.phase = rng() * 6.28;
    this.scale = 0.8 + rng() * 0.6;
    this.mesh.scale.multiplyScalar(this.scale);
  }
  update(dt, t) {
    this.x += this.dir * this.speed * dt;
    if (this.x > 210) this.x = -210;
    if (this.x < -210) this.x = 210;
    this.mesh.position.set(this.x, this.baseY + Math.sin(t * 0.9 + this.phase) * 0.18, this.z);
    this.mesh.rotation.z = Math.sin(t * 0.7 + this.phase) * 0.03;
    this.mesh.rotation.x = Math.cos(t * 0.55 + this.phase) * 0.02;
    this.mesh.rotation.y = this.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
}

/* ---------------- conjunto ---------------- */
export class Life {
  constructor(scene, city, rng) {
    this.scene = scene;
    this.peds = [];

    const urban = city.blocks.filter(b => b.type === 'urban' || b.type === 'plaza');
    for (let i = 0; i < 26; i++) {
      const b = urban[Math.floor(rng() * urban.length)];
      if (!b) break;
      this.peds.push(new Ped(scene, rng, 'walk', b));
    }
    const crossPoints = [
      { x: -40, side: 1 }, { x: 24, side: -1 }, { x: 92, side: 1 }, { x: -96, side: -1 }, { x: 8, side: 1 },
    ];
    for (const cp of crossPoints) {
      for (let k = 0; k < 2; k++) this.peds.push(new Ped(scene, rng, 'cross', null, cp));
    }

    this.boats = [];
    const boatKeys = ['wt/speed-a', 'wt/speed-c', 'wt/row', 'wt/sail-a', 'wt/sail-b', 'wt/fishing', 'wt/tug'];
    boatKeys.forEach((k, i) => {
      this.boats.push(new Boat(scene, rng, k, L.river.z1 - 18 - i * 13 - rng() * 8));
    });

    this.peopleCount = this.peds.length;
  }

  update(dt, simTime) {
    for (const p of this.peds) p.update(dt, simTime);
    for (const b of this.boats) b.update(dt, simTime);
  }
}
