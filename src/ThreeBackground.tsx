import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const gridRef = useRef<THREE.PolarGridHelper | null>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 2, 12)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    // ───── Polar Grid (spatial anchor) ─────
    const grid = new THREE.PolarGridHelper(14, 32, 24, 256, 0x222222, 0x111111)
    grid.position.y = -4.5
    scene.add(grid)
    gridRef.current = grid

    // ───── Particles ─────
    const COUNT = 450
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)

    const accentColor = new THREE.Color('#F5C518')
    const whiteColor = new THREE.Color('#ffffff')
    const blueColor = new THREE.Color('#0a72ef')

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const radius = 3 + Math.random() * 9
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 8

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      const colorChoice = Math.random()
      if (colorChoice < 0.15) {
        colors[i3] = accentColor.r
        colors[i3 + 1] = accentColor.g
        colors[i3 + 2] = accentColor.b
      } else if (colorChoice < 0.3) {
        colors[i3] = blueColor.r
        colors[i3 + 1] = blueColor.g
        colors[i3 + 2] = blueColor.b
      } else {
        const brightness = 0.3 + Math.random() * 0.7
        colors[i3] = whiteColor.r * brightness
        colors[i3 + 1] = whiteColor.g * brightness
        colors[i3 + 2] = whiteColor.b * brightness
      }

      sizes[i] = Math.random() * 0.03 + 0.01
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      transparent: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)
    particlesRef.current = particles

    // ───── Ambient glow orbs ─────
    const glowGeo = new THREE.SphereGeometry(6, 32, 32)
    const glowMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#F5C518') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          fresnel = pow(fresnel, 4.0);
          float alpha = fresnel * 0.06;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
    const glowOrb = new THREE.Mesh(glowGeo, glowMat)
    glowOrb.position.set(4, 1, -3)
    scene.add(glowOrb)

    // Second orb (blue)
    const glowGeo2 = new THREE.SphereGeometry(5, 32, 32)
    const glowMat2 = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#0a72ef') },
      },
      vertexShader: glowMat.vertexShader,
      fragmentShader: glowMat.fragmentShader,
      transparent: true,
      depthWrite: false,
    })
    const glowOrb2 = new THREE.Mesh(glowGeo2, glowMat2)
    glowOrb2.position.set(-5, -1, -4)
    scene.add(glowOrb2)

    sceneRef.current = scene
    cameraRef.current = camera

    // ───── Mouse parallax ─────
    let mouseX = 0,
      mouseY = 0
    let targetMouseX = 0,
      targetMouseY = 0

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    // ───── Scroll reaction ─────
    let scrollY = 0
    let targetScrollY = 0
    const onScroll = () => {
      targetScrollY = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ───── Resize ─────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ───── Animation loop ─────
    function animate() {
      frameRef.current = requestAnimationFrame(animate)

      // Smooth lerp
      mouseX += (targetMouseX - mouseX) * 0.02
      mouseY += (targetMouseY - mouseY) * 0.02
      scrollY += (targetScrollY - scrollY) * 0.03

      // Camera parallax
      camera.position.x = mouseX * 2.5
      camera.position.y = 2 + mouseY * 1.5
      camera.lookAt(0, mouseY * 0.5, 0)

      // Particle rotation
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.00015
        particlesRef.current.rotation.x = mouseY * 0.15
      }

      // Grid rotation
      if (gridRef.current) {
        gridRef.current.rotation.x = -0.45 + scrollY * 0.00015
        gridRef.current.rotation.z += 0.0001
      }

      // Update glow uniforms
      glowMat.uniforms.uTime.value += 0.01
      glowMat2.uniforms.uTime.value += 0.008

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
