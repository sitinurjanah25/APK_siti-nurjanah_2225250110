import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MOUSE,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TOUCH,
  Vector2,
  Vector3,
  Box3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { fmtNum, noNegZero } from '../lib/coords.js';
import styles from './City3D.module.css';

/* ---------- Posisi & kamera ---------- */

/** Koordinat kota (x, y) → posisi 3D (x, tinggi, z). Sumbu-y kota = arah -z. */
const toWorld = ([x, y], height = 0) => [x, height, noNegZero(-y)];

/** Setengah lebar kota: cukup untuk semua bangunan, minimal 5. */
function cityHalfSize(buildings, min = 5) {
  return Math.max(min, ...buildings.flatMap((b) => b.at.map(Math.abs))) + 1;
}

function cameraPreset(view, half) {
  const d = half * 1.9;
  if (view === 'top') return { position: [0, d * 1.25, 0.001], target: [0, 0, 0], up: [0, 1, 0] };
  return { position: [0, d * 0.85, d * 0.95], target: [0, 0, 0], up: [0, 1, 0] };
}

const lerpArr = (from, to, t) => from.map((v, i) => v + (to[i] - v) * t);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/* ---------- Model bangunan sederhana ---------- */

const mat = (color) => new MeshLambertMaterial({ color });

const WALL = '#d9cdb8';
const PILLAR = '#b8c2ce';
const ROOF_GREY = '#64748b';
const CANOPY_GREEN = '#4d7c0f';
const LEAF = '#65a30d';
const TRUNK = '#78350f';
const CROSS_RED = '#b91c1c';
const GOLD = '#ca8a04';

function box(w, h, d, color, y = h / 2) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat(color));
  m.position.y = y;
  return m;
}

function cylinder(rTop, rBottom, h, color, y = h / 2, segments = 12) {
  const m = new Mesh(new CylinderGeometry(rTop, rBottom, h, segments), mat(color));
  m.position.y = y;
  return m;
}

function cone(r, h, color, y, segments = 12) {
  const m = new Mesh(new ConeGeometry(r, h, segments), mat(color));
  m.position.y = y;
  return m;
}

/** Atap limas di atas dinding setinggi `y`. */
function roof(w, d, h, color, y) {
  const s = Math.max(w, d);
  const m = new Mesh(new ConeGeometry(s * 0.72, h, 4), mat(color));
  m.position.y = y + h / 2;
  m.rotation.y = Math.PI / 4;
  m.scale.set(w / s, 1, d / s);
  return m;
}

const MODELS = {
  alun: () => [
    cylinder(0.42, 0.42, 0.06, '#8fbf6a', 0.03, 20),
    box(0.16, 1.3, 0.16, '#a8a29e', 0.71),
    cone(0.12, 0.25, GOLD, 1.48),
  ],
  hospital: () => [
    box(0.8, 1.1, 0.7, '#e3c5c9'),
    box(0.36, 0.08, 0.1, CROSS_RED, 1.15),
    box(0.1, 0.08, 0.36, CROSS_RED, 1.15),
  ],
  library: () => [box(0.8, 0.8, 0.6, WALL), roof(0.85, 0.65, 0.3, '#92400e', 0.8)],
  school: () => [
    box(0.85, 0.65, 0.55, WALL),
    roof(0.9, 0.6, 0.3, '#9f1239', 0.65),
    box(0.03, 0.5, 0.03, '#475569', 1.2),
  ],
  bank: () => [
    box(0.8, 0.12, 0.6, '#a9b4c2', 0.06),
    ...[-0.28, -0.1, 0.1, 0.28].map((x) => {
      const pillar = cylinder(0.05, 0.05, 0.55, PILLAR, 0.4, 8);
      pillar.position.x = x;
      return pillar;
    }),
    box(0.85, 0.12, 0.65, '#94a3b8', 0.73),
  ],
  police: () => [box(0.7, 0.75, 0.6, '#a9b4c2'), box(0.2, 0.12, 0.2, '#334155', 0.81)],
  mall: () => [box(0.95, 0.9, 0.8, '#bfb3e0'), box(1, 0.08, 0.85, '#6d28d9', 0.94)],
  terminal: () => [box(1, 0.45, 0.55, '#b4bac4'), box(1.1, 0.06, 0.7, ROOF_GREY, 0.5)],
  gas: () => [
    box(0.35, 0.4, 0.35, '#b9c3cf'),
    box(0.9, 0.06, 0.6, CANOPY_GREEN, 0.75),
    cylinder(0.04, 0.04, 0.72, '#475569', 0.36, 6),
  ],
  mosque: () => [
    box(0.75, 0.55, 0.75, '#b5d3c3'),
    (() => {
      const dome = new Mesh(new SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#15803d'));
      dome.position.y = 0.55;
      return dome;
    })(),
    (() => {
      const minaret = cylinder(0.06, 0.06, 1.2, '#b5d3c3', 0.6, 8);
      minaret.position.set(0.32, 0.6, 0.32);
      return minaret;
    })(),
  ],
  park: () => [
    cylinder(0.45, 0.45, 0.04, '#8fbf6a', 0.02, 16),
    cylinder(0.06, 0.08, 0.45, TRUNK, 0.25, 6),
    (() => {
      const crown = new Mesh(new SphereGeometry(0.3, 12, 10), mat(LEAF));
      crown.position.y = 0.7;
      return crown;
    })(),
  ],
  market: () => [box(0.85, 0.5, 0.6, WALL), roof(0.95, 0.7, 0.2, '#a16207', 0.5)],
};

function buildingModel(type) {
  const group = new Group();
  for (const part of (MODELS[type] ?? MODELS.alun)()) group.add(part);
  return group;
}

const topOf = (obj) => new Box3().setFromObject(obj).max.y;

/* ---------- Scene ---------- */

// Tema neon gelap (layar kosmik): sumbu bercahaya, grid ungu-biru, label terang.
const COLORS = {
  x: '#60a5fa',
  y: '#fb923c',
  ink: '#e0f2fe',
  grid: '#2f3f9a',
  gridMajor: '#6d7cf0',
  ground: '#141a4c',
  sky: '#120c3d',
};

const FLY_MS = 600;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Teks sebagai sprite (selalu menghadap kamera). */
function textSprite(text, { color = COLORS.ink, size = 0.45, bold = true, bg = null, border = null } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `${bold ? '700' : '500'} 48px system-ui, Roboto, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + (bg ? 44 : 24);
  canvas.width = w;
  canvas.height = 64;
  if (bg) {
    // Papan nama: kotak membulat gelap dengan bingkai bercahaya
    ctx.fillStyle = bg;
    ctx.strokeStyle = border ?? bg;
    ctx.lineWidth = 5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(4, 4, w - 8, 56, 16);
    else ctx.rect(4, 4, w - 8, 56); // browser lama
    ctx.fill();
    ctx.stroke();
  }
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, 34);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(new SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set((size * w) / 64, size, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function dashedLine(from, to, color) {
  const geometry = new BufferGeometry().setFromPoints([new Vector3(...from), new Vector3(...to)]);
  const line = new Line(geometry, new LineDashedMaterial({ color, dashSize: 0.25, gapSize: 0.15 }));
  line.computeLineDistances();
  return line;
}

/** Tanah, garis grid, sumbu X/Y berpanah, dan angka-angkanya. */
function groundAndAxes(half) {
  const group = new Group();
  const size = half * 2;

  const ground = new Mesh(new PlaneGeometry(size + 1, size + 1), new MeshLambertMaterial({ color: COLORS.ground, side: DoubleSide }));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  const minor = [];
  const major = [];
  for (let i = -half; i <= half; i += 1) {
    if (i === 0) continue;
    (i % 5 === 0 ? major : minor).push(i, 0.01, -half, i, 0.01, half, -half, 0.01, i, half, 0.01, i);
  }
  for (const [positions, color] of [
    [minor, COLORS.grid],
    [major, COLORS.gridMajor],
  ]) {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    group.add(new LineSegments(geometry, new LineBasicMaterial({ color })));
  }

  const axisLen = size + 0.8;
  const axisX = new Mesh(new BoxGeometry(axisLen, 0.04, 0.09), new MeshBasicMaterial({ color: COLORS.x }));
  axisX.position.y = 0.03;
  const axisY = new Mesh(new BoxGeometry(0.09, 0.04, axisLen), new MeshBasicMaterial({ color: COLORS.y }));
  axisY.position.y = 0.03;
  const arrowX = new Mesh(new ConeGeometry(0.18, 0.45, 12), new MeshBasicMaterial({ color: COLORS.x }));
  arrowX.rotation.z = -Math.PI / 2;
  arrowX.position.set(axisLen / 2 + 0.2, 0.03, 0);
  const arrowY = new Mesh(new ConeGeometry(0.18, 0.45, 12), new MeshBasicMaterial({ color: COLORS.y }));
  arrowY.rotation.x = -Math.PI / 2;
  arrowY.position.set(0, 0.03, -(axisLen / 2 + 0.2));
  group.add(axisX, axisY, arrowX, arrowY);

  const labelX = textSprite('X', { color: COLORS.x, size: 0.6 });
  labelX.position.set(axisLen / 2 + 0.3, 0.4, 0.5);
  const labelY = textSprite('Y', { color: COLORS.y, size: 0.6 });
  labelY.position.set(0.5, 0.4, -(axisLen / 2 + 0.3));
  const labelO = textSprite('O', { size: 0.45 });
  labelO.position.set(-0.4, 0.2, 0.45);
  group.add(labelX, labelY, labelO);

  for (let i = -half + 1; i < half; i += 1) {
    if (i === 0 || i % 2 !== 0) continue;
    const nx = textSprite(fmtNum(i), { color: COLORS.x, size: 0.38, bold: false });
    nx.position.set(i, 0.15, 0.45);
    const ny = textSprite(fmtNum(i), { color: COLORS.y, size: 0.38, bold: false });
    ny.position.set(-0.45, 0.15, -i);
    group.add(nx, ny);
  }
  return group;
}

function disposeTree(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of materials) {
      if (!m) continue;
      m.map?.dispose();
      m.dispose();
    }
  });
}

/* ---------- Komponen ---------- */

/**
 * Kota 3D interaktif. Ref memberi `flyTo(view)` ("tilt" / "top") dan `zoom(factor)`.
 */
const City3D = forwardRef(function City3D({ buildings, selectedId, onSelectBuilding }, ref) {
  const hostRef = useRef(null);
  const apiRef = useRef(null);
  const onSelectRef = useRef(onSelectBuilding);
  const [contextLost, setContextLost] = useState(false);
  onSelectRef.current = onSelectBuilding;

  useEffect(() => {
    const host = hostRef.current;
    const half = cityHalfSize(buildings);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(COLORS.sky, 0); // transparan: latar kosmik bingkai terlihat
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.add(new HemisphereLight('#e0e7ff', '#4c1d95', 2.4));
    const sun = new DirectionalLight('#ffffff', 1.4);
    sun.position.set(6, 12, 8);
    scene.add(sun);
    scene.add(groundAndAxes(half));

    // Bangunan + label nama
    const pickable = [];
    const models = new Map();
    for (const b of buildings) {
      const model = buildingModel(b.type);
      const [wx, , wz] = toWorld(b.at);
      model.position.set(wx, 0, wz);
      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.userData.buildingId = b.id;
          pickable.push(obj);
        }
      });
      const label = textSprite(b.name, { size: 0.4, color: '#e0f2fe', bg: 'rgba(30,27,75,.85)', border: '#38bdf8' });
      label.position.set(wx, topOf(model) + 0.35, wz);
      scene.add(model, label);
      models.set(b.id, model);
    }

    const guides = new Group();
    scene.add(guides);

    // Kamera & kontrol
    const camera = new PerspectiveCamera(45, 1, 0.1, 200);
    const start = cameraPreset('tilt', half);
    camera.position.set(...start.position);
    camera.up.set(...start.up);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 1.1;
    controls.panSpeed = 0.9;
    controls.zoomToCursor = true;
    controls.screenSpacePanning = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 2;
    controls.maxDistance = half * 6;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
    controls.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    controls.target.set(...start.target);
    controls.update();

    // Render hanya saat perlu (hemat baterai)
    let renderFrame = 0;
    const renderNow = () => {
      renderFrame = 0;
      renderer.render(scene, camera);
    };
    const requestRender = () => {
      if (!renderFrame) renderFrame = requestAnimationFrame(renderNow);
    };

    let interacting = false;
    let loopFrame = 0;
    const loop = () => {
      const changed = controls.update();
      renderer.render(scene, camera);
      loopFrame = interacting || changed ? requestAnimationFrame(loop) : 0;
    };
    const startLoop = () => {
      if (!loopFrame) loopFrame = requestAnimationFrame(loop);
    };
    const onStart = () => {
      interacting = true;
      startLoop();
    };
    const onEnd = () => {
      interacting = false;
      startLoop();
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    controls.addEventListener('change', startLoop);

    const resize = () => {
      const w = host.clientWidth || 340;
      const h = host.clientHeight || w;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      requestRender();
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(host);

    // Ketuk bangunan (abaikan kalau jari bergeser > 8 px)
    const raycaster = new Raycaster();
    let down = null;
    const onPointerDown = (e) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
      down = null;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(pickable, false)[0];
      onSelectRef.current?.(hit ? hit.object.userData.buildingId : null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onContextLost = (e) => {
      e.preventDefault();
      setContextLost(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // Animasi pindah sudut pandang
    let flyFrame = 0;
    const flyTo = (view) => {
      const { position, target, up } = cameraPreset(view, half);
      const apply = (p, t, u) => {
        camera.position.set(...p);
        camera.up.set(...u).normalize();
        controls.target.set(...t);
        camera.lookAt(controls.target);
        controls.update();
      };
      cancelAnimationFrame(flyFrame);
      if (prefersReducedMotion()) {
        apply(position, target, up);
        requestRender();
        return;
      }
      const fromPos = camera.position.toArray();
      const fromTarget = controls.target.toArray();
      const fromUp = camera.up.toArray();
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / FLY_MS);
        const k = easeInOut(t);
        apply(lerpArr(fromPos, position, k), lerpArr(fromTarget, target, k), lerpArr(fromUp, up, k));
        renderer.render(scene, camera);
        if (t < 1) flyFrame = requestAnimationFrame(step);
      };
      flyFrame = requestAnimationFrame(step);
    };

    const zoomBy = (factor) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    };

    // Sorot bangunan terpilih + garis bantu ke sumbu
    const showGuides = (id) => {
      for (const child of [...guides.children]) {
        guides.remove(child);
        disposeTree(child);
      }
      for (const [bid, model] of models) model.scale.setScalar(bid === id ? 1.15 : 1);
      const b = buildings.find((item) => item.id === id);
      if (b) {
        const [x, y] = b.at;
        const [wx, , wz] = toWorld(b.at);
        if (x !== 0) guides.add(dashedLine([wx, 0.05, wz], [0, 0.05, wz], COLORS.x));
        if (y !== 0) guides.add(dashedLine([wx, 0.05, wz], [wx, 0.05, 0], COLORS.y));
        const ring = new Mesh(new RingGeometry(0.5, 0.6, 32), new MeshBasicMaterial({ color: COLORS.ink, side: DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx, 0.04, wz);
        guides.add(ring);
      }
      requestRender();
    };

    apiRef.current = { flyTo, zoomBy, showGuides };
    requestRender();

    return () => {
      apiRef.current = null;
      interacting = false;
      cancelAnimationFrame(renderFrame);
      cancelAnimationFrame(flyFrame);
      cancelAnimationFrame(loopFrame);
      ro?.disconnect();
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [buildings]);

  useEffect(() => {
    apiRef.current?.showGuides(selectedId);
  }, [selectedId]);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (view) => apiRef.current?.flyTo(view),
      zoom: (factor) => apiRef.current?.zoomBy(factor),
    }),
    [],
  );

  if (contextLost) {
    return (
      <div className={styles.lost} role="alert">
        <p>Grafik 3D berhenti. Ini bisa terjadi di HP saat memori penuh.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Muat ulang
        </button>
      </div>
    );
  }

  return <div ref={hostRef} className={styles.host} aria-hidden="true" onContextMenu={(e) => e.preventDefault()} />;
});

export default City3D;
