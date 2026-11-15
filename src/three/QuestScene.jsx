import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
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
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TOUCH,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { fmtNum } from '../lib/coords.js';

// Koordinat matematika (x, y, z) dengan z = tinggi → posisi three.js (x, z, -y).
const toWorld = ([x, y, z = 0]) => new Vector3(x, z, y === 0 ? 0 : -y);

export const AXIS_COLORS = { x: '#60a5fa', y: '#fb923c', z: '#4ade80' };
const COLORS = {
  ...AXIS_COLORS,
  sky: '#0b1437',
  ground: '#12204f',
  grid: '#38bdf8',
  house: '#fb923c',
  roof: '#c2410c',
  ok: '#22c55e',
  okRoof: '#15803d',
  err: '#ef4444',
  point: '#fde047',
};
const CONFETTI = ['#f43f5e', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a855f7', '#ffffff'];
const FLY_MS = 650;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/* ---------- Teks sebagai sprite (selalu menghadap kamera) ---------- */

function textSprite(text, { color = '#ffffff', bg = null, size = 0.45, bold = true } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `${bold ? '800' : '600'} 56px system-ui, -apple-system, Roboto, sans-serif`;
  ctx.font = font;
  const pad = bg ? 28 : 12;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = 80;
  canvas.width = w;
  canvas.height = h;
  if (bg) {
    const r = 30;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(r, 4);
    ctx.lineTo(w - r, 4);
    ctx.arc(w - r, h / 2, h / 2 - 4, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(r, h - 4);
    ctx.arc(r, h / 2, h / 2 - 4, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fill();
  }
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!bg) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(11,20,55,0.85)';
    ctx.strokeText(text, w / 2, h / 2 + 3);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 3);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(new SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set((size * w) / h, size, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function dashed(from, to, color) {
  const geometry = new BufferGeometry().setFromPoints([from, to]);
  const line = new Line(geometry, new LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12 }));
  line.computeLineDistances();
  line.renderOrder = 5;
  return line;
}

function disposeTree(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m) continue;
      m.map?.dispose();
      m.dispose();
    }
  });
}

/* ---------- Lantai, kisi, sumbu ---------- */

function buildWorld(range, zMax) {
  const g = new Group();

  const ground = new Mesh(
    new PlaneGeometry(range * 2 + 1.2, range * 2 + 1.2),
    new MeshLambertMaterial({ color: COLORS.ground, side: DoubleSide }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  g.add(ground);

  const pos = [];
  for (let i = -range; i <= range; i += 1) {
    if (i === 0) continue;
    pos.push(i, 0, -range, i, 0, range, -range, 0, i, range, 0, i);
  }
  const gridGeo = new BufferGeometry();
  gridGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.add(new LineSegments(gridGeo, new LineBasicMaterial({ color: COLORS.grid, transparent: true, opacity: 0.45 })));

  const end = range + 0.7;
  const r = 0.05;
  const mk = (len, color) => new Mesh(new CylinderGeometry(r, r, len, 10), new MeshBasicMaterial({ color }));
  const tip = (color) => new Mesh(new ConeGeometry(0.16, 0.42, 14), new MeshBasicMaterial({ color }));

  // Sumbu X (kiri-kanan)
  const ax = mk(end * 2, COLORS.x);
  ax.rotation.z = -Math.PI / 2;
  const tx = tip(COLORS.x);
  tx.rotation.z = -Math.PI / 2;
  tx.position.set(end + 0.2, 0, 0);
  // Sumbu Y (depan-belakang): +y = ke belakang (−z three.js)
  const ay = mk(end * 2, COLORS.y);
  ay.rotation.x = -Math.PI / 2;
  const ty = tip(COLORS.y);
  ty.rotation.x = -Math.PI / 2;
  ty.position.set(0, 0, -(end + 0.2));
  // Sumbu Z (tinggi)
  const zEnd = zMax + 0.7;
  const az = mk(zEnd, COLORS.z);
  az.position.y = zEnd / 2;
  const tz = tip(COLORS.z);
  tz.position.set(0, zEnd + 0.2, 0);
  g.add(ax, tx, ay, ty, az, tz);

  // Label sumbu: tebal, berlatar warna, selalu menghadap kamera
  const lx = textSprite('X', { bg: COLORS.x, color: '#0b1437', size: 0.62 });
  lx.position.set(end + 0.75, 0.15, 0);
  const ly = textSprite('Y', { bg: COLORS.y, color: '#0b1437', size: 0.62 });
  ly.position.set(0, 0.15, -(end + 0.75));
  const lz = textSprite('Z', { bg: COLORS.z, color: '#0b1437', size: 0.62 });
  lz.position.set(0, zEnd + 0.75, 0);
  const lo = textSprite('O', { size: 0.42 });
  lo.position.set(-0.3, 0.05, 0.35);
  g.add(lx, ly, lz, lo);

  // Angka di setiap sumbu
  for (let i = -range; i <= range; i += 1) {
    if (i === 0) continue;
    const nx = textSprite(fmtNum(i), { color: COLORS.x, size: 0.34 });
    nx.position.set(i, 0.02, 0.38);
    const ny = textSprite(fmtNum(i), { color: COLORS.y, size: 0.34 });
    ny.position.set(-0.4, 0.02, -i);
    g.add(nx, ny);
  }
  for (let i = 1; i <= zMax; i += 1) {
    const nz = textSprite(String(i), { color: COLORS.z, size: 0.34 });
    nz.position.set(0.38, i, 0.2);
    const tick = new Mesh(new BoxGeometry(0.22, 0.03, 0.03), new MeshBasicMaterial({ color: COLORS.z }));
    tick.position.y = i;
    g.add(nz, tick);
  }
  return g;
}

/* ---------- Rumah ---------- */

function buildHouse() {
  const group = new Group();
  const bodyMat = new MeshLambertMaterial({ color: COLORS.house });
  const roofMat = new MeshLambertMaterial({ color: COLORS.roof });
  const body = new Mesh(new BoxGeometry(0.72, 0.56, 0.72), bodyMat);
  body.position.y = 0.28;
  const roof = new Mesh(new ConeGeometry(0.64, 0.42, 4), roofMat);
  roof.position.y = 0.56 + 0.21;
  roof.rotation.y = Math.PI / 4;
  const door = new Mesh(new BoxGeometry(0.2, 0.3, 0.02), new MeshLambertMaterial({ color: '#7c2d12' }));
  door.position.set(0, 0.15, 0.37);
  const win = new Mesh(new BoxGeometry(0.16, 0.14, 0.02), new MeshLambertMaterial({ color: '#fef3c7' }));
  win.position.set(0.37, 0.32, 0);
  win.rotation.y = Math.PI / 2;
  const dot = new Mesh(new SphereGeometry(0.09, 16, 12), new MeshBasicMaterial({ color: COLORS.point }));
  group.add(body, roof, door, win, dot);
  return { group, bodyMat, roofMat };
}

/* ---------- Komponen ---------- */

/**
 * Ruang 3D untuk Quest.
 * Props: house = [x, y, z] atau null, showGuides, range (x/y), zMax,
 * effect = { type: 'success' | 'error', key } untuk memicu animasi.
 * Ref: resetView(), rotate(derajat), zoom(faktor), topView().
 */
const QuestScene = forwardRef(function QuestScene(
  { house = null, showGuides = true, range = 5, zMax = 5, effect = null },
  ref,
) {
  const hostRef = useRef(null);
  const api = useRef(null);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(COLORS.sky);
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    host.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.add(new HemisphereLight('#ffffff', '#334155', 2.1));
    const sun = new DirectionalLight('#ffffff', 1.5);
    sun.position.set(5, 10, 7);
    scene.add(sun, buildWorld(range, zMax));

    const { group: houseGroup, bodyMat, roofMat } = buildHouse();
    houseGroup.visible = false;
    scene.add(houseGroup);
    const guides = new Group();
    scene.add(guides);
    const particles = new Group();
    scene.add(particles);

    // Kamera
    const camera = new PerspectiveCamera(45, 1, 0.1, 200);
    const VIEWS = {
      home: { pos: new Vector3(range * 1.25, range * 1.5, range * 2.55), target: new Vector3(0.4, 1.4, -0.4) },
      top: { pos: new Vector3(0, range * 3.3, 0.01), target: new Vector3(0, 0, 0) },
    };
    camera.position.copy(VIEWS.home.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: 0.12,
      rotateSpeed: 0.9,
      zoomSpeed: 1.1,
      panSpeed: 0.9,
      screenSpacePanning: false,
      minDistance: 3,
      maxDistance: range * 6,
      maxPolarAngle: Math.PI / 2 - 0.05,
    });
    controls.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
    controls.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    controls.target.copy(VIEWS.home.target);
    controls.update();

    // Animasi: setiap fungsi menerima dt (detik), mengembalikan false kalau sudah selesai.
    let anims = [];
    let dirty = true;
    const addAnim = (fn) => {
      anims.push(fn);
    };

    const flyTo = (pos, target) => {
      anims = anims.filter((a) => !a.isFly);
      if (reducedMotion()) {
        camera.position.copy(pos);
        controls.target.copy(target);
        controls.update();
        dirty = true;
        return;
      }
      const p0 = camera.position.clone();
      const t0 = controls.target.clone();
      let elapsed = 0;
      const fly = (dt) => {
        elapsed += dt * 1000;
        const k = easeInOut(Math.min(1, elapsed / FLY_MS));
        camera.position.lerpVectors(p0, pos, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        return elapsed < FLY_MS;
      };
      fly.isFly = true;
      addAnim(fly);
    };

    // Loop: render hanya kalau ada yang berubah
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let active = controls.update();
      if (anims.length) {
        anims = anims.filter((fn) => fn(dt));
        active = true;
      }
      if (active || dirty) {
        renderer.render(scene, camera);
        dirty = false;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const resize = () => {
      const w = host.clientWidth || 340;
      const h = host.clientHeight || w;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(host);

    const onLost = (e) => {
      e.preventDefault();
      setLost(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    /* --- Rumah & garis bantu --- */
    const setHouse = (point, withGuides) => {
      for (const c of [...guides.children]) {
        guides.remove(c);
        disposeTree(c);
      }
      if (!point) {
        houseGroup.visible = false;
        dirty = true;
        return;
      }
      const [x, y, z = 0] = point;
      const at = toWorld(point);
      houseGroup.visible = true;
      houseGroup.position.copy(at);

      const floor = toWorld([x, y, 0]);
      const shadow = new Mesh(
        new CircleGeometry(0.45, 28),
        new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(floor.x, 0.005, floor.z);
      guides.add(shadow);

      if (withGuides) {
        if (x !== 0) guides.add(dashed(floor, toWorld([0, y, 0]), COLORS.x)); // panjang = x
        if (y !== 0) guides.add(dashed(floor, toWorld([x, 0, 0]), COLORS.y)); // panjang = y
        if (z !== 0) {
          guides.add(dashed(floor, at, COLORS.z)); // tinggi = z
          const ring = new Mesh(new CircleGeometry(0.1, 16), new MeshBasicMaterial({ color: COLORS.z }));
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(floor.x, 0.01, floor.z);
          guides.add(ring);
        }
      }
      dirty = true;
    };

    const resetHouseColor = () => {
      bodyMat.color.set(COLORS.house);
      roofMat.color.set(COLORS.roof);
    };

    const celebrate = () => {
      bodyMat.color.set(COLORS.ok);
      roofMat.color.set(COLORS.okRoof);
      if (reducedMotion()) {
        dirty = true;
        return;
      }
      // Rumah melompat
      let t = 0;
      addAnim((dt) => {
        t += dt;
        const k = Math.min(1, t / 0.6);
        houseGroup.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.35);
        return k < 1;
      });
      // Konfeti 3D
      const geo = new BoxGeometry(0.09, 0.09, 0.02);
      const origin = houseGroup.position.clone().add(new Vector3(0, 0.8, 0));
      const bits = Array.from({ length: 90 }, (_, i) => {
        const m = new Mesh(geo, new MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: DoubleSide }));
        m.position.copy(origin);
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 2.5;
        m.userData.v = new Vector3(Math.cos(a) * s * 0.6, 3 + Math.random() * 3, Math.sin(a) * s * 0.6);
        m.userData.spin = new Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10);
        particles.add(m);
        return m;
      });
      let life = 0;
      addAnim((dt) => {
        life += dt;
        for (const b of bits) {
          b.userData.v.y -= 9 * dt;
          b.position.addScaledVector(b.userData.v, dt);
          b.rotation.x += b.userData.spin.x * dt;
          b.rotation.y += b.userData.spin.y * dt;
        }
        if (life < 1.8) return true;
        for (const b of bits) {
          particles.remove(b);
          b.material.dispose();
        }
        geo.dispose();
        return false;
      });
    };

    const shake = () => {
      bodyMat.color.set(COLORS.err);
      const base = houseGroup.position.clone();
      let t = 0;
      addAnim((dt) => {
        t += dt;
        const k = Math.min(1, t / 0.5);
        houseGroup.position.x = base.x + Math.sin(k * Math.PI * 8) * 0.12 * (1 - k);
        if (k >= 1) {
          houseGroup.position.copy(base);
          resetHouseColor();
          return false;
        }
        return true;
      });
    };

    const rotateBy = (deg) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new Vector3(0, 1, 0), MathUtils.degToRad(deg));
      flyTo(controls.target.clone().add(offset), controls.target.clone());
    };

    const zoomBy = (factor) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      flyTo(controls.target.clone().add(offset), controls.target.clone());
    };

    api.current = {
      setHouse,
      resetHouseColor,
      celebrate,
      shake,
      resetView: () => flyTo(VIEWS.home.pos, VIEWS.home.target),
      topView: () => flyTo(VIEWS.top.pos, VIEWS.top.target),
      rotate: rotateBy,
      zoom: zoomBy,
    };

    return () => {
      api.current = null;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [range, zMax]);

  // Posisi rumah mengikuti props
  const hx = house?.[0];
  const hy = house?.[1];
  const hz = house?.[2];
  useEffect(() => {
    api.current?.setHouse(house ? [hx, hy, hz ?? 0] : null, showGuides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hx, hy, hz, house === null, showGuides]);

  // Efek benar / salah
  useEffect(() => {
    if (!effect || !api.current) return;
    if (effect.type === 'success') api.current.celebrate();
    else if (effect.type === 'error') api.current.shake();
    else api.current.resetHouseColor();
  }, [effect?.type, effect?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(
    ref,
    () => ({
      resetView: () => api.current?.resetView(),
      topView: () => api.current?.topView(),
      rotate: (deg) => api.current?.rotate(deg),
      zoom: (f) => api.current?.zoom(f),
    }),
    [],
  );

  if (lost) {
    return (
      <div className="grid h-full place-items-center gap-3 bg-slate-900 p-4 text-center text-white" role="alert">
        <p className="m-0">Grafik 3D berhenti. Ini bisa terjadi di HP saat memori penuh.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="h-full w-full touch-none"
      role="img"
      aria-label={
        house
          ? `Ruang 3D dengan rumah di koordinat ${fmtNum(hx)}, ${fmtNum(hy)}, ${fmtNum(hz ?? 0)}`
          : 'Ruang koordinat 3D'
      }
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

export default QuestScene;
