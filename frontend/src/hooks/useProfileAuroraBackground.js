import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * useProfileAuroraBackground — "Calm Nebula"
 *
 * Three layered effects:
 *  1. Volumetric particle cloud — 3,200 soft particles drifting in slow sine waves,
 *     breathing in and out like a living nebula across 3 depth shells.
 *  2. Three large orbital torus rings, each slowly rotating on different axes —
 *     barely visible, cinematic depth planes.
 *  3. Gentle mouse parallax on the camera — smooth, weighted, film-like.
 *
 * Palette: deep navy bg, soft teal + warm amber particles, ivory mist.
 */
export const useProfileAuroraBackground = (canvasRef, canvasReady = true) => {
  const frameRef = useRef(null);

  useEffect(() => {
    if (!canvasReady || !canvasRef.current) return;

    const mountEl = canvasRef.current;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // ── SCENE ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120);
    scene.fog = new THREE.FogExp2(0x0c1428, 0.012);

    // ── CAMERA ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 300);
    camera.position.set(0, 0, 38);

    // ── RENDERER ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.CineonToneMapping;
    renderer.toneMappingExposure = 1.05;
    mountEl.innerHTML = "";
    mountEl.appendChild(renderer.domElement);

    // ── LIGHTS ─────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x1a2a4a, 3);
    scene.add(ambientLight);

    const tealFill = new THREE.PointLight(0x2dd4bf, 4, 120);
    tealFill.position.set(-20, 10, 10);
    scene.add(tealFill);

    const amberFill = new THREE.PointLight(0xf59e0b, 3, 120);
    amberFill.position.set(20, -8, 5);
    scene.add(amberFill);

    // ── PARTICLE NEBULA ────────────────────────────────────────────────────
    const createParticleShell = ({ count, spreadX, spreadY, spreadZ, offsetZ, colors, size, opacity }) => {
      const geo      = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colArray  = new Float32Array(count * 3);
      const phases    = new Float32Array(count);
      const speeds    = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const theta  = Math.random() * Math.PI * 2;
        const phi    = Math.acos(2 * Math.random() - 1);
        const radius = Math.pow(Math.random(), 0.4);

        positions[i * 3]     = Math.sin(phi) * Math.cos(theta) * spreadX * radius + (Math.random() - 0.5) * spreadX * 0.3;
        positions[i * 3 + 1] = Math.cos(phi) * spreadY * radius + (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * spreadZ * radius + offsetZ;

        phases[i] = Math.random() * Math.PI * 2;
        speeds[i] = 0.12 + Math.random() * 0.28;

        const c      = colors[Math.floor(Math.random() * colors.length)];
        const bright = 0.5 + Math.random() * 0.5;
        colArray[i * 3]     = c.r * bright;
        colArray[i * 3 + 1] = c.g * bright;
        colArray[i * 3 + 2] = c.b * bright;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(colArray, 3));

      const mat = new THREE.PointsMaterial({
        size, vertexColors: true, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return { points, geo, mat, phases, speeds, count };
    };

    const tealC   = new THREE.Color(0x2dd4bf);
    const amberC  = new THREE.Color(0xf59e0b);
    const ivoryC  = new THREE.Color(0xe8ede4);
    const slateC  = new THREE.Color(0x94a3b8);
    const indigoC = new THREE.Color(0x818cf8);

    const shellFar  = createParticleShell({ count: 1200, spreadX: 55, spreadY: 32, spreadZ: 40, offsetZ: -20, colors: [tealC, slateC, indigoC], size: 0.18, opacity: 0.28 });
    const shellMid  = createParticleShell({ count: 1400, spreadX: 36, spreadY: 22, spreadZ: 28, offsetZ: -8,  colors: [tealC, ivoryC, amberC, slateC], size: 0.13, opacity: 0.42 });
    const shellNear = createParticleShell({ count: 600,  spreadX: 24, spreadY: 14, spreadZ: 16, offsetZ: 4,   colors: [ivoryC, amberC, tealC], size: 0.09, opacity: 0.55 });
    const shells = [shellFar, shellMid, shellNear];

    const basePositions = shells.map(({ geo, count }) => new Float32Array(geo.attributes.position.array));

    // ── ORBITAL TORUS RINGS ────────────────────────────────────────────────
    const rings = [];
    const ringData = [
      { radius: 28, tube: 0.06, color: 0x2dd4bf, opacity: 0.09, rotAxis: new THREE.Vector3(1, 0.3, 0.2).normalize(), rotSpeed: 0.00018 },
      { radius: 20, tube: 0.05, color: 0xf59e0b, opacity: 0.07, rotAxis: new THREE.Vector3(0.2, 1, 0.4).normalize(),  rotSpeed: 0.00025 },
      { radius: 38, tube: 0.04, color: 0x818cf8, opacity: 0.05, rotAxis: new THREE.Vector3(0.5, 0.2, 1).normalize(),  rotSpeed: 0.00012 },
    ];

    ringData.forEach(({ radius, tube, color, opacity, rotAxis, rotSpeed }) => {
      const geo  = new THREE.TorusGeometry(radius, tube, 4, 180);
      const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      scene.add(mesh);
      rings.push({ mesh, mat, rotAxis, rotSpeed, baseOpacity: opacity });
    });

    // ── FINE DUST ─────────────────────────────────────────────────────────
    const dustCount = 800;
    const dustGeo   = new THREE.BufferGeometry();
    const dustPos   = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3]     = (Math.random() - 0.5) * 100;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat   = new THREE.PointsMaterial({ size: 0.05, color: 0x94a3b8, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const dustField = new THREE.Points(dustGeo, dustMat);
    scene.add(dustField);

    // ── MOUSE ─────────────────────────────────────────────────────────────
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMouseMove = (e) => {
      tx = (e.clientX / W()) * 2 - 1;
      ty = -(e.clientY / H()) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── ANIMATE ───────────────────────────────────────────────────────────
    const tmpAxis = new THREE.Vector3();

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      camera.position.x += (mx * 3.5 - camera.position.x) * 0.015;
      camera.position.y += (my * 2.0 - camera.position.y) * 0.015;
      camera.lookAt(0, 0, 0);

      // Particle shell breathing drift
      shells.forEach((shell, si) => {
        const base = basePositions[si];
        const arr  = shell.geo.attributes.position.array;
        const freq = 0.14 + si * 0.06;
        const amp  = 0.35 + si * 0.12;
        for (let i = 0; i < shell.count; i++) {
          const ph = shell.phases[i];
          const sp = shell.speeds[i];
          arr[i * 3]     = base[i * 3]     + Math.sin(t * sp * freq + ph) * amp;
          arr[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * sp * freq * 0.7 + ph + 1.2) * (amp * 0.8);
          arr[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * sp * freq * 0.4 + ph + 2.4) * (amp * 0.5);
        }
        shell.geo.attributes.position.needsUpdate = true;
      });

      // Ring rotation
      rings.forEach((ring, i) => {
        tmpAxis.copy(ring.rotAxis);
        ring.mesh.rotateOnAxis(tmpAxis, ring.rotSpeed);
        ring.mat.opacity = ring.baseOpacity + Math.sin(t * 0.22 + i * 2.1) * (ring.baseOpacity * 0.3);
      });

      dustField.rotation.y += 0.00004;
      dustField.rotation.x = Math.sin(t * 0.05) * 0.01;

      tealFill.position.x = -20 + Math.sin(t * 0.2) * 8;
      tealFill.position.y =  10 + Math.cos(t * 0.15) * 5;
      tealFill.intensity  = 4 + Math.sin(t * 0.4) * 0.8;
      amberFill.position.x = 20 + Math.cos(t * 0.18) * 6;
      amberFill.position.y = -8 + Math.sin(t * 0.22) * 4;
      amberFill.intensity  = 3 + Math.sin(t * 0.35 + 1.5) * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // ── RESIZE ────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    // ── CLEANUP ───────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(frameRef.current);
      shells.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
      rings.forEach(({ mesh, mat }) => { mesh.geometry.dispose(); mat.dispose(); });
      dustGeo.dispose(); dustMat.dispose(); renderer.dispose();
      if (mountEl.contains(renderer.domElement)) mountEl.removeChild(renderer.domElement);
    };
  }, [canvasRef, canvasReady]);
};