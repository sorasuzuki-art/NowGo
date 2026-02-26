'use client';

import { useState, useEffect } from 'react';
import { Loader2, Train, Clock, Users, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { StationSelectModal } from '../home/StationSelectModal';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { getLastConditions, saveLastConditions } from '@/lib/storage';

const TIME_OPTIONS = [
  { value: 30, label: '30min', desc: 'Quick break' },
  { value: 60, label: '1h', desc: 'Coffee time' },
  { value: 120, label: '2h', desc: 'Afternoon out' },
  { value: 180, label: '3h', desc: 'Half day trip' },
  { value: 300, label: '5h', desc: 'Full adventure' },
];

const GROUP_OPTIONS = [
  { value: 1, label: 'Solo', icon: '1' },
  { value: 2, label: 'Duo', icon: '2' },
  { value: 4, label: 'Group', icon: '3+' },
];

export function QuickPlanScreen() {
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const { startLocation, duration, groupSize, setStartLocation, setDuration, setGroupSize, setScreen, setPlan } =
    useNowgoStore();

  useEffect(() => {
    if (!hasLoadedInitial) {
      getLastConditions().then((last) => {
        if (last) {
          if (last.station) {
            setStartLocation({
              label: last.station,
              lat: null,
              lng: null,
              source: 'manual',
              accuracy: null,
            });
          }
          if (last.duration) setDuration(last.duration);
          if (last.groupSize) setGroupSize(last.groupSize);
        }
        setHasLoadedInitial(true);
      });
    }
  }, [hasLoadedInitial, setStartLocation, setDuration, setGroupSize]);

  const handleCreatePlan = async () => {
    if (!startLocation.label || duration === 0 || groupSize === 0) return;

    await saveLastConditions({
      station: startLocation.label,
      duration,
      groupSize,
    });

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 新しい検索ロジックを使用
    const { searchSpots } = await import('@/lib/searchLogic');

    const now = new Date();
    const searchParams = {
      availableTime: duration,
      currentHour: now.getHours(),
      companion: (groupSize === 1 ? 'ひとり' :
                groupSize === 2 ? 'デート' :
                groupSize >= 3 ? '友達' : '未定') as 'ひとり' | 'デート' | '友達' | '未定',
      mode: 'おまかせ' as const,
      weather: '晴れ' as const
    };

    const searchResults = searchSpots(searchParams);
    const spotsCount = Math.max(2, Math.min(4, Math.floor(duration / 60)));
    const selectedSpots = searchResults.slice(0, spotsCount);

    setPlan({
      spots: selectedSpots.map((spot, index) => ({
        id: spot.id,
        name: spot.name,
        category: spot.category === 'culture' ? '観光' :
                 spot.category === 'nature' ? '公園' :
                 spot.category === 'shopping' ? 'ショップ' :
                 spot.category === 'food' ? 'カフェ' : 'その他',
        description: spot.reason.length > 0 ? spot.reason.join('、') : spot.description.slice(0, 50) + '...',
        time: (() => {
          const startTime = new Date();
          startTime.setHours(14, 0, 0, 0);
          startTime.setMinutes(startTime.getMinutes() + index * 75);
          return startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        })(),
        duration: Math.floor(duration / spotsCount),
        lat: spot.coordinates.latitude,
        lng: spot.coordinates.longitude,
      })),
      startTime: '14:00',
      totalDuration: duration,
      pinnedSpots: [],
      searchParams: {
        availableTime: duration,
        currentHour: now.getHours(),
        weather: '晴れ',
        style: groupSize === 1 ? 'ゆっくり' : groupSize === 2 ? 'ほどほど' : 'アクティブ',
        mode: '定番',
      },
    });

    setScreen('plan');
    setIsLoading(false);
  };

  const canCreate = startLocation.label && duration > 0 && groupSize > 0;

  const getEndTime = () => {
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60000);
    return end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-56 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
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
              <h1 className="text-xl font-bold text-white">Create Plan</h1>
              <p className="text-sm text-white/70">Design your perfect outing</p>
            </div>
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-white/90">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">AI will create the perfect plan for you</span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 pb-32 py-6 -mt-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <Train className="w-4 h-4 text-blue-500" />
              Starting Station
            </label>
            <button
              onClick={() => setIsStationModalOpen(true)}
              className={`w-full px-4 py-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                startLocation.label
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                startLocation.label ? 'bg-blue-500' : 'bg-gray-100'
              }`}>
                <Train className={`w-5 h-5 ${startLocation.label ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={`font-medium ${startLocation.label ? 'text-gray-900' : 'text-gray-400'}`}>
                {startLocation.label || 'Select a station'}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <Clock className="w-4 h-4 text-blue-500" />
              Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDuration(option.value)}
                  className={`py-4 px-2 rounded-xl border-2 text-center transition-all ${
                    duration === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-lg font-bold ${duration === option.value ? 'text-blue-600' : 'text-gray-900'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden md:block">{option.desc}</p>
                </button>
              ))}
            </div>
            {duration > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">End time</p>
                <p className="text-2xl font-bold text-gray-900">{getEndTime()}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
              <Users className="w-4 h-4 text-blue-500" />
              Group Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {GROUP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupSize(option.value)}
                  className={`py-5 px-4 rounded-xl border-2 text-center transition-all ${
                    (option.value === 4 ? groupSize >= 3 : groupSize === option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold ${
                    (option.value === 4 ? groupSize >= 3 : groupSize === option.value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.icon}
                  </div>
                  <p className={`font-medium ${
                    (option.value === 4 ? groupSize >= 3 : groupSize === option.value)
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleCreatePlan}
            disabled={!canCreate || isLoading}
            className={`w-full py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold text-lg ${
              canCreate && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating your plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>

      <StationSelectModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} />
    </div>
  );
}
