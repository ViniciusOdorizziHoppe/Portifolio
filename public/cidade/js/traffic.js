import * as THREE from 'three';
import { L } from './city.js';

export const CYCLE = 24;
export function lightState(t, axis) {
  const p = ((t % CYCLE) + CYCLE) % CYCLE;
  if (axis === 'X') {
    if (p < 10) return 'green';
    if (p < 12) return 'yellow';
    return 'red';
  }
  if (p >= 12 && p < 22) return 'green';
  if (p >= 22) return 'yellow';
  return 'red';
}

const laneOf = (hw) => (hw > 5 ? 1.9 : hw * 0.52);

function nearestAhead(list, coord, sign) {
  if (sign > 0) {
    for (const r of list) if (r.at > coord + 0.5) return r;
    return null;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].at < coord - 0.5) return list[i];
  return null;
}

export class Traffic {
  constructor(scene, city, cars, rng) {
    this.scene = scene;
    this.city = city;
    this.rng = rng;
    this.cars = [];
    this.models = cars;
    this.glowMeshes = [];

    // esferas de semáforo
    const geo = new THREE.SphereGeometry(0.34, 10, 8);
    for (const g of city.lightGlows) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff3322 }));
      m.position.set(g.x, g.y, g.z);
      scene.add(m);
      this.glowMeshes.push({ mesh: m, ax: g.ax });
    }

    // carros
    const palettes = [0xb8342c, 0x2e5f8a, 0xd8d5cd, 0x2f7d54, 0x22262b, 0xa8a29a, 0xc9a227, 0x7a3f8c];
    for (let i = 0; i < 26; i++) {
      const proto = cars.car.proto;
      const g = proto.clone(true);
      const paint = palettes[Math.floor(rng() * palettes.length)];
      g.traverse(o => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        o.material = mats.map(m => {
          if (/^(lightblue|white|grey)$/i.test(m.name || '')) {
            const c = m.clone(); c.color.setHex(paint); return c;
          }
          return m.clone();
        });
        if (!Array.isArray(o.material)) o.material = o.material[0];
      });
      scene.add(g);
      this.cars.push(this.spawn(g, rng()));
    }

    // viatura
    const cop = cars.cop.proto.clone(true);
    cop.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); });
    scene.add(cop);
    const pc = this.spawn(cop, 0.3);
    pc.cop = true;
    pc.maxSpeed = 9;
    this.cars.push(pc);
  }

  spawn(g, r) {
    // escolhe via e direção
    const onX = r < 0.5;
    const roads = onX ? L.roadsX : L.roadsZ;
    const road = roads[Math.floor(this.rng() * roads.length)];
    const sign = this.rng() < 0.5 ? 1 : -1;
    const lane = laneOf(road.hw);
    const along = (this.rng() - 0.5) * 260;
    const axis = onX ? 'X' : 'Z';
    const car = {
      g, axis, sign, roadAt: road.at, lane, hw: road.hw,
      x: onX ? along : road.at - sign * lane,
      z: onX ? road.at + sign * lane : along,
      speed: 8 + this.rng() * 5,
      maxSpeed: 11 + this.rng() * 6,
      mode: 'drive', turn: null, wheels: 0,
    };
    this.place(car);
    return car;
  }

  place(car) {
    const ry = car.axis === 'X'
      ? (car.sign > 0 ? Math.PI / 2 : -Math.PI / 2)
      : (car.sign > 0 ? 0 : Math.PI);
    car.g.position.set(car.x, 0, car.z);
    car.g.rotation.y = ry;
  }

  update(dt, simTime) {
    const lx = lightState(simTime, 'X');
    const lz = lightState(simTime, 'Z');

    // semáforos
    for (const g of this.glowMeshes) {
      // o semáforo fica na via paralela a X? o modelo é colocado nas quinas; usamos a via X como referência
      const st = lightState(simTime, 'X');
      const c = st === 'green' ? 0x38d16a : st === 'yellow' ? 0xffb020 : 0xff3322;
      g.mesh.material.color.setHex(c);
    }

    for (const car of this.cars) {
      if (car.cop) {
        // viatura: patrulha devagar, giroflex piscando
        car.g.traverse(o => {
          if (o.isMesh && /lights/i.test(o.material?.name || '') && !/head|tail/i.test(o.material.name)) {
            const on = (Math.floor(simTime * 4) % 2) === 0;
            o.material.emissive.setHex(on ? 0x3b7bff : 0x1b2a80);
            o.material.emissiveIntensity = on ? 3.2 : 0.2;
          }
        });
      }

      if (car.mode === 'turn') {
        const T = car.turn;
        T.t += dt / T.dur;
        const u = Math.min(1, T.t);
        const p = bezier(T.a, T.b, T.c, u);
        const p2 = bezier(T.a, T.b, T.c, Math.min(1, u + 0.02));
        car.x = p.x; car.z = p.z;
        car.g.position.set(p.x, 0, p.z);
        const ang = Math.atan2(p2.x - p.x, p2.z - p.z);
        car.g.rotation.y = ang;
        if (u >= 1) {
          car.mode = 'drive';
          car.axis = T.naxis; car.sign = T.nsign; car.roadAt = T.nat; car.lane = T.nlane; car.hw = T.nhw;
          car.turn = null;
          this.place(car);
        }
        continue;
      }

      // condução
      const light = car.axis === 'X' ? lx : lz;
      const coord = car.axis === 'X' ? car.x : car.z;
      const crossList = car.axis === 'X' ? L.roadsZ : L.roadsX;
      const next = nearestAhead(crossList, coord, car.sign);

      let desired = car.maxSpeed;
      if (next) {
        const d = (next.at - coord) * car.sign;
        if (light !== 'green' && d < 22) {
          const stopAt = 4.6;
          if (d <= stopAt) desired = 0;
          else desired = Math.min(desired, car.maxSpeed * Math.min(1, (d - stopAt) / 12));
        }
        // vira quando chega no centro
        if (Math.abs(d) < 0.9) {
          if (this.maybeTurn(car, next)) continue;
        }
      }

      // fila: freia atrás do carro da frente
      for (const o of this.cars) {
        if (o === car || o.mode !== 'drive') continue;
        if (o.axis !== car.axis || o.sign !== car.sign || Math.abs(o.roadAt - car.roadAt) > 0.1) continue;
        const gap = ((o.x - car.x) * (car.axis === 'X' ? car.sign : 0) + (o.z - car.z) * (car.axis === 'Z' ? car.sign : 0));
        if (gap > 0 && gap < 10) desired = Math.min(desired, Math.max(0, (gap - 5.6) * 0.9));
      }

      car.speed += THREE.MathUtils.clamp(desired - car.speed, -9 * dt, 5 * dt);
      car.speed = Math.max(0, car.speed);
      if (car.axis === 'X') car.x += car.sign * car.speed * dt;
      else car.z += car.sign * car.speed * dt;

      // mantém dentro do mapa: se sair muito, renasce
      if (Math.abs(car.x) > 190 || Math.abs(car.z) > 190) {
        const n = this.spawn(car.g, this.rng());
        Object.assign(car, n);
        continue;
      }
      this.place(car);
    }
  }

  maybeTurn(car, next) {
    const rnd = this.rng();
    if (rnd > 0.42) return false;      // segue reto

    const right = rnd > 0.21;
    const nat = next.at;
    // nova direção
    let naxis, nsign;
    if (car.axis === 'X') {
      naxis = 'Z';
      nsign = right ? car.sign : -car.sign;
    } else {
      naxis = 'X';
      nsign = right ? -car.sign : car.sign;
    }
    // via nova
    const roads = naxis === 'X' ? L.roadsX : L.roadsZ;
    const road = roads.find(r => Math.abs(r.at - nat) < 0.01) || roads[0];
    const nlane = laneOf(road.hw);
    const nhw = road.hw;

    const end = new THREE.Vector3();
    if (naxis === 'X') {
      end.set(car.x + nsign * 9, 0, nat + nsign * nlane);
    } else {
      end.set(nat - nsign * nlane, 0, car.z + nsign * 9);
    }
    const a = new THREE.Vector3(car.x, 0, car.z);
    const c = new THREE.Vector3(car.axis === 'X' ? nat : car.x, 0, car.axis === 'X' ? car.z : nat);

    car.mode = 'turn';
    car.turn = {
      a, c, b: end, t: 0, dur: Math.max(0.55, 9 / Math.max(4, car.speed)),
      naxis, nsign, nat, nlane, nhw,
    };
    return true;
  }

  setNight(f) {
    for (const car of this.cars) {
      car.g.traverse(o => {
        if (!o.isMesh) return;
        const nm = o.material?.name || '';
        if (/headlights/i.test(nm)) { o.material.emissiveIntensity = 0.5 + f * 3.2; }
        if (/taillights/i.test(nm)) { o.material.emissiveIntensity = 0.4 + f * 2.2; }
      });
    }
  }
}

function bezier(a, b, c, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    z: mt * mt * a.z + 2 * mt * t * b.z + t * t * c.z,
  };
}
