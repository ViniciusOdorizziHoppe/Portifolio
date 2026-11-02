import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Agrupa clones estáticos e funde por material -> poucos draw calls.
 * Uso: const b = new Batcher(); b.add(proto, matrix); b.build(scene);
 */
export class Batcher {
  constructor() { this.stage = new THREE.Group(); this.stage.matrixAutoUpdate = false; }

  add(proto, matrix) {
    const o = proto.clone(true);
    o.matrixAutoUpdate = false;
    o.matrix.copy(matrix);
    o.updateMatrixWorld(true);
    this.stage.add(o);
    return o;
  }

  /** chave extra para separar lotes (ex.: por modelo) */
  build(scene, name = 'batch') {
    const byMat = new Map();
    this.stage.updateMatrixWorld(true);
    this.stage.traverse(m => {
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      // cada mesh normalmente tem 1 material; se tiver vários, usa o primeiro grupo
      const mat = mats[0];
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      // normaliza atributos (evita falha de merge)
      for (const k of Object.keys(g.attributes)) {
        if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      }
      if (!g.attributes.normal) g.computeVertexNormals();
      const key = mat.uuid;
      if (!byMat.has(key)) byMat.set(key, { mat, geos: [] });
      byMat.get(key).geos.push(g);
    });

    const out = [];
    for (const { mat, geos } of byMat.values()) {
      if (!geos.length) continue;
      let merged;
      try { merged = mergeGeometries(geos, false); } catch (e) { merged = null; }
      if (!merged) { geos.forEach(g => { const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; scene.add(m); out.push(m); }); continue; }
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.name = name;
      scene.add(mesh);
      out.push(mesh);
      geos.forEach(g => g.dispose());
    }
    this.stage.clear();
    return out;
  }
}

export function mat4(x, y, z, ry = 0, s = 1) {
  const m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
    new THREE.Vector3(s, s, s)
  );
  return m;
}
