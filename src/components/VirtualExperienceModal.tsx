import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { PROJECT_META } from '../data/projectData';
import {
  VIRTUAL_HOTSPOTS,
  VIRTUAL_TOUR_FOV_MAX,
  VIRTUAL_TOUR_FOV_MIN,
  VIRTUAL_VANTAGES,
  type VirtualHotspot,
  type VirtualVantageId,
  clampPitchDeg,
  clampTourFov,
  computeLookTargetVector,
  getVirtualVantageById,
  normalizeAzimuthDeg,
  shortestAzimuthDelta,
  worldAzimuthToGeographicBearing,
} from '../utils/virtualTourSpec';

interface VirtualExperienceModalProps {
  open: boolean;
  onClose: () => void;
  initialVantageId?: VirtualVantageId;
  onArrangeViewing?: () => void;
}

// Reusable scratch math objects allocated once outside render loop (zero GC)
const _scratchMatrix = new THREE.Matrix4();
const _scratchColor = new THREE.Color();
const _scratchProj = new THREE.Vector3();
const _scratchHotspotPos = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    if (Boolean(navigator.webdriver) || /Headless/i.test(navigator.userAgent)) {
      return true;
    }
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    const vendor = String(gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa/i.test(`${gpu} ${vendor}`)) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Generates a seamless 360° Arabian Sea sunset / Pali Hill twilight sky & horizon panorama texture.
 * World -Z sits at u = 0.50 (facing western Arabian Sea horizon), while +Z is u = 0/1 (eastern Bandra skyline).
 */
function createTwilightPanoramaTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Vertical sky-to-sea twilight gradient (rich slate-indigo zenith to crisp ocean horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0.0, '#071318');
    skyGrad.addColorStop(0.28, '#102630');
    skyGrad.addColorStop(0.45, '#213f4c');
    skyGrad.addColorStop(0.495, '#594e4c');
    skyGrad.addColorStop(0.502, '#2b3e47'); // Crisp ocean horizon
    skyGrad.addColorStop(0.535, '#122933');
    skyGrad.addColorStop(0.68, '#091b22');
    skyGrad.addColorStop(1.0, '#051014');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Western Arabian Sea amber-champagne dusk afterglow centered around u = 0.5 (-Z)
    const sunCenterX = width * 0.5;
    const horizonY = height * 0.5;
    const duskGlow = ctx.createRadialGradient(
      sunCenterX,
      horizonY - 10,
      10,
      sunCenterX,
      horizonY - 10,
      width * 0.29
    );
    duskGlow.addColorStop(0.0, 'rgba(226, 174, 114, 0.78)');
    duskGlow.addColorStop(0.25, 'rgba(170, 118, 82, 0.42)');
    duskGlow.addColorStop(0.62, 'rgba(72, 76, 86, 0.16)');
    duskGlow.addColorStop(1.0, 'rgba(16, 36, 44, 0)');
    ctx.fillStyle = duskGlow;
    ctx.fillRect(0, height * 0.2, width, height * 0.302);

    // 3. Soft shimmering twilight water reflections strictly below sea horizon
    const waterGlow = ctx.createRadialGradient(
      sunCenterX,
      horizonY + 34,
      8,
      sunCenterX,
      horizonY + 34,
      width * 0.22
    );
    waterGlow.addColorStop(0.0, 'rgba(204, 158, 108, 0.45)');
    waterGlow.addColorStop(0.5, 'rgba(78, 104, 114, 0.18)');
    waterGlow.addColorStop(1.0, 'rgba(9, 27, 34, 0)');
    ctx.fillStyle = waterGlow;
    ctx.fillRect(0, horizonY, width, height * 0.25);

    // Fine water shimmer streaks
    let seed = 109;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < 160; i++) {
      const dist = (rand() - 0.5) * (width * 0.32);
      const sx = sunCenterX + dist;
      const sy = horizonY + 8 + rand() * 88;
      const sw = 18 + rand() * 64;
      const alpha = Math.max(0.04, 0.22 * (1 - Math.abs(dist) / (width * 0.18)));
      ctx.fillStyle = `rgba(225, 192, 146, ${alpha.toFixed(3)})`;
      ctx.fillRect(sx - sw / 2, sy, sw, 1.5);
    }

    // 4. Distant Pali Hill foliage & Bandra-Worli coastal silhouette around eastern/southern horizon
    // Left edge (south / Sea Link) and right edge (east / Pali Hill & Bandra) wrap cleanly across seam!
    const drawHorizonCluster = (startX: number, endX: number, maxH: number) => {
      for (let x = startX; x < endX; x += 14) {
        const bh = 8 + rand() * maxH;
        const bw = 10 + rand() * 14;
        ctx.fillStyle = '#09161b';
        ctx.fillRect(x, horizonY - bh, bw, bh + 6);

        // Warm sparse architectural window pinpoints
        const lights = Math.floor(rand() * 4);
        for (let k = 0; k < lights; k++) {
          ctx.fillStyle = rand() > 0.4 ? 'rgba(218, 186, 132, 0.55)' : 'rgba(170, 205, 212, 0.35)';
          ctx.fillRect(x + 2 + rand() * (bw - 4), horizonY - bh + 4 + rand() * (bh - 8), 2, 2);
        }
      }
    };

    // South/East silhouettes (keep 0.30..0.72 western sea arc clear!)
    drawHorizonCluster(0, width * 0.27, 46);
    drawHorizonCluster(width * 0.74, width, 44);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createHonedTravertineMaps(maxAnisotropy: number): {
  albedoMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (aCtx && bCtx) {
    aCtx.fillStyle = '#b6a892';
    aCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    let seed = 73;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Subtle organic travertine mineral veins
    for (let i = 0; i < 950; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 18 + rand() * 68;
      const h = 1 + rand() * 3.5;
      const tone = Math.floor(156 + rand() * 32);
      aCtx.fillStyle = `rgba(${tone}, ${tone - 11}, ${tone - 26}, 0.3)`;
      aCtx.fillRect(x, y, w, h);

      const bTone = Math.floor(114 + rand() * 28);
      bCtx.fillStyle = `rgb(${bTone}, ${bTone}, ${bTone})`;
      bCtx.fillRect(x, y, w, h);
    }

    // Large architectural stone slab joints (2x2 grid per tile repeat)
    aCtx.strokeStyle = 'rgba(132, 120, 102, 0.35)';
    aCtx.lineWidth = 2;
    bCtx.strokeStyle = 'rgba(65, 65, 65, 0.65)';
    bCtx.lineWidth = 2;

    for (const pos of [size * 0.5, size - 1]) {
      aCtx.beginPath();
      aCtx.moveTo(0, pos);
      aCtx.lineTo(size, pos);
      aCtx.moveTo(pos, 0);
      aCtx.lineTo(pos, size);
      aCtx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(0, pos);
      bCtx.lineTo(size, pos);
      bCtx.moveTo(pos, 0);
      bCtx.lineTo(pos, size);
      bCtx.stroke();
    }
  }

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(4, 3);
  albedoMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 3);
  bumpMap.anisotropy = maxAnisotropy;

  return { albedoMap, bumpMap };
}

function createWalnutWoodMap(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#4e3524';
    ctx.fillRect(0, 0, size, size);

    let seed = 211;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 420; i++) {
      const x = rand() * size;
      const w = 1 + rand() * 3;
      const shade = Math.floor(42 + rand() * 44);
      ctx.fillStyle = `rgba(${shade + 22}, ${shade + 6}, ${Math.max(12, shade - 8)}, 0.42)`;
      ctx.fillRect(x, 0, w, size);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function VirtualExperienceModal({
  open,
  onClose,
  initialVantageId = 'salon',
  onArrangeViewing,
}: VirtualExperienceModalProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hotspotElRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [activeVantageId, setActiveVantageId] = useState<VirtualVantageId>(initialVantageId);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [azimuthDeg, setAzimuthDeg] = useState<number>(0);
  const [fov, setFov] = useState<number>(62);
  const [autoPan, setAutoPan] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [renderReady, setRenderReady] = useState<boolean>(false);

  const activeVantageRef = useRef<VirtualVantageId>(initialVantageId);
  activeVantageRef.current = activeVantageId;

  // Mutable camera target & damped state refs read directly by render loop
  const viewStateRef = useRef({
    eyeX: -2.6,
    eyeY: 1.66,
    eyeZ: 1.9,
    targetEyeX: -2.6,
    targetEyeY: 1.66,
    targetEyeZ: 1.9,
    azimuth: 32,
    targetAzimuth: 32,
    pitch: -4,
    targetPitch: -4,
    fov: 64,
    targetFov: 64,
    isDragging: false,
    autoPan: false,
  });

  const requestSceneRenderRef = useRef<(() => void) | null>(null);

  const selectVantage = useCallback((vantageId: VirtualVantageId) => {
    const station = getVirtualVantageById(vantageId);
    activeVantageRef.current = station.id;
    setActiveVantageId(station.id);
    setActiveHotspotId(null);

    // Standing station switches perform an instant architectural cut rather than clipping through walls
    const state = viewStateRef.current;
    const nextPitch = clampPitchDeg(station.defaultPitchDeg);
    const nextFov = clampTourFov(station.defaultFov);
    state.eyeX = station.eyePosition[0];
    state.eyeY = station.eyePosition[1];
    state.eyeZ = station.eyePosition[2];
    state.targetEyeX = station.eyePosition[0];
    state.targetEyeY = station.eyePosition[1];
    state.targetEyeZ = station.eyePosition[2];
    state.azimuth = station.defaultAzimuthDeg;
    state.targetAzimuth = station.defaultAzimuthDeg;
    state.pitch = nextPitch;
    state.targetPitch = nextPitch;
    state.fov = nextFov;
    state.targetFov = nextFov;
    setFov(nextFov);
    setAzimuthDeg(Math.round(normalizeAzimuthDeg(station.defaultAzimuthDeg)));
    requestSceneRenderRef.current?.();
  }, []);

  const focusHotspot = useCallback((hotspot: VirtualHotspot) => {
    const station = getVirtualVantageById(hotspot.vantageId);
    const changedStation = activeVantageRef.current !== station.id;
    activeVantageRef.current = station.id;
    setActiveVantageId(station.id);
    setActiveHotspotId(hotspot.id);

    const state = viewStateRef.current;
    state.targetEyeX = station.eyePosition[0];
    state.targetEyeY = station.eyePosition[1];
    state.targetEyeZ = station.eyePosition[2];
    if (changedStation) {
      state.eyeX = station.eyePosition[0];
      state.eyeY = station.eyePosition[1];
      state.eyeZ = station.eyePosition[2];
    }
    state.targetAzimuth = state.azimuth + shortestAzimuthDelta(state.azimuth, hotspot.lookAzimuthDeg);
    state.targetPitch = clampPitchDeg(hotspot.lookPitchDeg);
    state.targetFov = clampTourFov(hotspot.lookFov);
    state.autoPan = false;
    setAutoPan(false);
    setFov(state.targetFov);
    setAzimuthDeg(Math.round(normalizeAzimuthDeg(hotspot.lookAzimuthDeg)));
    requestSceneRenderRef.current?.();
  }, []);

  const adjustFov = useCallback((deltaFov: number) => {
    const state = viewStateRef.current;
    state.targetFov = clampTourFov(state.targetFov + deltaFov);
    setFov(Math.round(state.targetFov));
    requestSceneRenderRef.current?.();
  }, []);

  // Sync initialVantageId whenever modal opens
  useEffect(() => {
    if (!open) return;
    const station = getVirtualVantageById(initialVantageId);
    setActiveVantageId(station.id);
    setActiveHotspotId(null);
    setDockCollapsed(false);
    setRenderReady(false);

    const state = viewStateRef.current;
    state.eyeX = station.eyePosition[0];
    state.eyeY = station.eyePosition[1];
    state.eyeZ = station.eyePosition[2];
    state.targetEyeX = station.eyePosition[0];
    state.targetEyeY = station.eyePosition[1];
    state.targetEyeZ = station.eyePosition[2];
    state.azimuth = station.defaultAzimuthDeg;
    state.targetAzimuth = station.defaultAzimuthDeg;
    state.pitch = station.defaultPitchDeg;
    state.targetPitch = station.defaultPitchDeg;
    state.fov = station.defaultFov;
    state.targetFov = station.defaultFov;
    state.autoPan = false;
    setAutoPan(false);
    setAzimuthDeg(Math.round(normalizeAzimuthDeg(station.defaultAzimuthDeg)));
    setFov(station.defaultFov);
  }, [open, initialVantageId]);

  // Keep autoPan flag synced to mutable ref
  useEffect(() => {
    viewStateRef.current.autoPan = autoPan;
    if (autoPan) {
      requestSceneRenderRef.current?.();
    }
  }, [autoPan]);

  // Body scroll lock & keyboard escape / pan / zoom controls while modal is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const state = viewStateRef.current;
      let handled = false;
      if (e.key === 'ArrowRight') {
        state.targetAzimuth += 14;
        setAzimuthDeg(Math.round(normalizeAzimuthDeg(state.targetAzimuth)));
        handled = true;
      } else if (e.key === 'ArrowLeft') {
        state.targetAzimuth -= 14;
        setAzimuthDeg(Math.round(normalizeAzimuthDeg(state.targetAzimuth)));
        handled = true;
      } else if (e.key === 'ArrowUp') {
        state.targetPitch = clampPitchDeg(state.targetPitch + 7);
        handled = true;
      } else if (e.key === 'ArrowDown') {
        state.targetPitch = clampPitchDeg(state.targetPitch - 7);
        handled = true;
      } else if (e.key === '+' || e.key === '=') {
        state.targetFov = clampTourFov(state.targetFov - 5);
        setFov(Math.round(state.targetFov));
        handled = true;
      } else if (e.key === '-' || e.key === '_') {
        state.targetFov = clampTourFov(state.targetFov + 5);
        setFov(Math.round(state.targetFov));
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        if (state.autoPan) {
          state.autoPan = false;
          setAutoPan(false);
        }
        requestSceneRenderRef.current?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  // WebGL 360-Degree Sky Estate Interior Scene
  useEffect(() => {
    if (!open) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 1280;
    const height = container.clientHeight || 800;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a181b);
    scene.fog = new THREE.FogExp2(0x0d1f24, 0.012);

    const camera = new THREE.PerspectiveCamera(
      viewStateRef.current.fov,
      width / height,
      0.12,
      140
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Lighting Rig: Warm western dusk key + soft interior ambient + architectural point fill
    const hemiLight = new THREE.HemisphereLight(0xc2d5dc, 0x3b2e24, 0.85);
    scene.add(hemiLight);

    const sunsetDirectional = new THREE.DirectionalLight(0xffcda0, 1.85);
    sunsetDirectional.position.set(-4, 5.2, -16);
    sunsetDirectional.castShadow = !isSoftwareGl;
    sunsetDirectional.shadow.mapSize.set(1024, 1024);
    sunsetDirectional.shadow.camera.near = 2;
    sunsetDirectional.shadow.camera.far = 36;
    sunsetDirectional.shadow.camera.left = -11;
    sunsetDirectional.shadow.camera.right = 11;
    sunsetDirectional.shadow.camera.top = 9;
    sunsetDirectional.shadow.camera.bottom = -4;
    sunsetDirectional.shadow.bias = -0.0005;
    scene.add(sunsetDirectional);

    const salonCoveLight = new THREE.PointLight(0xffdfb8, 2.2, 16, 1.4);
    salonCoveLight.position.set(0.4, 3.3, 0.2);
    scene.add(salonCoveLight);

    const diningGlowLight = new THREE.PointLight(0xffd3a3, 1.7, 13, 1.5);
    diningGlowLight.position.set(4.1, 3.0, 2.8);
    scene.add(diningGlowLight);

    const foyerGlowLight = new THREE.PointLight(0xf6cfa0, 1.8, 10, 1.5);
    foyerGlowLight.position.set(-4.8, 3.1, 4.1);
    scene.add(foyerGlowLight);

    // Procedural Textures
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const skyPanoramaTex = createTwilightPanoramaTexture();
    const { albedoMap: stoneMap, bumpMap: stoneBump } = createHonedTravertineMaps(maxAniso);
    const walnutMap = createWalnutWoodMap(maxAniso);

    // Track disposable resources
    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T): T => {
      geos.push(g);
      return g;
    };
    const mat = <T extends THREE.Material>(m: T): T => {
      mats.push(m);
      return m;
    };

    // Materials
    const skyDomeMat = mat(
      new THREE.MeshBasicMaterial({
        map: skyPanoramaTex,
        side: THREE.BackSide,
        fog: false,
      })
    );
    const travertineFloorMat = mat(
      new THREE.MeshStandardMaterial({
        map: stoneMap,
        bumpMap: stoneBump,
        bumpScale: 0.018,
        roughness: 0.54,
        metalness: 0.04,
        envMapIntensity: 0.45,
      })
    );
    const ceilingPlasterMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xe6dfd3,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    const slateWallMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0x202d33,
        roughness: 0.78,
        metalness: 0.08,
      })
    );
    const travertineWallMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xd5cbb8,
        bumpMap: stoneBump,
        bumpScale: 0.01,
        roughness: 0.66,
        metalness: 0.04,
      })
    );
    const walnutMat = mat(
      new THREE.MeshStandardMaterial({
        map: walnutMap,
        roughness: 0.52,
        metalness: 0.06,
      })
    );
    const bronzeMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0x5c4a35,
        roughness: 0.28,
        metalness: 0.88,
      })
    );
    const champagneMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xcbb389,
        roughness: 0.22,
        metalness: 0.9,
      })
    );
    const coveGlowMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xf7e3bf,
        emissive: 0xe6b87c,
        emissiveIntensity: 1.35,
        roughness: 0.3,
      })
    );
    const linenMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xdfd8cc,
        roughness: 0.92,
        metalness: 0.01,
      })
    );
    const boucleAccentMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xb7ab98,
        roughness: 0.95,
        metalness: 0.01,
      })
    );
    const curtainGlassMat = mat(
      new THREE.MeshPhysicalMaterial({
        color: 0x9fc2ca,
        roughness: 0.06,
        metalness: 0.05,
        clearcoat: 1.0,
        transparent: true,
        opacity: isSoftwareGl ? 0.16 : 0.2,
      })
    );
    const rugMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0x9d9485,
        roughness: 0.96,
        metalness: 0.0,
      })
    );
    const foliageMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.94,
        metalness: 0.0,
        envMapIntensity: 0.25,
      })
    );

    // 1. 360° Seamless Twilight Panorama Sky Dome
    const skyDome = new THREE.Mesh(geo(new THREE.SphereGeometry(72, 48, 32)), skyDomeMat);
    // Rotate horizontally so texture center (u = 0.5) aligns directly with -Z (Arabian Sea sunset)
    skyDome.rotation.y = Math.PI * 0.5;
    scene.add(skyDome);

    // 2. Interior Full-Floor Sky Estate Pavilion (y: 0 -> 3.65m = 12 ft. clear ceiling height)
    const estateGroup = new THREE.Group();
    const ceilingHeight = 3.65;

    // Continuous Honed Travertine Interior + Terrace Slab
    const mainFloor = new THREE.Mesh(geo(new THREE.BoxGeometry(15.2, 0.24, 15.8)), travertineFloorMat);
    mainFloor.position.set(0.4, -0.12, -1.0);
    mainFloor.receiveShadow = true;
    estateGroup.add(mainFloor);

    // Acoustic Coffered Ceiling + Warm Recessed Perimeter Cove Soffit
    const ceilingSlab = new THREE.Mesh(geo(new THREE.BoxGeometry(14.4, 0.22, 11.4)), ceilingPlasterMat);
    ceilingSlab.position.set(0.4, ceilingHeight + 0.11, 0.9);
    estateGroup.add(ceilingSlab);

    const innerSoffit = new THREE.Mesh(geo(new THREE.BoxGeometry(11.6, 0.14, 8.6)), ceilingPlasterMat);
    innerSoffit.position.set(0.4, ceilingHeight - 0.06, 0.9);
    estateGroup.add(innerSoffit);

    // Glowing Champagne Light Cove Perimeter Strips around Main Salon Ceiling
    const coveBars: Array<[number, number, number, number, number, number]> = [
      [0.4, ceilingHeight - 0.01, -3.45, 11.6, 0.04, 0.09],
      [0.4, ceilingHeight - 0.01, 5.25, 11.6, 0.04, 0.09],
      [-5.45, ceilingHeight - 0.01, 0.9, 0.09, 0.04, 8.6],
      [6.25, ceilingHeight - 0.01, 0.9, 0.09, 0.04, 8.6],
    ];
    for (const [cx, cy, cz, sx, sy, sz] of coveBars) {
      const strip = new THREE.Mesh(geo(new THREE.BoxGeometry(sx, sy, sz)), coveGlowMat);
      strip.position.set(cx, cy, cz);
      estateGroup.add(strip);
    }

    // Back / Side Structural Walls
    // East Architectural Feature Wall (x = +7.3) with Fluted Walnut Slats & Illuminated Art Niche
    const eastWall = new THREE.Mesh(geo(new THREE.BoxGeometry(0.32, ceilingHeight, 11.4)), travertineWallMat);
    eastWall.position.set(7.35, ceilingHeight / 2, 0.9);
    eastWall.receiveShadow = true;
    estateGroup.add(eastWall);

    // Hearth / Fireplace Stone Plinth on East Wall facing Salon
    const hearthPlinth = new THREE.Mesh(geo(new THREE.BoxGeometry(0.65, 0.42, 4.4)), slateWallMat);
    hearthPlinth.position.set(6.95, 0.21, 0.1);
    hearthPlinth.castShadow = true;
    hearthPlinth.receiveShadow = true;
    estateGroup.add(hearthPlinth);

    const hearthGlow = new THREE.Mesh(geo(new THREE.BoxGeometry(0.18, 0.14, 1.5)), coveGlowMat);
    hearthGlow.position.set(6.95, 0.48, 0.1);
    estateGroup.add(hearthGlow);

    // Monolithic Stone Backdrop Panel over Hearth
    const galleryStonePanel = new THREE.Mesh(
      geo(new THREE.BoxGeometry(0.24, 3.0, 3.4)),
      travertineWallMat
    );
    galleryStonePanel.position.set(7.12, 1.9, 0.1);
    estateGroup.add(galleryStonePanel);

    // Fluted Walnut Vertical Architectural Battens along East Gallery Wall (InstancedMesh > 20)
    const battenGeo = geo(new THREE.BoxGeometry(0.08, 3.5, 0.06));
    const battenPositionsZ: number[] = [];
    for (let z = -4.5; z <= -1.9; z += 0.13) battenPositionsZ.push(z);
    for (let z = 2.0; z <= 5.8; z += 0.13) battenPositionsZ.push(z);

    const battenInstanced = new THREE.InstancedMesh(battenGeo, walnutMat, battenPositionsZ.length);
    battenPositionsZ.forEach((bz, i) => {
      _scratchMatrix.makeTranslation(7.16, 1.78, bz);
      battenInstanced.setMatrixAt(i, _scratchMatrix);
    });
    battenInstanced.instanceMatrix.needsUpdate = true;
    battenInstanced.computeBoundingSphere();
    estateGroup.add(battenInstanced);

    // Framed Minimalist Abstract Artwork Canvas mounted on Walnut Side Wall
    const artFrame = new THREE.Mesh(geo(new THREE.BoxGeometry(0.06, 1.55, 1.95)), bronzeMat);
    artFrame.position.set(6.98, 1.88, 0.1);
    estateGroup.add(artFrame);
    const artCanvas = new THREE.Mesh(
      geo(new THREE.BoxGeometry(0.07, 1.42, 1.82)),
      mat(
        new THREE.MeshStandardMaterial({
          color: 0xcabaa0,
          roughness: 0.78,
        })
      )
    );
    artCanvas.position.set(6.97, 1.88, 0.1);
    estateGroup.add(artCanvas);

    // North / South Wall enclosure + Private Elevator Vestibule (+Z = +6.5, -X = -6.9)
    const northBackWall = new THREE.Mesh(geo(new THREE.BoxGeometry(14.5, ceilingHeight, 0.3)), travertineWallMat);
    northBackWall.position.set(0.25, ceilingHeight / 2, 6.55);
    northBackWall.receiveShadow = true;
    estateGroup.add(northBackWall);

    const westWingWall = new THREE.Mesh(geo(new THREE.BoxGeometry(0.32, ceilingHeight, 4.6)), travertineWallMat);
    westWingWall.position.set(-6.9, ceilingHeight / 2, 4.25);
    westWingWall.receiveShadow = true;
    estateGroup.add(westWingWall);

    // Private Elevator Arrival Portal (Bronze Double Doors + Nero Slate Reveal) on North Foyer Wall
    const liftSurround = new THREE.Mesh(geo(new THREE.BoxGeometry(2.6, 3.05, 0.2)), slateWallMat);
    liftSurround.position.set(-4.6, 1.525, 6.38);
    estateGroup.add(liftSurround);

    const liftDoorLeft = new THREE.Mesh(geo(new THREE.BoxGeometry(0.88, 2.65, 0.08)), bronzeMat);
    liftDoorLeft.position.set(-5.06, 1.325, 6.32);
    estateGroup.add(liftDoorLeft);

    const liftDoorRight = new THREE.Mesh(geo(new THREE.BoxGeometry(0.88, 2.65, 0.08)), bronzeMat);
    liftDoorRight.position.set(-4.14, 1.325, 6.32);
    estateGroup.add(liftDoorRight);

    const liftThresholdStrip = new THREE.Mesh(geo(new THREE.BoxGeometry(2.0, 0.03, 0.25)), champagneMat);
    liftThresholdStrip.position.set(-4.6, 0.015, 6.18);
    estateGroup.add(liftThresholdStrip);

    // Sculptural Foyer Lathe Alabaster Pendant Lamp
    const foyerPendantGroup = new THREE.Group();
    const cord = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 8)), bronzeMat);
    cord.position.y = 3.05;
    foyerPendantGroup.add(cord);

    const shadeProfile = [
      new THREE.Vector2(0.02, 0),
      new THREE.Vector2(0.36, 0.14),
      new THREE.Vector2(0.42, 0.28),
      new THREE.Vector2(0.18, 0.44),
      new THREE.Vector2(0.04, 0.46),
    ];
    const alabasterMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0xf4e8d2,
        emissive: 0xdba96b,
        emissiveIntensity: 0.75,
        roughness: 0.35,
      })
    );
    const pendantShade = new THREE.Mesh(geo(new THREE.LatheGeometry(shadeProfile, 24)), alabasterMat);
    pendantShade.position.y = 2.22;
    foyerPendantGroup.add(pendantShade);
    foyerPendantGroup.position.set(-4.6, 0, 4.3);
    estateGroup.add(foyerPendantGroup);

    // Private Foyer-to-Salon Fluted Bronze Privacy Screen Fins (z = 2.2, x: -6.2 -> -2.8)
    const screenFinGeo = geo(new THREE.BoxGeometry(0.06, 3.45, 0.18));
    const screenFinCount = 14;
    const screenInstanced = new THREE.InstancedMesh(screenFinGeo, bronzeMat, screenFinCount);
    for (let i = 0; i < screenFinCount; i++) {
      _scratchMatrix.makeTranslation(-6.4 + i * 0.28, 1.725, 2.2);
      screenInstanced.setMatrixAt(i, _scratchMatrix);
    }
    screenInstanced.instanceMatrix.needsUpdate = true;
    screenInstanced.computeBoundingSphere();
    estateGroup.add(screenInstanced);

    // Foyer Walnut Arrival Bench + Decorative Ceramic Urn
    const foyerBench = new THREE.Mesh(geo(new THREE.BoxGeometry(1.75, 0.42, 0.56)), walnutMat);
    foyerBench.position.set(-6.35, 0.21, 4.1);
    foyerBench.rotation.y = Math.PI / 2;
    foyerBench.castShadow = true;
    estateGroup.add(foyerBench);

    // 3. Floor-to-Ceiling Bronze Curtain-Wall Facade Facing Western Arabian Sea (z = -4.65)
    // With Wide Open Cantilevered Sliding Threshold onto Sea Terrace (x: -1.8 -> +2.4 left unobstructed!)
    const mullionGeo = geo(new THREE.BoxGeometry(0.09, ceilingHeight, 0.14));
    const mullionCoords: Array<[number, number]> = [
      // Sea facade left wing (z = -4.65)
      [-6.8, -4.65],
      [-5.1, -4.65],
      [-3.4, -4.65],
      [-1.8, -4.65],
      // Sea facade right wing (open threshold between -1.8 and +2.4!)
      [2.4, -4.65],
      [4.1, -4.65],
      [5.8, -4.65],
      [7.2, -4.65],
      // South-West Side Panorama Wing (x = -6.8, z: -4.65 -> +1.8)
      [-6.8, -2.9],
      [-6.8, -1.2],
      [-6.8, 0.5],
      [-6.8, 1.9],
    ];
    const mullionInstanced = new THREE.InstancedMesh(mullionGeo, bronzeMat, mullionCoords.length);
    mullionCoords.forEach(([mx, mz], i) => {
      _scratchMatrix.makeTranslation(mx, ceilingHeight / 2, mz);
      mullionInstanced.setMatrixAt(i, _scratchMatrix);
    });
    mullionInstanced.instanceMatrix.needsUpdate = true;
    mullionInstanced.computeBoundingSphere();
    estateGroup.add(mullionInstanced);

    // Curtain Wall Low-Iron Glass Panes
    const glassSeaLeft = new THREE.Mesh(geo(new THREE.BoxGeometry(5.0, ceilingHeight, 0.03)), curtainGlassMat);
    glassSeaLeft.position.set(-4.3, ceilingHeight / 2, -4.65);
    estateGroup.add(glassSeaLeft);

    const glassSeaRight = new THREE.Mesh(geo(new THREE.BoxGeometry(4.8, ceilingHeight, 0.03)), curtainGlassMat);
    glassSeaRight.position.set(4.8, ceilingHeight / 2, -4.65);
    estateGroup.add(glassSeaRight);

    const glassSideWest = new THREE.Mesh(geo(new THREE.BoxGeometry(0.03, ceilingHeight, 6.6)), curtainGlassMat);
    glassSideWest.position.set(-6.8, ceilingHeight / 2, -1.35);
    estateGroup.add(glassSideWest);

    // Overhead Bronze Transom Header across Sea Threshold
    const headerBeam = new THREE.Mesh(geo(new THREE.BoxGeometry(14.2, 0.22, 0.28)), bronzeMat);
    headerBeam.position.set(0.2, ceilingHeight - 0.11, -4.65);
    estateGroup.add(headerBeam);

    // 4. Grand Living Salon Bespoke Japandi Furniture Ensemble
    const salonRug = new THREE.Mesh(geo(new THREE.BoxGeometry(6.6, 0.025, 4.9)), rugMat);
    salonRug.position.set(1.2, 0.012, -0.35);
    salonRug.receiveShadow = true;
    estateGroup.add(salonRug);

    // L-Shaped Low-Profile Japandi Sofa (facing sea horizon + hearth)
    const sofaGroup = new THREE.Group();
    const sofaBaseMain = new THREE.Mesh(geo(new THREE.BoxGeometry(4.2, 0.16, 1.05)), walnutMat);
    sofaBaseMain.position.set(0.8, 0.12, 1.45);
    sofaBaseMain.castShadow = true;
    sofaGroup.add(sofaBaseMain);

    const sofaSeatMain = new THREE.Mesh(geo(new THREE.BoxGeometry(4.05, 0.26, 0.96)), linenMat);
    sofaSeatMain.position.set(0.8, 0.33, 1.43);
    sofaSeatMain.castShadow = true;
    sofaGroup.add(sofaSeatMain);

    const sofaBackMain = new THREE.Mesh(geo(new THREE.BoxGeometry(4.1, 0.48, 0.24)), linenMat);
    sofaBackMain.position.set(0.8, 0.62, 1.82);
    sofaBackMain.castShadow = true;
    sofaGroup.add(sofaBackMain);

    // Chaise / Return Wing of L-Sofa
    const sofaBaseWing = new THREE.Mesh(geo(new THREE.BoxGeometry(1.05, 0.16, 2.55)), walnutMat);
    sofaBaseWing.position.set(-1.1, 0.12, 0.68);
    sofaBaseWing.castShadow = true;
    sofaGroup.add(sofaBaseWing);

    const sofaSeatWing = new THREE.Mesh(geo(new THREE.BoxGeometry(0.96, 0.26, 2.45)), linenMat);
    sofaSeatWing.position.set(-1.1, 0.33, 0.68);
    sofaSeatWing.castShadow = true;
    sofaGroup.add(sofaSeatWing);

    // Throw Cushions
    const cushionGeo = geo(new THREE.BoxGeometry(0.45, 0.36, 0.16));
    for (const [cx, cz, rotY] of [
      [-0.45, 1.65, 0.12],
      [0.65, 1.66, -0.05],
      [1.85, 1.65, -0.14],
    ] as const) {
      const cushion = new THREE.Mesh(cushionGeo, boucleAccentMat);
      cushion.position.set(cx, 0.61, cz);
      cushion.rotation.y = rotY;
      cushion.rotation.x = -0.15;
      sofaGroup.add(cushion);
    }
    estateGroup.add(sofaGroup);

    // Two Sculptural Lounge Armchairs Facing Sofa Across Coffee Table
    for (const [ax, az, rot] of [
      [3.55, -1.65, -2.5],
      [0.15, -2.15, 2.95],
    ] as const) {
      const chair = new THREE.Group();
      const cBase = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.42, 0.46, 0.32, 18)), walnutMat);
      cBase.position.y = 0.16;
      chair.add(cBase);
      const cSeat = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.44, 0.42, 0.16, 18)), boucleAccentMat);
      cSeat.position.y = 0.4;
      chair.add(cSeat);
      const cBack = new THREE.Mesh(
        geo(new THREE.CylinderGeometry(0.45, 0.45, 0.42, 18, 1, false, 0, Math.PI)),
        boucleAccentMat
      );
      cBack.position.y = 0.62;
      chair.add(cBack);
      chair.position.set(ax, 0, az);
      chair.rotation.y = rot;
      estateGroup.add(chair);
    }

    // Monolithic Honed Travertine Coffee Table + Lathe Ceramic Vessel + Interior Bonsai
    const coffeeTop = new THREE.Mesh(geo(new THREE.BoxGeometry(2.1, 0.11, 1.15)), travertineWallMat);
    coffeeTop.position.set(1.1, 0.38, -0.35);
    coffeeTop.castShadow = true;
    coffeeTop.receiveShadow = true;
    estateGroup.add(coffeeTop);

    for (const px of [0.45, 1.75]) {
      const drumLeg = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 18)), travertineWallMat);
      drumLeg.position.set(px, 0.17, -0.35);
      drumLeg.castShadow = true;
      estateGroup.add(drumLeg);
    }

    // Lathe Ceramic Vessel on Coffee Table
    const vaseProfile = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.11, 0),
      new THREE.Vector2(0.15, 0.12),
      new THREE.Vector2(0.08, 0.24),
      new THREE.Vector2(0.1, 0.28),
    ];
    const vaseMesh = new THREE.Mesh(geo(new THREE.LatheGeometry(vaseProfile, 18)), slateWallMat);
    vaseMesh.position.set(0.68, 0.44, -0.45);
    estateGroup.add(vaseMesh);

    // Architectural Interior Tabletop Bonsai Dish
    const dish = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 16)), bronzeMat);
    dish.position.set(1.52, 0.47, -0.25);
    estateGroup.add(dish);
    const smallTrunk = new THREE.Mesh(
      geo(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.52, 0.51, -0.25),
            new THREE.Vector3(1.6, 0.66, -0.22),
            new THREE.Vector3(1.48, 0.82, -0.28),
          ]),
          10,
          0.025,
          6,
          false
        )
      ),
      bronzeMat
    );
    estateGroup.add(smallTrunk);
    const bonsaiLeafMat = mat(
      new THREE.MeshStandardMaterial({
        color: 0x3b634b,
        roughness: 0.88,
      })
    );
    const smallCrown = new THREE.Mesh(geo(new THREE.DodecahedronGeometry(0.18, 0)), bonsaiLeafMat);
    smallCrown.position.set(1.48, 0.86, -0.28);
    smallCrown.scale.set(1.35, 0.58, 1.1);
    estateGroup.add(smallCrown);

    // Dining Table + Linear Champagne Chandelier in South-East Quadrant (x: 3.9, z: 3.4)
    const diningTop = new THREE.Mesh(geo(new THREE.BoxGeometry(3.2, 0.09, 1.35)), travertineWallMat);
    diningTop.position.set(3.8, 0.76, 3.6);
    diningTop.castShadow = true;
    estateGroup.add(diningTop);
    for (const dx of [2.95, 4.65]) {
      const dLeg = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.22, 0.28, 0.72, 16)), walnutMat);
      dLeg.position.set(dx, 0.36, 3.6);
      estateGroup.add(dLeg);
    }
    const chandelierBar = new THREE.Mesh(geo(new THREE.BoxGeometry(2.5, 0.06, 0.09)), champagneMat);
    chandelierBar.position.set(3.8, 2.48, 3.6);
    estateGroup.add(chandelierBar);
    const chandelierGlow = new THREE.Mesh(geo(new THREE.BoxGeometry(2.4, 0.03, 0.07)), coveGlowMat);
    chandelierGlow.position.set(3.8, 2.44, 3.6);
    estateGroup.add(chandelierGlow);

    // 5. Sea-Facing Cantilevered Biophilic Verandah (z: -4.75 -> -8.8)
    // Open Balcony Balustrade (laminated glass + bronze handrail)
    const railGlass = new THREE.Mesh(geo(new THREE.BoxGeometry(14.0, 1.05, 0.04)), curtainGlassMat);
    railGlass.position.set(0.2, 0.525, -8.75);
    estateGroup.add(railGlass);

    const railTop = new THREE.Mesh(geo(new THREE.BoxGeometry(14.1, 0.07, 0.09)), bronzeMat);
    railTop.position.set(0.2, 1.08, -8.75);
    estateGroup.add(railTop);

    const sideRailLeft = new THREE.Mesh(geo(new THREE.BoxGeometry(0.07, 0.07, 4.1)), bronzeMat);
    sideRailLeft.position.set(-6.8, 1.08, -6.7);
    estateGroup.add(sideRailLeft);

    // Terrace Outdoor Lounge Daybeds Facing Sea Horizon
    const daybed = new THREE.Mesh(geo(new THREE.BoxGeometry(2.1, 0.34, 1.25)), linenMat);
    daybed.position.set(-3.1, 0.25, -6.65);
    daybed.castShadow = true;
    estateGroup.add(daybed);
    const daybedBase = new THREE.Mesh(geo(new THREE.BoxGeometry(2.2, 0.14, 1.35)), walnutMat);
    daybedBase.position.set(-3.1, 0.07, -6.65);
    estateGroup.add(daybedBase);

    // Instanced Biophilic Terrace Foliage along Balustrade Planter Troughs (> 24 instances)
    const planterTrough = new THREE.Mesh(geo(new THREE.BoxGeometry(13.6, 0.38, 0.72)), slateWallMat);
    planterTrough.position.set(0.2, 0.19, -8.28);
    estateGroup.add(planterTrough);

    const shrubGeo = geo(new THREE.IcosahedronGeometry(0.38, 1));
    const shrubCount = 26;
    const shrubInstanced = new THREE.InstancedMesh(shrubGeo, foliageMat, shrubCount);
    for (let i = 0; i < shrubCount; i++) {
      const px = -6.1 + i * 0.51;
      const py = 0.56 + ((i * 19) % 10) * 0.028;
      const pz = -8.25 + ((i % 3) - 1) * 0.1;
      const sc = 0.78 + ((i * 29) % 35) / 100;
      _scratchMatrix.makeScale(sc, sc * 0.88, sc);
      _scratchMatrix.setPosition(px, py, pz);
      shrubInstanced.setMatrixAt(i, _scratchMatrix);
      _scratchColor.setHSL(0.36 + (i % 5) * 0.012, 0.42, 0.11 + (i % 4) * 0.025).convertSRGBToLinear();
      shrubInstanced.setColorAt(i, _scratchColor);
    }
    shrubInstanced.instanceMatrix.needsUpdate = true;
    if (shrubInstanced.instanceColor) shrubInstanced.instanceColor.needsUpdate = true;
    shrubInstanced.computeBoundingSphere();
    estateGroup.add(shrubInstanced);

    scene.add(estateGroup);

    // 6. On-demand coalesced rendering loop + hotspot 3D-to-2D projection + software GL GPU fence
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTimestamp = performance.now();
    let lastUiAzimuthSync = 0;

    function updateProjectedHotspots() {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      for (const h of VIRTUAL_HOTSPOTS) {
        const el = hotspotElRefs.current[h.id];
        if (!el) continue;

        if (h.vantageId !== activeVantageRef.current) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          continue;
        }

        _scratchHotspotPos.set(h.worldPosition[0], h.worldPosition[1], h.worldPosition[2]);
        _scratchProj.copy(_scratchHotspotPos).project(camera);

        // Hide markers behind camera or very near outer screen edges
        const inFront = _scratchProj.z < 1 && _scratchProj.z > -1;
        const xPct = (_scratchProj.x * 0.5 + 0.5) * 100;
        const yPct = (-_scratchProj.y * 0.5 + 0.5) * 100;
        const inViewport = inFront && xPct >= 6 && xPct <= 94 && yPct >= 14 && yPct <= 84;

        if (!inViewport) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          const px = (_scratchProj.x * 0.5 + 0.5) * rect.width;
          const py = (-_scratchProj.y * 0.5 + 0.5) * rect.height;
          el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
        }
      }
    }

    function afterDraw(cb: () => void) {
      if (disposed) return;
      renderer.getContext().flush();
      frameId = window.setTimeout(cb, 20);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame((now) => {
        if (disposed) return;
        const delta = Math.min(0.05, Math.max(0.001, (now - lastTimestamp) / 1000));
        lastTimestamp = now;
        renderDirty = false;

        const st = viewStateRef.current;
        if (st.autoPan && !st.isDragging) {
          st.targetAzimuth += delta * 10.5;
        }

        const dampFactor = 14;
        const dampFn = (cur: number, tgt: number) =>
          isSoftwareGl ? tgt : THREE.MathUtils.damp(cur, tgt, dampFactor, delta);

        st.eyeX = dampFn(st.eyeX, st.targetEyeX);
        st.eyeY = dampFn(st.eyeY, st.targetEyeY);
        st.eyeZ = dampFn(st.eyeZ, st.targetEyeZ);
        st.azimuth = dampFn(st.azimuth, st.targetAzimuth);
        st.pitch = dampFn(st.pitch, st.targetPitch);
        st.fov = dampFn(st.fov, st.targetFov);

        camera.position.set(st.eyeX, st.eyeY, st.eyeZ);
        if (Math.abs(camera.fov - st.fov) > 0.05) {
          camera.fov = st.fov;
          camera.updateProjectionMatrix();
        }

        const [tx, ty, tz] = computeLookTargetVector(
          [st.eyeX, st.eyeY, st.eyeZ],
          st.azimuth,
          st.pitch,
          4
        );
        camera.lookAt(tx, ty, tz);

        renderer.render(scene, camera);
        updateProjectedHotspots();
        setRenderReady(true);

        // Throttled compass readout sync (~10Hz max during continuous pan/drag)
        if (now - lastUiAzimuthSync > 90 || st.isDragging || !st.autoPan) {
          lastUiAzimuthSync = now;
          const roundedAz = Math.round(normalizeAzimuthDeg(st.azimuth));
          setAzimuthDeg((prev) => (prev === roundedAz ? prev : roundedAz));
        }

        const settled =
          !st.autoPan &&
          Math.abs(st.eyeX - st.targetEyeX) < 0.005 &&
          Math.abs(st.eyeZ - st.targetEyeZ) < 0.005 &&
          Math.abs(st.azimuth - st.targetAzimuth) < 0.08 &&
          Math.abs(st.pitch - st.targetPitch) < 0.08 &&
          Math.abs(st.fov - st.targetFov) < 0.08;

        const done = () => {
          renderBusy = false;
          if (renderDirty || !settled) {
            requestRender();
          }
        };

        if (isSoftwareGl && (st.autoPan || !settled)) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestSceneRenderRef.current = requestRender;

    // Interactive 360° Pointer Drag + Wheel Zoom attached across window move/up so dragging never drops
    let lastClientX = 0;
    let lastClientY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const st = viewStateRef.current;
      st.isDragging = true;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      if (st.autoPan) {
        st.autoPan = false;
        setAutoPan(false);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const st = viewStateRef.current;
      if (!st.isDragging) return;
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      st.targetAzimuth -= dx * 0.24;
      st.targetPitch = clampPitchDeg(st.targetPitch + dy * 0.16);
      requestRender();
    };

    const onPointerUp = () => {
      const st = viewStateRef.current;
      if (!st.isDragging) return;
      st.isDragging = false;
      const rounded = Math.round(normalizeAzimuthDeg(st.targetAzimuth));
      setAzimuthDeg(rounded);
      requestRender();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = viewStateRef.current;
      st.targetFov = clampTourFov(st.targetFov + e.deltaY * 0.025);
      setFov(Math.round(st.targetFov));
      requestRender();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 1280;
      const h = container.clientHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    });
    resizeObserver.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);

      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      skyPanoramaTex.dispose();
      stoneMap.dispose();
      stoneBump.dispose();
      walnutMap.dispose();
      envTex.dispose();
      renderer.dispose();
      requestSceneRenderRef.current = null;
    };
  }, [open]);

  const activeVantage = useMemo(() => getVirtualVantageById(activeVantageId), [activeVantageId]);
  const activeHotspot = useMemo(
    () => VIRTUAL_HOTSPOTS.find((h) => h.id === activeHotspotId) ?? null,
    [activeHotspotId]
  );
  const compass = useMemo(() => worldAzimuthToGeographicBearing(azimuthDeg), [azimuthDeg]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Virtual Experience — 360-degree Sky Estates Interior"
      data-testid="virtual-experience-modal"
      data-ready={renderReady ? 'true' : 'false'}
      data-vantage={activeVantage.id}
      data-azimuth-deg={azimuthDeg}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0a181b] text-[#f4efe6]"
    >
      {/* Dedicated WebGL Mount Layer */}
      <div
        ref={mountRef}
        data-testid="virtual-experience-canvas"
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Interactive 3D Projected Spatial Hotspot Markers (Zero backdrop-blur over WebGL) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {VIRTUAL_HOTSPOTS.map((hotspot) => {
          const isFocused = hotspot.id === activeHotspotId;
          return (
            <button
              key={hotspot.id}
              ref={(el) => {
                hotspotElRefs.current[hotspot.id] = el;
              }}
              type="button"
              onClick={() => focusHotspot(hotspot)}
              aria-label={`Inspect architectural detail: ${hotspot.title}`}
              style={{ opacity: 0 }}
              className={`absolute top-0 left-0 flex items-center gap-2 border px-2.5 py-1 text-left transition-colors duration-150 ${
                isFocused
                  ? 'border-[#cbb389] bg-[#cbb389] text-[#0e2226]'
                  : 'border-[#cbb389]/65 bg-[#0e2226]/92 text-[#f4efe6] hover:border-[#cbb389] hover:bg-[#163137]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  isFocused ? 'bg-[#0e2226]' : 'bg-[#cbb389]'
                }`}
              />
              <span className="font-mono text-[10px] font-medium tracking-[0.14em] uppercase whitespace-nowrap">
                {hotspot.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Bar: Minimal Architectural Readout & Close Control (Solid rgba, no backdrop-filter) */}
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="pointer-events-auto max-w-xl border border-[#cbb389]/35 bg-[#0e2226]/94 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.18em] uppercase text-[#cbb389]">
            <span>VIRTUAL EXPERIENCE · 360° SKY ESTATE</span>
            <span aria-hidden="true">·</span>
            <span>{PROJECT_META.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-lg sm:text-2xl font-normal text-[#f4efe6]">
              {activeHotspot ? activeHotspot.title : activeVantage.label}
            </h2>
            <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#93a1aa]">
              {activeHotspot ? activeHotspot.tag : activeVantage.subtitle}
            </span>
          </div>
          <p className="mt-1.5 hidden text-xs font-light leading-relaxed text-[#c8c4bc] sm:block">
            {activeHotspot ? activeHotspot.detail : activeVantage.description}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5 shrink-0">
          {/* Compass Telemetry Chip */}
          <div
            data-testid="virtual-compass-readout"
            className="hidden sm:flex h-11 items-center gap-2.5 border border-[#cbb389]/30 bg-[#0e2226]/94 px-3.5 font-mono text-[11px] tracking-[0.14em] uppercase"
          >
            <Compass className="h-3.5 w-3.5 text-[#cbb389]" strokeWidth={1.5} />
            <span className="text-[#f4efe6]">
              {String(compass.bearingDeg).padStart(3, '0')}° {compass.cardinal}
            </span>
            <span aria-hidden="true" className="text-[#cbb389]/50">
              ·
            </span>
            <span className="text-[#c8c4bc]">{compass.landmarkHint}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Virtual Experience"
            className="inline-flex h-11 items-center gap-2 border border-[#cbb389]/45 bg-[#0e2226]/95 px-4 text-xs font-medium tracking-[0.16em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cbb389]"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Bottom Unified Collapsible Control Dock (Zero Center Occlusion) */}
      <div className="pointer-events-none relative z-10 mt-auto flex flex-col items-center px-3 pb-4 sm:px-6 sm:pb-6">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          aria-expanded={!dockCollapsed}
          className="pointer-events-auto mb-2 inline-flex h-7 items-center gap-1.5 border border-[#cbb389]/40 bg-[#0e2226]/95 px-3 font-mono text-[10px] tracking-[0.16em] uppercase text-[#cbb389] transition-colors hover:bg-[#19363c]"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3 w-3" strokeWidth={1.5} />
              <span>Show Tour Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
              <span>Hide Tour Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex w-full max-w-[1040px] flex-col gap-2.5 border border-[#cbb389]/35 bg-[#0e2226]/95 p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Vantage Station Switcher */}
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Interior Vantage Stations">
                <span className="mr-1 hidden items-center gap-1 font-mono text-[10px] tracking-[0.16em] uppercase text-[#93a1aa] md:inline-flex">
                  <Eye className="h-3 w-3 text-[#cbb389]" strokeWidth={1.5} />
                  Vantage
                </span>
                {VIRTUAL_VANTAGES.map((station) => {
                  const selected = station.id === activeVantageId;
                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => selectVantage(station.id)}
                      className={`h-9 px-3 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors ${
                        selected
                          ? 'bg-[#cbb389] text-[#0e2226]'
                          : 'border border-[#f4efe6]/18 bg-[#132b30] text-[#f4efe6]/85 hover:border-[#cbb389]/65'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-75 mr-1.5">{station.code}</span>
                      {station.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Camera Controls: Auto-Pan, Zoom, Reset, Private Viewing CTA */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoPan((prev) => !prev)}
                  aria-pressed={autoPan}
                  className={`inline-flex h-9 items-center gap-1.5 border px-3 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors ${
                    autoPan
                      ? 'border-[#cbb389] bg-[#19363c] text-[#cbb389]'
                      : 'border-[#f4efe6]/18 bg-[#132b30] text-[#f4efe6]/85 hover:border-[#cbb389]/60'
                  }`}
                >
                  {autoPan ? <Pause className="h-3 w-3" strokeWidth={1.5} /> : <Play className="h-3 w-3" strokeWidth={1.5} />}
                  <span>360° Pan</span>
                </button>

                <div className="flex items-center border border-[#f4efe6]/18 bg-[#132b30]">
                  <button
                    type="button"
                    aria-label="Zoom in"
                    disabled={fov <= VIRTUAL_TOUR_FOV_MIN}
                    onClick={() => adjustFov(-6)}
                    className="inline-flex h-9 w-8 items-center justify-center text-[#f4efe6] transition-colors hover:text-[#cbb389] disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <span className="px-1.5 font-mono text-[10px] tracking-[0.1em] text-[#c8c4bc]">
                    {fov}°
                  </span>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    disabled={fov >= VIRTUAL_TOUR_FOV_MAX}
                    onClick={() => adjustFov(6)}
                    className="inline-flex h-9 w-8 items-center justify-center text-[#f4efe6] transition-colors hover:text-[#cbb389] disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>

                <button
                  type="button"
                  aria-label="Reset 360 view"
                  onClick={() => selectVantage(activeVantageId)}
                  className="inline-flex h-9 w-9 items-center justify-center border border-[#f4efe6]/18 bg-[#132b30] text-[#c8c4bc] transition-colors hover:border-[#cbb389] hover:text-[#cbb389]"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>

                {onArrangeViewing && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onArrangeViewing();
                    }}
                    className="hidden sm:inline-flex h-9 items-center bg-[#cbb389] px-3.5 text-[10px] font-semibold tracking-[0.16em] uppercase text-[#0e2226] transition-colors hover:bg-[#dcc7a0]"
                  >
                    Private Viewing
                  </button>
                )}
              </div>
            </div>

            {/* Architectural Hotspot Quick-Focus Bar + Interaction Hint */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f4efe6]/10 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] uppercase text-[#cbb389] mr-1">
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                  Highlights:
                </span>
                {VIRTUAL_HOTSPOTS.map((h) => {
                  const active = h.id === activeHotspotId;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => focusHotspot(h)}
                      className={`h-7 px-2.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                        active
                          ? 'border border-[#cbb389] bg-[#19363c] text-[#cbb389]'
                          : 'border border-[#f4efe6]/14 bg-[#0a181b]/70 text-[#c8c4bc] hover:border-[#cbb389]/50 hover:text-[#f4efe6]'
                      }`}
                    >
                      {h.title}
                    </button>
                  );
                })}
              </div>

              <p className="hidden font-mono text-[10px] tracking-[0.12em] uppercase text-[#93a1aa] lg:block">
                Drag 360° · Scroll Zoom · Arrows Pan · Conceptual Spatial Study
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
