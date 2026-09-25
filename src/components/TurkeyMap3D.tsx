import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { 
  RotateCcw, 
  Compass, 
  MapPin
} from 'lucide-react';
import defaultGeoData from '../data/nuts3.geo.json';
import { PROVINCE_CODES, REGIONS } from '../data/regions';
import { getProvinceExport } from '../data/tradeData';
import { getProvinceOSB } from '../data/osbData';
import { getWomenShare } from '../data/womenTradeData';
import { getProvinceOverview } from '../data/demographyData';

export type MapMetricType = 'export' | 'osb' | 'women' | 'population' | 'gdp';
export type MapStyleType = 'earth' | 'cyber' | 'hybrid';

interface TurkeyMap3DProps {
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
  activeMetric: MapMetricType;
  onMetricChange?: (metric: MapMetricType) => void;
}

// Helper to project lon/lat to 3D world coordinates
const CENTER_LON = 35.24;
const CENTER_LAT = 38.96;
const SCALE_X = 2.8;
const SCALE_Z = 3.6;

// Geographic bounding box for Turkey world coordinates
const W_MIN = -26.85;
const W_MAX = 26.85;
const Z_MIN = -11.35; // North (Sinop)
const Z_MAX = 11.35;  // South (Hatay)

function lonLatToWorld(lon: number, lat: number): [number, number] {
  const x = (lon - CENTER_LON) * SCALE_X;
  const z = -(lat - CENTER_LAT) * SCALE_Z;
  return [x, z];
}

// Pure function: calculate province metric without depending on React closures
export function computeProvinceMetric(code: string, metric: MapMetricType): number {
  switch (metric) {
    case 'export':
      return getProvinceExport(code, 3); // 2025
    case 'osb':
      return getProvinceOSB(code).count;
    case 'women':
      return getWomenShare(code, 7);
    case 'population':
      return getProvinceOverview(code).population;
    case 'gdp':
      return getProvinceOverview(code).gdpPerCapitaUsd;
    default:
      return getProvinceExport(code, 3);
  }
}

// Precompute centroids for all 81 provinces
const PROVINCE_CENTROIDS: Record<string, [number, number]> = {};
if (defaultGeoData && (defaultGeoData as any).features) {
  (defaultGeoData as any).features.forEach((f: any) => {
    const code = String(f.properties.duzeyKodu);
    const coords = f.geometry.type === 'Polygon' 
      ? f.geometry.coordinates[0] 
      : f.geometry.coordinates[0][0];
    if (coords && coords.length > 0) {
      let sumLon = 0, sumLat = 0;
      coords.forEach((pt: number[]) => { sumLon += pt[0]; sumLat += pt[1]; });
      PROVINCE_CENTROIDS[code] = [sumLon / coords.length, sumLat / coords.length];
    }
  });
}

function getCategoryLabel(metric: MapMetricType): string {
  switch (metric) {
    case 'export': return 'İhracat Hacmi';
    case 'osb': return 'Sanayi Bölgesi';
    case 'women': return 'Kadın İhracat';
    case 'population': return 'Toplam Nüfus';
    case 'gdp': return 'GSYH / Kişi';
  }
}

function formatMetricDisplay(metric: MapMetricType, val: number): string {
  if (metric === 'export') {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)} Milyar`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)} Milyon`;
    return `$${val.toLocaleString('tr-TR')}`;
  }
  if (metric === 'osb') return `${val} OSB Bölgesi`;
  if (metric === 'women') return `%${val.toFixed(1)} Kadın Payı`;
  if (metric === 'population') {
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M Kişi`;
    return `${(val / 1e3).toFixed(0)}K Kişi`;
  }
  if (metric === 'gdp') return `$${val.toLocaleString('tr-TR')} GSYH`;
  return String(val);
}

function formatMetricShort(metric: MapMetricType, val: number): string {
  if (metric === 'export') {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString('tr-TR')}`;
  }
  if (metric === 'osb') return `${val} OSB`;
  if (metric === 'women') return `%${val.toFixed(1)}`;
  if (metric === 'population') {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    return `${(val / 1e3).toFixed(0)}K`;
  }
  if (metric === 'gdp') return `$${val.toLocaleString('tr-TR')}`;
  return String(val);
}

// Generate Premium Futuristic Command Center 3D Billboard Tag (512x160 Hi-Res Canvas)
function createCyberBillboardTexture(
  rank: number,
  name: string,
  metricText: string,
  categoryLabel: string,
  colorScheme: 'gold' | 'cyan' | 'emerald' | 'blue'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const theme = {
    gold: {
      primary: '#fbbf24',
      badgeBg: '#fbbf24',
      badgeText: '#0a0e1a',
      border: 'rgba(251, 191, 36, 0.90)',
      glow: 'rgba(251, 191, 36, 0.45)',
      bg: 'rgba(6, 17, 36, 0.94)'
    },
    cyan: {
      primary: '#00f2fe',
      badgeBg: '#00f2fe',
      badgeText: '#030814',
      border: 'rgba(0, 242, 254, 0.90)',
      glow: 'rgba(0, 242, 254, 0.45)',
      bg: 'rgba(4, 15, 34, 0.94)'
    },
    emerald: {
      primary: '#05ffa1',
      badgeBg: '#05ffa1',
      badgeText: '#030814',
      border: 'rgba(5, 255, 161, 0.90)',
      glow: 'rgba(5, 255, 161, 0.45)',
      bg: 'rgba(3, 18, 30, 0.94)'
    },
    blue: {
      primary: '#38bdf8',
      badgeBg: '#38bdf8',
      badgeText: '#030814',
      border: 'rgba(56, 189, 248, 0.80)',
      glow: 'rgba(56, 189, 248, 0.35)',
      bg: 'rgba(4, 15, 34, 0.92)'
    }
  }[colorScheme];

  const w = canvas.width;
  const h = canvas.height;
  const pad = 10;

  // 1. Shadowed Card Background
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = theme.bg;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 8);
  ctx.fill();
  ctx.restore();

  // 2. High-Tech Dual Border
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 8);
  ctx.stroke();

  // 3. Cyber HUD Corner Brackets
  const brk = 14;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  // Top-Left
  ctx.beginPath();
  ctx.moveTo(pad - 1, pad + brk);
  ctx.lineTo(pad - 1, pad - 1);
  ctx.lineTo(pad + brk, pad - 1);
  ctx.stroke();
  // Top-Right
  ctx.beginPath();
  ctx.moveTo(w - pad + 1 - brk, pad - 1);
  ctx.lineTo(w - pad + 1, pad - 1);
  ctx.lineTo(w - pad + 1, pad + brk);
  ctx.stroke();
  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(pad - 1, h - pad - brk);
  ctx.lineTo(pad - 1, h - pad + 1);
  ctx.lineTo(pad + brk, h - pad + 1);
  ctx.stroke();
  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(w - pad + 1 - brk, h - pad + 1);
  ctx.lineTo(w - pad + 1, h - pad + 1);
  ctx.lineTo(w - pad + 1, h - pad - brk);
  ctx.stroke();

  // 4. Header Bar
  const rankStr = rank < 10 ? `#0${rank}` : `#${rank}`;
  const badgeW = 68;
  const badgeH = 34;
  const badgeX = pad + 16;
  const badgeY = pad + 14;

  // Rank Pill
  ctx.fillStyle = theme.badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
  ctx.fill();

  ctx.fillStyle = theme.badgeText;
  ctx.font = 'bold 21px "Orbitron", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rankStr, badgeX + badgeW / 2, badgeY + badgeH / 2);

  // City Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), badgeX + badgeW + 14, badgeY + badgeH / 2);

  // Category Tag on right
  ctx.fillStyle = theme.primary;
  ctx.font = 'bold 15px "Rajdhani", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(categoryLabel.toUpperCase(), w - pad - 18, badgeY + badgeH / 2);

  // 5. Tech Divider Line
  const divY = badgeY + badgeH + 12;
  const lineGrad = ctx.createLinearGradient(pad + 16, divY, w - pad - 16, divY);
  lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  lineGrad.addColorStop(0.3, theme.border);
  lineGrad.addColorStop(0.7, theme.border);
  lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad + 16, divY);
  ctx.lineTo(w - pad - 16, divY);
  ctx.stroke();

  // 6. Centered, Balanced Value
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Orbitron", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  ctx.fillText(metricText, w / 2, divY + 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Generate photorealistic Google Earth style topographic canvas texture
function createSatelliteReliefTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background deep base
  ctx.fillStyle = '#1c261e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Natural landscape base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0.0, '#1a3c1e'); // Northern Black Sea coastal forest belt
  grad.addColorStop(0.2, '#2d4d28'); // Pontic mountain foothills
  grad.addColorStop(0.45, '#5c4d36'); // Central Anatolian plateau steppe
  grad.addColorStop(0.65, '#6a563c'); // South Central hills
  grad.addColorStop(0.85, '#3b4c2b'); // Taurus mountain slopes
  grad.addColorStop(1.0, '#1c341b'); // Mediterranean coastal green
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Procedural mountain ranges & rugged relief topography
  for (let i = 0; i < 450; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    const rrad = 12 + Math.random() * 50;

    const isNorthChain = ry < 170;
    const isSouthChain = ry > 310;
    const isEastHighlands = rx > 640;

    const opacity = (isNorthChain || isSouthChain || isEastHighlands)
      ? 0.4 + Math.random() * 0.45
      : 0.15 + Math.random() * 0.25;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate((Math.random() - 0.5) * 1.8);
    const mGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rrad);

    if (isEastHighlands && rx > 740 && ry > 80 && ry < 340 && Math.random() > 0.45) {
      mGrad.addColorStop(0, `rgba(240, 248, 255, ${opacity * 1.4})`);
      mGrad.addColorStop(0.35, `rgba(130, 115, 100, ${opacity})`);
      mGrad.addColorStop(1, 'transparent');
    } else if (isNorthChain) {
      mGrad.addColorStop(0, `rgba(20, 50, 24, ${opacity})`);
      mGrad.addColorStop(0.5, `rgba(45, 80, 40, ${opacity * 0.7})`);
      mGrad.addColorStop(1, 'transparent');
    } else {
      mGrad.addColorStop(0, `rgba(85, 70, 52, ${opacity})`);
      mGrad.addColorStop(0.5, `rgba(55, 65, 45, ${opacity * 0.8})`);
      mGrad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rrad, rrad * (0.3 + Math.random() * 0.4), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lake Van (Eastern Anatolia)
  ctx.save();
  const vanGrad = ctx.createRadialGradient(865, 275, 4, 865, 275, 36);
  vanGrad.addColorStop(0, '#0f415c');
  vanGrad.addColorStop(0.8, '#145c82');
  vanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vanGrad;
  ctx.beginPath();
  ctx.ellipse(865, 275, 36, 24, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lake Tuz (Central Anatolia)
  ctx.save();
  const tuzGrad = ctx.createRadialGradient(440, 250, 4, 440, 250, 28);
  tuzGrad.addColorStop(0, '#c2d2d9');
  tuzGrad.addColorStop(0.7, '#8aa8b6');
  tuzGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = tuzGrad;
  ctx.beginPath();
  ctx.ellipse(440, 250, 28, 18, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const TurkeyMap3D: React.FC<TurkeyMap3DProps> = ({
  selectedProvinceCode,
  onSelectProvince,
  activeMetric,
  onMetricChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('earth');
  const [hoveredInfo, setHoveredInfo] = useState<{
    code: string;
    name: string;
    value: number;
    agency?: string;
    x: number;
    y: number;
  } | null>(null);

  // References to keep Three.js scene instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const provinceMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const selectedMeshCodeRef = useRef<string>(selectedProvinceCode);
  selectedMeshCodeRef.current = selectedProvinceCode;
  const activeMetricRef = useRef<MapMetricType>(activeMetric);
  activeMetricRef.current = activeMetric;

  // External update handlers
  const updateBaseBeaconsRef = useRef<((metric: MapMetricType, selCode: string) => void) | null>(null);
  const updateHoverBeaconRef = useRef<((code: string | null) => void) | null>(null);

  // Find min, max, and selected province rank using pure computeProvinceMetric
  const { minVal, maxVal, selectedRank } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const list: { code: string; val: number }[] = [];
    for (let i = 1; i <= 81; i++) {
      const c = String(i);
      const v = computeProvinceMetric(c, activeMetric);
      if (v < min) min = v;
      if (v > max) max = v;
      list.push({ code: c, val: v });
    }
    list.sort((a, b) => b.val - a.val);
    const sIdx = list.findIndex((item) => item.code === selectedProvinceCode);
    return { 
      minVal: min === Infinity ? 0 : min, 
      maxVal: max === -Infinity ? 100 : max,
      selectedRank: sIdx !== -1 ? sIdx + 1 : 1
    };
  }, [activeMetric, selectedProvinceCode]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030814);
    scene.fog = new THREE.FogExp2(0x030814, 0.009);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 38, 48); // Perspective aerial view

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Full 3D OrbitControls (Left-Click: Rotate, Right-Click: Pan, Wheel: Zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 14;
    controls.maxDistance = 130;
    controls.maxPolarAngle = Math.PI / 2.05;

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(30, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00f2fe, 0.8);
    rimLight.position.set(-30, 20, -30);
    scene.add(rimLight);

    // 4. Perspective 3D Grid Plane
    const gridHelper = new THREE.GridHelper(160, 32, 0x00f2fe, 0x113355);
    gridHelper.position.y = -0.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    const subGrid = new THREE.GridHelper(160, 64, 0x00e1d9, 0x071b30);
    subGrid.position.y = -0.52;
    (subGrid.material as THREE.Material).transparent = true;
    (subGrid.material as THREE.Material).opacity = 0.2;
    scene.add(subGrid);

    // 5. Starfield / Floating Dust Particles
    const particleCount = 650;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 180;
      particlePositions[i * 3 + 1] = Math.random() * 50 - 5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x88ddff,
      size: 0.6,
      transparent: true,
      opacity: 0.65
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Extruded 3D Provinces Geometry from nuts3.geo.json
    const satelliteTexture = createSatelliteReliefTexture();
    const provinceMeshes = new Map<string, THREE.Mesh[]>();
    provinceMeshesRef.current = provinceMeshes;

    const topMaterialsCache = new Map<string, THREE.MeshStandardMaterial>();

    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2434,
      metalness: 0.75,
      roughness: 0.35,
      shadowSide: THREE.DoubleSide
    });

    const EXTRUDE_DEPTH = 1.4;

    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    if (defaultGeoData && (defaultGeoData as any).features) {
      (defaultGeoData as any).features.forEach((feature: any) => {
        const code = String(feature.properties.duzeyKodu);
        const name = PROVINCE_CODES[code] || feature.properties.name;
        const geomType = feature.geometry.type;
        const coordinates = feature.geometry.coordinates;

        const polyRingsList: number[][][][] = geomType === 'Polygon' 
          ? [coordinates] 
          : coordinates;

        const meshesForProvince: THREE.Mesh[] = [];

        polyRingsList.forEach((polyRings: number[][][]) => {
          if (!polyRings || polyRings.length === 0) return;

          const outerCoords = polyRings[0];
          const shape = new THREE.Shape();

          outerCoords.forEach((pt: number[], ptIdx: number) => {
            const [wx, wz] = lonLatToWorld(pt[0], pt[1]);
            if (ptIdx === 0) {
              shape.moveTo(wx, -wz);
            } else {
              shape.lineTo(wx, -wz);
            }
          });

          for (let h = 1; h < polyRings.length; h++) {
            const holeCoords = polyRings[h];
            const holePath = new THREE.Path();
            holeCoords.forEach((pt: number[], ptIdx: number) => {
              const [wx, wz] = lonLatToWorld(pt[0], pt[1]);
              if (ptIdx === 0) holePath.moveTo(wx, -wz);
              else holePath.lineTo(wx, -wz);
            });
            shape.holes.push(holePath);
          }

          const extrudeSettings: THREE.ExtrudeGeometryOptions = {
            depth: EXTRUDE_DEPTH,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.05,
            bevelThickness: 0.05
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          // Rotate by -Math.PI / 2 so positive Y extrudes UPWARDS and Z matches world wz exactly
          geometry.rotateX(-Math.PI / 2);

          // Calibrate photorealistic geographic UV coordinates matching Turkey satellite terrain
          const pos = geometry.attributes.position;
          const uvs = geometry.attributes.uv;
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            const u = (vx - W_MIN) / (W_MAX - W_MIN);
            const v = (Z_MAX - vz) / (Z_MAX - Z_MIN);
            uvs.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
          }
          uvs.needsUpdate = true;
          geometry.computeVertexNormals();

          const topMat = new THREE.MeshStandardMaterial({
            map: satelliteTexture,
            color: 0xffffff,
            roughness: 0.55,
            metalness: 0.2
          });
          topMaterialsCache.set(code, topMat);

          const mesh = new THREE.Mesh(geometry, [topMat, sideMaterial]);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { code, name, topMat };

          mapGroup.add(mesh);
          meshesForProvince.push(mesh);

          // Crisp 3D border line along province top perimeter
          const linePoints: THREE.Vector3[] = outerCoords.map((pt) => {
            const [wx, wz] = lonLatToWorld(pt[0], pt[1]);
            return new THREE.Vector3(wx, EXTRUDE_DEPTH + 0.08, wz);
          });
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x99ddff, transparent: true, opacity: 0.65 });
          const borderLine = new THREE.Line(lineGeo, lineMat);
          mapGroup.add(borderLine);
        });

        provinceMeshes.set(code, meshesForProvince);
      });
    }

    // 7. Dynamic Persistent Beacons & Separate Hover Beacon
    const baseBeaconsGroup = new THREE.Group();
    scene.add(baseBeaconsGroup);

    const dynamicArcsGroup = new THREE.Group();
    scene.add(dynamicArcsGroup);

    // Map to preserve existing base beacons (NO JUMPING when hovering!)
    const activeBaseBeaconsMap = new Map<string, {
      group: THREE.Group;
      sprite: THREE.Sprite;
      rank: number;
      role: 'gold' | 'cyan' | 'blue';
      metric: MapMetricType;
    }>();

    // Dedicated separate Hover Beacon instance
    const hoverBeaconGroup = new THREE.Group();
    hoverBeaconGroup.visible = false;
    scene.add(hoverBeaconGroup);

    // Build hover beacon visual components once
    const hoverBeamGeo = new THREE.CylinderGeometry(0.12, 0.38, 7.4, 16);
    const hoverBeamMat = new THREE.MeshBasicMaterial({ color: 0x05ffa1, transparent: true, opacity: 0.75 });
    const hoverBeamMesh = new THREE.Mesh(hoverBeamGeo, hoverBeamMat);
    hoverBeamMesh.position.set(0, 3.7, 0);
    hoverBeaconGroup.add(hoverBeamMesh);

    const hoverDot = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hoverDot.position.set(0, 0.1, 0);
    hoverBeaconGroup.add(hoverDot);

    // Static clean ground ring (NO expanding/shrinking pulse!)
    const hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.4, 32),
      new THREE.MeshBasicMaterial({ color: 0x05ffa1, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.set(0, 0.08, 0);
    hoverBeaconGroup.add(hoverRing);

    const hoverSpriteMat = new THREE.SpriteMaterial({ transparent: true });
    const hoverSprite = new THREE.Sprite(hoverSpriteMat);
    hoverSprite.position.set(0, 8.0, 0);
    hoverBeaconGroup.add(hoverSprite);
    hoverBeaconGroup.userData = { targetScaleY: 1.0, isBeacon: true, sprite: hoverSprite };

    // Function to build a single 3D beacon item
    const createBeaconObject = (
      code: string,
      rank: number,
      name: string,
      val: number,
      metric: MapMetricType,
      role: 'gold' | 'cyan' | 'blue'
    ) => {
      const coords = PROVINCE_CENTROIDS[code];
      if (!coords) return null;
      const [hx, hz] = lonLatToWorld(coords[0], coords[1]);

      const group = new THREE.Group();
      group.position.set(hx, EXTRUDE_DEPTH, hz);
      group.scale.set(1, 0.05, 1); // Animate from ground level ONCE
      group.userData = { targetScaleY: 1.0, isBeacon: true, code };

      const mainColor = role === 'gold' ? 0xfbbf24 : role === 'cyan' ? 0x00f2fe : 0x38bdf8;

      // Vertical tapered beam
      const beamGeo = new THREE.CylinderGeometry(0.1, 0.35, 7.2, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: mainColor,
        transparent: true,
        opacity: role === 'gold' ? 0.75 : 0.45
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(0, 3.6, 0);
      group.add(beamMesh);

      // Base glowing dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      dot.position.set(0, 0.1, 0);
      group.add(dot);

      // Static clean base ring on terrain (NO pulsating scale!)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 1.3, 32),
        new THREE.MeshBasicMaterial({
          color: mainColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.08, 0);
      group.add(ring);

      // High-resolution premium billboard tag
      const texture = createCyberBillboardTexture(
        rank,
        name,
        formatMetricDisplay(metric, val),
        getCategoryLabel(metric),
        role
      );
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(5.2, 1.62, 1);
      sprite.position.set(0, 7.8, 0);
      group.add(sprite);

      return { group, sprite, rank, role, metric };
    };

    // Update Base Beacons (Category Top 5 + Selected Province) WITHOUT clearing existing ones
    const updateBaseBeacons = (metric: MapMetricType, selCode: string) => {
      // 1. Rank provinces for the PASSED metric strictly using pure computeProvinceMetric
      const ranked = Object.keys(PROVINCE_CODES).map((code) => ({
        code,
        name: PROVINCE_CODES[code],
        value: computeProvinceMetric(code, metric)
      })).sort((a, b) => b.value - a.value);

      const rankMap = new Map<string, number>();
      ranked.forEach((item, idx) => rankMap.set(item.code, idx + 1));

      // Determine targets for this metric: Top 5 leaders + Selected
      const targetMap = new Map<string, {
        code: string;
        name: string;
        value: number;
        rank: number;
        role: 'gold' | 'cyan' | 'blue';
      }>();

      ranked.slice(0, 5).forEach((item) => {
        const rank = rankMap.get(item.code) || 1;
        const isSel = item.code === selCode;
        targetMap.set(item.code, {
          ...item,
          rank,
          role: isSel ? 'gold' : rank === 1 ? 'cyan' : 'blue'
        });
      });

      if (!targetMap.has(selCode)) {
        const sItem = ranked.find((r) => r.code === selCode);
        if (sItem) {
          targetMap.set(selCode, {
            ...sItem,
            rank: rankMap.get(selCode) || 1,
            role: 'gold'
          });
        }
      }

      // 2. Remove beacons that are no longer in target
      Array.from(activeBaseBeaconsMap.keys()).forEach((code) => {
        if (!targetMap.has(code)) {
          const entry = activeBaseBeaconsMap.get(code);
          if (entry) {
            baseBeaconsGroup.remove(entry.group);
            entry.sprite.material.dispose();
          }
          activeBaseBeaconsMap.delete(code);
        }
      });

      // 3. Add or update target beacons
      targetMap.forEach((item, code) => {
        const existing = activeBaseBeaconsMap.get(code);
        if (existing) {
          // If already existing, DO NOT RE-ANIMATE from ground! Keep stable!
          // Update texture only if metric, rank, or role changed
          if (existing.metric !== metric || existing.role !== item.role || existing.rank !== item.rank) {
            existing.sprite.material.map?.dispose();
            existing.sprite.material.map = createCyberBillboardTexture(
              item.rank,
              item.name,
              formatMetricDisplay(metric, item.value),
              getCategoryLabel(metric),
              item.role
            );
            existing.sprite.material.needsUpdate = true;
            existing.role = item.role;
            existing.rank = item.rank;
            existing.metric = metric;
          }
        } else {
          // New beacon: smoothly rises once from ground
          const newEntry = createBeaconObject(
            code,
            item.rank,
            item.name,
            item.value,
            metric,
            item.role
          );
          if (newEntry) {
            baseBeaconsGroup.add(newEntry.group);
            activeBaseBeaconsMap.set(code, newEntry);
          }
        }
      });

      // 4. Update flight arcs between Rank 1 and other leaders
      while (dynamicArcsGroup.children.length > 0) {
        dynamicArcsGroup.remove(dynamicArcsGroup.children[0]);
      }

      const displayList = Array.from(targetMap.values());
      if (displayList.length >= 2) {
        const top1Coords = PROVINCE_CENTROIDS[displayList[0].code];
        if (top1Coords) {
          const [top1X, top1Z] = lonLatToWorld(top1Coords[0], top1Coords[1]);

          displayList.slice(1).forEach((dest) => {
            const destCoords = PROVINCE_CENTROIDS[dest.code];
            if (!destCoords) return;
            const [destX, destZ] = lonLatToWorld(destCoords[0], destCoords[1]);

            const midX = (top1X + destX) / 2;
            const midZ = (top1Z + destZ) / 2;
            const dist = Math.hypot(destX - top1X, destZ - top1Z);
            const arcHeight = Math.min(13, dist * 0.45) + EXTRUDE_DEPTH;

            const curve = new THREE.QuadraticBezierCurve3(
              new THREE.Vector3(top1X, EXTRUDE_DEPTH + 0.3, top1Z),
              new THREE.Vector3(midX, arcHeight, midZ),
              new THREE.Vector3(destX, EXTRUDE_DEPTH + 0.3, destZ)
            );

            const arcPoints = curve.getPoints(45);
            const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
            const arcMat = new THREE.LineDashedMaterial({
              color: 0x00f2fe,
              dashSize: 1.2,
              gapSize: 0.8,
              transparent: true,
              opacity: 0.65
            });
            const line = new THREE.Line(arcGeo, arcMat);
            line.computeLineDistances();
            dynamicArcsGroup.add(line);
          });
        }
      }
    };

    // Update Hover Beacon (Only if hovered province is NOT already in Top 5 or Selected)
    const updateHoverBeacon = (code: string | null) => {
      if (!code || activeBaseBeaconsMap.has(code)) {
        // If province is already in top 5 or selected, do NOT recreate or bounce it!
        hoverBeaconGroup.visible = false;
        return;
      }

      const coords = PROVINCE_CENTROIDS[code];
      if (!coords) {
        hoverBeaconGroup.visible = false;
        return;
      }

      const [hx, hz] = lonLatToWorld(coords[0], coords[1]);
      hoverBeaconGroup.position.set(hx, EXTRUDE_DEPTH, hz);
      hoverBeaconGroup.scale.set(1, 0.05, 1);
      hoverBeaconGroup.visible = true;

      // Compute rank of hovered province strictly for current metric
      const currentMetric = activeMetricRef.current;
      const ranked = Object.keys(PROVINCE_CODES).map((c) => ({
        code: c,
        value: computeProvinceMetric(c, currentMetric)
      })).sort((a, b) => b.value - a.value);
      const rankIdx = ranked.findIndex((r) => r.code === code);
      const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
      const name = PROVINCE_CODES[code] || 'İL';
      const val = computeProvinceMetric(code, currentMetric);

      // Generate emerald tag for hover
      hoverSprite.material.map?.dispose();
      hoverSprite.material.map = createCyberBillboardTexture(
        rank,
        name,
        formatMetricDisplay(currentMetric, val),
        getCategoryLabel(currentMetric),
        'emerald'
      );
      hoverSprite.material.needsUpdate = true;
    };

    updateBaseBeaconsRef.current = updateBaseBeacons;
    updateHoverBeaconRef.current = updateHoverBeacon;

    // Initial build
    updateBaseBeacons(activeMetricRef.current, selectedMeshCodeRef.current);

    // 8. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredMesh: THREE.Mesh | null = null;

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(mapGroup.children);

      const hitMesh = intersects.find((hit) => hit.object.userData?.code)?.object as THREE.Mesh | undefined;

      if (hitMesh !== hoveredMesh) {
        // Reset old hover
        if (hoveredMesh && hoveredMesh.userData?.topMat) {
          const isSelected = hoveredMesh.userData.code === selectedMeshCodeRef.current;
          hoveredMesh.userData.topMat.emissive.setHex(isSelected ? 0x664400 : 0x000000);
        }

        // Apply new hover
        if (hitMesh && hitMesh.userData?.topMat) {
          hitMesh.userData.topMat.emissive.setHex(0x004466);
          const code = hitMesh.userData.code;
          const name = hitMesh.userData.name;
          const reg = REGIONS.find((r) => r.provinces.some((p) => p.toLowerCase() === name.toLowerCase()));

          setHoveredInfo({
            code,
            name,
            value: computeProvinceMetric(code, activeMetricRef.current),
            agency: reg?.shortCode,
            x: event.clientX,
            y: event.clientY
          });

          // Show hover beacon only if not already active in top 5 or selected
          if (updateHoverBeaconRef.current) {
            updateHoverBeaconRef.current(code);
          }
        } else {
          setHoveredInfo(null);
          if (updateHoverBeaconRef.current) {
            updateHoverBeaconRef.current(null);
          }
        }
        hoveredMesh = hitMesh || null;
      }
    };

    const onClick = (event: MouseEvent) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(mapGroup.children);
      const hitMesh = intersects.find((hit) => hit.object.userData?.code)?.object as THREE.Mesh | undefined;
      if (hitMesh && hitMesh.userData?.code) {
        onSelectProvince(hitMesh.userData.code);
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 9. Animation Loop (Rising beacons and Zoom-Distance Readability Compensation; NO pulsating ground rings)
    let animId: number;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Damping orbit controls update
      controls.update();

      const camPos = camera.position;

      // Animate active base beacons rising smoothly once (NO pulsating rings on ground)
      activeBaseBeaconsMap.forEach(({ group, sprite }) => {
        if (group.userData?.isBeacon) {
          group.scale.y += (group.userData.targetScaleY - group.scale.y) * 0.12;
        }

        // Distance-based dynamic zoom scale compensation (stays readable when zooming out!)
        const dist = camPos.distanceTo(group.getWorldPosition(tempVec));
        const scaleMult = Math.max(0.75, Math.min(2.5, Math.pow(dist / 42, 0.72)));
        sprite.scale.set(5.2 * scaleMult, 1.62 * scaleMult, 1);
      });

      // Animate separate hover beacon
      if (hoverBeaconGroup.visible) {
        if (hoverBeaconGroup.userData?.isBeacon) {
          hoverBeaconGroup.scale.y += (hoverBeaconGroup.userData.targetScaleY - hoverBeaconGroup.scale.y) * 0.14;
        }
        const dist = camPos.distanceTo(hoverBeaconGroup.getWorldPosition(tempVec));
        const scaleMult = Math.max(0.75, Math.min(2.5, Math.pow(dist / 42, 0.72)));
        hoverSprite.scale.set(5.2 * scaleMult, 1.62 * scaleMult, 1);
      }

      // Slowly float dust particles
      particleSystem.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Handlers (Window and Container Observer so map expands dynamically)
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Province Highlight Color and Re-trigger Base Markers when Metric or Selection changes
  useEffect(() => {
    selectedMeshCodeRef.current = selectedProvinceCode;
    activeMetricRef.current = activeMetric;

    // Update base beacons (Top 5 + Selected) for the selected activeMetric
    if (updateBaseBeaconsRef.current) {
      updateBaseBeaconsRef.current(activeMetric, selectedProvinceCode);
    }
    if (updateHoverBeaconRef.current) {
      updateHoverBeaconRef.current(null);
    }

    const provinceMeshes = provinceMeshesRef.current;
    provinceMeshes.forEach((meshes, code) => {
      const isSelected = code === selectedProvinceCode;
      const val = computeProvinceMetric(code, activeMetric);
      const ratio = maxVal === minVal ? 0.5 : Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));

      meshes.forEach((mesh) => {
        const topMat = mesh.userData?.topMat as THREE.MeshStandardMaterial | undefined;
        if (!topMat) return;

        if (isSelected) {
          // Glow gold/amber for selected province
          topMat.emissive.setHex(0xb8860b);
          topMat.color.setHex(0xffd700);
        } else {
          topMat.emissive.setHex(0x000000);
          if (mapStyle === 'earth') {
            topMat.color.setHex(0xffffff); // True earth satellite texture
          } else if (mapStyle === 'cyber') {
            // Cyber color scale
            topMat.color.setRGB(0.05 + ratio * 0.1, 0.2 + ratio * 0.8, 0.4 + ratio * 0.6);
          } else {
            // Hybrid mode
            topMat.color.setRGB(0.6 + ratio * 0.4, 0.8 + ratio * 0.2, 1.0);
          }
        }
      });
    });
  }, [selectedProvinceCode, activeMetric, mapStyle, minVal, maxVal]);

  // View reset helper
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 38, 48);
    controlsRef.current.target.set(0, 0, 0);
  };

  const setTopDownView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 70, 0.1);
    controlsRef.current.target.set(0, 0, 0);
  };

  const formatMetricVal = (v: number) => {
    if (activeMetric === 'women') return `%${v.toFixed(1)}`;
    if (activeMetric === 'export') {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
      return `$${v.toLocaleString('tr-TR')}`;
    }
    if (activeMetric === 'gdp') return `$${v.toLocaleString('tr-TR')}`;
    return v.toLocaleString('tr-TR');
  };

  return (
    <div className="relative w-full h-full min-h-[480px] flex flex-col items-center justify-center overflow-hidden bg-[#030814] rounded-sm border border-cyan-500/30 select-none">
      
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing relative" />

      {/* Top Left: Map Metric Selectors */}
      <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-[#030919]/90 backdrop-blur-md p-1.5 rounded border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
        {[
          { id: 'export' as MapMetricType, label: 'İHRACAT' },
          { id: 'osb' as MapMetricType, label: 'OSB SAYISI' },
          { id: 'women' as MapMetricType, label: 'KADIN PAYI %' },
          { id: 'population' as MapMetricType, label: 'NÜFUS' },
          { id: 'gdp' as MapMetricType, label: 'GSYH/KİŞİ' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onMetricChange && onMetricChange(btn.id)}
            className={`px-2.5 py-1 text-xs font-['Rajdhani'] font-bold tracking-wider transition-all rounded-xs ${
              activeMetric === btn.id
                ? 'bg-cyan-500 text-[#030919] shadow-[0_0_10px_#00f2fe]'
                : 'text-cyan-300/80 hover:text-cyan-100 hover:bg-cyan-950/40'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Top Right: 3D Camera Controls & Earth Mode Switcher */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-[#030919]/90 backdrop-blur-md p-1.5 rounded border border-cyan-500/40 text-cyan-300">
        <button
          onClick={resetCamera}
          className="flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold hover:text-white hover:bg-cyan-500/20 rounded transition-colors"
          title="3D Açılı Görünüm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D AÇI</span>
        </button>

        <button
          onClick={setTopDownView}
          className="flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold hover:text-white hover:bg-cyan-500/20 rounded transition-colors"
          title="Kuşbakışı (2D Düz)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">KUŞBAKIŞI</span>
        </button>

        {/* Style mode toggle: Earth vs Cyber */}
        <div className="flex items-center bg-[#07193b] p-0.5 rounded border border-cyan-500/20 ml-1">
          <button
            onClick={() => setMapStyle('earth')}
            className={`px-2 py-0.5 text-[11px] font-['Rajdhani'] font-bold rounded-xs transition-colors ${
              mapStyle === 'earth' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-cyan-300/70 hover:text-white'
            }`}
            title="Google Earth / Topografik Kabartma"
          >
            UYDU/EARTH
          </button>
          <button
            onClick={() => setMapStyle('cyber')}
            className={`px-2 py-0.5 text-[11px] font-['Rajdhani'] font-bold rounded-xs transition-colors ${
              mapStyle === 'cyber' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-cyan-300/70 hover:text-white'
            }`}
            title="Siber Isı Haritası"
          >
            SİBER
          </button>
        </div>
      </div>

      {/* Floating 3D Tooltip */}
      {hoveredInfo && (
        <div 
          className="fixed pointer-events-none z-50 px-3.5 py-2.5 bg-[#061533]/95 border border-cyan-400/80 shadow-[0_0_25px_rgba(0,242,254,0.5)] rounded-xs backdrop-blur-md"
          style={{
            left: `${hoveredInfo.x + 16}px`,
            top: `${hoveredInfo.y - 48}px`
          }}
        >
          <div className="flex items-center gap-2 text-xs font-['Rajdhani'] font-bold text-white uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hoveredInfo.name}</span>
            <span className="text-cyan-400 text-[11px] font-mono">({hoveredInfo.code})</span>
            {hoveredInfo.agency && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {hoveredInfo.agency}
              </span>
            )}
          </div>
          <div className="mt-1 text-base font-['Orbitron'] font-bold text-cyan-200">
            {formatMetricDisplay(activeMetric, hoveredInfo.value)}
          </div>
        </div>
      )}

      {/* Bottom Unified HUD Bar - Zero Overlap Layout */}
      <div className="absolute bottom-2.5 left-3 right-3 z-20 flex flex-col md:flex-row items-center justify-between gap-2 pointer-events-none">
        {/* Left: Metric Range Scale */}
        <div className="pointer-events-auto bg-[#030919]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xs border border-cyan-500/30 flex items-center gap-3">
          <div className="text-[10px] font-mono text-cyan-300">
            <span>MİN: {formatMetricVal(minVal)}</span>
          </div>
          <div className="w-32 h-1.5 rounded-xs bg-gradient-to-r from-[#061324] via-[#0084c4] to-[#00f2fe] border border-cyan-400/40" />
          <div className="text-[10px] font-mono text-cyan-300">
            <span>MAKS: {formatMetricVal(maxVal)}</span>
          </div>
        </div>

        {/* Center: Mouse 3D Navigation Guide */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-3 text-[10px] font-mono text-cyan-300/80 bg-[#030919]/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/25">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <strong className="text-white">Sol Tık:</strong> 3D Çevir
          </span>
          <span>·</span>
          <span><strong className="text-white">Sağ Tık:</strong> Serbest Taşı</span>
          <span>·</span>
          <span><strong className="text-white">Tekerlek:</strong> Zoom</span>
        </div>

        {/* Right: Selected Province & Rank Badge */}
        <div className="pointer-events-auto text-xs font-mono text-cyan-300 bg-[#030919]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xs border border-cyan-500/30 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          <span>
            SEÇİLİ: <strong className="text-white">{PROVINCE_CODES[selectedProvinceCode] || 'İSTANBUL'}</strong>
            <span className="text-[10px] text-amber-400 font-bold ml-1.5">
              (#{selectedRank} · {formatMetricShort(activeMetric, computeProvinceMetric(selectedProvinceCode, activeMetric))})
            </span>
          </span>
        </div>
      </div>

    </div>
  );
};
