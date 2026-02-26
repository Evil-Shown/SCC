// hooks/useCyberpunkBackground.js (updated with green neon)
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const useCyberpunkBackground = (canvasRef, canvasReady = true) => {
  const animationRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();

  useEffect(() => {
    if (!canvasReady || !canvasRef.current) return;

    const mountEl = canvasRef.current;

    const scene = new THREE.Scene();
    const isLightMode = () => document.documentElement.getAttribute('data-theme') === 'light';
    scene.background = new THREE.Color(isLightMode() ? 0xd8e7fb : 0x111827);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountEl.innerHTML = '';
    mountEl.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x5b6b8a, isLightMode() ? 1.25 : 1);
    scene.add(ambientLight);

    const lightCyan = new THREE.PointLight(0x67e8f9, isLightMode() ? 1.35 : 1.1, 44);
    lightCyan.position.set(5, 3, 5);
    scene.add(lightCyan);

    const lightGreen = new THREE.PointLight(0x34d399, isLightMode() ? 1.45 : 1.25, 44);
    lightGreen.position.set(-5, 2, 5);
    scene.add(lightGreen);

    const lightPurple = new THREE.PointLight(0xc4b5fd, isLightMode() ? 1.1 : 0.92, 44);
    lightPurple.position.set(2, 5, 10);
    scene.add(lightPurple);

    // Main group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Grid
    const gridHelper = new THREE.GridHelper(40, 20, isLightMode() ? 0x115e59 : 0x10b981, isLightMode() ? 0x1d4ed8 : 0x2dd4bf);
    gridHelper.position.y = -2;
    gridHelper.material.opacity = isLightMode() ? 0.34 : 0.22;
    gridHelper.material.transparent = true;
    mainGroup.add(gridHelper);

    // Rings
    const ringMat = (color) => new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: isLightMode() ? 1.05 : 0.8,
      transparent: true,
      opacity: isLightMode() ? 0.5 : 0.3,
      side: THREE.DoubleSide,
    });
    const ringMaterialCyan = ringMat(0x2dd4bf);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3, 0.1, 16, 64), ringMaterialCyan);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 2;
    mainGroup.add(ring1);

    const ringMaterialGreen = ringMat(0x10b981);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5, 0.15, 16, 64), ringMaterialGreen);
    ring2.rotation.z = Math.PI / 3;
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -1;
    mainGroup.add(ring2);

    const ringMaterialPurple = ringMat(0xa78bfa);
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2, 0.08, 16, 64), ringMaterialPurple);
    ring3.rotation.x = Math.PI / 2;
    ring3.rotation.y = Math.PI / 4;
    ring3.position.y = 4;
    mainGroup.add(ring3);

    const ringMaterials = [ringMaterialCyan, ringMaterialGreen, ringMaterialPurple];

    // Cubes
    const cubeMat = new THREE.MeshStandardMaterial({
      color: isLightMode() ? 0x059669 : 0x10b981,
      emissive: isLightMode() ? 0x065f46 : 0x004400,
      wireframe: true,
      transparent: true,
      opacity: isLightMode() ? 0.42 : 0.3,
    });
    for (let i = 0; i < 6; i++) {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMat);
      cube.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10 - 5);
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mainGroup.add(cube);
    }

    // Particles
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 8;
      const radius = 4 + Math.sin(angle * 2) * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 1.5) * 2;
      positions[i*3] = x;
      positions[i*3+1] = y;
      positions[i*3+2] = z;
      // Color gradient: cyan to green to purple
      const hue = 0.5 + Math.sin(angle)*0.2; // approx 0.5 is greenish
      color.setHSL(hue, 1, 0.6);
      colors[i*3] = color.r;
      colors[i*3+1] = color.g;
      colors[i*3+2] = color.b;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: isLightMode() ? 0.12 : 0.1,
      vertexColors: true,
      blending: isLightMode() ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: isLightMode() ? 0.95 : 0.82,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    const applyTheme = () => {
      const light = isLightMode();

      scene.background.set(light ? 0xeaf2ff : 0x111827);

      ambientLight.intensity = light ? 1.25 : 1;
      lightCyan.intensity = light ? 1.35 : 1.1;
      lightGreen.intensity = light ? 1.45 : 1.25;
      lightPurple.intensity = light ? 1.1 : 0.92;

      ringMaterials.forEach((material) => {
        material.emissiveIntensity = light ? 1.05 : 0.8;
        material.opacity = light ? 0.5 : 0.3;
        material.needsUpdate = true;
      });

      cubeMat.color.set(light ? 0x059669 : 0x10b981);
      cubeMat.emissive.set(light ? 0x065f46 : 0x004400);
      cubeMat.opacity = light ? 0.42 : 0.3;
      cubeMat.needsUpdate = true;

      gridHelper.material.opacity = light ? 0.34 : 0.22;
      if (Array.isArray(gridHelper.material) && gridHelper.material.length >= 2) {
        gridHelper.material[0].color.set(light ? 0x1d4ed8 : 0x2dd4bf);
        gridHelper.material[1].color.set(light ? 0x115e59 : 0x10b981);
      }

      particleMat.size = light ? 0.12 : 0.1;
      particleMat.opacity = light ? 0.95 : 0.82;
      particleMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      particleMat.needsUpdate = true;

      renderer.render(scene, camera);
    };

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    applyTheme();

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    const animate = () => {
      mainGroup.rotation.y += 0.0008;
      mainGroup.rotation.x += 0.0002;
      mainGroup.rotation.y += mouseX * 0.0005;
      mainGroup.rotation.x += mouseY * 0.0003;
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      themeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (mountEl?.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [canvasRef, canvasReady]);
};