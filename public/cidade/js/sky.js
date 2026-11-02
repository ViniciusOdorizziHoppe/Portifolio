import * as THREE from 'three';

/* Paletas por elevação solar */
const PALETTE = {
  night:  { top: 0x050710, hor: 0x131c2e, sun: 0x1a2440, hemi: 0x22314a, ground: 0x0a0d12, fog: 0x101828 },
  dusk:   { top: 0x2a3f6b, hor: 0xff9d5c, sun: 0xff8a3d, hemi: 0x6a7fa8, ground: 0x2b2620, fog: 0x8a7a72 },
  day:    { top: 0x3f7fc4, hor: 0xc3d8ea, sun: 0xfff4e2, hemi: 0xbfd8f0, ground: 0x6a6a58, fog: 0xc3d8ea },
};

function lerpColor(a, b, t, out) {
  out.setHex(a).lerp(new THREE.Color(b), t);
  return out;
}

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    /* ---- domo ---- */
    this.uniforms = {
      topCol: { value: new THREE.Color(PALETTE.day.top) },
      horCol: { value: new THREE.Color(PALETTE.day.hor) },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunCol: { value: new THREE.Color(0xffffff) },
      sunI:   { value: 1 },
    };
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(900, 32, 20),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: this.uniforms,
        vertexShader: `
          varying vec3 vDir;
          void main(){
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          varying vec3 vDir;
          uniform vec3 topCol, horCol, sunCol;
          uniform vec3 sunDir;
          uniform float sunI;
          void main(){
            float h = clamp(vDir.y, -1.0, 1.0);
            vec3 c = mix(horCol, topCol, smoothstep(-0.02, 0.62, h));
            float d = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
            c += sunCol * pow(d, 220.0) * 1.5 * sunI;          // disco
            c += sunCol * pow(d, 6.0) * 0.16 * sunI;           // halo
            gl_FragColor = vec4(c, 1.0);
          }`,
      })
    );
    dome.frustumCulled = false;
    dome.renderOrder = -10;
    scene.add(dome);
    this.dome = dome;

    /* ---- estrelas ---- */
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * r * 800;
      pos[i * 3 + 1] = Math.abs(u) * 700 + 30;
      pos[i * 3 + 2] = Math.sin(a) * r * 800;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xdfe8ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false,
    }));
    this.stars.frustumCulled = false;
    scene.add(this.stars);

    /* ---- luzes ---- */
    this.sun = new THREE.DirectionalLight(0xfff4e2, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -95; sc.right = 95; sc.top = 95; sc.bottom = -95; sc.near = 1; sc.far = 420;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.moon = new THREE.DirectionalLight(0xa9c4ff, 0);
    scene.add(this.moon);

    this.hemi = new THREE.HemisphereLight(0xbfd8f0, 0x6a6a58, 1.0);
    scene.add(this.hemi);

    this.amb = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(this.amb);

    scene.fog = new THREE.Fog(0xc3d8ea, 130, 520);
    scene.fog.far = 560;

    this.night = 0;
    this.hour = 12;
    this._c1 = new THREE.Color();
    this._c2 = new THREE.Color();
  }

  setTime(hour) {
    this.hour = ((hour % 24) + 24) % 24;
    const h = this.hour;

    // theta: 0 no nascer (6h), PI no poente (18h)
    const theta = ((h - 6) / 12) * Math.PI;
    const dir = new THREE.Vector3(
      Math.cos(theta),
      Math.sin(theta) * 0.98,
      -0.40
    ).normalize();
    const elev = dir.y;

    this.sun.position.copy(dir).multiplyScalar(300);
    this.sun.target.position.set(0, 0, 0);

    // fatores
    const dayF = THREE.MathUtils.smoothstep(elev, 0.02, 0.30);
    const duskF = THREE.MathUtils.smoothstep(elev, -0.16, 0.10);
    const night = 1 - THREE.MathUtils.smoothstep(elev, -0.12, 0.10);
    this.night = night;

    // cores
    const P = PALETTE;
    const top = this._c1;
    const hor = this._c2;
    // base: noite -> crepúsculo -> dia
    top.setHex(P.night.top).lerp(new THREE.Color(P.dusk.top), duskF);
    top.lerp(new THREE.Color(P.day.top), dayF);
    hor.setHex(P.night.hor).lerp(new THREE.Color(P.dusk.hor), duskF);
    hor.lerp(new THREE.Color(P.day.hor), dayF);

    this.uniforms.topCol.value.copy(top);
    this.uniforms.horCol.value.copy(hor);
    this.uniforms.sunDir.value.copy(dir);
    this.uniforms.sunCol.value.setHex(P.dusk.sun).lerp(new THREE.Color(P.day.sun), dayF);
    this.uniforms.sunI.value = THREE.MathUtils.smoothstep(elev, -0.08, 0.05);

    // sol / lua
    this.sun.intensity = 3.0 * dayF + 1.1 * duskF * (1 - dayF);
    this.sun.color.setHex(P.dusk.sun).lerp(new THREE.Color(P.day.sun), dayF);
    this.sun.castShadow = elev > -0.02;

    this.moon.intensity = 0.55 * night;
    this.moon.position.copy(dir).multiplyScalar(-300);

    this.hemi.intensity = 0.22 + 0.95 * dayF + 0.35 * duskF;
    this.hemi.color.copy(hor);
    this.hemi.groundColor.setHex(P.night.ground).lerp(new THREE.Color(P.day.ground), dayF);

    this.amb.intensity = 0.10 + 0.16 * dayF;
    this.amb.color.setHex(night > 0.5 ? 0x2a3f66 : 0xffffff);

    if (this.scene.fog) this.scene.fog.color.copy(hor);

    this.stars.material.opacity = Math.max(0, night - 0.15) * 0.95;
    this.stars.visible = night > 0.2;
    this.dome.visible = true;
    return { night, elev, hour: h };
  }

  /** sombra acompanha o jogador */
  followShadow(x, z) {
    this.sun.target.position.set(x, 0, z);
    this.sun.position.copy(this.sun.position).sub(new THREE.Vector3(0, 0, 0));
    const d = this.sun.position.clone().normalize();
    this.sun.position.set(x + d.x * 260, d.y * 260, z + d.z * 260);
    this.sun.target.updateMatrixWorld();
  }

  /** posição do sol (para reflexo na água) */
  get sunDir() { return this.uniforms.sunDir.value; }
}
