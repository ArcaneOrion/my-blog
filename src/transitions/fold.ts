// 3D 维度折叠：主页所有几何结构被压缩，圆门折叠为由 3D 线框构成的拓扑流形（如扭转的 3D Mobius 环或扭曲双曲抛物面），伴随着网格线条向中心流星般坍缩，相机超光速突进穿透！
// 保持白色极极简美学（#fbfaf7 / #FAF9F6 暖白底色 + 深色几何骨架线框和微弱灰尘粒子），背景融入极淡的 fog (FogExp2)。

import type { TransitionSpec, TransitionCtx } from './types';
import { createOverlay } from './types';
import { navigate } from 'astro:transitions/client';
import * as THREE from 'three';

const MATH_GLYPHS = [
  'Möbius Band · M²',
  'det(A)',
  'dim · V',
  'manifold · M',
  'R³ ➔ S²',
  'rank · J',
  'dy ∧ dx',
  'df = Σ (∂f/∂xi) dxi',
  'Curvature',
  'π · S²',
  'T² · torus',
  'χ(M) = 2 - 2g'
];

export const foldTransition: TransitionSpec = {
  id: 'fold',
  durationMs: 2600,
  freezeCanvas: true,

  play: async ({ center, radius, targetUrl }) => {
    // 1. 创建全屏高层级的 z-index Overlay
    const overlay = createOverlay('transition-fold');
    overlay.style.zIndex = '100';

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 创建 HTML 标签容器，用于渲染 3D 投影的数学公式与流形名称
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
    scene.fog = new THREE.FogExp2(bgHex, 0.0025);

    const fov = 45;
    const aspect = width / height;
    const cameraZ = 500;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2200);

    // 3. 将 2D 坐标 1:1 映射到 WebGL 3D 坐标
    const planeHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraZ;
    const pixelRatio = planeHeight / height;

    const webglCx = (center.x - width / 2) * pixelRatio;
    const webglCy = -(center.y - height / 2) * pixelRatio;
    const webglRadius = radius * pixelRatio;

    camera.position.set(webglCx, webglCy, cameraZ);
    camera.lookAt(webglCx, webglCy, 0);

    // 4. 在 3D 中创建一个优雅自旋的 3D Mobius 环流形，作为 2D 圆门折叠后的实体
    const mobiusGroup = new THREE.Group();
    scene.add(mobiusGroup);

    // 数学定义 Mobius 带几何体
    const mobiusGeo = new THREE.BufferGeometry();
    const uSegments = 80;
    const vSegments = 20;
    const vertices: number[] = [];
    const indices: number[] = [];

    const mobiusR = webglRadius * 1.1;
    const mobiusW = webglRadius * 0.36;

    for (let j = 0; j <= uSegments; j++) {
      const u = (j / uSegments) * Math.PI * 2;
      for (let k = 0; k <= vSegments; k++) {
        const v = (k / vSegments - 0.5) * mobiusW;

        // 莫比乌斯带的经典参数方程
        const x = (mobiusR + v * Math.cos(u / 2)) * Math.cos(u);
        const y = (mobiusR + v * Math.cos(u / 2)) * Math.sin(u);
        const z = v * Math.sin(u / 2);

        vertices.push(webglCx + x, webglCy + y, z);
      }
    }

    // 构建格网索引，使其能用 LineSegments 渲染出精致的数学网格面
    for (let j = 0; j < uSegments; j++) {
      for (let k = 0; k < vSegments; k++) {
        const i0 = j * (vSegments + 1) + k;
        const i1 = i0 + 1;
        const i2 = (j + 1) * (vSegments + 1) + k;
        const i3 = i2 + 1;

        // 横线
        indices.push(i0, i1);
        // 竖线
        indices.push(i0, i2);
      }
    }

    mobiusGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mobiusGeo.setIndex(indices);

    const mobiusMat = new THREE.LineBasicMaterial({
      color: 0x2e1b6b, // 猎户座深紫
      transparent: true,
      opacity: 0.55,
    });
    const mobiusMesh = new THREE.LineSegments(mobiusGeo, mobiusMat);
    mobiusGroup.add(mobiusMesh);

    // 5. 放射状网格几何射线 (3D Grid Lines)
    const lineCount = 36;
    const gridLines: THREE.Line[] = [];
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    const diag = Math.hypot(width, height) * pixelRatio;

    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      // 起点在远端外围，并分布在不同 z 深度处
      const startDist = diag * 0.95;
      const startZ = -300 - Math.random() * 800;

      const sx = webglCx + Math.cos(angle) * startDist;
      const sy = webglCy + Math.sin(angle) * startDist;

      // 终点指向折叠核心
      const endX = webglCx + Math.cos(angle) * webglRadius * 0.4;
      const endY = webglCy + Math.sin(angle) * webglRadius * 0.4;
      const endZ = 150; // 朝着相机后方汇聚

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, sy, startZ),
        new THREE.Vector3(endX, endY, endZ)
      ]);

      const lineMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x2e1b6b : 0x1d4ed8,
        transparent: true,
        opacity: 0.15,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      lineGroup.add(line);
      gridLines.push(line);
    }

    // 6. 微粒星尘 (Dust)
    const particleCount = 350;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const pColor1 = new THREE.Color(0x2e1b6b);
    const pColor2 = new THREE.Color(0x1d4ed8);

    for (let i = 0; i < particleCount; i++) {
      const pz = -Math.random() * 1400;
      const angle = Math.random() * Math.PI * 2;
      const dist = (webglRadius * 0.6) + Math.random() * 300;

      positions[i * 3] = webglCx + Math.cos(angle) * dist;
      positions[i * 3 + 1] = webglCy + Math.sin(angle) * dist;
      positions[i * 3 + 2] = pz;

      const pColor = Math.random() < 0.55 ? pColor1 : pColor2;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 7. 3D 浮动的几何拓扑标签
    const labels: Array<{ el: HTMLDivElement; pos: THREE.Vector3 }> = [];
    const labelCount = 10;

    for (let i = 0; i < labelCount; i++) {
      const el = document.createElement('div');
      const text = MATH_GLYPHS[i % MATH_GLYPHS.length];

      el.textContent = text;
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -50%);
        font-family: JetBrains Mono, monospace;
        font-size: 0.7rem;
        font-weight: 300;
        color: rgba(46, 27, 107, 0.7);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 300ms ease;
      `;
      labelContainer.appendChild(el);

      const lz = -100 - (i / labelCount) * 1100;
      const angle = (i / labelCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = webglRadius * (0.85 + Math.random() * 1.2);
      const lx = webglCx + Math.cos(angle) * dist;
      const ly = webglCy + Math.sin(angle) * dist;

      labels.push({
        el,
        pos: new THREE.Vector3(lx, ly, lz),
      });
    }

    // 闪白全屏层
    const fade = document.createElement('div');
    Object.assign(fade.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(251, 250, 247, 0)',
      zIndex: '120',
      pointerEvents: 'none',
      transition: 'background 750ms cubic-bezier(0.7, 0, 0.84, 0)',
    });
    overlay.appendChild(fade);

    // 8. 主页 2D 元素渐变淡出，同时主 canvas 轻微进行缩放扭曲退场
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 600ms ease, filter 800ms ease, transform 1500ms cubic-bezier(0.55, 0, 0.85, 0)';
    });

    if (pageRoot) {
      pageRoot.style.opacity = '0.05';
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
      structureField.style.transformOrigin = `${center.x}px ${center.y}px`;
      structureField.style.transform = 'scale(0.35) rotate(15deg)';
    }

    // 9. 动画渲染循环
    const startTime = performance.now();
    let rAFId = 0;
    const duration = 2600;

    const tempV = new THREE.Vector3();

    function animate(now: number) {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1.0);

      // 自旋扭转 Möbius 环
      mobiusGroup.rotation.z = elapsed * 0.0005;
      mobiusGroup.rotation.x = elapsed * 0.0003;
      mobiusGroup.rotation.y = elapsed * 0.0002;

      // 放射网格线条随时间自旋，呈现螺旋收缩漏斗感
      lineGroup.rotation.z = elapsed * 0.00015;

      // 闪流星坍缩：线条缩短、逼近中心
      const collapseProgress = Math.pow(pct, 2.0);
      lineGroup.scale.set(
        1.0 - collapseProgress * 0.95,
        1.0 - collapseProgress * 0.95,
        1.0
      );

      // 相机推进 (从 500 高速冲向 -1300)
      const moveProgress = Math.pow(pct, 2.6);
      const currentCamZ = cameraZ - moveProgress * 1800;
      camera.position.set(webglCx, webglCy, currentCamZ);

      // Dolly Zoom / FOV Warp 效应：从 45 急速拉大到 130+
      const fovProgress = Math.pow(pct, 3.4);
      camera.fov = fov + fovProgress * 85;
      camera.updateProjectionMatrix();

      // 数学标签 3D 空间投影与淡出
      labels.forEach(({ el, pos }) => {
        tempV.copy(pos);
        tempV.project(camera);

        const behindCamera = currentCamZ <= pos.z;
        const distToCam = Math.abs(pos.z - currentCamZ);

        if (behindCamera || tempV.z > 1 || distToCam < 35) {
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

      // 粒子自旋
      particleSystem.rotation.z = -elapsed * 0.0002;

      renderer.render(scene, camera);

      if (pct < 1.0) {
        rAFId = requestAnimationFrame(animate);
      }
    }

    rAFId = requestAnimationFrame(animate);

    // T+1900ms: 闪白层开始渐入
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.95)';
    }, 1900);

    // T+2400ms: 彻底闪白
    await new Promise((resolve) => setTimeout(resolve, 2400));
    cancelAnimationFrame(rAFId);

    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));

    // 调用 Astro navigate 跳转
    navigate(targetUrl);

    // 释放 WebGL 资源
    setTimeout(() => {
      labels.forEach(({ el }) => el.remove());
      mobiusGeo.dispose();
      mobiusMat.dispose();
      gridLines.forEach(l => l.geometry.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      overlay.remove();
    }, 600);
  },
};
