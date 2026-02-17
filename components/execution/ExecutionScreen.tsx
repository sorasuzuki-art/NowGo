'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, MapPin, Sparkles, Footprints, Clock } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';

export function ExecutionScreen() {
  const { currentPlan, setScreen } = useNowgoStore();
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0);
  const [expandSchedule, setExpandSchedule] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  if (!currentPlan) return null;

  const currentSpot = currentPlan.spots[currentSpotIndex];
  const nextSpot = currentPlan.spots[currentSpotIndex + 1];
  const isLastSpot = currentSpotIndex === currentPlan.spots.length - 1;
  const remainingSpots = currentPlan.spots.slice(currentSpotIndex + 2);

  const progressPct = useMemo(
    () => ((currentSpotIndex + 1) / currentPlan.spots.length) * 100,
    [currentSpotIndex, currentPlan.spots.length]
  );

  const progressLabel = useMemo(() => {
    const pct = Math.round(progressPct);
    if (pct >= 100) return 'フィナーレ！';
    if (pct >= 66) return 'いい感じ！';
    if (pct >= 33) return '乗ってきた';
    return 'スタート！';
  }, [progressPct]);

  const handleNext = () => {
    if (currentSpotIndex < currentPlan.spots.length - 1) {
      setCurrentSpotIndex(currentSpotIndex + 1);
      setExpandSchedule(false);
    }
  };

  const handleComplete = () => {
    setShowExitDialog(false);
    setScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-stone-100 px-5 pt-4 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowExitDialog(true)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5 text-stone-800" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              NOW
            </span>
            <span className="text-sm text-stone-500 tabular-nums">
              {currentSpotIndex + 1} / {currentPlan.spots.length}
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Progress */}
        <div className="max-w-lg mx-auto mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-500">
              旅の達成度 <span className="font-semibold text-stone-700 tabular-nums">{Math.round(progressPct)}%</span> · {progressLabel}
            </span>
            <span className="text-xs text-stone-400 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              テンポ良くいこ
            </span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current spot */}
      <div className="px-5 pt-8 pb-6" key={currentSpotIndex}>
        <div className="max-w-lg mx-auto">
          <div className="rounded-[28px] overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-500 to-cyan-400 shadow-sm">
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/20">
                  {currentSpot.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/15">
                  <Clock className="w-4 h-4" />
                  {currentSpot.duration}分
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mt-4 leading-tight">
                {currentSpot.name}
              </h1>

              {currentSpot.description && (
                <p className="text-sm text-white/85 mt-3 max-w-sm mx-auto leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {currentSpot.description}
                </p>
              )}

              <div className="flex items-center justify-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm text-white/90 ring-1 ring-white/15">
                  <MapPin className="w-4 h-4" />
                  今ここ
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-sm text-white/90 ring-1 ring-white/15">
                  <Footprints className="w-4 h-4" />
                  徒歩で移動
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next & Schedule */}
      <div className="px-5 pt-1 pb-36">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Next spot */}
          {nextSpot && (
            <div>
              <p className="text-xs font-semibold text-stone-400 mb-2 tracking-wider uppercase">Next</p>
              <div className="bg-white rounded-3xl p-4 shadow-sm ring-1 ring-stone-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{nextSpot.name}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {nextSpot.category} · <span className="font-semibold text-indigo-600">徒歩5分</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5 text-[11px] font-semibold">
                    つぎ！
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-3">
                  次は、5分歩いて… <span className="text-stone-600 font-semibold">ワクワク上げよ</span>
                </p>
              </div>
            </div>
          )}

          {/* Last spot */}
          {isLastSpot && (
            <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-stone-100 text-center">
              <p className="text-sm font-semibold text-stone-900">最後のスポットです</p>
              <p className="text-xs text-stone-500 mt-1">このまま気持ちよく締めよう。</p>
            </div>
          )}

          {/* Remaining schedule */}
          {remainingSpots.length > 0 && (
            <div>
              <button
                onClick={() => setExpandSchedule(!expandSchedule)}
                className="flex items-center justify-between w-full py-2"
              >
                <p className="text-xs font-semibold text-stone-400 tracking-wider uppercase">この後</p>
                <ChevronDown
                  className={`w-4 h-4 text-stone-300 transition-transform duration-300 ${
                    expandSchedule ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandSchedule ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-2 pt-1">
                  {remainingSpots.map((spot, idx) => (
                    <div
                      key={spot.id}
                      className="flex items-center gap-3 py-3 px-4 bg-white rounded-2xl shadow-sm ring-1 ring-stone-100"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center flex-shrink-0 tabular-nums">
                        {currentSpotIndex + 3 + idx}
                      </div>
                      <p className="text-sm text-stone-700 flex-1 min-w-0 truncate">{spot.name}</p>
                      <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        {spot.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-stone-100 px-5 pt-3 pb-6 z-10">
        <div className="max-w-lg mx-auto space-y-2">
          {isLastSpot ? (
            <button
              onClick={() => setShowExitDialog(true)}
              className="w-full py-3.5 rounded-full font-bold text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition-colors"
            >
              プランを完了する
            </button>
          ) : (
            <>
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-full font-bold text-white bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition-colors"
              >
                次のスポットへ
              </button>
              <button
                onClick={() => setShowExitDialog(true)}
                className="w-full py-2.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                プランを終了する
              </button>
            </>
          )}
        </div>
      </div>

      {/* Exit dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 w-full sm:max-w-sm">
            <h3 className="text-lg font-bold text-stone-900 mb-1">プランを終了しますか？</h3>
            <p className="text-sm text-stone-500 mb-6">ホーム画面に戻ります。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3.5 rounded-full font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3.5 rounded-full font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
              >
                終了する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
