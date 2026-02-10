'use client';

import { useState } from 'react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

const MOODS = [
  { label: 'まったり', description: 'のんびり過ごしたい日に' },
  { label: 'アクティブ', description: '元気に動き回りたい' },
  { label: 'バー', description: 'お酒を楽しみたい' },
  { label: '買い物', description: 'ショッピングを楽しむ' },
  { label: 'デート', description: '特別な時間を過ごす' },
  { label: '特別', description: '創作意欲を刺激する' },
];

export function MoodScreen() {
  const { setScreen, setPlan } = useNowgoStore();
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = async (mood: typeof MOODS[0]) => {
    setSelectedMood(mood.label);
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 rounded hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-black" strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-light tracking-wide text-black">MODE</h1>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 mb-8">
            あなたの気分に合わせて、ぴったりのプランを提案します
          </p>

          <div className="grid grid-cols-2 gap-4">
            {MOODS.map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMoodSelect(mood)}
                disabled={loading}
                className="border border-gray-200 rounded p-8 hover:bg-black hover:text-white hover:border-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-40 flex flex-col items-center justify-center gap-4"
              >
                {loading && selectedMood === mood.label ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-xs font-medium">生成中...</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 border border-current rounded-full" />
                    <div className="text-center">
                      <p className="text-sm font-medium mb-1">{mood.label}</p>
                      <p className="text-xs opacity-70">{mood.description}</p>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
