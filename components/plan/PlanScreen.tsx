'use client';

import { useMemo, useState } from 'react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  Clock,
  Bookmark,
  Loader2,
  RefreshCw,
  MapPin,
  Sparkles,
  Footprints,
} from 'lucide-react';

export function PlanScreen() {
  const { currentPlan, setScreen, togglePinSpot } = useNowgoStore();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  if (!currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">プランが見つかりません</p>
      </div>
    );
  }

  const handleNextPlan = async () => {
    setIsGeneratingNext(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGeneratingNext(false);
  };

  const pinnedCount = currentPlan.pinnedSpots.length;

  const durationLabel = useMemo(() => {
    const totalHours = Math.floor(currentPlan.totalDuration / 60);
    const totalMinutes = currentPlan.totalDuration % 60;
    if (totalHours <= 0) return `${totalMinutes}分のおでかけ`;
    return totalMinutes > 0 ? `${totalHours}時間${totalMinutes}分のおでかけ` : `${totalHours}時間のおでかけ`;
  }, [currentPlan.totalDuration]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-stone-100 px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-800" />
          </button>
          <span className="text-sm font-semibold text-stone-800">プラン</span>
          {pinnedCount > 0 ? (
            <div className="flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span className="text-sm font-medium text-indigo-500 tabular-nums">{pinnedCount}</span>
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="px-5 pt-6 pb-4">
        <div className="max-w-lg mx-auto rounded-[28px] overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-500 to-cyan-400 shadow-sm">
          <div className="p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white/80">{durationLabel}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                今日はこれでいこ
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white mt-2 tracking-tight">
              {currentPlan.startTime} スタート
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm text-white/90 ring-1 ring-white/15">
                <MapPin className="w-4 h-4" />
                {currentPlan.spots.length}スポット
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm text-white/90 ring-1 ring-white/15">
                <Footprints className="w-4 h-4" />
                徒歩中心
              </span>
              {pinnedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm text-white/90 ring-1 ring-white/15">
                  <Bookmark className="w-4 h-4" />
                  お気に入り {pinnedCount}
                </span>
              )}
            </div>

            <p className="text-xs text-white/75 mt-4">
              迷ったら、とりあえず1つ目へ。テンポ良く進むほど楽しい。
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-36">
        <div className="max-w-lg mx-auto">
          {currentPlan.spots.map((spot, index) => {
            const isLast = index === currentPlan.spots.length - 1;
            const isPinned = currentPlan.pinnedSpots.includes(spot.id);
            const isNow = index === 0;

            return (
              <div key={spot.id} className="flex gap-4">
                {/* Left rail */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isNow ? 'bg-indigo-500 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-stone-200 my-1" />}
                </div>

                {/* Card */}
                <div className={`flex-1 min-w-0 ${isLast ? 'pb-4' : 'pb-5'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-400 mb-1.5 tabular-nums">{spot.time}</p>
                    {isNow && (
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                  </div>

                  <div
                    className={`bg-white rounded-3xl p-5 shadow-sm ring-1 transition-transform duration-200 active:scale-[0.99] ${
                      isNow ? 'ring-indigo-100' : 'ring-stone-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-stone-900 truncate">{spot.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-500">
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5">
                            {spot.category}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5">
                            <Clock className="w-3 h-3" />
                            {spot.duration}分
                          </span>
                          {isNow && (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5">
                              まずここ
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => togglePinSpot(spot.id)}
                        className={`p-2 rounded-2xl transition-colors flex-shrink-0 ${
                          isPinned
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-stone-300 hover:text-stone-400 hover:bg-stone-50'
                        }`}
                        aria-label={isPinned ? 'お気に入り解除' : 'お気に入りに追加'}
                      >
                        <Bookmark className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <p className="text-sm text-stone-600 mt-3 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {spot.description}
                    </p>
                  </div>

                  {!isLast && (
                    <p className="text-xs text-stone-400 mt-2.5 ml-1">
                      次は、徒歩5分で…
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-stone-100 px-5 pt-3 pb-6 z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleNextPlan}
            disabled={isGeneratingNext}
            className="flex-1 py-3.5 rounded-full font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            className="flex-1 py-3.5 rounded-full font-bold text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition-colors"
          >
            このプランで行く
          </button>
        </div>
      </div>
    </div>
  );
}
