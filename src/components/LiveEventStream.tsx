import React, { useState, useEffect } from 'react';
import { Activity, Bell, ChevronRight, Zap } from 'lucide-react';

interface EventItem {
  id: string;
  time: string;
  source: string;
  title: string;
  type: 'trade' | 'osb' | 'women' | 'agency';
}

const INITIAL_EVENTS: EventItem[] = [
  { id: '1', time: '14:28:10', source: 'TÜİK Dış Ticaret', title: 'İstanbul 2025 yılı ihracat hacmi 131.2 Milyar $ seviyesini aştı.', type: 'trade' },
  { id: '2', time: '14:26:45', source: 'OSBÜK Analitik', title: 'Kocaeli ve Bursa sanayi OSB parsel doluluk oranı %96.4 olarak kaydedildi.', type: 'osb' },
  { id: '3', time: '14:22:18', source: 'Bölgesel Kalkınma', title: 'İzmir ve Manisa kadın ihracat payında Ege bölgesi öncüsü konumunu koruyor.', type: 'women' },
  { id: '4', time: '14:18:02', source: 'İpekyolu Ajansı', title: 'Gaziantep sanayi ihracatı 10.7 Milyar $ ile bölge lokomotifi oldu.', type: 'agency' },
  { id: '5', time: '14:12:30', source: 'Sanayi Bakanlığı', title: 'Türkiye geneli 418 OSB içinde 276 OSB tam kapasite faaliyette.', type: 'osb' },
  { id: '6', time: '14:05:14', source: 'TÜİK CIP', title: 'Kişi başı elektrik tüketimi ve altyapı şebekesi kapsama oranı %99.2.', type: 'trade' }
];

export const LiveEventStream: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);

  // Periodic simulated live notification
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const time = now.toLocaleTimeString('tr-TR', { hour12: false });
      const sampleTitles = [
        'Sakarya otomotiv ihracatında yıllık 6.2 Milyar $ hacme ulaştı.',
        'Denizli tekstil ve kablo ihracatı 4.6 Milyar $ ile rekor kırdı.',
        'Ankara savunma ve yazılım ihracatı 18.5 Milyar $ seviyesine yükseldi.',
        'Konya ve Karaman tarımsal makine ve gıda OSB ihracatını %12 artırdı.',
        'Hatay ve Çukurova bölgesinde toparlanma ihracatı 3.8 Milyar dolara ulaştı.'
      ];
      const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      const newEv: EventItem = {
        id: Date.now().toString(),
        time,
        source: 'Veri Radarı',
        title: randomTitle,
        type: 'trade'
      };
      setEvents((prev) => [newEv, ...prev.slice(0, 5)]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 h-full overflow-hidden select-none font-['Rajdhani']">
      <div className="flex items-center justify-between text-xs mb-0.5 pb-1 border-b border-cyan-500/20">
        <span className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Canlı Akış ve Bölgesel Bildirimler
        </span>
        <span className="text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
          LIVE STREAM
        </span>
      </div>

      <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="p-1.5 rounded-xs bg-[#05142f]/60 border border-cyan-500/15 hover:border-cyan-400/40 transition-colors flex items-start gap-2"
          >
            <div className="mt-0.5">
              <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80 mb-0.5">
                <span className="font-bold text-slate-300">{ev.source}</span>
                <span>{ev.time}</span>
              </div>
              <p className="text-xs text-slate-200 leading-tight truncate">
                {ev.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
