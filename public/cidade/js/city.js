import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { make, registry, CELL } from './assets.js';
import { Batcher, mat4 } from './merge.js';

/* ---------------- malha urbana ---------------- */
export const L = {
  extent: 178,
  walk: 3.6,
  slab: 0.18,
  roadsX: [{ at: -128, hw: 3.9 }, { at: -64, hw: 3.9 }, { at: 0, hw: 7.2 }, { at: 64, hw: 3.9 }, { at: 128, hw: 3.9 }],
  roadsZ: [{ at: -128, hw: 3.9 }, { at: -64, hw: 3.9 }, { at: 0, hw: 7.2 }, { at: 64, hw: 3.9 }, { at: 128, hw: 3.9 }],
  river: { z0: -300, z1: -182, y: -0.06 },
};

export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILD_POOL = [
  'com/building-a', 'com/building-b', 'com/building-c', 'com/building-d', 'com/building-e',
  'com/building-f', 'com/building-g', 'com/building-h', 'com/building-i', 'com/building-j',
  'com/building-k', 'com/building-l', 'com/building-m', 'com/building-n',
  'com/low-a', 'com/low-e', 'com/low-i', 'com/low-n',
];
const TALL_POOL = ['com/sky-a', 'com/sky-b', 'com/sky-c', 'com/sky-d', 'com/sky-e'];
const INDUSTRIAL_POOL = ['ind/building-a', 'ind/building-c', 'ind/building-e', 'ind/building-g',
  'ind/building-i', 'ind/building-k', 'ind/building-m', 'ind/building-o', 'ind/building-q'];
const TREE_POOL = ['nat/tree', 'nat/tree-dark', 'nat/oak', 'nat/detailed', 'nat/palm', 'nat/pine'];
const SMALL_TREE_POOL = ['nat/pine-s', 'nat/bush-d', 'nat/tree-dark', 'nat/bush'];

export function buildCity(scene, rng) {
  const colliders = [];       // {x0,x1,z0,z1,h}
  const lamps = [];           // {x,y,z, rot}
  const lightGlows = [];      // esferas de semáforo
  const windowSlots = [];     // {m: Matrix4, lit:bool}
  const treesAnim = [];       // não usado se fundido

  /* ---- terreno ---- */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0x4e5f45, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.34;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---- rio ---- */
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, Math.abs(L.river.z1 - L.river.z0)),
    new THREE.MeshStandardMaterial({ color: 0x2d6d86, roughness: 0.22, metalness: 0.55, envMapIntensity: 1 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, L.river.y, (L.river.z0 + L.river.z1) / 2);
  scene.add(water);

  // cais
  const quayB = new Batcher();
  const quay = new THREE.Mesh(new THREE.BoxGeometry(1400, 3.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8d8b84, roughness: 0.95 }));
  quay.position.set(0, -0.3, L.river.z1 - 1.2);
  quay.receiveShadow = true; quay.castShadow = true;
  scene.add(quay);

  /* ---- asfalto ---- */
  const roadB = new Batcher();
  const roadGeo = (w, d) => {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.96, metalness: 0.02 });
  const roads = [];
  const addRoad = (x, z, w, d) => {
    const g = roadGeo(w, d);
    const m = new THREE.Mesh(g, asphaltMat);
    m.position.set(x, 0, z);
    m.receiveShadow = true;
    roads.push(m);
  };
  // ruas no eixo X (contínuas)
  for (const r of L.roadsX) addRoad(0, r.at, L.extent * 2, r.hw * 2);
  // ruas no eixo Z (em segmentos, para não sobrepor as interseções)
  for (let i = 0; i < L.roadsZ.length; i++) {
    const r = L.roadsZ[i];
    for (let j = 0; j < L.roadsX.length - 1; j++) {
      const a = L.roadsX[j], b = L.roadsX[j + 1];
      const z0 = a.at + a.hw, z1 = b.at - b.hw;
      addRoad(r.at, (z0 + z1) / 2, r.hw * 2, z1 - z0);
    }
    // pontas
    addRoad(r.at, (L.roadsX[0].at - L.extent) / 2 - 2, r.hw * 2, L.extent + L.roadsX[0].at);
    addRoad(r.at, (L.roadsX[4].at + L.extent) / 2 + 2, r.hw * 2, L.extent - L.roadsX[4].at);
  }
  roads.forEach(m => scene.add(m));

  /* ---- marcações viárias ---- */
  const paint = new THREE.MeshBasicMaterial({ color: 0xe9e5d6, toneMapped: false });
  const paintDim = new THREE.MeshBasicMaterial({ color: 0xcfcab8, toneMapped: false });
  const marks = [];
  const flat = (w, d, x, z, mat) => {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(x, 0.012, z);
    marks.push({ g, mat });
  };
  // eixo duplo central tracejado + faixas de bordo
  for (const r of L.roadsX) {
    for (let x = -L.extent + 3; x < L.extent; x += 8) {
      const nearZ = L.roadsZ.some(rz => Math.abs(rz.at - x) < rz.hw + 3);
      if (!nearZ) flat(3.4, 0.16, x, r.at, paint);
    }
    if (r.hw > 5) {
      for (const off of [-3.6, 3.6]) flat(L.extent * 2, 0.12, 0, r.at + off, paintDim);
    }
    for (const off of [-r.hw + 0.5, r.hw - 0.5]) flat(L.extent * 2, 0.1, 0, r.at + off, paintDim);
  }
  for (let i = 0; i < L.roadsZ.length; i++) {
    const r = L.roadsZ[i];
    for (let j = 0; j < L.roadsX.length - 1; j++) {
      const a = L.roadsX[j], b = L.roadsX[j + 1];
      for (let z = a.at + a.hw + 3; z < b.at - b.hw - 2; z += 8) flat(0.16, 3.4, r.at, z, paint);
    }
    if (r.hw > 5) for (const off of [-3.6, 3.6]) flat(0.12, L.extent * 2, r.at + off, 0, paintDim);
    for (const off of [-r.hw + 0.5, r.hw - 0.5]) flat(0.1, L.extent * 2, r.at + off, 0, paintDim);
  }
  // faixas de pedestre nas interseções
  for (const rx of L.roadsX) {
    for (const rz of L.roadsZ) {
      // cruzando a via paralela a X (pedestre anda em Z) — barras longas em X
      for (const dx of [rz.hw + 2.0, -(rz.hw + 2.0)]) {
        for (let z = rx.at - rx.hw + 0.7; z < rx.at + rx.hw; z += 1.1) {
          flat(2.4, 0.5, rz.at + dx, z, paint);
        }
      }
      // cruzando a via paralela a Z (pedestre anda em X) — barras longas em Z
      for (const dz of [rx.hw + 2.0, -(rx.hw + 2.0)]) {
        for (let x = rz.at - rz.hw + 0.7; x < rz.at + rz.hw; x += 1.1) {
          flat(0.5, 2.4, x, rx.at + dz, paint);
        }
      }
    }
  }
  // agrupa marcações por material (2 draw calls)
  for (const mat of [paint, paintDim]) {
    const geos = marks.filter(m => m.mat === mat).map(m => m.g);
    if (!geos.length) continue;
    let merged;
    try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
    if (merged) {
      const mesh = new THREE.Mesh(merged, mat);
      mesh.receiveShadow = false;
      scene.add(mesh);
      geos.forEach(g => g.dispose());
    } else {
      for (const g of geos) {
        const mesh = new THREE.Mesh(g, mat);
        mesh.frustumCulled = false;
        scene.add(mesh);
      }
    }
  }

  /* ---- calçadas + quarteirões ---- */
  const slabB = new Batcher();
  const slabProto = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x9b9a93, roughness: 0.95 }));
  const curbProto = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xd8d5cb, roughness: 0.9 }));

  const blocks = [];
  for (let i = 0; i < L.roadsX.length - 1; i++) {
    for (let j = 0; j < L.roadsZ.length - 1; j++) {
      const a = L.roadsX[i], b = L.roadsX[i + 1];
      const c = L.roadsZ[j], d = L.roadsZ[j + 1];
      const x0 = a.at + a.hw, x1 = b.at - b.hw;
      const z0 = c.at + c.hw, z1 = d.at - d.hw;
      blocks.push({ x0, x1, z0, z1, i, j, w: x1 - x0, d: z1 - z0 });
    }
  }

  const typeOf = (blk) => {
    const key = `${blk.i},${blk.j}`;
    const T = { '0,0': 'park', '3,3': 'park', '3,0': 'industrial', '0,3': 'market', '1,3': 'construction', '2,0': 'plaza' };
    return T[key] || 'urban';
  };
  blocks.forEach(b => b.type = typeOf(b));

  for (const b of blocks) {
    // laje do quarteirão: ocupa exatamente o miolo entre as vias;
    // a calçada é a faixa de 3.6 m dentro dele
    const w = b.w, d = b.d;
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    slabB.add(slabProto, mat4(cx, L.slab / 2 - 0.02, cz, 0, 1)
      .multiply(new THREE.Matrix4().makeScale(w, L.slab, d)));
  }

  /* ---- prédios ---- */
  const bldB = new Batcher();
  const propB = new Batcher();
  let buildingCount = 0;

  function placeBuilding(key, x, y, z, ry, isTall) {
    const r = registry.get(key);
    if (!r) return null;
    const size = r.size;
    const m = mat4(x, y, z, ry);
    bldB.add(r.proto, m);
    buildingCount++;

    // caixa de colisão (aprox. pelo bounding box rotacionado)
    const halfW = (Math.abs(Math.cos(ry)) * size.x + Math.abs(Math.sin(ry)) * size.z) / 2;
    const halfD = (Math.abs(Math.sin(ry)) * size.x + Math.abs(Math.cos(ry)) * size.z) / 2;
    colliders.push({ x0: x - halfW, x1: x + halfW, z0: z - halfD, z1: z + halfD, h: size.y });

    // janelas para a noite
    const rows = Math.max(2, Math.floor((size.y - 3.2) / 3.1));
    const colsF = Math.max(2, Math.floor(size.x / 2.9));
    const colsS = Math.max(2, Math.floor(size.z / 2.9));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0));
    const push = (lx, ly, lz, ry2) => {
      const off = new THREE.Vector3(lx, 0, lz).applyQuaternion(q);
      const mm = new THREE.Matrix4().compose(
        new THREE.Vector3(x + off.x, y + ly, z + off.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry + ry2, 0)),
        new THREE.Vector3(1.15, 1.5, 1)
      );
      windowSlots.push({ m: mm, lit: rng() < 0.52 });
    };
    for (let rr = 0; rr < rows; rr++) {
      const ly = 3.0 + rr * 3.1;
      if (ly > size.y - 1.6) break;
      for (let cc = 0; cc < colsF; cc++) {
        const lx = (cc - (colsF - 1) / 2) * (size.x / colsF);
        push(lx, ly, size.z / 2 + 0.06, 0);
        push(lx, ly, -size.z / 2 - 0.06, Math.PI);
      }
      for (let cc = 0; cc < colsS; cc++) {
        const lz = (cc - (colsS - 1) / 2) * (size.z / colsS);
        push(size.x / 2 + 0.06, ly, lz, Math.PI / 2);
        push(-size.x / 2 - 0.06, ly, lz, -Math.PI / 2);
      }
    }
    return size;
  }

  /**
   * Fill one edge of a block with buildings.
   * axis 'x' → distribui ao longo de x (profundidade em z)
   * axis 'z' → distribui ao longo de z (profundidade em x)
   */
  function fillSide(blk, axis, edge, ry, pool, y) {
    const alongMin = axis === 'x' ? blk.x0 : blk.z0;
    const alongMax = axis === 'x' ? blk.x1 : blk.z1;
    const perpMin = axis === 'x' ? blk.z0 : blk.x0;
    const perpMax = axis === 'x' ? blk.z1 : blk.x1;
    const pad = 1.2;
    let pos = alongMin + L.walk + pad + rng() * 3;
    let guard = 0;
    while (pos < alongMax - L.walk - pad - 6 && guard++ < 9) {
      const key = pool[Math.floor(rng() * pool.length)];
      const r = registry.get(key);
      if (!r) break;
      const s = r.size;
      const wB = axis === 'x' ? s.x : s.z;     // largura no eixo de distribuição
      const dB = axis === 'x' ? s.z : s.x;     // profundidade perpendicular
      if (pos + wB > alongMax - L.walk - pad) break;
      const perp = edge === 'min' ? perpMin + L.walk + dB / 2 : perpMax - L.walk - dB / 2;
      const cx = axis === 'x' ? pos + wB / 2 : perp;
      const cz = axis === 'x' ? perp : pos + wB / 2;
      placeBuilding(key, cx, y, cz, ry, pool === TALL_POOL);
      pos += wB + 1.0 + rng() * 2.6;
    }
  }

  for (const blk of blocks) {
    if (blk.type === 'urban' || blk.type === 'plaza') {
      const pool = blk.type === 'plaza' || (Math.abs(blk.i - 1.5) < 1 && Math.abs(blk.j - 1.5) < 1)
        ? [...BUILD_POOL, ...TALL_POOL] : BUILD_POOL;
      // frente para -z (borda z0, virada para a via ao norte do quarteirão)
      fillSide(blk, 'x', 'min', Math.PI, pool, L.slab);
      // frente para +z (borda z1)
      fillSide(blk, 'x', 'max', 0, pool, L.slab);
      // frente para -x (borda x0)
      fillSide(blk, 'z', 'min', -Math.PI / 2, pool, L.slab);
      // frente para +x (borda x1)
      fillSide(blk, 'z', 'max', Math.PI / 2, pool, L.slab);
    }
    if (blk.type === 'industrial') {
      let px = blk.x0 + 6, pz = blk.z0 + 8;
      for (let k = 0; k < 5; k++) {
        const key = INDUSTRIAL_POOL[Math.floor(rng() * INDUSTRIAL_POOL.length)];
        const r = registry.get(key);
        if (!r) break;
        placeBuilding(key, px + r.size.x / 2, L.slab, pz + r.size.z / 2, rng() < 0.5 ? 0 : Math.PI, false);
        px += r.size.x + 4;
        if (px > blk.x1 - 10) { px = blk.x0 + 6; pz += 24; }
      }
      // extras industriais
      ['ind/water-tower', 'ind/chimney', 'ind/tank', 'ind/container-a', 'ind/container-b', 'ind/windmill']
        .forEach((k, n) => {
          const r = registry.get(k);
          if (!r) return;
          const x = blk.x1 - 8 - (n % 3) * 9, z = blk.z1 - 6 - Math.floor(n / 3) * 10;
          propB.add(r.proto, mat4(x, L.slab, z, rng() * 6.28));
        });
    }
  }

  /* ---- parques / praça / feira / obra ---- */
  const floraB = new Batcher();
  function scatter(key, cx, cz, radius, count, y = L.slab, sMin = 0.8, sMax = 1.35) {
    const r = registry.get(key);
    if (!r) return;
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2, rad = Math.sqrt(rng()) * radius;
      const x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad;
      const s = sMin + rng() * (sMax - sMin);
      const m = mat4(x, y, z, rng() * 6.28, 1).multiply(new THREE.Matrix4().makeScale(s, s, s));
      floraB.add(r.proto, m);
    }
  }

  for (const blk of blocks) {
    const cx = (blk.x0 + blk.x1) / 2, cz = (blk.z0 + blk.z1) / 2;
    if (blk.type === 'park') {
      // gramado
      const g = new THREE.Mesh(new THREE.BoxGeometry(blk.w - L.walk * 2, 0.12, blk.d - L.walk * 2),
        new THREE.MeshStandardMaterial({ color: 0x53704a, roughness: 1 }));
      g.position.set(cx, L.slab + 0.02, cz); g.receiveShadow = true; scene.add(g);
      scatter('nat/tree', cx, cz, blk.w * 0.38, 9);
      scatter('nat/palm', cx, cz, blk.w * 0.42, 3);
      scatter('nat/bush-d', cx, cz, blk.w * 0.42, 8, L.slab + 0.05, 0.7, 1.1);
      scatter('nat/flower-r', cx, cz, blk.w * 0.42, 10, L.slab + 0.06, 0.8, 1.2);
      scatter('nat/flower-y', cx, cz, blk.w * 0.42, 10, L.slab + 0.06, 0.8, 1.2);
      scatter('nat/rock-s', cx, cz, blk.w * 0.4, 4);
      // lago
      const pond = new THREE.Mesh(new THREE.CircleGeometry(7, 24),
        new THREE.MeshStandardMaterial({ color: 0x2f6f7a, roughness: 0.2, metalness: 0.4 }));
      pond.rotation.x = -Math.PI / 2; pond.position.set(cx + 4, L.slab + 0.09, cz - 4); scene.add(pond);
    }
    if (blk.type === 'plaza') {
      scatter('nat/palm-t', cx, cz, blk.w * 0.3, 6);
      const r = registry.get('nat/obelisk');
      if (r) propB.add(r.proto, mat4(cx, L.slab, cz, 0));
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        scatter('ft/plant', cx + Math.cos(a) * 9, cz + Math.sin(a) * 9, 1, 1, L.slab + 0.05, 0.9, 1.1);
      }
    }
    if (blk.type === 'market') {
      const rows = [-9, 5];
      for (const dz of rows) {
        for (let k = 0; k < 4; k++) {
          const x = cx - 15 + k * 10, z = cz + dz;
          const p = registry.get(k % 2 ? 'com/parasol-a' : 'com/parasol-b');
          if (p) propB.add(p.proto, mat4(x, L.slab, z, 0.2, 1.25));
          // banca de caixotes
          for (let n = 0; n < 3; n++) {
            const c = registry.get('pr/crate');
            if (c) propB.add(c.proto, mat4(x - 1.3 + n * 1.3, L.slab, z + 0.9, rng() * 0.35, 0.26));
          }
          const f = registry.get(['fd/apple', 'fd/banana', 'fd/melon'][k % 3]);
          if (f) for (let n = 0; n < 4; n++) {
            propB.add(f.proto, mat4(x - 1.1 + n * 0.75, L.slab + 0.24, z + 0.9, rng() * 3, 0.2));
          }
        }
      }
    }
    if (blk.type === 'construction') {
      const r = registry.get('ind/building-e');
      if (r) placeBuilding('ind/building-e', cx - 8, L.slab, cz, 0, false);
      ['rd/barrier', 'rd/cone', 'rd/fence', 'rd/clight', 'rd/cone'].forEach((k, n) => {
        const p = registry.get(k);
        if (!p) return;
        propB.add(p.proto, mat4(blk.x0 + 6 + n * 8, L.slab, blk.z1 - 10 + (n % 2) * 5, n * 0.7));
      });
      const c = registry.get('ind/container-c');
      if (c) propB.add(c.proto, mat4(blk.x1 - 10, L.slab, blk.z0 + 10, 1.2));
    }
  }

  /* ---- árvores de calçada ---- */
  for (const blk of blocks) {
    const step = 15;
    for (let x = blk.x0 + 6; x < blk.x1 - 4; x += step) {
      for (const zs of [blk.z0 + L.walk * 0.55, blk.z1 - L.walk * 0.55]) {
        if (rng() < 0.42) continue;
        const k = TABLE_TREE(rng);
        const r = registry.get(k);
        if (!r) continue;
        const s = 0.78 + rng() * 0.3;
        floraB.add(r.proto, mat4(x + (rng() - 0.5) * 1.5, L.slab, zs, rng() * 6.28, 1)
          .multiply(new THREE.Matrix4().makeScale(s, s, s)));
      }
    }
  }
  function TABLE_TREE(r) {
    const a = r();
    return a < 0.4 ? 'nat/tree' : a < 0.55 ? 'nat/oak' : a < 0.7 ? 'nat/palm' : a < 0.85 ? 'nat/pine' : 'nat/tree-dark';
  }

  /* ---- postes, lâmpadas, semáforos, placas ---- */
  const lampProto = registry.get('rd/lamp');
  const lamp2Proto = registry.get('rd/lamp2');
  for (const blk of blocks) {
    const step = 24;
    for (let x = blk.x0 + 10; x < blk.x1 - 6; x += step) {
      for (const [zs, ry] of [[blk.z0 + L.walk * 0.5, 0], [blk.z1 - L.walk * 0.5, Math.PI]]) {
        const p = registry.get(rng() < 0.75 ? 'rd/lamp' : 'rd/lamp2');
        if (!p) continue;
        propB.add(p.proto, mat4(x, L.slab, zs, ry));
        lamps.push({ x, y: L.slab + 6.2, z: zs - Math.sin(ry) * 1.1 });
      }
    }
  }

  // semáforos nas interseções
  for (const rx of L.roadsX) {
    for (const rz of L.roadsZ) {
      // interseção em (x = rz.at, z = rx.at)
      const corners = [
        [rz.at - rz.hw - 1.2, rx.at - rx.hw - 1.2, Math.PI * 0.75],
        [rz.at + rz.hw + 1.2, rx.at + rx.hw + 1.2, -Math.PI * 0.25],
      ];
      for (const [x, z, ry] of corners) {
        const p = registry.get('rd/traffic-light');
        if (!p) continue;
        propB.add(p.proto, mat4(x, L.slab, z, ry, 0.72));
        lightGlows.push({ x, y: L.slab + 3.05, z, ax: rx });
      }
    }
  }

  // postes de energia na avenida central
  for (let x = -160; x <= 160; x += 26) {
    const p = registry.get(rng() < 0.5 ? 'rd/pole' : 'rd/pole-s');
    if (!p) continue;
    propB.add(p.proto, mat4(x, L.slab, L.roadsZ[2].at - L.roadsZ[2].hw - L.walk * 0.6, rng() * 0.2));
    propB.add(p.proto, mat4(x + 13, L.slab, L.roadsZ[2].at + L.roadsZ[2].hw + L.walk * 0.6, Math.PI));
  }

  // lixeiras + placas
  for (const blk of blocks) {
    if (rng() < 0.5) {
      const d = registry.get('rd/dumpster');
      if (d) propB.add(d.proto, mat4(blk.x0 + 5 + rng() * 8, L.slab, blk.z0 + L.walk * 0.7, rng() * 6, 0.55));
    }
    const sg = registry.get(rng() < 0.5 ? 'rd/sign-street' : 'rd/sign-stop');
    if (sg && rng() < 0.6) propB.add(sg.proto, mat4(blk.x1 - 6, L.slab, blk.z0 + L.walk * 0.7, rng() * 0.6, 0.8));
  }

  /* ---- orla do rio: cais, gramado e coqueiros ---- */
  const quayZ = L.river.z1;              // -182
  const promZ0 = quayZ + 3, promZ1 = quayZ + 48;
  const promW = 360;
  const promCz = (promZ0 + promZ1) / 2;
  // gramado da orla
  const prom = new THREE.Mesh(new THREE.BoxGeometry(promW, 0.22, promZ1 - promZ0),
    new THREE.MeshStandardMaterial({ color: 0x557a42, roughness: 1 }));
  prom.position.set(0, 0.10, promCz); prom.receiveShadow = true; scene.add(prom);
  // calçadão
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(promW, 0.26, 7),
    new THREE.MeshStandardMaterial({ color: 0xa8a496, roughness: 0.95 }));
  walkway.position.set(0, 0.13, promZ0 + 5); walkway.receiveShadow = true; scene.add(walkway);
  // coqueiros e bancos virados para a água
  for (let x = -promW / 2 + 8; x < promW / 2 - 8; x += 13) {
    const palm = registry.get(rng() < 0.6 ? 'nat/palm-t' : 'nat/palm');
    if (palm) {
      const s = 0.85 + rng() * 0.35;
      floraB.add(palm.proto, mat4(x, 0.2, promZ0 + 9 + rng() * 3, rng() * 6.28, 1)
        .multiply(new THREE.Matrix4().makeScale(s, s, s)));
    }
    if (rng() < 0.5) {
      const b = registry.get('rd/lamp');
      if (b) propB.add(b.proto, mat4(x + 6, 0.2, promZ0 + 4, Math.PI));
    }
  }
  // boias e trapiche
  ['wt/buoy', 'wt/buoy-f'].forEach((k, i) => {
    const r = registry.get(k);
    if (!r) return;
    for (let n = 0; n < 3; n++) propB.add(r.proto, mat4(-90 + n * 90 + i * 30, L.river.y + 0.15, quayZ - 22 - n * 16, 0, 0.3));
  });

  /* ---- subúrbio: anel de prédios baixos fechando a cidade ---- */
  const lowPool = ['com/low-a', 'com/low-e', 'com/low-i', 'com/low-n'];
  const ring = [];
  for (let x = -170; x <= 170; x += 24) {
    ring.push([x, 150], [x, 176], [x + 12, 132]);
  }
  for (let z = -120; z <= 124; z += 24) {
    ring.push([150, z], [176, z], [-150, z], [-176, z], [132, z + 12], [-132, z + 12]);
  }
  for (const [x, z] of ring) {
    if (z > 128 || z < -120) { /* permite */ }
    const key = lowPool[Math.floor(rng() * lowPool.length)];
    const r = registry.get(key);
    if (!r) continue;
    const ry = Math.atan2(-x, -z) + (rng() - 0.5) * 0.4;   // frente para o centro
    placeBuilding(key, x, -0.3, z, ry, false);
  }

  /* ---- mata em volta ---- */
  for (let k = 0; k < 260; k++) {
    const a = rng() * Math.PI * 2;
    const rad = 150 + rng() * 130;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad - 30;
    if (z < promZ0) continue;
    const r = registry.get(rng() < 0.5 ? 'nat/pine' : 'nat/tree-dark');
    if (!r) continue;
    const s = 1.0 + rng() * 0.9;
    floraB.add(r.proto, mat4(x, -0.2, z, rng() * 6.28, 1)
      .multiply(new THREE.Matrix4().makeScale(s, s, s)));
  }

  /* ---- build batches ---- */
  slabB.build(scene, 'slabs');
  bldB.build(scene, 'buildings');
  propB.build(scene, 'props');
  floraB.build(scene, 'flora');

  /* ---- janelas acesas (instanciadas, visíveis só à noite) ---- */
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: true });
  const winGeo = new THREE.PlaneGeometry(1, 1);
  const winMesh = new THREE.InstancedMesh(winGeo, winMat, windowSlots.length);
  winMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.Color();
  windowSlots.forEach((w, i) => {
    winMesh.setMatrixAt(i, w.m);
    col.setHex(w.lit ? 0xffd9a0 : 0x0a0d12);
    winMesh.setColorAt(i, col);
  });
  winMesh.instanceMatrix.needsUpdate = true;
  if (winMesh.instanceColor) winMesh.instanceColor.needsUpdate = true;
  winMesh.visible = false;
  winMesh.frustumCulled = false;
  scene.add(winMesh);

  /* ---- brilho dos postes (planos aditivos no chão) ---- */
  const glowTex = radialTexture();
  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, color: 0xffc98a, opacity: 0
  });
  const glowGeo = new THREE.PlaneGeometry(16, 16);
  const glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, lamps.length);
  lamps.forEach((l, i) => {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(l.x, 0.06, l.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    glowMesh.setMatrixAt(i, m);
  });
  glowMesh.instanceMatrix.needsUpdate = true;
  glowMesh.visible = false;
  glowMesh.frustumCulled = false;
  scene.add(glowMesh);

  return {
    colliders, lamps, lightGlows, blocks, roads, water, winMesh, glowMesh,
    stats: { buildings: buildingCount, windows: windowSlots.length, lamps: lamps.length, blocks: blocks.length },
  };
}

let _radial = null;
function radialTexture() {
  if (_radial) return _radial;
  const s = 128;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,214,160,0.95)');
  grd.addColorStop(0.45, 'rgba(255,190,120,0.35)');
  grd.addColorStop(1, 'rgba(255,180,100,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  _radial = t;
  return t;
}
