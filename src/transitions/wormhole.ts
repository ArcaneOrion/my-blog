// 3D 几何虫洞：无数线框圆环组成的 3D 旋转管道，相机高速冲过，两旁飞过网格粒子和坐标文字。
// 保持白色极简美学（#fbfaf7 / #FAF9F6 暖白底色 + 深色几何骨架线框和微弱灰尘粒子），背景融入极淡的 fog (FogExp2)。

import type { TransitionSpec, TransitionCtx } from './types';
import { createOverlay } from './types';
import { navigate } from 'astro:transitions/client';
import * as THREE from 'three';

const MATH_TEXTS = [
  '∇ × B = μ₀J + μ₀ε₀∂E/∂t',
  'e^(iπ) + 1 = 0',
  'lim (x→0) sin(x)/x = 1',
  '∫ e^(-x²) dx = √π',
  'S² ➔ R²',
  'H |ψ⟩ = E |ψ⟩',
  '∂u/∂t = α ∇²u',
  'd(p, q) = √Σ(qi - pi)²',
  'λ · I - A',
  '(x, y) ∈ S²',
  'φ = (1 + √5)/2',
  'ζ(s) = Σ n^(-s)',
  'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'ψ'
];

export const wormholeTransition: TransitionSpec = {
  id: 'wormhole',
  durationMs: 2800,
  freezeCanvas: true,

  play: async ({ center, radius, targetUrl }) => {
    // 1. 创建全屏高层级的 z-index Overlay
    const overlay = createOverlay('transition-wormhole');
    overlay.style.zIndex = '100';

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 创建 HTML 标签容器，用于渲染 3D 投影的数学公式和坐标，避免 canvas 2D 文本模糊或额外字体加载
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
    scene.fog = new THREE.FogExp2(bgHex, 0.0018);

    const fov = 45;
    const aspect = width / height;
    const cameraZ = 500;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000);

    // 3. 将 2D 坐标 1:1 映射到 WebGL 的 3D coordinates
    // 在 z = 0 处，Three.js 的视口高度（以 3D 单位计）：
    const planeHeight = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraZ;
    const pixelRatio = planeHeight / height; // 像素与 3D 单位的缩放比例

    const webglCx = (center.x - width / 2) * pixelRatio;
    const webglCy = -(center.y - height / 2) * pixelRatio;
    const webglRadius = radius * pixelRatio;

    // 相机初始位置对齐 2D 圆环中心
    camera.position.set(webglCx, webglCy, cameraZ);
    camera.lookAt(webglCx, webglCy, 0);

    // 4. 创建 3D 拓扑结构复刻 2D 圆门 (一个具有多圈旋转的 3D Torus)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    // 主圆环 (Torus 几何体，配合网格材质)
    const torusGeo = new THREE.TorusGeometry(webglRadius, webglRadius * 0.015, 8, 80);
    const torusWire = new THREE.WireframeGeometry(torusGeo);
    const torusMat = new THREE.LineBasicMaterial({
      color: 0x1d4ed8, // 经典数学蓝
      transparent: true,
      opacity: 0.7,
    });
    const torusMesh = new THREE.LineSegments(torusWire, torusMat);
    torusMesh.position.set(webglCx, webglCy, 0);
    ringGroup.add(torusMesh);

    // 外圈细光环
    const outerRingGeo = new THREE.RingGeometry(webglRadius * 1.18, webglRadius * 1.185, 64);
    const outerRingWire = new THREE.WireframeGeometry(outerRingGeo);
    const outerRingMat = new THREE.LineBasicMaterial({
      color: 0x2e1b6b, // 猎户座深紫
      transparent: true,
      opacity: 0.4,
    });
    const outerRingMesh = new THREE.LineSegments(outerRingWire, outerRingMat);
    outerRingMesh.position.set(webglCx, webglCy, 0);
    ringGroup.add(outerRingMesh);

    // 5. 3D 虫洞管道隧道 (沿 z 轴向负方向弯曲延伸)
    const tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    const ringCount = 50;
    const tunnelRings: THREE.LineLoop[] = [];
    const tunnelSegments = 64;

    for (let i = 0; i < ringCount; i++) {
      const z = -i * 35; // 向内测延伸
      const progress = i / ringCount;
      // 管道半径在波动中慢慢扩大，产生膨胀感
      const rSize = webglRadius * (1.0 + Math.sin(i * 0.2) * 0.15 + progress * 0.6);

      const points: THREE.Vector3[] = [];
      // 虫洞中轴线呈正弦波动弯曲，制造时空扭曲感
      const offsetX = webglCx + Math.sin(i * 0.15) * 35 * progress;
      const offsetY = webglCy + Math.cos(i * 0.15) * 35 * progress;

      for (let j = 0; j <= tunnelSegments; j++) {
        const theta = (j / tunnelSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          offsetX + Math.cos(theta) * rSize,
          offsetY + Math.sin(theta) * rSize,
          z
        ));
      }

      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringColor = i % 2 === 0 ? 0x2e1b6b : 0x1d4ed8;
      const ringMaterial = new THREE.LineBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.12 + (1.0 - progress) * 0.45,
      });

      const lineLoop = new THREE.LineLoop(ringGeo, ringMaterial);
      tunnelGroup.add(lineLoop);
      tunnelRings.push(lineLoop);
    }

    // 6. 微弱灰尘粒子系统 (3D Stars/Dust)
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const pColor1 = new THREE.Color(0x2e1b6b);
    const pColor2 = new THREE.Color(0x1d4ed8);
    const pColor3 = new THREE.Color(0x7c3aed);

    for (let i = 0; i < particleCount; i++) {
      // 粒子散布在弯曲管道周围
      const pz = -Math.random() * 1600;
      const ringIdx = Math.floor(Math.abs(pz) / 35);
      const ringProg = Math.min(ringIdx / ringCount, 1);
      const ringX = webglCx + Math.sin(ringIdx * 0.15) * 35 * ringProg;
      const ringY = webglCy + Math.cos(ringIdx * 0.15) * 35 * ringProg;

      const angle = Math.random() * Math.PI * 2;
      const dist = (webglRadius * 0.8) + Math.random() * 250;
      const px = ringX + Math.cos(angle) * dist;
      const py = ringY + Math.sin(angle) * dist;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      const r = Math.random();
      const pColor = r < 0.4 ? pColor1 : r < 0.8 ? pColor2 : pColor3;
      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 7. 3D 浮动数学常量与坐标标签
    const labels: Array<{ el: HTMLDivElement; pos: THREE.Vector3 }> = [];
    const labelCount = 12;

    for (let i = 0; i < labelCount; i++) {
      const el = document.createElement('div');
      const text = MATH_TEXTS[i % MATH_TEXTS.length];
      const isGlyph = text.length === 1;

      el.textContent = text;
      el.style.cssText = `
        position: absolute;
        transform: translate(-50%, -50%);
        font-family: ${isGlyph ? 'Cormorant Garamond, serif' : 'JetBrains Mono, monospace'};
        font-size: ${isGlyph ? '1.25rem' : '0.75rem'};
        font-weight: 300;
        color: rgba(46, 27, 107, 0.65);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 300ms ease;
      `;
      labelContainer.appendChild(el);

      // 计算标签在 3D 管道周围的位置
      const lz = -150 - (i / labelCount) * 1100;
      const ringIdx = Math.floor(Math.abs(lz) / 35);
      const ringProg = Math.min(ringIdx / ringCount, 1);
      const ringX = webglCx + Math.sin(ringIdx * 0.15) * 35 * ringProg;
      const ringY = webglCy + Math.cos(ringIdx * 0.15) * 35 * ringProg;

      const angle = (i / labelCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = webglRadius * (0.9 + Math.random() * 0.8);
      const lx = ringX + Math.cos(angle) * dist;
      const ly = ringY + Math.sin(angle) * dist;

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

    // 8. 主页 2D 元素渐变淡出
    const pageRoot = document.querySelector<HTMLElement>('.page-fade-in');
    const narrativeLayer = document.querySelector<HTMLElement>('.narrative-layer');
    const sysInfo = document.querySelector<HTMLElement>('.sys-info');
    const structureField = document.querySelector<HTMLElement>('[data-structure-field]');

    [pageRoot, narrativeLayer, sysInfo, structureField].forEach((el) => {
      if (el) el.style.transition = 'opacity 650ms ease, filter 800ms ease';
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
    }

    // 9. 动画渲染循环
    const startTime = performance.now();
    let rAFId = 0;
    const duration = 2800;

    const tempV = new THREE.Vector3();

    function animate(now: number) {
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1.0);

      // 自旋 3D 门口
      torusMesh.rotation.z = elapsed * 0.0006;
      torusMesh.rotation.y = elapsed * 0.0003;
      outerRingMesh.rotation.z = -elapsed * 0.0004;

      // 扭动虫洞管道
      tunnelRings.forEach((ring, idx) => {
        ring.rotation.z = elapsed * 0.0003 + idx * 0.015;
      });

      // 相机推进 (从 500 高速冲向 -1350)
      const moveProgress = Math.pow(pct, 2.5); // 加速向前推进
      const currentCamZ = cameraZ - moveProgress * 1850;

      // 相机跟随管道中轴线进行微小偏移，增加过山车式沉浸感
      const currentRingIdx = Math.floor(Math.abs(currentCamZ) / 35);
      const currentRingProg = Math.min(Math.max(0, currentRingIdx) / ringCount, 1);
      const camOffsetX = webglCx + Math.sin(currentRingIdx * 0.15) * 35 * currentRingProg * 0.55;
      const camOffsetY = webglCy + Math.cos(currentRingIdx * 0.15) * 35 * currentRingProg * 0.55;

      camera.position.set(camOffsetX, camOffsetY, currentCamZ);

      // Dolly Zoom / FOV Warp 效应：从 45 急速拉大到 125+
      const fovProgress = Math.pow(pct, 3.2);
      camera.fov = fov + fovProgress * 80;
      camera.updateProjectionMatrix();

      // 数学标签 3D 空间投影与淡出
      labels.forEach(({ el, pos }) => {
        tempV.copy(pos);
        tempV.project(camera);

        // 如果在相机后面或者太近就淡出
        const behindCamera = currentCamZ <= pos.z;
        const distToCam = Math.abs(pos.z - currentCamZ);

        if (behindCamera || tempV.z > 1 || distToCam < 35) {
          el.style.opacity = '0';
        } else {
          const screenX = (tempV.x * 0.5 + 0.5) * width;
          const screenY = (tempV.y * -0.5 + 0.5) * height;
          el.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`;

          // 进入相机视野开始渐显，临近相机时极快消逝
          let op = 0.0;
          if (distToCam < 450) {
            op = (distToCam / 450) * 0.85;
          } else {
            op = (1.0 - (distToCam - 450) / 450) * 0.85;
          }
          el.style.opacity = `${Math.min(Math.max(op, 0), 0.85)}`;
        }
      });

      // 粒子旋转运动
      particleSystem.rotation.z = elapsed * 0.00015;

      renderer.render(scene, camera);

      if (pct < 1.0) {
        rAFId = requestAnimationFrame(animate);
      }
    }

    rAFId = requestAnimationFrame(animate);

    // T+2150ms: 闪白遮罩开始渐入
    setTimeout(() => {
      fade.style.background = 'rgba(251, 250, 247, 0.96)';
    }, 2100);

    // T+2600ms: 彻底闪白
    await new Promise((resolve) => setTimeout(resolve, 2600));
    cancelAnimationFrame(rAFId);

    fade.style.transition = 'background 180ms linear';
    fade.style.background = 'rgba(251, 250, 247, 1)';

    await new Promise((resolve) => setTimeout(resolve, 200));

    // 调用 Astro navigate 跳转到 observatory
    navigate(targetUrl);

    // 保持 overlay 600ms 用于目的页面渐显过渡，然后彻底释放 WebGL 资源
    setTimeout(() => {
      labels.forEach(({ el }) => el.remove());
      torusGeo.dispose();
      torusMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      tunnelRings.forEach(r => r.geometry.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      overlay.remove();
    }, 600);
  },
};
