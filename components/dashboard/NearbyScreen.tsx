'use client';

import { useState, useEffect } from 'react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { ArrowLeft, MapPin, Navigation, Star, Clock, Filter, Loader2 } from 'lucide-react';
import { getNearbyPlaces, getWalkingTime, getPlaceImageUrl, OSMPlace } from '@/lib/osm-service';

const CATEGORIES = ['All', 'カフェ', 'レストラン', '公園', 'ショップ', '美術館', 'ギャラリー'];

export function NearbyScreen() {
  const { setScreen, setPlan, selectedStation } = useNowgoStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [spots, setSpots] = useState<OSMPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbySpots = async () => {
      if (!selectedStation) {
        setError('駅が選択されていません');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const places = await getNearbyPlaces(selectedStation, 1.5);
        setSpots(places);
      } catch (err) {
        console.error('Failed to fetch nearby places:', err);
        setError('近くのスポットを取得できませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbySpots();
  }, [selectedStation]);

  const filteredSpots = selectedCategory === 'All'
    ? spots
    : spots.filter((spot) => spot.category === selectedCategory);

  const handleSelectSpot = (spot: OSMPlace) => {
    const walkingTime = getWalkingTime(spot.distance || 0);
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + walkingTime * 60000);

    setPlan({
      spots: [
        {
          id: spot.id,
          name: spot.name,
          category: spot.category,
          description: `${spot.category}スポット`,
          time: arrivalTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          duration: 60,
          lat: spot.lat,
          lng: spot.lon,
        },
      ],
      startTime: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      totalDuration: 60,
      pinnedSpots: [],
    });
    setScreen('plan');
  };

  const getRandomStatus = () => {
    const statuses = ['空いています', '普通', '混雑中'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusColor = (status: string) => {
    if (status === '空いています') return 'text-emerald-600 bg-emerald-50';
    if (status === '混雑中') return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  const getRandomRating = () => {
    return (Math.random() * 2 + 3).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1680247/pexels-photo-1680247.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
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
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Nearby</h1>
              <p className="text-sm text-white/70 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                渋谷駅周辺
              </p>
            </div>
            <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <Filter className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-4 -mb-4 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/20 text-white backdrop-blur-sm border border-white/20 hover:bg-white/30'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500">近くのスポットを検索中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setScreen('dashboard')}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                戻る
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {filteredSpots.length} spots found
              </p>

              {filteredSpots.length === 0 ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <p className="text-gray-500">このカテゴリのスポットが見つかりませんでした</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSpots.map((spot) => {
                    const status = getRandomStatus();
                    const rating = getRandomRating();
                    const walkingTime = getWalkingTime(spot.distance || 0);

                    return (
                      <button
                        key={spot.id}
                        onClick={() => handleSelectSpot(spot)}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all text-left group"
                      >
                        <div className="relative h-32">
                          <img
                            src={getPlaceImageUrl(spot.category)}
                            alt={spot.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {spot.name}
                            </h3>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-amber-500" />
                              <span className="text-sm font-medium">{rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{spot.category}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              徒歩{walkingTime}分
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
