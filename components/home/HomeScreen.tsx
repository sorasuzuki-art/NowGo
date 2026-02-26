'use client';

import { useState, useEffect } from 'react';
import { Loader2, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { StationSelectModal } from './StationSelectModal';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { getLastConditions, saveLastConditions } from '@/lib/storage';
import { getNearbyPlaces, getWalkingTime } from '@/lib/osm-service';

const TIME_OPTIONS = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 120, label: '2時間' },
  { value: 180, label: '3時間' },
  { value: 300, label: '半日' },
];

export function HomeScreen() {
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const { startLocation, duration, groupSize, setStartLocation, setDuration, setGroupSize, setScreen, setPlan } =
    useNowgoStore();

  useEffect(() => {
    if (!hasLoadedInitial) {
      getLastConditions().then((last) => {
        if (last) {
          setStartLocation({
            label: last.station,
            lat: null,
            lng: null,
            source: 'manual',
            accuracy: null,
          });
          setDuration(last.duration);
          setGroupSize(last.groupSize);
        }
        setHasLoadedInitial(true);
      });
    }
  }, [hasLoadedInitial, setStartLocation, setDuration, setGroupSize]);

  const handleCreatePlan = async () => {
    if (!startLocation.label) return;

    setIsLoading(true);

    await saveLastConditions({
      station: startLocation.label,
      duration,
      groupSize,
    });

    try {
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
        weather: '晴れ' as const // デフォルト値、後で天気APIと連携可能
      };

      const searchResults = searchSpots(searchParams);
      console.log(`Found ${searchResults.length} recommended spots`);

      if (searchResults.length === 0) {
        alert('おすすめのスポットが見つかりませんでした');
        setIsLoading(false);
        return;
      }

      // 時間に応じてスポット数を決定
      const maxSpots = Math.min(5, Math.floor(duration / 45));
      const selectedSpots = searchResults.slice(0, maxSpots);

      let currentTime = now.getTime();
      const spots = [];

      for (let i = 0; i < selectedSpots.length; i++) {
        const spot = selectedSpots[i];
        const walkingTime = i === 0 ? 10 : Math.floor(Math.random() * 10) + 5;

        currentTime += walkingTime * 60000;

        const spotDuration = Math.min(spot.estimatedTime, Math.floor(duration / selectedSpots.length));
        const arrivalTime = new Date(currentTime);
        currentTime += spotDuration * 60000;

        spots.push({
          id: spot.id,
          name: spot.name,
          category: spot.category === 'culture' ? '観光' :
                   spot.category === 'nature' ? '公園' :
                   spot.category === 'shopping' ? 'ショップ' :
                   spot.category === 'food' ? 'カフェ' : 'その他',
          description: spot.reason.length > 0 ? spot.reason.join('、') : spot.description,
          time: arrivalTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          duration: spotDuration,
          lat: spot.coordinates.latitude,
          lng: spot.coordinates.longitude,
        });
      }

      console.log(`Generated plan with ${spots.length} spots using smart search`);

      if (spots.length === 0) {
        alert('プランを生成できませんでした。条件を変更してお試しください。');
        setIsLoading(false);
        return;
      }

      setPlan({
        spots: spots as any,
        startTime: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
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
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert(`プランの作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = startLocation.label && duration > 0 && groupSize > 0;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationText = hours > 0 ? `${hours}時間${minutes > 0 ? minutes + '分' : ''}` : `${minutes}分`;

  const getEndTime = () => {
    const now = new Date();
    const end = new Date(now.getTime() + duration * 60000);
    return end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-[#0084FF] mb-2">nowgo</h1>
          <p className="text-gray-600 text-lg">今から楽しもう</p>
        </div>
      </header>

      <main className="px-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#0084FF]" />
              <span className="text-sm font-semibold text-gray-700">出発駅</span>
            </div>
            <button
              onClick={() => setIsStationModalOpen(true)}
              className={`w-full px-6 py-4 rounded-xl text-left font-medium transition-all ${
                startLocation.label
                  ? 'bg-[#0084FF] text-white hover:bg-[#0070DD] shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400'
              }`}
            >
              {startLocation.label || '駅を選択してください'}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#0084FF]" />
              <span className="text-sm font-semibold text-gray-700">所要時間</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDuration(option.value)}
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                    duration === option.value
                      ? 'bg-[#0084FF] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="text-center py-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-[#0084FF]">{durationText}</p>
              {duration > 0 && <p className="text-sm text-gray-600 mt-1">{getEndTime()}頃まで</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#0084FF]" />
              <span className="text-sm font-semibold text-gray-700">人数</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: 1, label: '👤 1人', icon: '👤' },
                { num: 2, label: '👥 2人', icon: '👥' },
                { num: 3, label: '👥👤 3人以上', icon: '👥👤' },
              ].map(({ num, label }) => (
                <button
                  key={num}
                  onClick={() => setGroupSize(num === 3 ? 4 : num)}
                  className={`py-4 px-4 rounded-xl font-medium text-sm transition-all ${
                    (num === 3 ? groupSize >= 3 : groupSize === num)
                      ? 'bg-[#0084FF] text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCreatePlan}
            disabled={!canCreate || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canCreate && !isLoading
                ? 'bg-[#0084FF] text-white hover:bg-[#0070DD] shadow-md active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                プランを生成中...
              </>
            ) : (
              <>
                プランを作る
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      <StationSelectModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} />
    </div>
  );
}
