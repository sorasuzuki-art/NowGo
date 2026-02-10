'use client';

import { Clock, Pin, X, Loader2, ArrowDown, Coffee, Utensils, MapPin as MapPinIcon, Sparkles, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useNowgoStore } from '@/hooks/useNowgoStore';

const getCategoryIcon = (category: string) => {
  if (category.toLowerCase().includes('cafe') || category.toLowerCase().includes('カフェ')) {
    return <Coffee className="w-4 h-4" />;
  }
  if (category.toLowerCase().includes('restaurant') || category.toLowerCase().includes('食事') || category.toLowerCase().includes('居酒屋')) {
    return <Utensils className="w-4 h-4" />;
  }
  return <MapPinIcon className="w-4 h-4" />;
};

export function PlanScreen() {
  const { currentPlan, setScreen, togglePinSpot, setScreen: setAppScreen } = useNowgoStore();
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);

  if (!currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Plan not found</p>
      </div>
    );
  }

  const handleNextPlan = async () => {
    setIsGeneratingNext(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGeneratingNext(false);
  };

  const handleExecutePlan = () => {
    setAppScreen('executing');
  };

  const pinnedCount = currentPlan.pinnedSpots.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1486785/pexels-photo-1486785.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <header className="relative z-10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setAppScreen('dashboard')}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="text-center text-white">
              <p className="text-sm opacity-80">
                {Math.floor(currentPlan.totalDuration / 60)}h
                {currentPlan.totalDuration % 60 > 0 && ` ${currentPlan.totalDuration % 60}min`} plan
              </p>
              <p className="font-bold text-xl">{currentPlan.startTime} Start</p>
            </div>
            <div className="w-9" />
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <div className="max-w-4xl mx-auto">
            {pinnedCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full px-4 py-2 shadow-lg">
                <Pin className="w-4 h-4" fill="currentColor" />
                <span className="text-sm font-medium">{pinnedCount} pinned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="px-6 py-6 pb-32 -mt-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative space-y-3">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-blue-200" />
            {currentPlan.spots.map((spot, index) => (
              <div key={spot.id} className="relative pl-16">
                <div className="absolute left-5 top-6 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-md flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900 tabular-nums">{spot.time}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        {getCategoryIcon(spot.category)}
                        <span className="text-xs font-medium">{spot.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePinSpot(spot.id)}
                      className={`p-2 rounded-xl transition-all ${
                        currentPlan.pinnedSpots.includes(spot.id)
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                      }`}
                      title={currentPlan.pinnedSpots.includes(spot.id) ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-4 h-4" fill="currentColor" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{spot.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{spot.description}</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{spot.duration}min</span>
                  </div>
                </div>

                {index < currentPlan.spots.length - 1 && (
                  <div className="flex items-center justify-center py-3 pl-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <Navigation className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">5 min walk</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={handleNextPlan}
            disabled={isGeneratingNext}
            className="flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingNext ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {pinnedCount > 0 ? 'Regenerate' : 'Next Plan'}
              </>
            )}
          </button>
          <button
            onClick={handleExecutePlan}
            className="flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 shadow-lg flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Let's Go
          </button>
        </div>
      </div>
    </div>
  );
}
