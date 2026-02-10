'use client';

import { useNowgoStore } from '@/hooks/useNowgoStore';
import { ArrowLeft, ChevronRight, Sparkles, Cloud, Camera, MapPin, Coffee, Moon, Compass, Users } from 'lucide-react';

const THEMES = [
  {
    title: '雨の日プラン',
    description: '屋内で楽しむコース',
    duration: '2-3時間',
    icon: Cloud,
    color: 'from-slate-400 to-slate-600',
    bgColor: 'bg-slate-50',
    spots: 5,
  },
  {
    title: 'Instagram映え',
    description: '写真映えスポット巡り',
    duration: '3-4時間',
    icon: Camera,
    color: 'from-rose-400 to-rose-600',
    bgColor: 'bg-rose-50',
    spots: 8,
  },
  {
    title: '地元民コース',
    description: '隠れた名店を発見',
    duration: '2-3時間',
    icon: Compass,
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-50',
    spots: 6,
  },
  {
    title: '初めての渋谷',
    description: '定番スポットを巡る',
    duration: '3-4時間',
    icon: MapPin,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    spots: 7,
  },
  {
    title: 'カフェホッピング',
    description: 'おしゃれカフェ3軒巡り',
    duration: '3-4時間',
    icon: Coffee,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-50',
    spots: 3,
  },
  {
    title: 'ナイトプラン',
    description: '夜の街を楽しむ',
    duration: '2-3時間',
    icon: Moon,
    color: 'from-indigo-400 to-indigo-600',
    bgColor: 'bg-indigo-50',
    spots: 4,
  },
  {
    title: 'デートコース',
    description: '二人で楽しむ特別な時間',
    duration: '4-5時間',
    icon: Users,
    color: 'from-pink-400 to-pink-600',
    bgColor: 'bg-pink-50',
    spots: 5,
  },
  {
    title: '新規開拓',
    description: 'まだ知らない場所へ',
    duration: '2-3時間',
    icon: Sparkles,
    color: 'from-cyan-400 to-cyan-600',
    bgColor: 'bg-cyan-50',
    spots: 6,
  },
];

export function ThemesScreen() {
  const { setScreen, setPlan } = useNowgoStore();

  const handleSelectTheme = () => {
    setPlan({
      spots: [
        {
          id: '1',
          name: 'カフェ モーニング',
          category: 'カフェ',
          description: '落ち着いた雰囲気のカフェ',
          time: '14:00',
          duration: 60,
          lat: 35.6595,
          lng: 139.7004,
        },
        {
          id: '2',
          name: '公園散策',
          category: '公園',
          description: '緑豊かな公園でリフレッシュ',
          time: '15:15',
          duration: 45,
          lat: 35.6595,
          lng: 139.7004,
        },
      ],
      startTime: '14:00',
      totalDuration: 120,
      pinnedSpots: [],
    });
    setScreen('plan');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-40 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <header className="relative z-10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() => setScreen('dashboard')}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Themes</h1>
              <p className="text-sm text-white/70">Pick a theme for your adventure</p>
            </div>
          </div>
        </header>
      </div>

      <main className="px-6 py-6 -mt-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.title}
                  onClick={handleSelectTheme}
                  className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {theme.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{theme.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">
                          {theme.duration}
                        </span>
                        <span className="text-xs text-gray-400">
                          {theme.spots} spots
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all mt-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
