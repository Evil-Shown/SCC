import { useEffect, useRef } from "react";
import * as THREE from "three";

export const useProfileAuroraBackground = (canvasRef, canvasReady = true) => {
  const frameRef = useRef(null);

  useEffect(() => {
    if (!canvasReady || !canvasRef.current) return;

    const mountEl = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x102132);
    scene.fog = new THREE.FogExp2(0x142739, 0.0165);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 2, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountEl.innerHTML = "";
    mountEl.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x9fb6cb, 0.4);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0x93ddff, 1.08, 90);
    keyLight.position.set(-10, 8, 14);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa7f3c2, 0.9, 90);
    fillLight.position.set(12, -3, 10);
    scene.add(fillLight);

    const floorGeometry = new THREE.PlaneGeometry(140, 140, 40, 40);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: 0x1b3448,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -8;
    scene.add(floor);

    const auroraGroup = new THREE.Group();
    scene.add(auroraGroup);

    const auroraData = [];
    const auroraColors = [0xa5e5ff, 0xb5f5ce, 0xd7ccff];

    for (let index = 0; index < 3; index += 1) {
      const points = [];
      for (let x = -32; x <= 32; x += 2) {
        points.push(new THREE.Vector3(x, Math.sin(x * 0.18 + index) * 2.2 + index * 1.6, -24 + index * 4));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: auroraColors[index],
        transparent: true,
          opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geometry, material);
      auroraGroup.add(line);

      auroraData.push({
        line,
        points,
        speed: 0.5 + index * 0.2,
        amplitude: 1 + index * 0.15,
        offset: index * 0.9,
      });
    }

    const fireflyGroup = new THREE.Group();
    scene.add(fireflyGroup);

    for (let index = 0; index < 24; index += 1) {
      const hueColor = [0xfff3a3, 0xb4fff0, 0xd6ecff][index % 3];
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 10, 10),
        new THREE.MeshStandardMaterial({
          color: hueColor,
          emissive: hueColor,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0,
          transparent: true,
          opacity: 0.86,
        })
      );

      orb.position.set(
        (Math.random() - 0.5) * 34,
        -4 + Math.random() * 14,
        -22 + Math.random() * 20
      );
      orb.userData = {
        speed: 0.3 + Math.random() * 0.6,
        offset: Math.random() * Math.PI * 2,
        drift: 0.12 + Math.random() * 0.24,
      };
      fireflyGroup.add(orb);
    }

    const particlesCount = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const color = new THREE.Color();

    for (let index = 0; index < particlesCount; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 90;
      positions[index * 3 + 1] = -8 + Math.random() * 34;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 90;

      const palette = index % 3;
      if (palette === 0) color.set(0xe2e8f0);
      if (palette === 1) color.set(0x99f6e4);
      if (palette === 2) color.set(0xbfdbfe);

      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    const breezeLayers = [];
    for (let index = 0; index < 2; index += 1) {
      const layer = new THREE.Mesh(
        new THREE.PlaneGeometry(110, 48),
        new THREE.MeshBasicMaterial({
          color: index === 0 ? 0x0ea5e9 : 0x22c55e,
          transparent: true,
          opacity: 0.09 - index * 0.02,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      layer.position.set(0, 1 + index * 6, -28 - index * 8);
      layer.rotation.x = -0.12 - index * 0.04;
      scene.add(layer);
      breezeLayers.push(layer);
    }

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      const elapsed = performance.now() * 0.001;

      auroraData.forEach((item) => {
        const positionArray = item.line.geometry.attributes.position.array;
        for (let index = 0; index < item.points.length; index += 1) {
          const point = item.points[index];
          const phase = elapsed * item.speed + index * 0.08 + item.offset;
          positionArray[index * 3] = point.x;
          positionArray[index * 3 + 1] =
            point.y + Math.sin(phase) * item.amplitude + Math.cos(phase * 0.7) * 0.35;
          positionArray[index * 3 + 2] = point.z + Math.sin(phase * 0.35) * 0.9;
        }
        item.line.geometry.attributes.position.needsUpdate = true;
      });

      fireflyGroup.children.forEach((orb, index) => {
        const data = orb.userData;
        orb.position.x += Math.sin(elapsed * data.speed + data.offset) * 0.004 * data.drift;
        orb.position.y += Math.cos(elapsed * (data.speed * 0.8) + data.offset) * 0.004;
        orb.position.z += Math.sin(elapsed * 0.2 + index) * 0.002;
        orb.material.opacity = 0.45 + Math.sin(elapsed * data.speed * 2.4 + data.offset) * 0.35;
      });

      particleField.rotation.y += 0.0002;
      particleField.rotation.x = Math.sin(elapsed * 0.1) * 0.02;

      const particlePositions = particleField.geometry.attributes.position.array;
      for (let index = 0; index < particlesCount; index += 1) {
        particlePositions[index * 3 + 1] += 0.004 + Math.sin(elapsed * 0.8 + index * 0.05) * 0.0015;
        if (particlePositions[index * 3 + 1] > 26) {
          particlePositions[index * 3 + 1] = -8;
        }
      }
      particleField.geometry.attributes.position.needsUpdate = true;

      breezeLayers.forEach((layer, index) => {
        layer.rotation.z = Math.sin(elapsed * 0.15 + index * 0.7) * 0.08;
        layer.material.opacity = (index === 0 ? 0.07 : 0.05) + Math.sin(elapsed * 0.5 + index) * 0.012;
      });

      camera.position.x += ((mouseX * 1.8) - camera.position.x) * 0.02;
      camera.position.y += ((mouseY * 1.2) - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(frameRef.current);

      floorGeometry.dispose();
      floorMaterial.dispose();

      auroraData.forEach(({ line }) => {
        line.geometry.dispose();
        line.material.dispose();
      });

      fireflyGroup.children.forEach((orb) => {
        orb.geometry.dispose();
        orb.material.dispose();
      });

      breezeLayers.forEach((layer) => {
        layer.geometry.dispose();
        layer.material.dispose();
      });

      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, [canvasRef, canvasReady]);
};
