'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, MapPin, Footprints, Bookmark, Navigation, Building2 } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { markSpotsVisited, savePlanHistory } from '@/lib/storage';

// PlanScreen と同じカテゴリ色（テキスト＋ドット用）
const CATEGORY_TEXT: Record<string, string> = {
  'カフェ':       'text-amber-600',
  'バー':         'text-amber-700',
  'ファッション': 'text-rose-600',
  '雑貨':         'text-pink-600',
  'ショッピング': 'text-orange-600',
  'ミュージアム': 'text-violet-600',
  'ギャラリー':   'text-purple-600',
  '自然':         'text-green-600',
  'エンタメ':     'text-red-500',
  'いきもの':     'text-cyan-600',
  '寺社':         'text-stone-600',
  'まち歩き':     'text-teal-600',
  'リラックス':   'text-sky-600',
  'グルメ':       'text-orange-700',
  'ランドマーク': 'text-indigo-600',
  'スポーツ':     'text-emerald-600',
};

const WALK_TEXTS = [
  'てくてく歩いて…',
  'ぶらぶら移動して…',
  'お散歩しながら…',
  'すぐ近く！',
  'ちょっと歩くと…',
];

export function ExecutionScreen() {
  const { currentPlan, setScreen, startLocation } = useNowgoStore();
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
    if (pct >= 100) return '🎉 フィナーレ！';
    if (pct >= 66) return '🔥 いい感じ！';
    if (pct >= 33) return '✨ 乗ってきた';
    return '👟 スタート！';
  }, [progressPct]);

  const walkText = useMemo(
    () => WALK_TEXTS[Math.floor(Math.random() * WALK_TEXTS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSpotIndex]
  );

  const handleNext = () => {
    if (currentSpotIndex < currentPlan.spots.length - 1) {
      setCurrentSpotIndex(currentSpotIndex + 1);
      setExpandSchedule(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    // 全スポットを訪問済みとして記録 + プラン履歴を保存（fire-and-forget）
    const spotIds = currentPlan.spots.map((s) => s.id);
    markSpotsVisited(spotIds);

    const { startLocation } = useNowgoStore.getState();
    savePlanHistory({
      spots: currentPlan.spots,
      startTime: currentPlan.startTime,
      totalDuration: currentPlan.totalDuration,
      startLocationLabel: startLocation.label || undefined,
    });

    setShowExitDialog(false);
    setScreen('dashboard');
  };

  const currentCatText = CATEGORY_TEXT[currentSpot.category] ?? 'text-blue-600';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-5 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowExitDialog(true)}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
              Now
            </span>
            <span className="text-sm font-semibold text-gray-800 tabular-nums">
              {currentSpotIndex + 1} / {currentPlan.spots.length}
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Progress */}
        <div className="max-w-6xl mx-auto mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              旅の達成度 <span className="font-semibold text-gray-700 tabular-nums">{Math.round(progressPct)}%</span>
            </span>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
              {progressLabel}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current spot */}
      <div className="px-5 pt-8 pb-6" key={currentSpotIndex}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg ring-1 ring-gray-200/60 p-6">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <span className="font-extralight leading-none tabular-nums select-none text-gray-300 text-5xl">
                  {String(currentSpotIndex + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">{currentSpot.time}</span>
                  <span className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    Now
                  </span>
                </div>
              </div>

              {/* Spot name */}
              <h1 className="text-2xl font-bold text-gray-900 mt-4 leading-tight">
                {currentSpot.name}
              </h1>
              <div className="w-10 h-[3px] bg-blue-600 mt-2.5 rounded-full" />

              {/* Category & duration */}
              <p className="text-xs mt-3">
                <span className={`${currentCatText} font-semibold inline-flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
                  {currentSpot.category}
                </span>
                <span className="text-gray-400"> · {currentSpot.duration}分</span>
              </p>

              {/* Description */}
              {currentSpot.description && (
                <p
                  className="text-sm text-gray-500 mt-3 leading-relaxed overflow-hidden"
                  style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis' }}
                >
                  {currentSpot.description}
                </p>
              )}

              {/* Building info */}
              {currentSpot.building && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>{currentSpot.building}内</span>
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  今ここ
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1.5">
                  <Footprints className="w-3.5 h-3.5 text-gray-400" />
                  徒歩で移動
                </span>
              </div>

              {/* Google Maps navigation */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentSpot.lat},${currentSpot.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-2xl font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                スポットへ行く
              </a>
          </div>
        </div>
      </div>

      {/* Next & Schedule */}
      <div className="px-5 pt-1 pb-36">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Connector to next */}
          {nextSpot && (() => {
            const isSameBuilding = currentSpot.building && nextSpot.building && currentSpot.building === nextSpot.building;
            return (
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-300">
                <div className="w-px h-3 border-l border-dashed border-gray-200" />
                {isSameBuilding ? (
                  <>
                    <Building2 className="w-3 h-3" />
                    <span>同じ{currentSpot.building}内！</span>
                  </>
                ) : (
                  <>
                    <Footprints className="w-3 h-3" />
                    <span>{walkText}</span>
                  </>
                )}
                <div className="w-px h-3 border-l border-dashed border-gray-200" />
              </div>
            );
          })()}

          {/* Next spot */}
          {nextSpot && (() => {
            const nextCatText = CATEGORY_TEXT[nextSpot.category] ?? 'text-blue-600';
            return (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Next</p>
                <div className="bg-white rounded-3xl p-5 shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="font-extralight leading-none tabular-nums select-none text-gray-300 text-3xl">
                      {String(currentSpotIndex + 2).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{nextSpot.name}</p>
                      <p className="mt-1 text-xs">
                        <span className={`${nextCatText} font-semibold inline-flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
                          {nextSpot.category}
                        </span>
                        <span className="text-gray-400"> · {nextSpot.time} · {nextSpot.duration}分</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      つぎ！
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Last spot message */}
          {isLastSpot && (
            <div className="bg-white rounded-3xl p-6 shadow-md text-center">
              <p className="text-sm font-semibold text-gray-900">🎉 最後のスポットです</p>
              <p className="text-xs text-gray-500 mt-1">このまま気持ちよく締めよう。</p>
            </div>
          )}

          {/* Remaining schedule */}
          {remainingSpots.length > 0 && (
            <div>
              <button
                onClick={() => setExpandSchedule(!expandSchedule)}
                className="flex items-center justify-between w-full py-2"
              >
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">この後</p>
                <ChevronDown
                  className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${
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
                  {remainingSpots.map((spot, idx) => {
                    const catText = CATEGORY_TEXT[spot.category] ?? 'text-blue-600';
                    return (
                      <div
                        key={spot.id}
                        className="flex items-center gap-3 py-3 px-4 bg-white rounded-2xl shadow-sm"
                      >
                        <span className="font-extralight text-gray-300 text-lg tabular-nums select-none flex-shrink-0">
                          {String(currentSpotIndex + 3 + idx).padStart(2, '0')}
                        </span>
                        <p className="text-sm text-gray-700 flex-1 min-w-0 truncate">{spot.name}</p>
                        <span className={`text-[11px] ${catText} font-semibold inline-flex items-center gap-1`}>
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
                          {spot.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-5 pt-3 pb-6 z-10">
        <div className="max-w-lg mx-auto">
          {isLastSpot ? (
            <button
              onClick={() => setShowExitDialog(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]"
            >
              プランを完了する 🎉
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(true)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                終了する
              </button>
              <button
                onClick={handleNext}
                className="flex-[1.2] py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]"
              >
                次のスポットへ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exit dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 w-full sm:max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">プランを終了しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">ホーム画面に戻ります。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors"
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
