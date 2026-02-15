'use client';

import { useState } from 'react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  Clock,
  Bookmark,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const getCategoryColor = (category: string) => {
  const colors: Record<string, { dot: string; bg: string; text: string }> = {
    '観光': { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
    '公園': { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'ショップ': { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
    'カフェ': { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  };
  return colors[category] || { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-700' };
};

export function PlanScreen() {
  const { currentPlan, setScreen, togglePinSpot } = useNowgoStore();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  if (!currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400">プランが見つかりません</p>
      </div>
    );
  }

  const handleNextPlan = async () => {
    setIsGeneratingNext(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGeneratingNext(false);
  };

  const pinnedCount = currentPlan.pinnedSpots.length;
  const totalHours = Math.floor(currentPlan.totalDuration / 60);
  const totalMinutes = currentPlan.totalDuration % 60;
  const durationLabel = totalMinutes > 0
    ? `${totalHours}時間${totalMinutes}分`
    : `${totalHours}時間`;

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-5 pt-4 pb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          {pinnedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full">
              <Bookmark className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              <span className="text-blue-600 text-sm font-medium">{pinnedCount}件</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hero ── */}
      <div
        className="px-5 pt-6 pb-8"
        style={{ animation: 'scaleIn 0.5s ease-out both' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-400 text-sm">{durationLabel}のおでかけ</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            {currentPlan.startTime} スタート
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
              {currentPlan.spots.length} スポット
            </span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-500">
              徒歩移動
            </span>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="px-5 pb-32">
        <div className="max-w-2xl mx-auto">
          {currentPlan.spots.map((spot, index) => {
            const color = getCategoryColor(spot.category);
            const isLast = index === currentPlan.spots.length - 1;
            return (
              <div
                key={spot.id}
                className="flex gap-4"
                style={{ animation: `fadeInUp 0.5s ease-out ${index * 100 + 200}ms both` }}
              >
                {/* Timeline column */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm`}>
                    {index + 1}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  )}
                </div>

                {/* Content column */}
                <div className={`flex-1 min-w-0 ${isLast ? 'pb-4' : 'pb-6'}`}>
                  <p className="text-sm text-gray-400 tabular-nums mb-2">{spot.time}</p>

                  {/* Card */}
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                            {spot.category}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {spot.duration}分
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{spot.name}</h3>
                      </div>
                      <button
                        onClick={() => togglePinSpot(spot.id)}
                        className={`p-2 rounded-xl active:scale-90 transition-all flex-shrink-0 ${
                          currentPlan.pinnedSpots.includes(spot.id)
                            ? 'bg-blue-50 text-blue-500'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-white'
                        }`}
                      >
                        <Bookmark
                          className="w-4 h-4"
                          fill={currentPlan.pinnedSpots.includes(spot.id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{spot.description}</p>
                  </div>

                  {/* Walk label */}
                  {!isLast && (
                    <p className="text-xs text-gray-300 mt-3 ml-1">徒歩 5分</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-5 pt-3 pb-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleNextPlan}
            disabled={isGeneratingNext}
            className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGeneratingNext ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {pinnedCount > 0 ? '再作成' : '別のプラン'}
              </>
            )}
          </button>
          <button
            onClick={() => setScreen('executing')}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/25"
          >
            このプランで行く
          </button>
        </div>
      </div>
    </div>
  );
}
