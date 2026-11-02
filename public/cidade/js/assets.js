import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';

const M = './models/';
const gltf = new GLTFLoader();
const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();

/** catálogo: chave -> {path, kind, alvo} */
export const CATALOG = {
  // ---- prédios ----
  'com/building-a': { p: 'commercial/building-a.glb', kind: 'building' },
  'com/building-b': { p: 'commercial/building-b.glb', kind: 'building' },
  'com/building-c': { p: 'commercial/building-c.glb', kind: 'building' },
  'com/building-d': { p: 'commercial/building-d.glb', kind: 'building' },
  'com/building-e': { p: 'commercial/building-e.glb', kind: 'building' },
  'com/building-f': { p: 'commercial/building-f.glb', kind: 'building' },
  'com/building-g': { p: 'commercial/building-g.glb', kind: 'building' },
  'com/building-h': { p: 'commercial/building-h.glb', kind: 'building' },
  'com/building-i': { p: 'commercial/building-i.glb', kind: 'building' },
  'com/building-j': { p: 'commercial/building-j.glb', kind: 'building' },
  'com/building-k': { p: 'commercial/building-k.glb', kind: 'building' },
  'com/building-l': { p: 'commercial/building-l.glb', kind: 'building' },
  'com/building-m': { p: 'commercial/building-m.glb', kind: 'building' },
  'com/building-n': { p: 'commercial/building-n.glb', kind: 'building' },
  'com/sky-a': { p: 'commercial/building-skyscraper-a.glb', kind: 'building' },
  'com/sky-b': { p: 'commercial/building-skyscraper-b.glb', kind: 'building' },
  'com/sky-c': { p: 'commercial/building-skyscraper-c.glb', kind: 'building' },
  'com/sky-d': { p: 'commercial/building-skyscraper-d.glb', kind: 'building' },
  'com/sky-e': { p: 'commercial/building-skyscraper-e.glb', kind: 'building' },
  'com/low-a': { p: 'commercial/low-detail-building-a.glb', kind: 'building' },
  'com/low-e': { p: 'commercial/low-detail-building-e.glb', kind: 'building' },
  'com/low-i': { p: 'commercial/low-detail-building-i.glb', kind: 'building' },
  'com/low-n': { p: 'commercial/low-detail-building-n.glb', kind: 'building' },
  'com/awning': { p: 'commercial/detail-awning.glb', kind: 'prop' },
  'com/awning-w': { p: 'commercial/detail-awning-wide.glb', kind: 'prop' },
  'com/overhang': { p: 'commercial/detail-overhang.glb', kind: 'prop' },
  'com/parasol-a': { p: 'commercial/detail-parasol-a.glb', kind: 'prop' },
  'com/parasol-b': { p: 'commercial/detail-parasol-b.glb', kind: 'prop' },

  // ---- industrial ----
  'ind/building-a': { p: 'industrial/building-a.glb', kind: 'building' },
  'ind/building-c': { p: 'industrial/building-c.glb', kind: 'building' },
  'ind/building-e': { p: 'industrial/building-e.glb', kind: 'building' },
  'ind/building-g': { p: 'industrial/building-g.glb', kind: 'building' },
  'ind/building-i': { p: 'industrial/building-i.glb', kind: 'building' },
  'ind/building-k': { p: 'industrial/building-k.glb', kind: 'building' },
  'ind/building-m': { p: 'industrial/building-m.glb', kind: 'building' },
  'ind/building-o': { p: 'industrial/building-o.glb', kind: 'building' },
  'ind/building-q': { p: 'industrial/building-q.glb', kind: 'building' },
  'ind/chimney': { p: 'industrial/chimney-medium.glb', kind: 'prop' },
  'ind/tank': { p: 'industrial/detail-tank.glb', kind: 'prop' },
  'ind/tank-l': { p: 'industrial/detail-tank-large.glb', kind: 'prop' },
  'ind/water-tower': { p: 'industrial/water-tower.glb', kind: 'prop' },
  'ind/windmill': { p: 'industrial/windmill.glb', kind: 'prop' },
  'ind/container-a': { p: 'industrial/shipping-container-a.glb', kind: 'prop' },
  'ind/container-b': { p: 'industrial/shipping-container-b.glb', kind: 'prop' },
  'ind/container-c': { p: 'industrial/shipping-container-c.glb', kind: 'prop' },
  'ind/solar': { p: 'industrial/solar-panel-flat.glb', kind: 'prop' },

  // ---- rua ----
  'rd/traffic-light': { p: 'roads/traffic-light.glb', kind: 'prop' },
  'rd/lamp': { p: 'roads/light-curved.glb', kind: 'prop' },
  'rd/lamp2': { p: 'roads/light-curved-double.glb', kind: 'prop' },
  'rd/lamp-sq': { p: 'roads/light-square.glb', kind: 'prop' },
  'rd/pole': { p: 'roads/electricity-pole.glb', kind: 'prop' },
  'rd/pole-s': { p: 'roads/electricity-pole-single.glb', kind: 'prop' },
  'rd/dumpster': { p: 'roads/dumpster.glb', kind: 'prop' },
  'rd/cone': { p: 'roads/construction-cone.glb', kind: 'prop' },
  'rd/barrier': { p: 'roads/construction-barrier.glb', kind: 'prop' },
  'rd/fence': { p: 'roads/construction-fence.glb', kind: 'prop' },
  'rd/clight': { p: 'roads/construction-light.glb', kind: 'prop' },
  'rd/sign-stop': { p: 'roads/road-sign-stop.glb', kind: 'prop' },
  'rd/sign-street': { p: 'roads/road-sign-street.glb', kind: 'prop' },
  'rd/sign-warn': { p: 'roads/road-sign-warning.glb', kind: 'prop' },
  'rd/sign-hwy': { p: 'roads/sign-highway.glb', kind: 'prop' },

  // ---- natureza ----
  'nat/tree': { p: 'nature/tree_default.glb', kind: 'flora' },
  'nat/tree-dark': { p: 'nature/tree_default_dark.glb', kind: 'flora' },
  'nat/oak': { p: 'nature/tree_oak.glb', kind: 'flora' },
  'nat/detailed': { p: 'nature/tree_detailed.glb', kind: 'flora' },
  'nat/pine': { p: 'nature/tree_pineTallA.glb', kind: 'flora' },
  'nat/pine-s': { p: 'nature/tree_pineSmallA.glb', kind: 'flora' },
  'nat/palm': { p: 'nature/tree_palm.glb', kind: 'flora' },
  'nat/palm-t': { p: 'nature/tree_palmDetailedTall.glb', kind: 'flora' },
  'nat/bush': { p: 'nature/plant_bush.glb', kind: 'flora' },
  'nat/bush-d': { p: 'nature/plant_bushDetailed.glb', kind: 'flora' },
  'nat/rock-l': { p: 'nature/rock_largeA.glb', kind: 'flora' },
  'nat/rock-s': { p: 'nature/rock_smallB.glb', kind: 'flora' },
  'nat/flower-r': { p: 'nature/flower_redA.glb', kind: 'flora' },
  'nat/flower-y': { p: 'nature/flower_yellowA.glb', kind: 'flora' },
  'nat/grass': { p: 'nature/grass.glb', kind: 'flora' },
  'nat/grass-l': { p: 'nature/grass_large.glb', kind: 'flora' },
  'nat/log': { p: 'nature/log.glb', kind: 'flora' },
  'nat/obelisk': { p: 'nature/statue_obelisk.glb', kind: 'prop' },
  'nat/statue': { p: 'nature/statue_head.glb', kind: 'prop' },

  // ---- praça / feira ----
  'ft/tree': { p: 'forest/tree.glb', kind: 'flora' },
  'ft/fence': { p: 'forest/fence.glb', kind: 'prop' },
  'ft/flag': { p: 'forest/flag.glb', kind: 'prop' },
  'ft/plant': { p: 'forest/plant.glb', kind: 'flora' },
  'ft/stones': { p: 'forest/stones.glb', kind: 'flora' },
  'pr/crate': { p: 'proto/crate.glb', kind: 'prop' },
  'pr/crate-c': { p: 'proto/crate-color.glb', kind: 'prop' },
  'pr/column': { p: 'proto/column.glb', kind: 'prop' },
  'fd/barrel': { p: 'food/barrel.glb', kind: 'prop' },
  'fd/apple': { p: 'food/apple.glb', kind: 'prop' },
  'fd/banana': { p: 'food/banana.glb', kind: 'prop' },
  'fd/melon': { p: 'food/watermelon.glb', kind: 'prop' },

  // ---- barcos ----
  'wt/speed-a': { p: 'water/boat-speed-a.glb', kind: 'boat' },
  'wt/speed-c': { p: 'water/boat-speed-c.glb', kind: 'boat' },
  'wt/row': { p: 'water/boat-row-small.glb', kind: 'boat' },
  'wt/sail-a': { p: 'water/boat-sail-a.glb', kind: 'boat' },
  'wt/sail-b': { p: 'water/boat-sail-b.glb', kind: 'boat' },
  'wt/fishing': { p: 'water/boat-fishing-small.glb', kind: 'boat' },
  'wt/tug': { p: 'water/boat-tug-a.glb', kind: 'boat' },
  'wt/buoy': { p: 'water/buoy.glb', kind: 'prop' },
  'wt/buoy-f': { p: 'water/buoy-flag.glb', kind: 'prop' },
};

/** personagens (com animação) */
export const CHARS = ['a', 'b', 'c', 'd', 'e', 'f'].flatMap(c => [
  `character-male-${c}`, `character-female-${c}`
]).map(n => `char/${n}`);

export const registry = new Map();   // chave -> { proto, size, anims, kind }
const texCache = new Map();

let onProgress = () => {};
export function setProgress(fn) { onProgress = fn; }

function bbox(obj) {
  const b = new THREE.Box3().setFromObject(obj);
  const s = new THREE.Vector3(); b.getSize(s);
  return { b, s };
}

async function loadGLB(path) {
  const g = await gltf.loadAsync(M + path);
  return g;
}

/** escala alvo por tipo (metros) */
const TARGET = {
  char: { h: 1.78 },
  flora: { h: 9.0 },
  boat: { len: 9.0 },
  prop: { h: null },
  building: { h: null },
};
export const CELL = 10;   // 1 unidade Kenney = 10 m (prédios/props)
const FLORA_SCALE = 5.2;

/** o nature kit vem com paleta "survival" (folhas azul-turquesa); repinta para verde natural */
const NATURE_RECOLOR = {
  grass: 0x5d8a3c,
  leafsGreen: 0x4d7b33,
  leafsDark: 0x31552a,
  woodBark: 0x6d4b30,
  woodBarkDark: 0x4f3826,
  woodInner: 0xc2a074,
  dirt: 0x6d4b30,
  dirtDark: 0x513a26,
  stone: 0x9c968c,
  stoneDark: 0x7c766d,
  water: 0x3f7f8c,
};

export async function loadAll(report) {
  const keys = [...Object.keys(CATALOG), ...CHARS.map(c => 'char/' + c.split('/')[1])];
  const uniq = [...new Set(keys)];
  let done = 0;
  const total = uniq.length;

  const loadOne = async (key) => {
    const name = key.replace(/^char\//, '');
    const isChar = key.startsWith('char/');
    const spec = isChar ? { p: `char/${name}.glb`, kind: 'char' } : CATALOG[key];
    if (!spec) return;
    const g = await loadGLB(spec.p);
    const root = g.scene;
    root.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          m.roughness = m.roughness ?? 0.92;
          m.metalness = 0;
          if (m.map) m.map.anisotropy = 4;
          m.side = THREE.FrontSide;
          if (spec.p.startsWith('nature/')) {
            const c = NATURE_RECOLOR[m.name];
            if (c !== undefined) m.color.setHex(c);
          }
        }
      }
    });

    // normalização
    let scale = CELL;
    if (spec.kind === 'char') scale = null;
    if (spec.kind === 'flora') scale = FLORA_SCALE;
    if (spec.kind === 'boat') scale = null;

    const { b, s } = bbox(root);
    if (spec.kind === 'char') scale = TARGET.char.h / s.y;
    if (spec.kind === 'boat') scale = TARGET.boat.len / Math.max(s.z, s.x);
    root.scale.setScalar(scale);

    // reencaixa no chão e centraliza
    root.updateMatrixWorld(true);
    const b2 = bbox(root).b;
    const c = new THREE.Vector3(); b2.getCenter(c);
    const inner = new THREE.Group();
    root.position.x -= c.x; root.position.z -= c.z; root.position.y -= b2.min.y;
    inner.add(root);
    const size = bbox(inner).s;

    registry.set(key, {
      proto: inner, size, kind: spec.kind,
      anims: g.animations || [],
    });
    done++;
    onProgress(done / total, name);
  };

  // carrega em ondas para não travar
  const queue = uniq.slice();
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const k = queue.shift();
      try { await loadOne(k); } catch (e) { console.warn('falhou', k, e.message); }
    }
  });
  await Promise.all(workers);
  return registry;
}

/** instância estática (compartilha geometria) */
export function make(key, opts = {}) {
  const r = registry.get(key);
  if (!r) { console.warn('modelo ausente', key); return new THREE.Group(); }
  const g = r.proto.clone(true);
  if (opts.paint) {
    g.traverse(o => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      if (o.material.color) o.material.color.set(opts.paint);
    });
  }
  if (opts.rx) g.rotation.x += opts.rx;
  if (opts.ry) g.rotation.y += opts.ry;
  if (opts.s) g.scale.multiplyScalar(opts.s);
  g.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
  g.userData.size = r.size;
  return g;
}

/** instância de personagem (esqueleto independente) */
export function makeChar(key) {
  const r = registry.get(key);
  if (!r) return null;
  const g = skClone(r.proto);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(g);
  const clips = {};
  for (const a of r.anims) clips[a.name] = a;
  const walk = clips.walk || clips.idle || r.anims[0];
  const idle = clips.idle || walk;
  const action = mixer.clipAction(walk);
  action.play();
  return { obj: g, mixer, walk: mixer.clipAction(walk), idle: mixer.clipAction(idle), clips };
}

/** carros (OBJ + MTL) */
export async function loadCars() {
  const out = {};
  const mk = async (name, objFile, mtlFile, len) => {
    const mats = await mtlLoader.loadAsync(M + 'cars/' + mtlFile);
    mats.preload();
    objLoader.setMaterials(mats);
    const g = await objLoader.loadAsync(M + 'cars/' + objFile);
    g.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const mats2 = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats2) {
        m.roughness = 0.38; m.metalness = 0.25;
        if (/window/i.test(m.name)) { m.color.set(0x1b2733); m.roughness = 0.12; m.metalness = 0.5; }
        if (/light/i.test(m.name)) { m.emissive = new THREE.Color(/tail/i.test(m.name) ? 0xff2211 : 0xfff0cc); m.emissiveIntensity = 0.6; }
      }
    });
    const { s } = bbox(g);
    const sc = len / Math.max(s.z, s.x);
    g.scale.setScalar(sc);
    g.updateMatrixWorld(true);
    const bb = bbox(g).b;
    const c = new THREE.Vector3(); bb.getCenter(c);
    const wrap = new THREE.Group();
    g.position.x -= c.x; g.position.z -= c.z; g.position.y -= bb.min.y;
    wrap.add(g);
    out[name] = { proto: wrap, size: bbox(wrap).s };
  };
  await mk('car', 'NormalCar2.obj', 'NormalCar2.mtl', 4.5);
  await mk('cop', 'Cop.obj', 'Cop.mtl', 4.9);
  return out;
}

export function textureVariant(path) {
  if (!texCache.has(path)) {
    const t = new THREE.TextureLoader().load(M + path);
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
    texCache.set(path, t);
  }
  return texCache.get(path);
}
