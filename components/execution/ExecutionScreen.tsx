'use client';

import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';

const getCategoryColor = (category: string) => {
  const colors: Record<string, { dot: string; bg: string; text: string; glow: string }> = {
    '観光': { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', glow: 'rgba(59,130,246,0.25)' },
    '公園': { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', glow: 'rgba(16,185,129,0.25)' },
    'ショップ': { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', glow: 'rgba(139,92,246,0.25)' },
    'カフェ': { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', glow: 'rgba(245,158,11,0.25)' },
  };
  return colors[category] || { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-700', glow: 'rgba(107,114,128,0.25)' };
};

export function ExecutionScreen() {
  const { currentPlan, setScreen } = useNowgoStore();
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0);
  const [expandSchedule, setExpandSchedule] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  if (!currentPlan) return null;

  const currentSpot = currentPlan.spots[currentSpotIndex];
  const nextSpot = currentPlan.spots[currentSpotIndex + 1];
  const isLastSpot = currentSpotIndex === currentPlan.spots.length - 1;
  const currentColor = getCategoryColor(currentSpot.category);
  const remainingSpots = currentPlan.spots.slice(currentSpotIndex + 2);

  const handleNext = () => {
    if (currentSpotIndex < currentPlan.spots.length - 1) {
      setCurrentSpotIndex(currentSpotIndex + 1);
    }
  };

  const handleComplete = () => {
    setShowExitDialog(false);
    setScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8); }
          70% { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="px-5 pt-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowExitDialog(true)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <span className="text-sm text-gray-400 tabular-nums">
            {currentSpotIndex + 1} / {currentPlan.spots.length}
          </span>
        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="flex items-center justify-center gap-2.5 pt-8">
        {currentPlan.spots.map((spot, i) => {
          const dotColor = getCategoryColor(spot.category);
          return (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${
                i < currentSpotIndex
                  ? `w-2.5 h-2.5 ${dotColor.dot} opacity-40`
                  : i === currentSpotIndex
                  ? `w-3.5 h-3.5 ${dotColor.dot}`
                  : 'w-2.5 h-2.5 bg-gray-200'
              }`}
              style={i === currentSpotIndex ? {
                boxShadow: `0 0 0 6px ${dotColor.glow}`,
                animation: 'popIn 0.4s ease-out both',
              } : undefined}
            />
          );
        })}
      </div>

      {/* ── Current spot ── */}
      <div
        className="px-5 pt-12 pb-8"
        key={currentSpotIndex}
        style={{ animation: 'fadeInUp 0.4s ease-out both' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${currentColor.bg} ${currentColor.text} mb-4`}>
            {currentSpot.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {currentSpot.name}
          </h1>
          {currentSpot.description && (
            <p className="text-gray-400 text-sm mt-3 max-w-[300px] mx-auto leading-relaxed">
              {currentSpot.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="max-w-2xl mx-auto px-5">
        <div className="h-px bg-gray-100" />
      </div>

      {/* ── Next & Schedule ── */}
      <div className="px-5 pt-6 pb-36">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* つぎ */}
          {nextSpot && (() => {
            const nextColor = getCategoryColor(nextSpot.category);
            return (
              <div style={{ animation: 'fadeInUp 0.4s ease-out 150ms both' }}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-gray-400 tracking-wider">つぎ</p>
                  <span className="text-[11px] text-gray-300">徒歩 5分</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{nextSpot.name}</h3>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${nextColor.bg} ${nextColor.text}`}>
                      {nextSpot.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 最後のスポット */}
          {isLastSpot && (
            <div
              className="text-center py-6"
              style={{ animation: 'fadeInUp 0.4s ease-out 150ms both' }}
            >
              <p className="text-sm font-medium text-gray-900">最後のスポットです</p>
              <p className="text-xs text-gray-400 mt-1">楽しんで！</p>
            </div>
          )}

          {/* この後 */}
          {remainingSpots.length > 0 && (
            <div style={{ animation: 'fadeInUp 0.4s ease-out 250ms both' }}>
              <button
                onClick={() => setExpandSchedule(!expandSchedule)}
                className="flex items-center justify-between w-full py-2"
              >
                <p className="text-xs font-bold text-gray-400 tracking-wider">この後</p>
                <ChevronDown
                  className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${
                    expandSchedule ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  expandSchedule ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1 pt-1">
                  {remainingSpots.map((spot) => {
                    const spotColor = getCategoryColor(spot.category);
                    return (
                      <div key={spot.id} className="flex items-center gap-3 py-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${spotColor.dot}`} />
                        <p className="text-sm text-gray-600 flex-1 min-w-0 truncate">{spot.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-5 pt-3 pb-6">
        <div className="max-w-2xl mx-auto space-y-2">
          {isLastSpot ? (
            <button
              onClick={() => setShowExitDialog(true)}
              className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-400 to-teal-500 active:scale-[0.97] transition-all shadow-lg shadow-emerald-500/25"
            >
              プランを完了する
            </button>
          ) : (
            <>
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/25"
              >
                次のスポットへ
              </button>
              <button
                onClick={() => setShowExitDialog(true)}
                className="w-full flex items-center justify-center py-3 text-sm text-gray-400 hover:text-red-500 active:scale-[0.97] transition-all"
              >
                プランを終了する
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── 終了確認 ── */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 w-full sm:max-w-sm shadow-2xl"
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">プランを終了しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">ホーム画面に戻ります。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.97] transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-red-500 text-white font-medium hover:bg-red-600 active:scale-[0.97] transition-all"
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
