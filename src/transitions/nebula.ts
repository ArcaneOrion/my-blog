// 3D 星云坍缩：无数粒子从远端向中心拉伸并伴随相机超光速冲刺。
// 保持白色极简美学（#fbfaf7 / #FAF9F6 暖白底色 + 深色几何骨架线框和微弱灰尘粒子），背景融入极淡的 fog (FogExp2)。

import type { TransitionSpec, TransitionCtx } from './types';
import { createOverlay } from './types';
import { navigate } from 'astro:transitions/client';
import * as THREE from 'three';

const SYMBOLS = [
  'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'ψ', 'ω',
  'Φ', 'Ψ', 'Ω', 'Σ', '∇', '∂', '∫', 'ℵ', 'ℿ', 'ℱ',
  'x ∈ S²', 'y ∈ R²', 'mapping', 'observatory'
];

export const nebulaTransition: TransitionSpec = {
  id: 'nebula',
  durationMs: 3000,
  freezeCanvas: true,

  play: async ({ center, radius, targetUrl }) => {
    // 1. 创建全屏高层级的 z-index Overlay
    const overlay = createOverlay('transition-nebula');
    overlay.style.zIndex = '100';

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 创建 HTML 标签容器，用于渲染 3D 投影的希腊字母和状态，增强深度感
    const labelContainer = document.createElement('div');
    labelContainer.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 105;
      pointer-events: none;
      overflow: hidden;
    `;
    overlay.appendChild(labelContainer);

    // 2. 初始化 Three.js WebGL 场景
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 100;
      pointer-events: none;
    `;
    overlay.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    // 极淡暖白背景与 FogExp2
    const bgHex = 0xfbfaf7;
    scene.fog = new THREE.FogExp2(bgHex, 0.0022);

    const fov = 45;
    const aspect = width / height;
    const cameraZ = 600;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2500);

    // 3. 将 2D 坐标 1:1 映射到 WebGL 3D 坐标
    const planeHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraZ;
    const pixelRatio = planeHeight / height;

    const webglCx = (center.x - width / 2) * pixelRatio;
    const webglCy = -(center.y - height / 2) * pixelRatio;
    const webglRadius = radius * pixelRatio;

    camera.position.set(webglCx, webglCy, cameraZ);
    camera.lookAt(webglCx, webglCy, 0);

    // 4. 创建发光的中心拓扑圆（托拉斯纽结 Torus Knot 作为引力坍缩中心）
    const knotGroup = new THREE.Group();
    scene.add(knotGroup);

    // 优雅的托拉斯纽结代表时空坍缩核心
    const knotGeo = new THREE.TorusKnotGeometry(webglRadius * 0.45, webglRadius * 0.12, 100, 16, 2, 3);
    const knotWire = new THREE.WireframeGeometry(knotGeo);
    const knotMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed, // 紫色引力核心
      transparent: true,
      opacity: 0.65,
    });
    const knotMesh = new THREE.LineSegments(knotWire, knotMat);
    knotMesh.position.set(webglCx, webglCy, 0);
    knotGroup.add(knotMesh);

    // 5. 粒子坍缩系统
    const particleCount = 650;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x52269e); // 深紫
    const color2 = new THREE.Color(0x1d4ed8); // 经典蓝
    const color3 = new THREE.Color(0xbe185d); // AI粉红/胭脂红

    // 记录每个粒子的引力轨迹
    const initialPositions: THREE.Vector3[] = [];
    const targetPositions: THREE.Vector3[] = [];
    const particleSpeeds: number[] = [];
    const particleDelays: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // 粒子原本散落在大球体表面或极远处，慢慢坍缩并汇入中心
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 700 + Math.random() * 1200; // 极远处

      const sx = webglCx + dist * Math.sin(phi) * Math.cos(angle);
      const sy = webglCy + dist * Math.sin(phi) * Math.sin(angle);
      const sz = -300 - Math.random() * 1200;

      positions[i * 3] = sx;
      positions[i * 3 + 1] = sy;
      positions[i * 3 + 2] = sz;

      initialPositions.push(new THREE.Vector3(sx, sy, sz));

      // 目标位置是中心节点，并带有轻微的旋转旋涡偏差
      const spiralAngle = angle + 1.2; // 带来螺旋吸入感
      const tx = webglCx + (webglRadius * 0.15) * Math.cos(spiralAngle);
      const ty = webglCy + (webglRadius * 0.15) * Math.sin(spiralAngle);
      const tz = 0; // 朝着 z = 0 汇入

      targetPositions.push(new THREE.Vector3(tx, ty, tz));

      particleSpeeds.push(1.5 + Math.random() * 2.0);
      particleDelays.push(Math.random() * 0.5); // 异步启动，更加错落

      const randColor = Math.random();
      const pColor = randColor < 0.4 ? color1 : randColor < 0.75 ? color2 : color3;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. 3D 浮动的希腊字母和数理常数
    const labels: Array<{ el: HTMLDivElement; pos: THREE.Vector3 }> = [];
    const labelCount = 14;

    for (let i = 0; i < labelCount; i++) {
      const el = document.createElement('div');
      const text = SYMBOLS[i % SYMBOLS.length];
      const isGlyph = text.length === 1;

      el.textContent = text;
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -50%);
        font-family: ${isGlyph ? 'Cormorant Garamond, serif' : 'JetBrains Mono, monospace'};
        font-size: ${isGlyph ? '1.4rem' : '0.7rem'};
        font-weight: 300;
        color: rgba(124, 58, 237, 0.7);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 300ms ease;
      `;
      labelContainer.appendChild(el);

      // 标签的 3D 空间
      const lz = -100 - (i / labelCount) * 1300;
      const angle = (i / labelCount) * Math.PI * 2 + Math.random() * 0.4;
      const dist = webglRadius * (0.8 + Math.random() * 1.5);
      const lx = webglCx + Math.cos(angle) * dist;
      const ly = webglCy + Math.sin(angle) * dist;

      labels.push({
        el,
        pos: new THREE.Vector3(lx, ly, lz),
      });
    }

    // 闪白层
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      zIndex: '120',
      pointerEvents: 'none',
      transition: 'background 800ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    // 主页元素退场
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 700ms ease, filter 900ms ease';
    });

    if (pageRoot) {
      pageRoot.style.opacity = '0.04';
      pageRoot.style.filter = 'blur(4px)';
    }
    if (narrativeLayer) {
      narrativeLayer.style.opacity = '0';
      narrativeLayer.style.filter = 'blur(6px)';
    }
    if (sysInfo) sysInfo.style.opacity = '0';
    if (structureField) {
      structureField.style.opacity = '0';
      structureField.style.filter = 'blur(6px)';
    }

    // 7. 动画渲染循环
    const startTime = performance.now();
    let rAFId = 0;
    const duration = 3000;

    const tempV = new THREE.Vector3();

    function animate(now: number) {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1.0);

      // 旋转引力中心托拉斯纽结
      knotGroup.rotation.z = elapsed * 0.0004;
      knotGroup.rotation.y = elapsed * 0.0006;
      knotGroup.rotation.x = elapsed * 0.0002;

      // 引力坍缩：拉伸粒子
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const delay = particleDelays[i];
        let pPct = (pct - delay) / (1.0 - delay);
        if (pPct < 0) pPct = 0;

        // 加速坠入核心 (使用立方缓动，产生极速拉伸感)
        const tEase = Math.pow(pPct, particleSpeeds[i]);

        const startPos = initialPositions[i];
        const targetPos = targetPositions[i];

        // 沿 z 轴旋转
        const rotAngle = tEase * 2.5; // 吸入瞬间产生急剧旋转扭动
        const cosR = Math.cos(rotAngle);
        const sinR = Math.sin(rotAngle);

        // 插值计算
        const curX = startPos.x + (targetPos.x - startPos.x) * tEase;
        const curY = startPos.y + (targetPos.y - startPos.y) * tEase;
        const curZ = startPos.z + (targetPos.z - startPos.z) * tEase;

        // 计算带螺旋扭转的最终位置
        const dx = curX - webglCx;
        const dy = curY - webglCy;
        posAttr.setXYZ(
          i,
          webglCx + dx * cosR - dy * sinR,
          webglCy + dx * sinR + dy * cosR,
          curZ
        );
      }
      posAttr.needsUpdate = true;

      // 相机冲刺，从 600 高速穿透到 -1200
      const camProgress = Math.pow(pct, 2.8);
      const currentCamZ = cameraZ - camProgress * 1800;
      camera.position.set(webglCx, webglCy, currentCamZ);

      // FOV 急速拉大 (Dolly Zoom / Tunnel distortion)
      const fovProgress = Math.pow(pct, 3.5);
      camera.fov = fov + fovProgress * 85;
      camera.updateProjectionMatrix();

      // 数学标签 3D 投影与淡显
      labels.forEach(({ el, pos }) => {
        tempV.copy(pos);
        tempV.project(camera);

        const behindCamera = currentCamZ <= pos.z;
        const distToCam = Math.abs(pos.z - currentCamZ);

        if (behindCamera || tempV.z > 1 || distToCam < 40) {
          el.style.opacity = '0';
        } else {
          const screenX = (tempV.x * 0.5 + 0.5) * width;
          const screenY = (tempV.y * -0.5 + 0.5) * height;
          el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;

          let op = 0.0;
          if (distToCam < 400) {
            op = (distToCam / 400) * 0.85;
          } else {
            op = (1.0 - (distToCam - 400) / 400) * 0.85;
          }
          el.style.opacity = `${Math.min(Math.max(op, 0), 0.85)}`;
        }
      });

      renderer.render(scene, camera);

      if (pct < 1.0) {
        rAFId = requestAnimationFrame(animate);
      }
    }

    rAFId = requestAnimationFrame(animate);

    // T+2300ms: 闪白层渐入
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.95)';
    }, 2300);

    // T+2800ms: 闪白遮罩彻底覆盖
    await new Promise((resolve) => setTimeout(resolve, 2800));
    cancelAnimationFrame(rAFId);

    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Astro navigate 跳转
    navigate(targetUrl);

    // 释放资源
    setTimeout(() => {
      labels.forEach(({ el }) => el.remove());
      knotGeo.dispose();
      knotMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      overlay.remove();
    }, 600);
  },
};
