import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import {
  TOWER_MASSING_TIERS,
  TOWER_TOTAL_WORLD_HEIGHT,
  getMassingCameraTarget,
  type MassingCameraPresetId,
} from '../utils/towerMassingSpec';
import { getTowerZoneById, TOWER_ZONES } from '../utils/towerSiteMap';

interface TowerMassing3DProps {
  activeZoneId: string;
  onSelectZone: (zoneId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Reusable scratch math objects allocated once outside render loop (zero GC)
const _scratchPos = new THREE.Vector3();
const _scratchTarget = new THREE.Vector3();
const _scratchMatrix = new THREE.Matrix4();
const _scratchColor = new THREE.Color();
const _scratchPointer = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createProceduralStoneTextures(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (bCtx && rCtx) {
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#b4b4b4';
    rCtx.fillRect(0, 0, size, size);

    // Deterministic honed stone travertine veining + slab seams
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 600; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 12 + rand() * 38;
      const h = 1 + rand() * 3;
      const shade = Math.floor(110 + rand() * 36);
      bCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
      bCtx.fillRect(x, y, w, h);

      const rShade = Math.floor(165 + rand() * 45);
      rCtx.fillStyle = `rgb(${rShade},${rShade},${rShade})`;
      rCtx.fillRect(x, y, w, h);
    }

    bCtx.strokeStyle = 'rgba(70,70,70,0.45)';
    bCtx.lineWidth = 1;
    for (let y = 32; y < size; y += 32) {
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(size, y);
      bCtx.stroke();
    }
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 3);
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(6, 14, 17, 0.72)');
    grad.addColorStop(0.55, 'rgba(8, 18, 22, 0.36)');
    grad.addColorStop(1, 'rgba(8, 18, 22, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function TowerMassing3D({
  activeZoneId,
  onSelectZone,
  isFullscreen = false,
  onToggleFullscreen,
}: TowerMassing3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<MassingCameraPresetId>('overview');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [renderReady, setRenderReady] = useState(false);

  const activeZoneRef = useRef(activeZoneId);
  activeZoneRef.current = activeZoneId;

  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const cameraPresetRef = useRef<MassingCameraPresetId>(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  const transitionTargetRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(31.5, 16.0, 36.5),
    lookAt: new THREE.Vector3(0, 12.2, 0),
  });

  const requestSceneRenderRef = useRef<(() => void) | null>(null);

  // Trigger camera glide when user picks a preset or changes active zone in tier-focus mode
  useEffect(() => {
    const target = getMassingCameraTarget(cameraPreset, activeZoneId);
    transitionTargetRef.current.pos.set(...target.position);
    transitionTargetRef.current.lookAt.set(...target.target);
    transitionTargetRef.current.active = true;
    requestSceneRenderRef.current?.();
  }, [cameraPreset, activeZoneId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x132b30);
    scene.fog = new THREE.FogExp2(0x132b30, 0.0115);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.2, 220);
    camera.position.set(31.5, 16.0, 36.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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

    // Lighting rig: warm directional sun + cool sky/ground HemisphereLight + subtle warm rim
    const hemiLight = new THREE.HemisphereLight(0x9dc0d1, 0x182529, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe1b5, 2.15);
    keyLight.position.set(24, 38, 22);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 6;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.camera.left = -22;
    keyLight.shadow.camera.right = 22;
    keyLight.shadow.camera.top = 32;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcbb389, 0.72);
    rimLight.position.set(-22, 18, -24);
    scene.add(rimLight);

    // Procedural materials & textures (zero external URLs)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const { bumpMap, roughnessMap } = createProceduralStoneTextures(maxAniso);
    const contactShadowTex = createContactShadowTexture();

    const travertineMat = new THREE.MeshStandardMaterial({
      color: 0xd9cfc0,
      roughness: 0.76,
      metalness: 0.06,
      bumpMap,
      bumpScale: 0.04,
      roughnessMap,
    });

    const slateBaseMat = new THREE.MeshStandardMaterial({
      color: 0x1a262c,
      roughness: 0.85,
      metalness: 0.12,
      bumpMap,
      bumpScale: 0.03,
    });

    const bronzeMetalMat = new THREE.MeshStandardMaterial({
      color: 0x6f5b43,
      roughness: 0.28,
      metalness: 0.88,
    });

    const champagneTrimMat = new THREE.MeshStandardMaterial({
      color: 0xcbb389,
      roughness: 0.22,
      metalness: 0.92,
    });

    const glazingMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a4a52,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: isSoftwareGl ? 0.58 : 0.72,
    });

    const warmInteriorGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf4dcb4,
      emissive: 0xd9a86c,
      emissiveIntensity: 0.65,
      roughness: 0.4,
      metalness: 0.05,
    });

    const infinityWaterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e606b,
      emissive: 0x0e343c,
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.02,
    });

    const activeTierHaloMat = new THREE.MeshStandardMaterial({
      color: 0xcbb389,
      emissive: 0xcbb389,
      emissiveIntensity: 0.85,
      roughness: 0.25,
      metalness: 0.6,
      transparent: true,
      opacity: 0.78,
    });

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [
      travertineMat,
      slateBaseMat,
      bronzeMetalMat,
      champagneTrimMat,
      glazingMat,
      warmInteriorGlowMat,
      infinityWaterMat,
      foliageMat,
      activeTierHaloMat,
    ];

    const registerGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposableGeos.push(g);
      return g;
    };

    // --- 1. Ground Context: Pali Hill Stepped Plinth & Contact Shadow ---
    const groundGroup = new THREE.Group();
    const groundCircleGeo = registerGeo(new THREE.CircleGeometry(36, 48));
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x15292e,
      roughness: 0.92,
      metalness: 0.04,
    });
    disposableMats.push(groundMat);
    const groundDisc = new THREE.Mesh(groundCircleGeo, groundMat);
    groundDisc.rotation.x = -Math.PI / 2;
    groundDisc.position.y = -0.04;
    groundDisc.receiveShadow = true;
    groundGroup.add(groundDisc);

    const shadowPlaneGeo = registerGeo(new THREE.CircleGeometry(14.5, 40));
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    disposableMats.push(shadowPlaneMat);
    const contactShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.015;
    groundGroup.add(contactShadow);

    // Beveled extruded courtyard plinth (bottom-center flush at y = 0)
    const plinthShape = new THREE.Shape();
    const pw = 8.4;
    const pd = 6.8;
    plinthShape.moveTo(-pw, -pd);
    plinthShape.lineTo(pw, -pd);
    plinthShape.lineTo(pw, pd);
    plinthShape.lineTo(-pw, pd);
    plinthShape.closePath();

    const plinthGeo = registerGeo(
      new THREE.ExtrudeGeometry(plinthShape, {
        depth: 0.35,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.12,
        bevelSegments: 2,
      })
    );
    plinthGeo.rotateX(-Math.PI / 2);
    const plinthMesh = new THREE.Mesh(plinthGeo, slateBaseMat);
    plinthMesh.position.y = 0;
    plinthMesh.receiveShadow = true;
    groundGroup.add(plinthMesh);

    scene.add(groundGroup);

    // --- 2. Composite Multi-Part Tower Group (Ground Arrival -> Rooftop Crown) ---
    const towerGroup = new THREE.Group();

    // Central structural core
    const coreGeo = registerGeo(new THREE.BoxGeometry(5.6, 23.2, 4.4));
    const coreMesh = new THREE.Mesh(coreGeo, slateBaseMat);
    coreMesh.position.y = 11.6 + 0.35;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    towerGroup.add(coreMesh);

    // TIER 01: Belgrave Hall Double-Height Lobby (y: 0.43 -> 4.4) & 17.5 ft Portico
    const lobbyGroup = new THREE.Group();
    const lobbyGlassGeo = registerGeo(new THREE.BoxGeometry(10.6, 3.6, 7.6));
    const lobbyGlass = new THREE.Mesh(lobbyGlassGeo, glazingMat);
    lobbyGlass.position.y = 2.25;
    lobbyGroup.add(lobbyGlass);

    const lobbyGlowGeo = registerGeo(new THREE.BoxGeometry(9.6, 3.0, 6.6));
    const lobbyGlow = new THREE.Mesh(lobbyGlowGeo, warmInteriorGlowMat);
    lobbyGlow.position.y = 2.25;
    lobbyGroup.add(lobbyGlow);

    // Sculpted travertine colonnade piers around Belgrave Hall
    const pierGeo = registerGeo(new THREE.BoxGeometry(0.55, 4.0, 0.75));
    for (let i = -2; i <= 2; i++) {
      const frontPier = new THREE.Mesh(pierGeo, travertineMat);
      frontPier.position.set(i * 2.4, 2.35, 3.9);
      frontPier.castShadow = true;
      lobbyGroup.add(frontPier);

      const backPier = new THREE.Mesh(pierGeo, travertineMat);
      backPier.position.set(i * 2.4, 2.35, -3.9);
      backPier.castShadow = true;
      lobbyGroup.add(backPier);
    }

    // Cantilevered 17.5 ft. sweeping drop-off portico canopy + champagne fascia
    const canopyGeo = registerGeo(new THREE.BoxGeometry(11.6, 0.36, 4.2));
    const canopy = new THREE.Mesh(canopyGeo, travertineMat);
    canopy.position.set(0, 3.55, 5.5);
    canopy.castShadow = true;
    lobbyGroup.add(canopy);

    const canopyTrimGeo = registerGeo(new THREE.BoxGeometry(11.7, 0.12, 4.3));
    const canopyTrim = new THREE.Mesh(canopyTrimGeo, champagneTrimMat);
    canopyTrim.position.set(0, 3.35, 5.5);
    lobbyGroup.add(canopyTrim);

    // Ancient 100-year-old bonsai centerpiece on arrival courtyard
    const bonsaiGroup = new THREE.Group();
    const planterPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.85, 0),
      new THREE.Vector2(1.0, 0.42),
      new THREE.Vector2(0.75, 0.42),
      new THREE.Vector2(0, 0.35),
    ];
    const planterGeo = registerGeo(new THREE.LatheGeometry(planterPoints, 20));
    const planterMesh = new THREE.Mesh(planterGeo, slateBaseMat);
    bonsaiGroup.add(planterMesh);

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0.28, 0.85, 0.12),
      new THREE.Vector3(-0.2, 1.35, -0.08),
      new THREE.Vector3(0.18, 1.75, 0.1),
    ]);
    const trunkGeo = registerGeo(new THREE.TubeGeometry(trunkCurve, 12, 0.12, 8, false));
    const trunkMesh = new THREE.Mesh(trunkGeo, bronzeMetalMat);
    bonsaiGroup.add(trunkMesh);

    const bonsaiCanopyGeo = registerGeo(new THREE.DodecahedronGeometry(0.55, 1));
    const bonsaiMat = new THREE.MeshStandardMaterial({
      color: 0x3b634b,
      roughness: 0.88,
      metalness: 0.02,
    });
    disposableMats.push(bonsaiMat);
    const padPositions: [number, number, number, number][] = [
      [0.24, 1.85, 0.12, 1.0],
      [-0.42, 1.45, -0.1, 0.78],
      [0.45, 1.25, 0.18, 0.7],
    ];
    for (const [bx, by, bz, bs] of padPositions) {
      const pad = new THREE.Mesh(bonsaiCanopyGeo, bonsaiMat);
      pad.position.set(bx, by, bz);
      pad.scale.set(bs * 1.3, bs * 0.55, bs * 1.1);
      bonsaiGroup.add(pad);
    }
    bonsaiGroup.position.set(-5.2, 0.43, 5.2);
    lobbyGroup.add(bonsaiGroup);

    towerGroup.add(lobbyGroup);

    // TIER 02 & TIER 03: Podium Banquet/Wellness + 5 Sovereign Full-Floor Sky Estates
    const podiumFloorHeights = [4.4, 6.2, 8.0, 9.8];
    const skyEstateFloorHeights = [11.6, 13.3, 15.0, 16.7, 18.4];

    const podiumSlabGeo = registerGeo(new THREE.BoxGeometry(11.4, 0.34, 8.4));
    const podiumGlassGeo = registerGeo(new THREE.BoxGeometry(10.0, 1.45, 7.2));
    const estateSlabGeo = registerGeo(new THREE.BoxGeometry(11.8, 0.32, 8.8));
    const estateGlassGeo = registerGeo(new THREE.BoxGeometry(10.2, 1.38, 7.4));
    const estateGlowGeo = registerGeo(new THREE.BoxGeometry(9.4, 0.25, 6.8));

    for (const y of podiumFloorHeights) {
      const slab = new THREE.Mesh(podiumSlabGeo, travertineMat);
      slab.position.y = y;
      slab.castShadow = true;
      slab.receiveShadow = true;
      towerGroup.add(slab);

      const glass = new THREE.Mesh(podiumGlassGeo, glazingMat);
      glass.position.y = y + 0.9;
      towerGroup.add(glass);
    }

    for (const [idx, y] of skyEstateFloorHeights.entries()) {
      const slab = new THREE.Mesh(estateSlabGeo, travertineMat);
      slab.position.y = y;
      slab.castShadow = true;
      slab.receiveShadow = true;
      towerGroup.add(slab);

      // Subtle architectural cantilevered terrace stagger on alternating floors
      const offsetZ = idx % 2 === 0 ? 0.28 : -0.22;
      const trim = new THREE.Mesh(
        registerGeo(new THREE.BoxGeometry(11.9, 0.08, 8.9)),
        champagneTrimMat
      );
      trim.position.set(0, y - 0.16, offsetZ * 0.5);
      towerGroup.add(trim);

      const glass = new THREE.Mesh(estateGlassGeo, glazingMat);
      glass.position.y = y + 0.85;
      towerGroup.add(glass);

      const warmBand = new THREE.Mesh(estateGlowGeo, warmInteriorGlowMat);
      warmBand.position.y = y + 1.35;
      towerGroup.add(warmBand);
    }

    // Instanced vertical bronze louvre fins wrapping lower & residential perimeter (> 20 instances)
    const finGeo = registerGeo(new THREE.BoxGeometry(0.11, 13.8, 0.32));
    const finPositions: Array<[number, number, number]> = [];
    for (let x = -5.2; x <= 5.21; x += 0.95) {
      finPositions.push([x, 11.4, 4.35]);
      finPositions.push([x, 11.4, -4.35]);
    }
    for (let z = -3.4; z <= 3.41; z += 1.1) {
      finPositions.push([5.8, 11.4, z]);
      finPositions.push([-5.8, 11.4, z]);
    }
    const finInstanced = new THREE.InstancedMesh(finGeo, bronzeMetalMat, finPositions.length);
    finPositions.forEach(([fx, fy, fz], i) => {
      _scratchMatrix.makeTranslation(fx, fy, fz);
      finInstanced.setMatrixAt(i, _scratchMatrix);
    });
    finInstanced.instanceMatrix.needsUpdate = true;
    finInstanced.computeBoundingSphere();
    finInstanced.castShadow = !isSoftwareGl;
    towerGroup.add(finInstanced);

    // Instanced biophilic terrace planter foliage across podium & sky estates (> 20 instances)
    const foliageGeo = registerGeo(new THREE.IcosahedronGeometry(0.42, 0));
    const foliageSpots: Array<[number, number, number]> = [];
    const allTerraceYs = [...podiumFloorHeights, ...skyEstateFloorHeights];
    for (const fy of allTerraceYs) {
      for (let x = -4.5; x <= 4.51; x += 1.5) {
        foliageSpots.push([x, fy + 0.32, 4.05]);
        foliageSpots.push([x, fy + 0.32, -4.05]);
      }
    }
    const foliageInstanced = new THREE.InstancedMesh(
      foliageGeo,
      foliageMat,
      foliageSpots.length
    );
    foliageSpots.forEach(([px, py, pz], i) => {
      const s = 0.85 + ((i * 37) % 30) / 100;
      _scratchMatrix.makeScale(s, s * 0.72, s);
      _scratchMatrix.setPosition(px, py, pz);
      foliageInstanced.setMatrixAt(i, _scratchMatrix);
      _scratchColor.setHSL(0.38 + ((i * 13) % 8) * 0.006, 0.34, 0.24 + ((i * 7) % 5) * 0.025);
      foliageInstanced.setColorAt(i, _scratchColor);
    });
    foliageInstanced.instanceMatrix.needsUpdate = true;
    if (foliageInstanced.instanceColor) foliageInstanced.instanceColor.needsUpdate = true;
    foliageInstanced.computeBoundingSphere();
    towerGroup.add(foliageInstanced);

    // TIER 04: Sprawling Sky Penthouse Recessed Volume (y: 19.8 -> 22.0)
    const penthouseSlab = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(10.8, 0.38, 8.0)),
      travertineMat
    );
    penthouseSlab.position.y = 20.1;
    penthouseSlab.castShadow = true;
    towerGroup.add(penthouseSlab);

    const penthouseVolume = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(9.2, 1.85, 6.4)),
      glazingMat
    );
    penthouseVolume.position.y = 21.15;
    towerGroup.add(penthouseVolume);

    const penthouseGlow = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(8.4, 1.35, 5.6)),
      warmInteriorGlowMat
    );
    penthouseGlow.position.y = 21.15;
    towerGroup.add(penthouseGlow);

    // TIER 05: Rooftop Sky Crown, Infinity Pool & Bronze Pergola (y: 22.2 -> 25.0)
    const roofDeckSlab = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(11.4, 0.42, 8.6)),
      travertineMat
    );
    roofDeckSlab.position.y = 22.25;
    roofDeckSlab.castShadow = true;
    roofDeckSlab.receiveShadow = true;
    towerGroup.add(roofDeckSlab);

    // Rooftop infinity pool water basin (facing sea/west edge)
    const poolBasin = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(7.2, 0.28, 3.0)),
      slateBaseMat
    );
    poolBasin.position.set(-1.1, 22.52, 2.2);
    towerGroup.add(poolBasin);

    const poolWater = new THREE.Mesh(
      registerGeo(new THREE.BoxGeometry(6.8, 0.14, 2.6)),
      infinityWaterMat
    );
    poolWater.position.set(-1.1, 22.64, 2.2);
    towerGroup.add(poolWater);

    // Signature architectural champagne-bronze pergola frame at +56m crown
    const pergolaBeamGeo = registerGeo(new THREE.BoxGeometry(10.6, 0.18, 0.24));
    for (let z = -3.6; z <= 3.61; z += 1.2) {
      const beam = new THREE.Mesh(pergolaBeamGeo, champagneTrimMat);
      beam.position.set(0, 24.85, z);
      towerGroup.add(beam);
    }
    const pergolaColumnGeo = registerGeo(new THREE.BoxGeometry(0.24, 2.6, 0.24));
    for (const cx of [-5.1, 5.1]) {
      for (const cz of [-3.6, 0, 3.6]) {
        const col = new THREE.Mesh(pergolaColumnGeo, bronzeMetalMat);
        col.position.set(cx, 23.6, cz);
        towerGroup.add(col);
      }
    }

    // Active tier luminous indicator frame (glides smoothly to active TOWER_ZONE Y band)
    const haloGeo = registerGeo(new THREE.BoxGeometry(12.6, 0.16, 9.6));
    const activeTierHalo = new THREE.Mesh(haloGeo, activeTierHaloMat);
    const initialTier =
      TOWER_MASSING_TIERS.find((t) => t.zoneId === activeZoneRef.current) ??
      TOWER_MASSING_TIERS[0];
    let currentHaloY = initialTier.focusY;
    activeTierHalo.position.y = currentHaloY;
    towerGroup.add(activeTierHalo);

    scene.add(towerGroup);

    // Invisible proxy hitboxes on Layer 1 for fast pointer raycasting across the 5 architectural tiers
    const hitProxies: THREE.Mesh[] = [];
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    disposableMats.push(hitMat);
    for (const tier of TOWER_MASSING_TIERS) {
      const bandHeight = tier.yEnd - tier.yStart;
      const proxyGeo = registerGeo(new THREE.BoxGeometry(12.8, bandHeight, 9.8));
      const proxy = new THREE.Mesh(proxyGeo, hitMat);
      proxy.position.y = tier.yStart + bandHeight / 2;
      proxy.layers.set(1);
      proxy.userData.zoneId = tier.zoneId;
      scene.add(proxy);
      hitProxies.push(proxy);
    }

    // OrbitControls + on-demand coalesced rendering loop (software-WebGL safe)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 12.2, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minPolarAngle = 0.15;
    controls.minDistance = 14;
    controls.maxDistance = 68;
    controls.enablePan = false;

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;
    let lastTimestamp = performance.now();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
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

        let needsMoreFrames = false;

        // Exponential damping for active tier indicator halo
        const targetTier =
          TOWER_MASSING_TIERS.find((t) => t.zoneId === activeZoneRef.current) ??
          TOWER_MASSING_TIERS[0];
        const haloDiff = Math.abs(currentHaloY - targetTier.focusY);
        if (haloDiff > 0.015) {
          currentHaloY = THREE.MathUtils.damp(currentHaloY, targetTier.focusY, 9, delta);
          activeTierHalo.position.y = currentHaloY;
          needsMoreFrames = true;
        } else {
          currentHaloY = targetTier.focusY;
          activeTierHalo.position.y = currentHaloY;
        }

        // Exponentially damped scripted camera preset transitions (cancelled on user interaction)
        if (transitionTargetRef.current.active) {
          const factor = 1 - Math.exp(-6.5 * delta);
          _scratchPos.copy(transitionTargetRef.current.pos);
          _scratchTarget.copy(transitionTargetRef.current.lookAt);

          camera.position.lerp(_scratchPos, factor);
          controls.target.lerp(_scratchTarget, factor);

          if (
            camera.position.distanceTo(_scratchPos) < 0.08 &&
            controls.target.distanceTo(_scratchTarget) < 0.08
          ) {
            camera.position.copy(_scratchPos);
            controls.target.copy(_scratchTarget);
            transitionTargetRef.current.active = false;
          } else {
            needsMoreFrames = true;
          }
        }

        const controlsChanged = controls.update();
        if (controlsChanged) needsMoreFrames = true;

        renderer.render(scene, camera);
        setRenderReady(true);

        const done = () => {
          renderBusy = false;
          if (renderDirty || needsMoreFrames) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestSceneRenderRef.current = requestRender;

    const onControlsStart = () => {
      transitionTargetRef.current.active = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    // Pointer click raycast onto architectural tier proxies
    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Dragging orbit, not clicking
      const rect = renderer.domElement.getBoundingClientRect();
      _scratchPointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _scratchPointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_scratchPointer, camera);
      const hits = raycaster.intersectObjects(hitProxies, false);
      if (hits.length > 0) {
        const hitZoneId = hits[0].object.userData.zoneId as string | undefined;
        if (hitZoneId) {
          onSelectZoneRef.current(hitZoneId);
          requestRender();
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 640;
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
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);

      for (const g of disposableGeos) g.dispose();
      for (const m of disposableMats) m.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
      contactShadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
      requestSceneRenderRef.current = null;
    };
  }, []);

  // Re-trigger render whenever activeZoneId updates externally (hover/click on list)
  useEffect(() => {
    requestSceneRenderRef.current?.();
  }, [activeZoneId]);

  const activeZone = getTowerZoneById(activeZoneId);

  return (
    <div
      data-testid="tower-massing-3d"
      data-ready={renderReady ? 'true' : 'false'}
      data-active-tier={activeZone.tierCode}
      className={`relative overflow-hidden border border-[#cbb389]/25 bg-[#132b30] ${
        isFullscreen ? 'h-full w-full' : 'aspect-[10/14] w-full max-w-[460px] mx-auto'
      }`}
    >
      {/* Dedicated isolated WebGL mount node outside sibling React HUD */}
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Minimal top-left architectural readout (solid rgba, zero backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
        <div className="border border-[#cbb389]/35 bg-[#0e2226]/90 px-3 py-2">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#cbb389]">
            {activeZone.tierCode} · {(TOWER_TOTAL_WORLD_HEIGHT * 2.24).toFixed(0)}M TOWER
          </div>
          <div className="mt-0.5 font-serif text-sm sm:text-base text-[#f4efe6]">
            {activeZone.title}
          </div>
        </div>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit 3D full viewport' : 'Open 3D full viewport'}
            className="pointer-events-auto inline-flex h-10 items-center gap-2 border border-[#cbb389]/45 bg-[#0e2226]/95 px-3 text-[11px] font-medium tracking-[0.14em] uppercase text-[#f4efe6] transition-colors hover:bg-[#cbb389] hover:text-[#0e2226]"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Exit Full View</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Full 3D</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Mid-Screen Occlusion, No backdrop-blur) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          aria-expanded={!dockCollapsed}
          className="pointer-events-auto mb-1.5 inline-flex h-7 items-center gap-1.5 border border-[#cbb389]/40 bg-[#0e2226]/95 px-3 font-mono text-[10px] tracking-[0.16em] uppercase text-[#cbb389] transition-colors hover:bg-[#19363c]"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3 w-3" strokeWidth={1.5} />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
              <span>Hide Controls</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex w-full max-w-[740px] flex-wrap items-center justify-between gap-2 border border-[#cbb389]/35 bg-[#0e2226]/94 px-3 py-2">
            {/* Camera Framing Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'crown', label: 'Sky Crown' },
                  { id: 'tier-focus', label: 'Focus Tier' },
                  { id: 'arrival', label: 'Belgrave Hall' },
                ] as const
              ).map((item) => {
                const selected = cameraPreset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCameraPreset(item.id)}
                    className={`h-8 px-2.5 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors ${
                      selected
                        ? 'bg-[#cbb389] text-[#0e2226]'
                        : 'border border-[#f4efe6]/18 bg-[#132b30] text-[#f4efe6]/85 hover:border-[#cbb389]/60'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Tier Stepper */}
            <div className="flex flex-wrap items-center gap-1">
              {TOWER_ZONES.map((zone) => {
                const selected = zone.id === activeZoneId;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      onSelectZone(zone.id);
                      setCameraPreset('tier-focus');
                    }}
                    title={zone.title}
                    className={`h-8 px-2 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                      selected
                        ? 'border border-[#cbb389] bg-[#19363c] text-[#cbb389]'
                        : 'border border-[#f4efe6]/14 bg-[#132b30]/70 text-[#c8c4bc] hover:text-[#f4efe6]'
                    }`}
                  >
                    {zone.tierCode.replace('TIER ', 'T')}
                  </button>
                );
              })}

              <button
                type="button"
                aria-label="Reset camera view"
                onClick={() => setCameraPreset('overview')}
                className="inline-flex h-8 w-8 items-center justify-center border border-[#f4efe6]/18 bg-[#132b30] text-[#c8c4bc] transition-colors hover:border-[#cbb389] hover:text-[#cbb389]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
