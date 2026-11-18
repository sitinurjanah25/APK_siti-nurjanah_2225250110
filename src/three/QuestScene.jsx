import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
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

function buildWorld(range, zMax, showNumbers = true) {
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

  // Angka di setiap sumbu: satu grup yang bisa disembunyikan/ditampilkan tanpa membangun ulang adegan
  const nums = new Group();
  nums.name = 'numbers';
  nums.visible = showNumbers;
  g.add(nums);
  for (let i = -range; i <= range; i += 1) {
    if (i === 0) continue;
    const nx = textSprite(fmtNum(i), { color: COLORS.x, size: 0.34 });
    nx.position.set(i, 0.02, 0.38);
    const ny = textSprite(fmtNum(i), { color: COLORS.y, size: 0.34 });
    ny.position.set(-0.4, 0.02, -i);
    nums.add(nx, ny);
  }
  for (let i = 1; i <= zMax; i += 1) {
    const tick = new Mesh(new BoxGeometry(0.22, 0.03, 0.03), new MeshBasicMaterial({ color: COLORS.z }));
    tick.position.y = i;
    g.add(tick);
    const nz = textSprite(String(i), { color: COLORS.z, size: 0.34 });
    nz.position.set(0.38, i, 0.2);
    nums.add(nz);
  }
  return g;
}

const skyColor = new Color(COLORS.sky);
const tmpColor = new Color();

/* ---------- Rumah ---------- */

function buildHouse(id, label) {
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
  for (const m of [body, roof, door, win]) m.userData.houseId = id;
  if (label) {
    // Hanya huruf (A, B, C…), tidak pernah angka koordinat.
    const tag = textSprite(label, { bg: '#fde047', color: '#0b1437', size: 0.5 });
    tag.position.y = 1.35;
    group.add(tag);
  }
  return { group, bodyMat, roofMat };
}

/* ---------- Komponen ---------- */

/**
 * Ruang 3D untuk Quest.
 * Props:
 *  - houses: [{ id, at: [x, y, z], label? }] — rumah yang tampil (label hanya huruf)
 *  - selectedId, onPick(id): rumah bisa diketuk kalau onPick diberikan
 *  - showGuides: garis proyeksi untuk rumah aktif (rumah tunggal, atau yang dipilih)
 *  - showNumbers: angka di sumbu (disembunyikan di mode Hard)
 *  - effect: { type: 'success' | 'error' | 'idle', key, id } untuk animasi
 *  - view: sudut kamera awal ('home' | 'top' | 'front' | 'side' | 'low'); Reset kembali ke sini
 * Ref: resetView(), rotate(derajat), zoom(faktor), topView().
 */
const QuestScene = forwardRef(function QuestScene(
  {
    houses = [],
    selectedId = null,
    onPick = null,
    showGuides = true,
    showNumbers = true,
    range = 5,
    zMax = 5,
    effect = null,
    view = 'home',
  },
  ref,
) {
  const hostRef = useRef(null);
  const api = useRef(null);
  const viewRef = useRef(view);
  const numbersRef = useRef(showNumbers);
  const onPickRef = useRef(onPick);
  const [lost, setLost] = useState(false);
  onPickRef.current = onPick;

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
    const world = buildWorld(range, zMax, numbersRef.current);
    scene.add(sun, world);

    const houseLayer = new Group();
    const guides = new Group();
    const particles = new Group();
    scene.add(houseLayer, guides, particles);
    /** id → { group, bodyMat, roofMat } */
    const houseMap = new Map();
    const pickable = [];

    // Kamera
    const camera = new PerspectiveCamera(45, 1, 0.1, 200);
    const VIEWS = {
      home: { pos: new Vector3(range * 1.25, range * 1.5, range * 2.55), target: new Vector3(0.4, 1.4, -0.4) },
      top: { pos: new Vector3(0, range * 3.3, 0.01), target: new Vector3(0, 0, 0) },
      // Sudut kamera tambahan untuk level-level tertentu
      front: { pos: new Vector3(0, range * 0.9, range * 3.1), target: new Vector3(0, 1.6, 0) },
      side: { pos: new Vector3(range * 3.1, range * 0.9, 0.01), target: new Vector3(0, 1.6, 0) },
      low: { pos: new Vector3(-range * 2.2, range * 0.55, range * 2.2), target: new Vector3(0, 1.8, 0) },
    };
    let homeView = VIEWS[viewRef.current] ?? VIEWS.home;
    camera.position.copy(homeView.pos);

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
    controls.target.copy(homeView.target);
    controls.update();

    // Animasi: fungsi(dt) → true selama masih berjalan
    let anims = [];
    let dirty = true;
    const addAnim = (fn) => anims.push(fn);

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

    /* --- Ketuk rumah (abaikan kalau jari menggeser > 8 px) --- */
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let down = null;
    const hitHouse = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObjects(pickable, false)[0]?.object.userData.houseId ?? null;
    };
    const onDown = (e) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e) => {
      if (!down || !onPickRef.current || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
      down = null;
      const id = hitHouse(e);
      if (id) onPickRef.current(id);
    };
    const onMove = (e) => {
      if (!onPickRef.current || e.pointerType !== 'mouse') return;
      renderer.domElement.style.cursor = hitHouse(e) ? 'pointer' : '';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onMove);

    /* --- Rumah & garis bantu --- */
    const clearGroup = (g) => {
      for (const c of [...g.children]) {
        g.remove(c);
        disposeTree(c);
      }
    };

    const drawGuides = (point, withLines, highlight) => {
      clearGroup(guides);
      if (!point) {
        dirty = true;
        return;
      }
      const [x, y, z = 0] = point;
      const at = toWorld(point);
      const floor = toWorld([x, y, 0]);
      const shadow = new Mesh(
        new CircleGeometry(0.45, 28),
        new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(floor.x, 0.005, floor.z);
      guides.add(shadow);
      if (highlight) {
        const ring = new Mesh(
          new RingGeometry(0.55, 0.7, 40),
          new MeshBasicMaterial({ color: COLORS.point, side: DoubleSide }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(at.x, at.y + 0.02, at.z);
        guides.add(ring);
      }
      if (withLines) {
        if (x !== 0) guides.add(dashed(floor, toWorld([0, y, 0]), COLORS.x)); // panjang = x
        if (y !== 0) guides.add(dashed(floor, toWorld([x, 0, 0]), COLORS.y)); // panjang = y
        if (z !== 0) {
          guides.add(dashed(floor, at, COLORS.z)); // tinggi = z
          const foot = new Mesh(new CircleGeometry(0.1, 16), new MeshBasicMaterial({ color: COLORS.z }));
          foot.rotation.x = -Math.PI / 2;
          foot.position.set(floor.x, 0.01, floor.z);
          guides.add(foot);
        }
      }
      dirty = true;
    };

    const setHouses = (list, activeId, withLines) => {
      clearGroup(houseLayer);
      houseMap.clear();
      pickable.length = 0;
      for (const h of list) {
        const built = buildHouse(h.id, h.label);
        built.group.position.copy(toWorld(h.at));
        if (h.id === activeId && list.length > 1) built.group.scale.setScalar(1.12);
        houseLayer.add(built.group);
        houseMap.set(h.id, built);
        built.group.traverse((o) => o.userData.houseId && pickable.push(o));
      }
      const active = list.length === 1 ? list[0] : list.find((h) => h.id === activeId);
      drawGuides(active?.at ?? null, withLines, list.length > 1 && !!active);
    };

    const paint = (id, body, roof) => {
      const h = houseMap.get(id);
      if (!h) return;
      h.bodyMat.color.set(body);
      h.roofMat.color.set(roof);
      dirty = true;
    };
    const resetColors = () => {
      for (const id of houseMap.keys()) paint(id, COLORS.house, COLORS.roof);
    };

    // Kilatan warna langit (hijau = benar, merah = salah)
    const flashSky = (color) => {
      if (reducedMotion()) return;
      let t = 0;
      addAnim((dt) => {
        t += dt;
        const k = Math.min(1, t / 0.6);
        tmpColor.set(color).lerp(skyColor, k);
        renderer.setClearColor(tmpColor);
        return k < 1;
      });
    };

    const celebrate = (id) => {
      const h = houseMap.get(id);
      if (!h) return;
      paint(id, COLORS.ok, COLORS.okRoof);
      flashSky('#14532d');
      if (reducedMotion()) return;
      let t = 0;
      addAnim((dt) => {
        t += dt;
        const k = Math.min(1, t / 0.6);
        h.group.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.35);
        return k < 1;
      });
      const geo = new BoxGeometry(0.09, 0.09, 0.02);
      const origin = h.group.position.clone().add(new Vector3(0, 0.8, 0));
      const bits = Array.from({ length: 100 }, (_, i) => {
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

    const shake = (id) => {
      const h = houseMap.get(id);
      flashSky('#7f1d1d');
      if (!h) return;
      paint(id, COLORS.err, COLORS.roof);
      const base = h.group.position.clone();
      let t = 0;
      addAnim((dt) => {
        t += dt;
        const k = Math.min(1, t / 0.5);
        h.group.position.x = base.x + Math.sin(k * Math.PI * 8) * 0.12 * (1 - k);
        if (k >= 1) {
          h.group.position.copy(base);
          paint(id, COLORS.house, COLORS.roof);
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
      setNumbers: (visible) => {
        const n = world.getObjectByName('numbers');
        if (n && n.visible !== visible) {
          n.visible = visible;
          dirty = true;
        }
      },
      setHouses,
      resetColors,
      celebrate,
      shake,
      resetView: () => flyTo(homeView.pos, homeView.target),
      topView: () => flyTo(VIEWS.top.pos, VIEWS.top.target),
      setView: (name) => {
        homeView = VIEWS[name] ?? VIEWS.home;
        flyTo(homeView.pos, homeView.target);
      },
      rotate: rotateBy,
      zoom: zoomBy,
    };

    return () => {
      api.current = null;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onMove);
      disposeTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [range, zMax]);

  // Angka sumbu: tampil/sembunyi tanpa membangun ulang (kamera siswa tidak meloncat)
  useEffect(() => {
    numbersRef.current = showNumbers;
    api.current?.setNumbers(showNumbers);
  }, [showNumbers]);

  // Rumah mengikuti props (dibandingkan lewat isi, bukan identitas array)
  const housesKey = JSON.stringify(houses.map((h) => [h.id, h.at, h.label ?? '']));
  useEffect(() => {
    api.current?.setHouses(houses, selectedId, showGuides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [housesKey, selectedId, showGuides, showNumbers]);

  // Sudut kamera awal per level ('home' | 'top' | 'front' | 'side' | 'low')
  useEffect(() => {
    if (viewRef.current === view) return;
    viewRef.current = view;
    api.current?.setView(view);
  }, [view]);

  // Efek benar / salah
  useEffect(() => {
    if (!effect || !api.current) return;
    const id = effect.id ?? houses[0]?.id;
    if (effect.type === 'success') api.current.celebrate(id);
    else if (effect.type === 'error') api.current.shake(id);
    else api.current.resetColors();
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
        houses.length > 1
          ? `Ruang koordinat 3D dengan ${houses.length} rumah berlabel ${houses.map((h) => h.label).join(', ')}`
          : houses.length === 1
            ? 'Ruang koordinat 3D dengan satu rumah'
            : 'Ruang koordinat 3D'
      }
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

export default QuestScene;
