'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  MapPin,
  User,
  Navigation,
  ChevronDown,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  SlidersHorizontal,
} from 'lucide-react';
import { StationSelectModal } from '../home/StationSelectModal';
import { reverseGeocode } from '@/lib/geocoding';

const TIME_OPTIONS = ['60分', '90分', '120分', '150分', '半日', '1日'];
const MODE_OPTIONS = ['定番', '新規開拓', '冒険'];
const STYLE_OPTIONS = ['ゆっくり', 'ほどほど', 'アクティブ'];
const LOCATION_TYPE_OPTIONS = ['指定なし', '屋内', '屋外'];
const WEATHER_OPTIONS = [
  { label: '晴れ', icon: Sun },
  { label: '曇り', icon: Cloud },
  { label: '雨', icon: CloudRain },
  { label: '雪', icon: Snowflake },
];
const WALK_RANGE_OPTIONS = [10, 20, 30, 40, 50, 60];

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = Math.floor(now.getMinutes() / 15) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
};

const getCurrentWeather = () => {
  const weathers = ['晴れ', '曇り', '雨'];
  return weathers[Math.floor(Math.random() * weathers.length)];
};

export function DashboardScreen() {
  const { profile } = useAuth();
  const { startLocation, setStartLocation, walkRangeMinutes, setWalkRangeMinutes, setScreen, setPlan } = useNowgoStore();

  const [selectedTime, setSelectedTime] = useState('90分');
  const [selectedMode, setSelectedMode] = useState('定番');
  const [selectedStyle, setSelectedStyle] = useState('ほどほど');
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedDateTime, setSelectedDateTime] = useState(getCurrentTime());
  const [selectedWeather, setSelectedWeather] = useState(getCurrentWeather());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // GPS位置取得
  const getCurrentLocation = async () => {
    const host = window.location.hostname;
    const isSecureContext = window.location.protocol === 'https:'
      || host === 'localhost'
      || host === '127.0.0.1'
      || host === '[::1]';
    if (!isSecureContext) {
      setLocationError('GPS機能はHTTPS環境でのみ利用可能です');
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('このブラウザではGPS機能を利用できません');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      let addressLabel = '現在地';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const addr = await reverseGeocode(latitude, longitude, controller.signal);
        clearTimeout(timeoutId);
        if (addr) {
          const parts = addr.split(',');
          addressLabel = parts.length > 3 ? parts.slice(0, 3).join(',') : addr;
        }
      } catch {
        // 住所取得失敗でもGPS座標は使用
      }

      setStartLocation({
        label: addressLabel,
        lat: latitude,
        lng: longitude,
        source: 'gps',
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
      });
    } catch (error: any) {
      let errorMessage = '位置情報を取得できませんでした';
      if (error.code === 1) errorMessage = '位置情報の許可が必要です';
      else if (error.code === 2) errorMessage = '位置情報を取得できませんでした';
      else if (error.code === 3) errorMessage = '位置情報の取得がタイムアウトしました';
      setLocationError(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (!startLocation.label) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isSearching, setIsSearching] = useState(false);

  const handleGo = async () => {
    setIsSearching(true);
    try {
      const { searchSpotsFromDB } = await import('@/lib/spotSearch');
      const [selectedHour, selectedMinute] = selectedDateTime.split(':').map(Number);

      const timeInMinutes = selectedTime === '60分' ? 60 :
                           selectedTime === '90分' ? 90 :
                           selectedTime === '120分' ? 120 :
                           selectedTime === '150分' ? 150 :
                           selectedTime === '半日' ? 240 :
                           selectedTime === '1日' ? 480 : 90;

      const spots = await searchSpotsFromDB({
        availableTime: timeInMinutes,
        currentHour: selectedHour,
        currentMinute: selectedMinute ?? 0,
        weather: selectedWeather as any,
        style: (selectedStyle as 'ゆっくり' | 'ほどほど' | 'アクティブ') || undefined,
        locationType: (selectedLocationType as '屋内' | '屋外') || undefined,
        mode: selectedMode,
        origin: startLocation.lat != null && startLocation.lng != null
          ? { lat: startLocation.lat, lng: startLocation.lng } : undefined,
        walkRangeMinutes,
      });

      if (spots.length === 0) {
        alert('条件に合うスポットが見つかりませんでした');
        return;
      }

      const totalDuration = spots.reduce((sum, s) => sum + s.duration, 0);

      setPlan({
        spots,
        startTime: spots[0]?.time ?? '14:00',
        totalDuration,
        pinnedSpots: [],
        searchParams: {
          availableTime: timeInMinutes,
          currentHour: selectedHour,
          currentMinute: selectedMinute ?? 0,
          weather: selectedWeather as any,
          style: (selectedStyle as 'ゆっくり' | 'ほどほど' | 'アクティブ') || undefined,
          locationType: (selectedLocationType as '屋内' | '屋外') || undefined,
          mode: selectedMode,
        },
      });
      setScreen('plan');
    } catch (err) {
      console.error('Plan generation failed:', err);
      alert('プラン作成中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* 背景画像 — fixed で viewport 全体を覆い、モバイルスクロールでも白が出ない */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      />
      <div className="fixed inset-0 bg-black/50" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="px-5 pt-4 pb-2">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-white tracking-tight">Now Go</h1>
            <button
              onClick={() => setScreen('profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm">{profile?.nickname || 'ゲスト'}</span>
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight text-center mb-2">
            この後の予定？<span className="text-blue-300">Now</span>ろう
          </h2>
          <p className="text-white/50 text-sm mb-8">場所と時間を選ぶだけ</p>

          {/* ── Search Card ── */}
          <div className="w-full max-w-xl">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl">

              {/* 場所 */}
              <div className="p-5 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStationModalOpen(true)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group min-w-0"
                >
                  <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {startLocation.label || (isGettingLocation ? '取得中...' : '場所を選択')}
                    </p>
                    {startLocation.source === 'gps' && startLocation.accuracy != null && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        GPS{startLocation.accuracy < 100 ? ' · 高精度' : ''}
                      </p>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                </button>
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="p-3.5 bg-gray-50 hover:bg-blue-50 rounded-2xl transition-colors disabled:opacity-40"
                  title="現在地を取得"
                >
                  <Navigation className={`w-5 h-5 text-blue-500 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              {locationError && (
                <p className="mt-2 text-xs text-red-400 px-1">{locationError}</p>
              )}
            </div>

            {/* どのくらい遊ぶ？ */}
            <div className="px-5 pb-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">どのくらい遊ぶ？</p>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                      ${selectedTime === time
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* もっと絞り込む */}
            <div className="px-5">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>もっと絞り込む</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* ── 詳細オプション ── */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showAdvanced ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-5 pt-2 space-y-5">

                {/* 天気 */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">いまの天気は？</p>
                  <div className="flex gap-2">
                    {WEATHER_OPTIONS.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => setSelectedWeather(label)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-medium transition-all duration-200 active:scale-95
                          ${selectedWeather === label
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 気分 */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">今日はどんな感じ？</p>
                  <div className="flex gap-2">
                    {MODE_OPTIONS.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                          ${selectedMode === mode
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ペース */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">どう過ごす？</p>
                  <div className="flex gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                          ${selectedStyle === style
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 屋内/屋外 */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">屋内？屋外？</p>
                  <div className="flex gap-2">
                    {LOCATION_TYPE_OPTIONS.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedLocationType(type === '指定なし' ? '' : type)}
                        className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                          ${(type === '指定なし' && selectedLocationType === '') || selectedLocationType === type
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 歩ける範囲 */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">どのくらい歩ける？</p>
                  <div className="flex flex-wrap gap-2">
                    {WALK_RANGE_OPTIONS.map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => setWalkRangeMinutes(minutes)}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                          ${walkRangeMinutes === minutes
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {minutes}分
                      </button>
                    ))}
                  </div>
                </div>

                {/* 日時 */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">日時を変更</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                    />
                    <input
                      type="time"
                      value={selectedDateTime}
                      onChange={(e) => setSelectedDateTime(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Go ボタン */}
            <div className="p-5 pt-0">
              <button
                onClick={handleGo}
                disabled={isSearching}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSearching ? 'プラン作成中...' : 'Go'}
              </button>
            </div>

            </div>
          </div>
        </div>
      </div>

      <StationSelectModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} />
    </div>
  );
}
