'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  Bookmark,
  Loader2,
  RefreshCw,
  Footprints,
} from 'lucide-react';
import { toggleFavoriteSpot } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';

const PlanMap = dynamic(
  () => import('@/components/plan/PlanMap').then((mod) => mod.PlanMap),
  { ssr: false },
);

const CATEGORY_TEXT: Record<string, string> = {
  'カフェ':   'text-amber-600',
  '美術館':   'text-violet-600',
  '庭園':     'text-green-600',
  '雑貨':     'text-pink-600',
  'ショップ': 'text-orange-600',
  '水族館':   'text-cyan-600',
  '動物園':   'text-lime-600',
};

const CONNECTOR_TEXTS = [
  'てくてく歩いて…',
  'ぶらぶら移動して…',
  'お散歩しながら…',
  'すぐ近く！',
  'ちょっと歩くと…',
];

export function PlanScreen() {
  const { currentPlan, setScreen, togglePinSpot, startLocation, walkRangeMinutes, setPlan } = useNowgoStore();
  const { user, isGuest } = useAuth();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [shownSpotIds, setShownSpotIds] = useState<string[]>(() =>
    // 初回表示時のスポットIDを記録
    useNowgoStore.getState().currentPlan?.spots.map(s => s.id) ?? []
  );

  if (!currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">プランが見つかりません</p>
      </div>
    );
  }

  const handleNextPlan = async () => {
    setIsGeneratingNext(true);
    try {
      const { searchSpotsFromDB } = await import('@/lib/spotSearch');

      // 過去に表示した全スポットを除外
      const allExcludeIds = [...shownSpotIds];
      const spots = await searchSpotsFromDB({
        ...currentPlan.searchParams,
        origin: startLocation.lat != null && startLocation.lng != null
          ? { lat: startLocation.lat, lng: startLocation.lng } : undefined,
        walkRangeMinutes,
        userId: !isGuest && user ? user.id : undefined,
        excludeSpotIds: allExcludeIds,
      });

      if (spots.length === 0) {
        alert('条件に合うスポットが見つかりませんでした');
        return;
      }

      // 新しいスポットIDを蓄積
      setShownSpotIds(prev => [...prev, ...spots.map(s => s.id)]);

      const totalDuration = spots.reduce((sum, s) => sum + s.duration, 0);

      setPlan({
        spots,
        startTime: spots[0]?.time ?? currentPlan.startTime,
        totalDuration,
        pinnedSpots: [],
        searchParams: currentPlan.searchParams,
      });
    } catch (err) {
      console.error('Plan regeneration failed:', err);
      alert('プラン再作成中にエラーが発生しました');
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const pinnedCount = currentPlan.pinnedSpots.length;

  const heroMessage = useMemo(() => {
    const messages = [
      { emoji: '🎯', text: '今日はこれでいこ' },
      { emoji: '✨', text: 'いい感じのプラン' },
      { emoji: '🚀', text: '準備はOK？' },
      { emoji: '👟', text: 'さあ出発！' },
      { emoji: '🌈', text: 'いい一日になりそう' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  const connectorTexts = useMemo(() => {
    return currentPlan.spots.map(() =>
      CONNECTOR_TEXTS[Math.floor(Math.random() * CONNECTOR_TEXTS.length)]
    );
  }, [currentPlan.spots]);

  const durationLabel = useMemo(() => {
    const totalHours = Math.floor(currentPlan.totalDuration / 60);
    const totalMinutes = currentPlan.totalDuration % 60;
    if (totalHours <= 0) return `${totalMinutes}分`;
    return totalMinutes > 0 ? `${totalHours}時間${totalMinutes}分` : `${totalHours}時間`;
  }, [currentPlan.totalDuration]);

  // ── スポット一覧 ──
  const spotList = (
    <div className="space-y-3">
      {currentPlan.spots.map((spot, index) => {
        const isPinned = currentPlan.pinnedSpots.includes(spot.id);
        const isFirst = index === 0;
        const isLast = index === currentPlan.spots.length - 1;
        const catText = CATEGORY_TEXT[spot.category] ?? 'text-blue-600';

        return (
          <div key={spot.id}>
            <div className="bg-white rounded-3xl p-6 shadow-md">
              <div className="flex items-start justify-between">
                <span className={`font-extralight leading-none tabular-nums select-none text-gray-300 ${
                  isFirst ? 'text-5xl' : 'text-4xl'
                }`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 tabular-nums">{spot.time}</span>
                  <button
                    onClick={() => { togglePinSpot(spot.id); toggleFavoriteSpot(spot.id); }}
                    className={`p-1.5 rounded-xl transition-all ${
                      isPinned ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'
                    }`}
                    aria-label={isPinned ? 'お気に入り解除' : 'お気に入りに追加'}
                  >
                    <Bookmark className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <h3 className={`font-bold text-gray-900 leading-snug ${
                isFirst ? 'text-xl mt-4' : 'text-lg mt-3'
              }`}>
                {spot.name}
              </h3>
              {isFirst && <div className="w-10 h-[3px] bg-blue-600 mt-2.5 rounded-full" />}

              <p className={`text-xs ${isFirst ? 'mt-3' : 'mt-2'}`}>
                <span className={`${catText} font-semibold inline-flex items-center gap-1`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'currentColor' }} />
                  {spot.category}
                </span>
                <span className="text-gray-400"> · {spot.duration}分</span>
              </p>

              {spot.description && (
                <p
                  className="text-sm text-gray-500 mt-2.5 leading-relaxed overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {spot.description}
                </p>
              )}
            </div>

            {/* Connector */}
            {!isLast && (
              <div className="flex flex-col items-center py-1.5 text-gray-300">
                <div className="w-px h-2.5 border-l border-dashed border-gray-200" />
                <div className="flex items-center gap-1.5 my-0.5 text-[11px]">
                  <Footprints className="w-3 h-3" />
                  <span>{connectorTexts[index]}</span>
                </div>
                <div className="w-px h-2.5 border-l border-dashed border-gray-200" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── サイドバー ──
  const sidebar = (
    <div className="sticky top-20 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-xs font-medium text-gray-400 tracking-wider">スタート</p>
        <h2 className="text-5xl font-extrabold text-gray-900 mt-2 tracking-tight">
          {currentPlan.startTime}
        </h2>
        <p className="text-sm text-gray-400 mt-3">
          {durationLabel} · {currentPlan.spots.length}スポット · 徒歩
        </p>
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
            {heroMessage.emoji} {heroMessage.text}
          </span>
        </div>
      </div>

      <PlanMap spots={currentPlan.spots} currentLocation={startLocation.lat && startLocation.lng ? { lat: startLocation.lat, lng: startLocation.lng } : null} className="h-[350px]" />

      <div className="space-y-2">
        <button
          onClick={() => setScreen('executing')}
          className="w-full py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]"
        >
          このプランで行く
        </button>
        <button
          onClick={handleNextPlan}
          disabled={isGeneratingNext}
          className="w-full py-3.5 rounded-2xl font-semibold text-gray-600 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ring-1 ring-gray-100"
        >
          {isGeneratingNext ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              作成中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              再作成
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-5 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <span className="text-sm font-semibold text-gray-800">プラン</span>
          {pinnedCount > 0 ? (
            <div className="flex items-center gap-1 text-blue-600">
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span className="text-sm font-medium tabular-nums">{pinnedCount}</span>
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      {/* Mobile hero */}
      <div className="md:hidden bg-white border-b border-gray-100">
        <div className="px-5 pt-6 pb-7">
          <p className="text-xs font-medium text-gray-400 tracking-wider">スタート</p>
          <h1 className="text-5xl font-extrabold text-gray-900 mt-3 tracking-tight">
            {currentPlan.startTime}
          </h1>
          <p className="text-sm text-gray-400 mt-3">
            {durationLabel} · {currentPlan.spots.length}スポット · 徒歩
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-semibold">
              {heroMessage.emoji} {heroMessage.text}
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="md:hidden pt-5 pb-36">
          <PlanMap spots={currentPlan.spots} currentLocation={startLocation.lat && startLocation.lng ? { lat: startLocation.lat, lng: startLocation.lng } : null} className="h-[200px] mb-5" />
          {spotList}
        </div>
        <div className="hidden md:grid md:grid-cols-[1fr_340px] gap-10 pt-8 pb-12">
          <div>{spotList}</div>
          <div>{sidebar}</div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-5 pt-3 pb-6 z-10">
        <div className="flex gap-3">
          <button
            onClick={handleNextPlan}
            disabled={isGeneratingNext}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGeneratingNext ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                再作成
              </>
            )}
          </button>
          <button
            onClick={() => setScreen('executing')}
            className="flex-[1.2] py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98]"
          >
            このプランで行く
          </button>
        </div>
      </div>
    </div>
  );
}
