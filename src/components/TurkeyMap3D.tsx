import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { 
  RotateCcw, 
  Compass, 
  Camera,
  Sliders,
  Layers,
  ChevronDown,
  Search,
  Database,
  Check,
  Sparkles,
  Globe,
  Factory,
  Users,
  PieChart
} from 'lucide-react';
import defaultGeoData from '../data/nuts3.geo.json';
import { PROVINCE_CODES, REGIONS } from '../data/regions';
import { 
  MapMetricType, 
  METRIC_CATALOG, 
  computeProvinceMetric, 
  getCategoryLabel, 
  formatMetricDisplay 
} from '../data/metricCatalog';
import { DashboardMode } from './Header';
import { ThemeMode } from '../utils/theme';

export type { MapMetricType };
export { computeProvinceMetric };

// Light-color themes specifically for the 3D outer extrude pedestal walls
export type ExtrudeWallColorType = 'white' | 'silver' | 'marble' | 'ice';

interface TurkeyMap3DProps {
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
  activeMetric: MapMetricType;
  onMetricChange?: (metric: MapMetricType) => void;
  currentMode?: DashboardMode;
  onModeChange?: (mode: DashboardMode) => void;
  isAutoPlay?: boolean;
  autoPlayProgress?: number;
  autoPlayStepTitle?: string;
  activeTheme?: ThemeMode;
}

// Helper to project lon/lat to 3D world coordinates
const CENTER_LON = 35.24;
const CENTER_LAT = 38.96;
const SCALE_X = 2.8;
const SCALE_Z = 3.6;

// Default canonical perspective camera view
const DEFAULT_CAM_POS = new THREE.Vector3(0, 38, 48);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 0, 0);

// Exact Web Mercator bounds of the authentic Google Earth satellite texture (/turkey_satellite.jpg)
// Downloaded from Esri World Imagery (ArcGIS DigitalGlobe / Maxar satellite source used by Google Earth)
const SAT_LON_MIN = 25.3125;
const SAT_LON_MAX = 47.8125;
const SAT_MERC_NORTH = 0.8344855; // tile 47 top (lat 43.06888°)
const SAT_MERC_SOUTH = 0.6381360; // tile 51 top / tile 50 bottom (lat 34.30714°)

function lonLatToWorld(lon: number, lat: number): [number, number] {
  const x = (lon - CENTER_LON) * SCALE_X;
  const z = -(lat - CENTER_LAT) * SCALE_Z;
  return [x, z];
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

// Precompute ONLY the outermost boundary segments of Turkey (coastlines & national border)
const TURKEY_OUTER_SEGMENTS: [[number, number], [number, number]][] = [];
if (defaultGeoData && (defaultGeoData as any).features) {
  const directedMap = new Map<string, [[number, number], [number, number]]>();
  const undirectedMap = new Map<string, number>();

  function ptKey(pt: number[]) {
    return (Math.round(pt[0] * 10000) / 10000) + ',' + (Math.round(pt[1] * 10000) / 10000);
  }

  (defaultGeoData as any).features.forEach((f: any) => {
    const geomType = f.geometry.type;
    const coords = geomType === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    coords.forEach((poly: any) => {
      poly.forEach((ring: number[][]) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const k1 = ptKey(ring[i]);
          const k2 = ptKey(ring[i + 1]);
          if (k1 === k2) continue;
          const uk = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
          undirectedMap.set(uk, (undirectedMap.get(uk) || 0) + 1);
          directedMap.set(k1 + '->' + k2, [ring[i] as [number, number], ring[i + 1] as [number, number]]);
        }
      });
    });
  });

  undirectedMap.forEach((cnt, uk) => {
    if (cnt === 1) {
      const [k1, k2] = uk.split('|');
      const edge = directedMap.get(k1 + '->' + k2) || directedMap.get(k2 + '->' + k1);
      if (edge) {
        TURKEY_OUTER_SEGMENTS.push(edge);
      }
    }
  });
}

// Generate Compact, High-Density 3D Billboard Tag (480x148 Hi-Res Canvas)
function createCyberBillboardTexture(
  rank: number,
  name: string,
  metricText: string,
  categoryLabel: string,
  colorScheme: 'gold' | 'cyan' | 'emerald' | 'blue'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const theme = {
    gold: {
      primary: '#f59e0b',
      badgeBg: '#fbbf24',
      badgeText: '#0f172a',
      border: 'rgba(251, 191, 36, 0.95)',
      glow: 'rgba(251, 191, 36, 0.55)',
      bg: 'rgba(15, 23, 42, 0.96)'
    },
    cyan: {
      primary: '#00f2fe',
      badgeBg: '#00f2fe',
      badgeText: '#0f172a',
      border: 'rgba(0, 242, 254, 0.95)',
      glow: 'rgba(0, 242, 254, 0.55)',
      bg: 'rgba(15, 23, 42, 0.96)'
    },
    emerald: {
      primary: '#10b981',
      badgeBg: '#10b981',
      badgeText: '#0f172a',
      border: 'rgba(16, 185, 129, 0.95)',
      glow: 'rgba(16, 185, 129, 0.55)',
      bg: 'rgba(15, 23, 42, 0.96)'
    },
    blue: {
      primary: '#38bdf8',
      badgeBg: '#38bdf8',
      badgeText: '#0f172a',
      border: 'rgba(56, 189, 248, 0.90)',
      glow: 'rgba(56, 189, 248, 0.45)',
      bg: 'rgba(15, 23, 42, 0.94)'
    }
  }[colorScheme];

  const w = canvas.width;
  const h = canvas.height;
  const pad = 8;

  // 1. Shadowed Card Background
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 16;
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
  const brk = 12;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pad - 1, pad + brk);
  ctx.lineTo(pad - 1, pad - 1);
  ctx.lineTo(pad + brk, pad - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - pad + 1 - brk, pad - 1);
  ctx.lineTo(w - pad + 1, pad - 1);
  ctx.lineTo(w - pad + 1, pad + brk);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad - 1, h - pad - brk);
  ctx.lineTo(pad - 1, h - pad + 1);
  ctx.lineTo(pad + brk, h - pad + 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - pad + 1 - brk, h - pad + 1);
  ctx.lineTo(w - pad + 1, h - pad + 1);
  ctx.lineTo(w - pad + 1, h - pad - brk);
  ctx.stroke();

  // 4. Header Bar
  const rankStr = rank < 10 ? `#0${rank}` : `#${rank}`;
  const badgeW = 62;
  const badgeH = 30;
  const badgeX = pad + 14;
  const badgeY = pad + 12;

  // Rank Pill
  ctx.fillStyle = theme.badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
  ctx.fill();

  ctx.fillStyle = theme.badgeText;
  ctx.font = 'bold 19px "Orbitron", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rankStr, badgeX + badgeW / 2, badgeY + badgeH / 2);

  // City Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Rajdhani", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), badgeX + badgeW + 12, badgeY + badgeH / 2);

  // Category Tag on right
  ctx.fillStyle = theme.primary;
  ctx.font = 'bold 14px "Rajdhani", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(categoryLabel.toUpperCase(), w - pad - 14, badgeY + badgeH / 2);

  // 5. Tech Divider Line
  const divY = badgeY + badgeH + 10;
  const lineGrad = ctx.createLinearGradient(pad + 14, divY, w - pad - 14, divY);
  lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  lineGrad.addColorStop(0.3, theme.border);
  lineGrad.addColorStop(0.7, theme.border);
  lineGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad + 14, divY);
  ctx.lineTo(w - pad - 14, divY);
  ctx.stroke();

  // 6. Centered, Balanced Value
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 33px "Orbitron", monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  ctx.fillText(metricText, w / 2, divY + 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Light colors for the 3D extrusion pedestal side walls
const EXTRUDE_WALL_COLORS: Record<ExtrudeWallColorType, { name: string; hex: number; lineHex: number }> = {
  white: { name: 'Açık Platin / Beyaz', hex: 0xf1f5f9, lineHex: 0x00f2fe },
  silver: { name: 'Açık Gümüş Metalik', hex: 0xe2e8f0, lineHex: 0x38bdf8 },
  marble: { name: 'Açık Mermer / Kumtaşı', hex: 0xfef3c7, lineHex: 0xf59e0b },
  ice: { name: 'Açık Buz Mavisi', hex: 0xe0f2fe, lineHex: 0x00f2fe }
};

// Smart Multi-Tier Elevation Algorithm:
// Calculates staggered base heights for geographically adjacent clusters (e.g. Marmara: İstanbul, Kocaeli, Bursa)
// Northern background cities get taller pedestals; Southern foreground cities get lower pedestals.
// Result: Natural stadium seating perspective where every card is 100% visible!
function assignAdaptiveHeights(items: { code: string; rank: number }[]): Map<string, number> {
  const result = new Map<string, number>();
  const clusters: { code: string; rank: number }[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const codeA = items[i].code;
    if (visited.has(codeA)) continue;
    const cluster = [items[i]];
    visited.add(codeA);

    const ptA = PROVINCE_CENTROIDS[codeA];
    if (!ptA) continue;
    const [xA, zA] = lonLatToWorld(ptA[0], ptA[1]);

    for (let j = i + 1; j < items.length; j++) {
      const codeB = items[j].code;
      if (visited.has(codeB)) continue;
      const ptB = PROVINCE_CENTROIDS[codeB];
      if (!ptB) continue;
      const [xB, zB] = lonLatToWorld(ptB[0], ptB[1]);
      if (Math.hypot(xA - xB, zA - zB) < 5.8) {
        cluster.push(items[j]);
        visited.add(codeB);
      }
    }
    clusters.push(cluster);
  }

  clusters.forEach((cluster) => {
    if (cluster.length === 1) {
      result.set(cluster[0].code, cluster[0].rank === 1 ? 9.5 : 7.6);
    } else {
      // Sort cluster by latitude descending (North to South).
      // North is farther in aerial perspective, so receives taller elevation!
      cluster.sort((a, b) => {
        const latA = PROVINCE_CENTROIDS[a.code] ? PROVINCE_CENTROIDS[a.code][1] : 39;
        const latB = PROVINCE_CENTROIDS[b.code] ? PROVINCE_CENTROIDS[b.code][1] : 39;
        return latB - latA; // Highest lat (north) first
      });

      // Distinct, non-overlapping elevation tiers
      const tiers = [11.8, 8.8, 5.8, 14.2];
      cluster.forEach((item, idx) => {
        result.set(item.code, tiers[idx] || 7.6);
      });
    }
  });

  return result;
}

const CANVAS_THEMES: {
  id: DashboardMode;
  label: string;
  icon: React.ReactNode;
  items: {
    id: MapMetricType;
    label: string;
    unit: string;
    source: string;
    desc: string;
  }[];
}[] = [
  {
    id: 'trade',
    label: 'DIŞ TİCARET',
    icon: <Globe className="w-3.5 h-3.5" />,
    items: [
      { id: 'export', label: 'Yıllık İhracat Hacmi', unit: '$', source: 'TİM / Ticaret Bak.', desc: '2025 resmi il bazlı ihracat tutarı' },
      { id: 'women', label: 'Kadın İhracatçı & Girişimci', unit: '% Pay', source: 'İhracatçılar Meclisi', desc: 'İhracatta kadın ortaklı/yönetimli firma payı' },
    ]
  },
  {
    id: 'osb',
    label: 'SANAYİ & OSB',
    icon: <Factory className="w-3.5 h-3.5" />,
    items: [
      { id: 'osb', label: 'Toplam OSB Sayısı', unit: 'Adet', source: 'OSBÜK / Sanayi Bak.', desc: 'Bakanlık tescilli organize sanayi bölgesi adedi' },
      { id: 'osb_area', label: 'Toplam OSB Alanı', unit: 'Hektar', source: 'Sanayi ve Teknoloji Bak.', desc: 'Organize sanayi bölgeleri toplam yüzölçümü' },
      { id: 'osb_parsel', label: 'Sanayi Parsel Sayısı', unit: 'Parsel', source: 'OSB Bilgi Sistemi', desc: 'Üretime hazır ve tahsis edilmiş sanayi parselleri' },
      { id: 'osb_active', label: 'İşletmedeki Aktif OSB', unit: 'Aktif OSB', source: 'Sanayi Genel Müd.', desc: 'Fabrikaların fiilen üretime geçtiği aktif OSB sayısı' },
    ]
  },
  {
    id: 'women',
    label: 'KADIN İSTİHDAMI',
    icon: <Users className="w-3.5 h-3.5" />,
    items: [
      { id: 'women', label: 'Kadın Girişimci & İhracatçı', unit: '% Oran', source: 'Ticaret Bakanlığı', desc: 'İhracatçı kadın işletme ve yönetici payı' },
      { id: 'employment', label: 'Kadın & Genel İstihdam Oranı', unit: '% Oran', source: 'TÜİK İşgücü', desc: '15+ yaş nüfusun çalışma hayatına katılım oranı' },
    ]
  },
  {
    id: 'demography',
    label: 'DEMOGRAFİ & SES',
    icon: <PieChart className="w-3.5 h-3.5" />,
    items: [
      { id: 'gdp', label: 'Kişi Başına GSYH', unit: '$ / Kişi', source: 'TÜİK İl GSYH', desc: 'Kişi başına düşen gayrisafi yurtiçi hasıla düzeyi' },
      { id: 'ses', label: 'SEGE Gelişmişlik Endeksi', unit: 'Endeks Skoru', source: 'Kalkınma Ajansları', desc: 'Sanayi ve Teknoloji Bakanlığı SEGE Skoru' },
      { id: 'population', label: 'Toplam İl Nüfusu', unit: 'Kişi', source: 'TÜİK ADNKS', desc: 'Adrese Dayalı Nüfus Kayıt Sistemi verisi' },
      { id: 'unemployment', label: 'İşsizlik Oranı', unit: '% Oran', source: 'TÜİK & İŞKUR', desc: 'İl bazında kayıtlı iş arayan işsizlik payı' },
      { id: 'education', label: 'Ortalama Eğitim Süresi', unit: 'Yıl', source: 'MEB & TÜİK', desc: '25 yaş üzeri ortalama tamamlanan okul yılı' },
      { id: 'hospital_beds', label: '10.000 Kişiye Düşen Yatak', unit: 'Yatak', source: 'Sağlık Bakanlığı', desc: 'İldeki kamu ve özel hastane yatak kapasitesi' },
    ]
  }
];

export const TurkeyMap3D: React.FC<TurkeyMap3DProps> = ({
  selectedProvinceCode,
  onSelectProvince,
  activeMetric,
  onMetricChange,
  currentMode,
  onModeChange,
  isAutoPlay = false,
  autoPlayProgress = 0,
  autoPlayStepTitle,
  activeTheme = 'cyber-blue'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // 3D Extrusion Depth
  const [extrudeDepth, setExtrudeDepth] = useState<number>(0.7);
  const [extrudeWallColor, setExtrudeWallColor] = useState<ExtrudeWallColorType>('marble');
  const [isExtrudeOpen, setIsExtrudeOpen] = useState<boolean>(false);
  const extrudePopoverRef = useRef<HTMLDivElement>(null);

  // Category Dropdown State ('trade' | 'osb' | 'women' | 'demography' | null)
  const [openCategory, setOpenCategory] = useState<DashboardMode | null>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);

  // Indicator Catalog Dropdown State
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const catalogPopoverRef = useRef<HTMLDivElement>(null);

  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return METRIC_CATALOG;
    const q = catalogSearch.toLowerCase();
    return METRIC_CATALOG.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.desc.toLowerCase().includes(q) ||
          it.shortLabel.toLowerCase().includes(q)
      )
    })).filter((cat) => cat.items.length > 0);
  }, [catalogSearch]);

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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 3D Groups for unified outer extrusion scaling
  const topGroupRef = useRef<THREE.Group | null>(null);
  const sideWallMeshRef = useRef<THREE.Mesh | null>(null);
  const outerTopLineRef = useRef<THREE.LineSegments | null>(null);
  const outerBottomLineRef = useRef<THREE.LineSegments | null>(null);
  const baseBeaconsGroupRef = useRef<THREE.Group | null>(null);
  const dynamicArcsGroupRef = useRef<THREE.Group | null>(null);
  const hoverBeaconGroupRef = useRef<THREE.Group | null>(null);

  // Map to hold each province's top flat ShapeGeometry meshes
  const provinceMeshesMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());

  const selectedMeshCodeRef = useRef<string>(selectedProvinceCode);
  selectedMeshCodeRef.current = selectedProvinceCode;
  const activeMetricRef = useRef<MapMetricType>(activeMetric);
  activeMetricRef.current = activeMetric;
  const extrudeDepthRef = useRef<number>(extrudeDepth);
  extrudeDepthRef.current = extrudeDepth;
  const extrudeWallColorRef = useRef<ExtrudeWallColorType>(extrudeWallColor);
  extrudeWallColorRef.current = extrudeWallColor;
  const activeThemeRef = useRef<ThemeMode>(activeTheme);
  activeThemeRef.current = activeTheme;

  // External update handlers
  const updateBaseBeaconsRef = useRef<((metric: MapMetricType, selCode: string) => void) | null>(null);
  const updateHoverBeaconRef = useRef<((code: string | null) => void) | null>(null);
  const updateProvincesVisualRef = useRef<(() => void) | null>(null);

  // Re-render beacons when theme changes
  useEffect(() => {
    if (updateBaseBeaconsRef.current) {
      updateBaseBeaconsRef.current(activeMetric, selectedProvinceCode);
    }
  }, [activeTheme]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (extrudePopoverRef.current && !extrudePopoverRef.current.contains(event.target as Node)) {
        setIsExtrudeOpen(false);
      }
      if (catalogPopoverRef.current && !catalogPopoverRef.current.contains(event.target as Node)) {
        setIsCatalogOpen(false);
      }
      if (categoryNavRef.current && !categoryNavRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    };
    if (isExtrudeOpen || isCatalogOpen || openCategory !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExtrudeOpen, isCatalogOpen, openCategory]);

  // Cinematic Orbit when AutoPlay is enabled & Smooth Camera Reset when Paused
  const isResettingRef = useRef<boolean>(false);
  const prevAutoPlayRef = useRef<boolean>(false);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !!isAutoPlay;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
    // When paused, smoothly return camera back to default front-facing perspective
    if (prevAutoPlayRef.current && !isAutoPlay) {
      isResettingRef.current = true;
    }
    prevAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

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

  // PNG Snapshot Export Function
  const exportMapPNG = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `turkiye-3d-harita-google-earth-${new Date().toISOString().slice(0, 10)}.png`;
    a.href = dataURL;
    a.click();
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060d1a);
    scene.fog = null; // No dark fog to keep the Google Earth satellite photo crystal clear!

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 38, 48); // Perspective aerial view

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    rendererRef.current = renderer;
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

    controls.addEventListener('start', () => {
      isResettingRef.current = false;
    });

    // 3. Multi-Point Bright Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(30, 70, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const frontWallLight = new THREE.DirectionalLight(0xffffff, 1.5);
    frontWallLight.position.set(0, 20, 60);
    scene.add(frontWallLight);

    const sideWallLight = new THREE.DirectionalLight(0xf8fafc, 1.2);
    sideWallLight.position.set(-60, 25, 10);
    scene.add(sideWallLight);

    const rimLight = new THREE.DirectionalLight(0x00f2fe, 0.9);
    rimLight.position.set(40, 25, -30);
    scene.add(rimLight);

    // 4. Perspective 3D Grid Plane (y: 0 ground floor)
    const gridHelper = new THREE.GridHelper(160, 32, 0x00f2fe, 0x112845);
    gridHelper.position.y = -0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.40;
    scene.add(gridHelper);

    const subGrid = new THREE.GridHelper(160, 64, 0x00f2fe, 0x0a192e);
    subGrid.position.y = -0.02;
    (subGrid.material as THREE.Material).transparent = true;
    (subGrid.material as THREE.Material).opacity = 0.22;
    scene.add(subGrid);

    // 5. Starfield / Cyber Matrix Particles STRICTLY UNDER THE GRID
    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 180;
      particlePositions[i * 3 + 1] = -1.5 - Math.random() * 26;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.65,
      transparent: true,
      opacity: 0.35
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. BUILD LIGHT-COLORED 3D PEDESTAL SIDE WALLS (Only around the outermost perimeter of Turkey)
    const wallPositions: number[] = [];
    const outerTopLinePoints: THREE.Vector3[] = [];
    const outerBottomLinePoints: THREE.Vector3[] = [];

    TURKEY_OUTER_SEGMENTS.forEach(([ptA, ptB]) => {
      const [x0, z0] = lonLatToWorld(ptA[0], ptA[1]);
      const [x1, z1] = lonLatToWorld(ptB[0], ptB[1]);

      wallPositions.push(
        x0, 0, z0,
        x1, 0, z1,
        x1, 1, z1
      );
      wallPositions.push(
        x0, 0, z0,
        x1, 1, z1,
        x0, 1, z0
      );

      outerTopLinePoints.push(new THREE.Vector3(x0, 1, z0), new THREE.Vector3(x1, 1, z1));
      outerBottomLinePoints.push(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, 0, z1));
    });

    const sideWallGeo = new THREE.BufferGeometry();
    sideWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallPositions, 3));
    sideWallGeo.computeVertexNormals();

    const activeColorConfig = EXTRUDE_WALL_COLORS[extrudeWallColorRef.current];
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: activeColorConfig.hex,
      metalness: 0.15,
      roughness: 0.30,
      side: THREE.DoubleSide
    });

    const sideWallMesh = new THREE.Mesh(sideWallGeo, sideMaterial);
    sideWallMesh.castShadow = true;
    sideWallMesh.receiveShadow = true;
    sideWallMesh.scale.set(1, extrudeDepthRef.current, 1);
    sideWallMeshRef.current = sideWallMesh;
    scene.add(sideWallMesh);

    const outerTopLineGeo = new THREE.BufferGeometry().setFromPoints(outerTopLinePoints);
    const outerTopLineMat = new THREE.LineBasicMaterial({ 
      color: activeColorConfig.lineHex, 
      linewidth: 2, 
      transparent: true, 
      opacity: 0.95 
    });
    const outerTopLine = new THREE.LineSegments(outerTopLineGeo, outerTopLineMat);
    outerTopLine.scale.set(1, extrudeDepthRef.current, 1);
    outerTopLineRef.current = outerTopLine;
    scene.add(outerTopLine);

    const outerBottomLineGeo = new THREE.BufferGeometry().setFromPoints(outerBottomLinePoints);
    const outerBottomLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });
    const outerBottomLine = new THREE.LineSegments(outerBottomLineGeo, outerBottomLineMat);
    outerBottomLineRef.current = outerBottomLine;
    scene.add(outerBottomLine);

    // 7. LOAD AUTHENTIC REAL GOOGLE EARTH SATELLITE TEXTURE (/turkey_satellite.jpg)
    const textureLoader = new THREE.TextureLoader();
    const satelliteTexture = textureLoader.load('/turkey_satellite.jpg', () => {
      renderer.render(scene, camera);
    });
    satelliteTexture.colorSpace = THREE.SRGBColorSpace;
    satelliteTexture.generateMipmaps = true;
    satelliteTexture.minFilter = THREE.LinearMipmapLinearFilter;
    satelliteTexture.magFilter = THREE.LinearFilter;
    satelliteTexture.wrapS = THREE.ClampToEdgeWrapping;
    satelliteTexture.wrapT = THREE.ClampToEdgeWrapping;

    const provinceMeshesMap = new Map<string, THREE.Mesh[]>();
    provinceMeshesMapRef.current = provinceMeshesMap;

    const topGroup = new THREE.Group();
    topGroup.position.y = extrudeDepthRef.current;
    topGroupRef.current = topGroup;
    scene.add(topGroup);

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

          const geometry = new THREE.ShapeGeometry(shape);
          geometry.rotateX(-Math.PI / 2);

          const pos = geometry.attributes.position;
          const uvs = geometry.attributes.uv;
          for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);

            const lon = vx / SCALE_X + CENTER_LON;
            const lat = -vz / SCALE_Z + CENTER_LAT;

            const u = (lon - SAT_LON_MIN) / (SAT_LON_MAX - SAT_LON_MIN);
            const latRad = (lat * Math.PI) / 180;
            const merc = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            const v = (merc - SAT_MERC_SOUTH) / (SAT_MERC_NORTH - SAT_MERC_SOUTH);

            uvs.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
          }
          uvs.needsUpdate = true;
          geometry.computeVertexNormals();

          const topMat = new THREE.MeshStandardMaterial({
            map: satelliteTexture,
            color: 0xffffff,
            roughness: 0.55,
            metalness: 0.12
          });

          const mesh = new THREE.Mesh(geometry, topMat);
          mesh.receiveShadow = true;
          mesh.userData = { code, name, topMat };

          topGroup.add(mesh);
          meshesForProvince.push(mesh);

          const linePoints: THREE.Vector3[] = outerCoords.map((pt) => {
            const [wx, wz] = lonLatToWorld(pt[0], pt[1]);
            return new THREE.Vector3(wx, 0.02, wz);
          });
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.70 
          });
          const borderLine = new THREE.Line(lineGeo, lineMat);
          topGroup.add(borderLine);
        });

        provinceMeshesMap.set(code, meshesForProvince);
      });
    }

    // 8. Dynamic Anti-Collision Billboard Beacons & Separate Hover Beacon
    const baseBeaconsGroup = new THREE.Group();
    baseBeaconsGroup.position.y = extrudeDepthRef.current;
    baseBeaconsGroupRef.current = baseBeaconsGroup;
    scene.add(baseBeaconsGroup);

    const dynamicArcsGroup = new THREE.Group();
    dynamicArcsGroup.position.y = extrudeDepthRef.current;
    dynamicArcsGroupRef.current = dynamicArcsGroup;
    scene.add(dynamicArcsGroup);

    // Map to preserve existing base beacons with dynamic anti-collision state
    const activeBaseBeaconsMap = new Map<string, {
      group: THREE.Group;
      sprite: THREE.Sprite;
      beamMesh: THREE.Mesh;
      baseHeight: number;
      currentHeight: number;
      targetHeight: number;
      repelOffsetY: number;
      rank: number;
      role: 'gold' | 'cyan' | 'blue';
      metric: MapMetricType;
    }>();

    // Dedicated separate Hover Beacon instance
    const hoverBeaconGroup = new THREE.Group();
    hoverBeaconGroup.position.y = extrudeDepthRef.current;
    hoverBeaconGroupRef.current = hoverBeaconGroup;
    hoverBeaconGroup.visible = false;
    scene.add(hoverBeaconGroup);

    // Build hover beacon visual components with scalable stem
    const hoverBeamGeo = new THREE.CylinderGeometry(0.08, 0.30, 1.0, 16);
    hoverBeamGeo.translate(0, 0.5, 0); // Origin anchored at base
    const hoverBeamMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.85 });
    const hoverBeamMesh = new THREE.Mesh(hoverBeamGeo, hoverBeamMat);
    hoverBeamMesh.scale.set(1, 7.4, 1);
    hoverBeaconGroup.add(hoverBeamMesh);

    const hoverDot = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hoverDot.position.set(0, 0.1, 0);
    hoverBeaconGroup.add(hoverDot);

    const hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.4, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.90 })
    );
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.set(0, 0.08, 0);
    hoverBeaconGroup.add(hoverRing);

    const hoverSpriteMat = new THREE.SpriteMaterial({ transparent: true });
    const hoverSprite = new THREE.Sprite(hoverSpriteMat);
    hoverSprite.position.set(0, 8.0, 0);
    hoverBeaconGroup.add(hoverSprite);
    hoverBeaconGroup.userData = { targetScaleY: 1.0, isBeacon: true, sprite: hoverSprite };

    // Function to build a single 3D beacon item with adaptive base height
    const createBeaconObject = (
      code: string,
      rank: number,
      name: string,
      val: number,
      metric: MapMetricType,
      role: 'gold' | 'cyan' | 'blue',
      baseHeight: number = 7.8
    ) => {
      const coords = PROVINCE_CENTROIDS[code];
      if (!coords) return null;
      const [hx, hz] = lonLatToWorld(coords[0], coords[1]);

      const group = new THREE.Group();
      group.position.set(hx, 0, hz);
      group.scale.set(1, 0.05, 1);
      group.userData = { targetScaleY: 1.0, isBeacon: true, code };

      const themePrimaryHex = 
        activeThemeRef.current === 'gold-titanium' ? 0xf59e0b :
        activeThemeRef.current === 'emerald-tech' ? 0x10b981 :
        activeThemeRef.current === 'crimson-command' ? 0xf43f5e :
        0x00f2fe;

      const mainColor = role === 'gold' ? 0xfbbf24 : role === 'cyan' ? themePrimaryHex : 0x38bdf8;

      // Vertical tapered leader beam with origin at bottom
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.28, 1.0, 16);
      beamGeo.translate(0, 0.5, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: mainColor,
        transparent: true,
        opacity: role === 'gold' ? 0.85 : 0.60
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.scale.set(1, baseHeight, 1);
      group.add(beamMesh);

      // Base glowing anchor dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      dot.position.set(0, 0.1, 0);
      group.add(dot);

      // Static clean base ring on terrain
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 1.3, 32),
        new THREE.MeshBasicMaterial({
          color: mainColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.90
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.08, 0);
      group.add(ring);

      // High-resolution billboard tag
      const texture = createCyberBillboardTexture(
        rank,
        name,
        formatMetricDisplay(metric, val),
        getCategoryLabel(metric),
        role
      );
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.5, 1.38, 1);
      sprite.position.set(0, baseHeight + 0.6, 0);
      group.add(sprite);

      return { 
        group, 
        sprite, 
        beamMesh,
        baseHeight, 
        currentHeight: baseHeight, 
        targetHeight: baseHeight, 
        repelOffsetY: 0,
        rank, 
        role, 
        metric 
      };
    };

    // Update Base Beacons with Smart Adaptive Heights to Prevent Overlapping
    const updateBaseBeacons = (metric: MapMetricType, selCode: string) => {
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

      // Calculate staggered adaptive base heights for any neighboring clusters (e.g. Istanbul / Kocaeli / Bursa)
      const targetList = Array.from(targetMap.values());
      const adaptiveHeightMap = assignAdaptiveHeights(targetList);

      // Remove beacons that are no longer in target
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

      // Add or update target beacons
      targetMap.forEach((item, code) => {
        const assignedBaseH = adaptiveHeightMap.get(code) || 7.8;
        const existing = activeBaseBeaconsMap.get(code);

        if (existing) {
          existing.baseHeight = assignedBaseH;
          existing.targetHeight = assignedBaseH;

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
          const newEntry = createBeaconObject(
            code,
            item.rank,
            item.name,
            item.value,
            metric,
            item.role,
            assignedBaseH
          );
          if (newEntry) {
            baseBeaconsGroup.add(newEntry.group);
            activeBaseBeaconsMap.set(code, newEntry);
          }
        }
      });

      // Update flight arcs between Rank 1 and other leaders
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
            const arcApex = Math.min(14, dist * 0.45);

            const curve = new THREE.QuadraticBezierCurve3(
              new THREE.Vector3(top1X, 0.35, top1Z),
              new THREE.Vector3(midX, arcApex, midZ),
              new THREE.Vector3(destX, 0.35, destZ)
            );

            const arcPoints = curve.getPoints(45);
            const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
            const arcMat = new THREE.LineDashedMaterial({
              color: 0x00f2fe,
              dashSize: 1.2,
              gapSize: 0.8,
              transparent: true,
              opacity: 0.8
            });
            const line = new THREE.Line(arcGeo, arcMat);
            line.computeLineDistances();
            dynamicArcsGroup.add(line);
          });
        }
      }
    };

    // Update Hover Beacon
    const updateHoverBeacon = (code: string | null) => {
      if (!code || activeBaseBeaconsMap.has(code)) {
        hoverBeaconGroup.visible = false;
        return;
      }

      const coords = PROVINCE_CENTROIDS[code];
      if (!coords) {
        hoverBeaconGroup.visible = false;
        return;
      }

      const [hx, hz] = lonLatToWorld(coords[0], coords[1]);

      hoverBeaconGroup.position.set(hx, extrudeDepthRef.current, hz);
      hoverBeaconGroup.scale.set(1, 0.05, 1);
      hoverBeaconGroup.visible = true;

      const currentMetric = activeMetricRef.current;
      const ranked = Object.keys(PROVINCE_CODES).map((c) => ({
        code: c,
        value: computeProvinceMetric(c, currentMetric)
      })).sort((a, b) => b.value - a.value);
      const rankIdx = ranked.findIndex((r) => r.code === code);
      const rank = rankIdx !== -1 ? rankIdx + 1 : 1;
      const name = PROVINCE_CODES[code] || 'İL';
      const val = computeProvinceMetric(code, currentMetric);

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

    // Update Province Appearance: AUTHENTIC GOOGLE EARTH SATELLITE TERRAIN PRESERVED!
    const updateProvincesVisual = () => {
      const selCode = selectedMeshCodeRef.current;

      provinceMeshesMap.forEach((meshes, code) => {
        const isSelected = code === selCode;

        meshes.forEach((mesh) => {
          const mat = mesh.userData?.topMat as THREE.MeshStandardMaterial | undefined;
          if (!mat) return;

          mat.map = satelliteTexture;
          mat.color.setHex(0xffffff);

          if (isSelected) {
            mat.emissive.setHex(0xf59e0b);
            mat.emissiveIntensity = 0.55;
          } else {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0.0;
          }
          mat.needsUpdate = true;
        });
      });
    };

    updateBaseBeaconsRef.current = updateBaseBeacons;
    updateHoverBeaconRef.current = updateHoverBeacon;
    updateProvincesVisualRef.current = updateProvincesVisual;

    // Initial builds
    updateProvincesVisual();
    updateBaseBeacons(activeMetricRef.current, selectedMeshCodeRef.current);

    // 9. Raycasting & Interaction State
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let hoveredMesh: THREE.Mesh | null = null;

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(topGroup.children);

      const hitMesh = intersects.find((hit) => hit.object.userData?.code)?.object as THREE.Mesh | undefined;

      if (hitMesh !== hoveredMesh) {
        if (hoveredMesh && hoveredMesh.userData?.topMat) {
          const isSelected = hoveredMesh.userData.code === selectedMeshCodeRef.current;
          if (isSelected) {
            hoveredMesh.userData.topMat.emissive.setHex(0xf59e0b);
            hoveredMesh.userData.topMat.emissiveIntensity = 0.55;
          } else {
            hoveredMesh.userData.topMat.emissive.setHex(0x000000);
            hoveredMesh.userData.topMat.emissiveIntensity = 0.0;
          }
        }

        if (hitMesh && hitMesh.userData?.topMat) {
          hitMesh.userData.topMat.emissive.setHex(0x00f2fe);
          hitMesh.userData.topMat.emissiveIntensity = 0.40;

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
      const intersects = raycaster.intersectObjects(topGroup.children);
      const hitMesh = intersects.find((hit) => hit.object.userData?.code)?.object as THREE.Mesh | undefined;
      if (hitMesh && hitMesh.userData?.code) {
        onSelectProvince(hitMesh.userData.code);
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 10. Animation Loop with Real-Time Screen-Space Collision Avoidance
    let animId: number;
    const tempVecA = new THREE.Vector3();
    const tempVecB = new THREE.Vector3();
    const tempCamPos = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera glide back to default canonical perspective when resetting or pausing
      if (isResettingRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(DEFAULT_CAM_POS, 0.08);
        controlsRef.current.target.lerp(DEFAULT_CAM_TARGET, 0.08);
        if (cameraRef.current.position.distanceTo(DEFAULT_CAM_POS) < 0.12) {
          cameraRef.current.position.copy(DEFAULT_CAM_POS);
          controlsRef.current.target.copy(DEFAULT_CAM_TARGET);
          isResettingRef.current = false;
        }
      }

      controls.update();

      const camPos = camera.position;
      const domW = renderer.domElement.clientWidth;
      const domH = renderer.domElement.clientHeight;

      // 1. Gather all active labels and project to 2D screen coordinates
      const activeItems = Array.from(activeBaseBeaconsMap.values());
      const screenBoxes = activeItems.map((item) => {
        // Growth animation
        if (item.group.userData?.isBeacon) {
          item.group.scale.y += (item.group.userData.targetScaleY - item.group.scale.y) * 0.12;
        }

        // Distance-based billboard scaling
        const dist = camPos.distanceTo(item.group.getWorldPosition(tempCamPos));
        const scaleMult = Math.max(0.75, Math.min(2.1, Math.pow(dist / 42, 0.72)));
        item.sprite.scale.set(4.5 * scaleMult, 1.38 * scaleMult, 1);

        // Project billboard center to screen coordinates
        item.sprite.getWorldPosition(tempVecA);
        tempVecA.project(camera);

        const sx = (tempVecA.x * 0.5 + 0.5) * domW;
        const sy = (-(tempVecA.y * 0.5) + 0.5) * domH;
        // Approximate pixel bounding box size
        const cardPxW = 145 * scaleMult;
        const cardPxH = 46 * scaleMult;

        return {
          item,
          sx,
          sy,
          cardPxW,
          cardPxH,
          z: tempVecA.z,
          isHovered: hoveredInfo?.code === item.group.userData.code
        };
      });

      // 2. Real-Time Pairwise Screen Collision Detection:
      // If two cards overlap on screen from the current camera angle, dynamically push them apart!
      for (let i = 0; i < screenBoxes.length; i++) {
        for (let j = i + 1; j < screenBoxes.length; j++) {
          const b1 = screenBoxes[i];
          const b2 = screenBoxes[j];

          // Skip if behind camera
          if (b1.z > 1.0 || b2.z > 1.0) continue;

          const dx = Math.abs(b1.sx - b2.sx);
          const dy = Math.abs(b1.sy - b2.sy);
          const requiredX = (b1.cardPxW + b2.cardPxW) * 0.52;
          const requiredY = (b1.cardPxH + b2.cardPxH) * 0.55;

          const overlapX = requiredX - dx;
          const overlapY = requiredY - dy;

          if (overlapX > 0 && overlapY > 0) {
            // Overlapping on screen!
            // Repel vertically in world units proportionally to screen overlap
            const pushStep = Math.min(1.8, (overlapY / requiredY) * 1.5);
            if (b1.sy < b2.sy) {
              // b1 is higher on screen -> push b1 higher in world space
              b1.item.repelOffsetY += pushStep * 0.5;
              b2.item.repelOffsetY -= pushStep * 0.5;
            } else {
              b1.item.repelOffsetY -= pushStep * 0.5;
              b2.item.repelOffsetY += pushStep * 0.5;
            }
          }
        }
      }

      // 3. Smooth Lerp & Leader Beam adjustment
      activeItems.forEach((item) => {
        // Clamp repulsion to graceful bounds (-2.0 to +4.5)
        item.repelOffsetY = Math.max(-2.0, Math.min(4.5, item.repelOffsetY));
        item.targetHeight = item.baseHeight + item.repelOffsetY;

        // Smooth transition
        item.currentHeight += (item.targetHeight - item.currentHeight) * 0.14;

        // Update card position and glowing leader beam scale
        item.sprite.position.y = item.currentHeight + 0.6;
        item.beamMesh.scale.y = Math.max(0.8, item.currentHeight);

        // Bring hovered card forward in renderOrder
        const isHovered = hoveredInfo?.code === item.group.userData.code;
        item.sprite.renderOrder = isHovered ? 999 : item.rank === 1 ? 50 : 20;

        // Soft decay so cards return to their resting tiered height when angle clears
        item.repelOffsetY *= 0.88;
      });

      // Hover beacon animation
      if (hoverBeaconGroup.visible) {
        if (hoverBeaconGroup.userData?.isBeacon) {
          hoverBeaconGroup.scale.y += (hoverBeaconGroup.userData.targetScaleY - hoverBeaconGroup.scale.y) * 0.14;
        }
        const dist = camPos.distanceTo(hoverBeaconGroup.getWorldPosition(tempVecB));
        const scaleMult = Math.max(0.75, Math.min(2.1, Math.pow(dist / 42, 0.72)));
        hoverSprite.scale.set(4.5 * scaleMult, 1.38 * scaleMult, 1);
        hoverSprite.renderOrder = 1000;
      }

      particleSystem.rotation.y += 0.0003;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Resize Handlers
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

    const handleExportEvent = () => exportMapPNG();
    window.addEventListener('export-map-png', handleExportEvent);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('export-map-png', handleExportEvent);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Real-time smooth scaling of outer extrusion depth (60fps)
  useEffect(() => {
    extrudeDepthRef.current = extrudeDepth;

    if (topGroupRef.current) {
      topGroupRef.current.position.y = extrudeDepth;
    }
    if (sideWallMeshRef.current) {
      sideWallMeshRef.current.scale.y = extrudeDepth;
    }
    if (outerTopLineRef.current) {
      outerTopLineRef.current.scale.y = extrudeDepth;
    }
    if (baseBeaconsGroupRef.current) {
      baseBeaconsGroupRef.current.position.y = extrudeDepth;
    }
    if (dynamicArcsGroupRef.current) {
      dynamicArcsGroupRef.current.position.y = extrudeDepth;
    }
    if (hoverBeaconGroupRef.current) {
      hoverBeaconGroupRef.current.position.y = extrudeDepth;
    }
  }, [extrudeDepth]);

  // Update Extrude Wall Color in real time (White / Silver / Marble / Ice)
  useEffect(() => {
    extrudeWallColorRef.current = extrudeWallColor;
    const cfg = EXTRUDE_WALL_COLORS[extrudeWallColor];

    if (sideWallMeshRef.current) {
      const mat = sideWallMeshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.setHex(cfg.hex);
        mat.needsUpdate = true;
      }
    }
    if (outerTopLineRef.current) {
      const lineMat = outerTopLineRef.current.material as THREE.LineBasicMaterial;
      if (lineMat) {
        lineMat.color.setHex(cfg.lineHex);
        lineMat.needsUpdate = true;
      }
    }
  }, [extrudeWallColor]);

  // Update Province Highlight Color when selection or metric changes
  useEffect(() => {
    selectedMeshCodeRef.current = selectedProvinceCode;
    activeMetricRef.current = activeMetric;

    if (updateBaseBeaconsRef.current) {
      updateBaseBeaconsRef.current(activeMetric, selectedProvinceCode);
    }
    if (updateHoverBeaconRef.current) {
      updateHoverBeaconRef.current(null);
    }
    if (updateProvincesVisualRef.current) {
      updateProvincesVisualRef.current();
    }
  }, [selectedProvinceCode, activeMetric]);

  // View reset helper
  const resetCamera = () => {
    isResettingRef.current = true;
  };

  const setTopDownView = () => {
    isResettingRef.current = false;
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 70, 0.1);
    controlsRef.current.target.set(0, 0, 0);
  };

  return (
    <div className="relative w-full h-full min-h-[480px] flex flex-col items-center justify-center overflow-hidden bg-[#060d1a] rounded-sm border border-cyan-500/40 select-none">
      
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing relative" />

      {/* Top Left: Domain Categories with Dropdown Indicators */}
      <div 
        ref={categoryNavRef}
        className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-[#0b172a]/95 backdrop-blur-md p-1.5 rounded border border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,254,0.18)]"
      >
        {CANVAS_THEMES.map((cat) => {
          const isCatActive = 
            currentMode === cat.id || 
            (cat.id === 'trade' && activeMetric === 'export') ||
            (cat.id === 'osb' && ['osb', 'osb_area', 'osb_parsel', 'osb_active'].includes(activeMetric)) ||
            (cat.id === 'women' && activeMetric === 'women') ||
            (cat.id === 'demography' && ['gdp', 'ses', 'population', 'unemployment', 'education', 'hospital_beds'].includes(activeMetric));
          
          const isOpen = openCategory === cat.id;

          return (
            <div key={cat.id} className="relative">
              <button
                onClick={() => {
                  setIsCatalogOpen(false);
                  setOpenCategory(isOpen ? null : cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-['Rajdhani'] font-bold tracking-wider transition-all rounded-xs border ${
                  isOpen
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_#00f2fe]'
                    : isCatActive
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(0,242,254,0.35)]'
                    : 'text-slate-300 hover:text-white bg-[#061122]/70 border-cyan-500/20 hover:border-cyan-500/50'
                }`}
                title={`${cat.label} göstergelerini listele ve haritada göster`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-950' : 'text-cyan-400'}`} />
                {isCatActive && !isOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f2fe] animate-pulse" />
                )}
              </button>

              {/* Dropdown Menu for this category */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-2 bg-[#071328]/98 backdrop-blur-2xl border border-cyan-400/70 shadow-[0_12px_40px_rgba(0,0,0,0.85)] rounded-xs flex flex-col gap-1 select-none text-white animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 border-b border-cyan-500/30 flex items-center justify-between text-[11px] font-['Orbitron'] font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5 uppercase">
                      {cat.icon}
                      {cat.label} GÖSTERGELERİ
                    </span>
                    <span className="font-mono text-[9px] bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-500/30">
                      {cat.items.length} GÖSTERGE
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 pt-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {cat.items.map((item) => {
                      const isItemActive = activeMetric === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (onMetricChange) onMetricChange(item.id);
                            if (onModeChange) onModeChange(cat.id);
                            setOpenCategory(null);
                          }}
                          className={`flex items-start justify-between gap-2 p-2 rounded-xs text-left transition-all ${
                            isItemActive
                              ? 'bg-cyan-500/25 border border-cyan-400 text-white shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                              : 'bg-[#0a1c38]/40 border border-transparent hover:bg-cyan-950/70 hover:border-cyan-500/40 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-['Rajdhani'] font-bold text-xs text-slate-100">
                                {item.label}
                              </span>
                              <span className="font-mono text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-500/30 shrink-0">
                                {item.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-cyan-400/80 font-mono">
                                {item.source}
                              </span>
                              <span className="text-[10px] text-slate-400 font-['Rajdhani'] truncate">
                                · {item.desc}
                              </span>
                            </div>
                          </div>

                          {isItemActive && (
                            <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="h-4 w-[1px] bg-cyan-500/30 mx-1 hidden sm:block" />

        {/* Global Catalog Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setOpenCategory(null);
              setIsCatalogOpen(!isCatalogOpen);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Rajdhani'] font-bold tracking-wider transition-all rounded-xs border ${
              isCatalogOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_12px_#00f2fe]'
                : !['export', 'osb', 'women', 'population', 'gdp'].includes(activeMetric)
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:text-white hover:bg-cyan-500/20'
            }`}
            title="Tüm Ulusal Göstergeler Kataloğu & Arama"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {!['export', 'osb', 'women', 'population', 'gdp'].includes(activeMetric)
                ? `KATALOG: ${getCategoryLabel(activeMetric).toUpperCase()}`
                : 'TÜM KATALOG'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Catalog Popover */}
          {isCatalogOpen && (
            <div
              ref={catalogPopoverRef}
              className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-96 max-h-[460px] overflow-hidden bg-[#071328]/98 backdrop-blur-2xl border border-cyan-400/60 shadow-[0_12px_40px_rgba(0,0,0,0.85)] rounded-xs flex flex-col select-none text-white animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Popover Header & Search */}
              <div className="p-3 border-b border-cyan-500/30 bg-[#0b1c38]/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Ulusal Gösterge Kataloğu
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-xs border border-cyan-500/40">
                    15 GÖSTERGE
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Göstergelerde ara (örn: işsizlik, SEGE, parsel...)"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full bg-[#051024] border border-cyan-500/40 rounded-xs pl-8 pr-3 py-1.5 text-xs font-['Rajdhani'] text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>
              </div>

              {/* Categorized Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar max-h-[340px]">
                {filteredCatalog.map((cat, cIdx) => (
                  <div key={cIdx} className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-['Orbitron'] font-bold tracking-wider text-cyan-400/80 border-b border-cyan-500/20 uppercase flex items-center justify-between">
                      <span>{cat.name}</span>
                      <span className="text-[9px] font-mono opacity-60">{cat.items.length}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 pt-1">
                      {cat.items.map((item) => {
                        const isSelected = activeMetric === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onMetricChange && onMetricChange(item.id);
                              setIsCatalogOpen(false);
                            }}
                            className={`flex items-start justify-between gap-2 p-2 rounded-xs text-left transition-all ${
                              isSelected
                                ? 'bg-cyan-500/25 border border-cyan-400 text-white shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                                : 'bg-[#0a1c38]/50 border border-transparent hover:bg-cyan-950/70 hover:border-cyan-500/40 text-slate-300 hover:text-white'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-['Rajdhani'] font-bold text-xs text-slate-100">
                                  {item.label}
                                </span>
                                <span className="font-mono text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-500/30">
                                  {item.unit}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-['Rajdhani'] leading-tight mt-0.5">
                                {item.desc}
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredCatalog.length === 0 && (
                  <div className="py-6 text-center text-xs font-['Rajdhani'] text-slate-400">
                    Aranan kritere uygun gösterge bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Camera, Extrude Pedestal Settings & PNG Export */}
      <div className="absolute top-3 right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 bg-[#0b172a]/90 backdrop-blur-md p-1.5 rounded border border-cyan-500/50 text-cyan-300 shadow-lg">
          {/* PNG Export */}
          <button
            onClick={exportMapPNG}
            className="flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold rounded transition-colors hover:bg-cyan-500/20 text-cyan-300 hover:text-white"
            title="Google Earth 3D Harita Görüntüsünü PNG Olarak İndir"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">PNG İNDİR</span>
          </button>

          {/* 3D Extrude Size & Light-Color Pedestal Settings */}
          <div className="relative">
            <button
              onClick={() => setIsExtrudeOpen(!isExtrudeOpen)}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold rounded transition-colors ${
                isExtrudeOpen
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe]'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-500/20'
              }`}
              title="3D Harita Dış Sınır Kabartma Derinliği ve Açık Kaide Rengi"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KABARTMA: {extrudeDepth.toFixed(1)}x</span>
            </button>

            {/* Slider Popover with Light-Color Extrude Options */}
            {isExtrudeOpen && (
              <div 
                ref={extrudePopoverRef}
                className="absolute top-full right-0 mt-2 z-50 w-72 p-3 bg-[#071328]/95 backdrop-blur-xl border border-cyan-400/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xs flex flex-col gap-2.5 select-none text-white"
              >
                <div className="flex items-center justify-between text-xs font-['Rajdhani'] font-bold">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-cyan-300">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    3D Türkiye Dış Kaide
                  </span>
                  <span className="font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 border border-cyan-500/30 rounded-xs text-[11px] font-bold">
                    {extrudeDepth.toFixed(1)}x
                  </span>
                </div>

                <p className="text-[11px] font-['Rajdhani'] text-slate-300 -mt-1">
                  Türkiye&apos;nin en dış kıyı ve kara sınırlarının 3D derinlik boyutu:
                </p>

                {/* Minimalist Slider */}
                <div className="py-1">
                  <input
                    type="range"
                    min="0.2"
                    max="3.5"
                    step="0.05"
                    value={extrudeDepth}
                    onChange={(e) => setExtrudeDepth(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none accent-cyan-500"
                    style={{
                      background: `linear-gradient(to right, #00f2fe 0%, #00f2fe ${((extrudeDepth - 0.2) / (3.5 - 0.2)) * 100}%, rgba(100, 116, 139, 0.4) ${((extrudeDepth - 0.2) / (3.5 - 0.2)) * 100}%, rgba(100, 116, 139, 0.4) 100%)`
                    }}
                  />
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
                    <span>0.2x (İnce Kaide)</span>
                    <span>0.7x (Varsayılan)</span>
                    <span>3.5x (Yüksek 3D Blok)</span>
                  </div>
                </div>

                {/* Extrude Side Wall Light Color Options */}
                <div className="pt-2 border-t border-cyan-500/20">
                  <span className="text-[11px] font-['Rajdhani'] font-bold text-slate-300 block mb-1.5">
                    Kaide Açık Rengi:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(EXTRUDE_WALL_COLORS) as ExtrudeWallColorType[]).map((clrKey) => (
                      <button
                        key={clrKey}
                        onClick={() => setExtrudeWallColor(clrKey)}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-['Rajdhani'] font-bold rounded-xs border transition-colors ${
                          extrudeWallColor === clrKey
                            ? 'bg-cyan-500/30 border-cyan-400 text-white'
                            : 'bg-[#0f2444] border-cyan-500/20 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-xs" 
                          style={{ backgroundColor: '#' + EXTRUDE_WALL_COLORS[clrKey].hex.toString(16).padStart(6, '0') }} 
                        />
                        <span>{EXTRUDE_WALL_COLORS[clrKey].name.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-cyan-500/20">
                  {[
                    { label: 'Hafif 0.4x', val: 0.4 },
                    { label: 'Varsayılan 0.7x', val: 0.7 },
                    { label: 'Yüksek 2.0x', val: 2.0 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setExtrudeDepth(preset.val)}
                      className={`py-1 text-[11px] font-['Rajdhani'] font-bold rounded-xs transition-colors ${
                        Math.abs(extrudeDepth - preset.val) < 0.1
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#0f2444] border border-cyan-500/20 text-cyan-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold rounded transition-colors hover:text-white hover:bg-cyan-500/20 text-cyan-300"
            title="Kamera Açısını Sıfırla (Perspektif)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">SIFIRLA</span>
          </button>

          <button
            onClick={setTopDownView}
            className="flex items-center gap-1 px-2 py-1 text-xs font-['Rajdhani'] font-bold rounded transition-colors hover:text-white hover:bg-cyan-500/20 text-cyan-300"
            title="Kuşbakışı (2D/3D Dik Açı) Görünüme Geç"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DİK AÇI</span>
          </button>
        </div>

        {/* Live Kiosk Transition & Countdown Pill under right menu */}
        {isAutoPlay && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xs bg-[#05132d]/95 backdrop-blur-xl border border-cyan-400/50 shadow-[0_6px_24px_rgba(0,0,0,0.65)] select-none animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="font-['Rajdhani'] font-bold text-xs tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(0,242,254,0.4)] whitespace-nowrap">
                {autoPlayStepTitle || 'CANLI SUNUM'}
              </span>
            </div>
            
            {/* Progress Bar (cyan to amber gradient) */}
            <div className="w-20 sm:w-24 h-2 bg-[#020712] rounded-full overflow-hidden border border-cyan-500/40 p-[1px] shadow-inner shrink-0">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(0,242,254,0.6)]"
                style={{ width: `${Math.min(100, Math.max(0, autoPlayProgress || 0))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Info Card */}
      {hoveredInfo && (
        <div
          className="fixed pointer-events-none z-50 p-2.5 rounded shadow-2xl backdrop-blur-md border border-cyan-400 bg-[#040e20]/95 text-white text-xs font-['Rajdhani'] transition-transform transform -translate-x-1/2 -translate-y-full -mt-3 select-none shadow-[0_0_20px_rgba(0,242,254,0.35)]"
          style={{ left: `${hoveredInfo.x}px`, top: `${hoveredInfo.y}px` }}
        >
          <div className="flex items-center gap-2 font-bold text-sm tracking-wider">
            <span className="text-cyan-400 font-mono">#{hoveredInfo.code}</span>
            <span className="text-white">{hoveredInfo.name.toUpperCase()}</span>
            {hoveredInfo.agency && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-xs">
                {hoveredInfo.agency}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-4 font-mono text-[11px]">
            <span className="text-slate-400">{getCategoryLabel(activeMetric)}:</span>
            <span className="text-amber-400 font-bold">
              {formatMetricDisplay(activeMetric, hoveredInfo.value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
