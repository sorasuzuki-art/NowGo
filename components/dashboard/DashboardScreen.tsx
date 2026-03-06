'use client';

import { useState, useEffect, useRef } from 'react';
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
import { reverseGeocode } from '@/lib/geocoding';
import { supabase } from '@/lib/supabase';
import { addRecentStation } from '@/lib/storage';

const TIME_OPTIONS = ['60分', '90分', '120分', '150分', '半日', '1日'];
const MODE_OPTIONS = ['定番', '新規開拓', '冒険'];
const STYLE_OPTIONS = ['ゆっくり', 'ほどほど', 'アクティブ'];
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

// ── ドラムロール式ピッカー（iOS風） ──
const WH = 32;          // 1アイテムの高さ
const W_VISIBLE = 3;    // 見えるアイテム数
const W_HALF = 1;       // 中央までのオフセット

const HOUR_VALUES = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_VALUES = [0, 15, 30, 45];

function TimeWheel({
  items,
  value,
  onChange,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const valRef = useRef(value);
  valRef.current = value;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx >= 0) el.scrollTop = idx * WH;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / WH);
      const i = Math.max(0, Math.min(items.length - 1, idx));
      if (items[i] !== valRef.current) onChange(items[i]);
    }, 80);
  };

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: WH * W_VISIBLE }}>
      {/* 選択バー */}
      <div
        className="absolute inset-x-0 border-y border-gray-200 pointer-events-none"
        style={{ top: W_HALF * WH, height: WH }}
      />
      {/* フェード */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" style={{ height: W_HALF * WH }} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" style={{ height: W_HALF * WH }} />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ height: W_HALF * WH }} />
        {items.map(v => (
          <div
            key={v}
            className="flex items-center justify-center"
            style={{ height: WH, scrollSnapAlign: 'center' }}
          >
            <span className={`tabular-nums transition-all duration-100 ${
              v === value
                ? 'text-gray-900 font-bold text-base'
                : 'text-gray-300 text-sm'
            }`}>
              {v.toString().padStart(2, '0')}
            </span>
          </div>
        ))}
        <div style={{ height: W_HALF * WH }} />
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const { profile } = useAuth();
  const { startLocation, setStartLocation, walkRangeMinutes, setWalkRangeMinutes, setScreen, setPlan } = useNowgoStore();

  const [selectedTime, setSelectedTime] = useState('90分');
  const [selectedMode, setSelectedMode] = useState('新規開拓');
  const [selectedStyle, setSelectedStyle] = useState('ほどほど');
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedDateTime, setSelectedDateTime] = useState(getCurrentTime());
  const [selectedWeather, setSelectedWeather] = useState(getCurrentWeather());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 駅名インライン検索
  const [stationQuery, setStationQuery] = useState('');
  const [stationResults, setStationResults] = useState<{ id: string; name: string; line_name: string | null; lat: number; lng: number }[]>([]);
  const [showStationDropdown, setShowStationDropdown] = useState(false);
  const stationTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchStation = (q: string) => {
    setStationQuery(q);
    if (!q.trim()) {
      setStationResults([]);
      setShowStationDropdown(false);
      return;
    }
    clearTimeout(stationTimer.current);
    stationTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('stations')
        .select('id, name, line_name, lat, lng')
        .or(`name.ilike.%${q}%,name_kana.ilike.%${q}%`)
        .limit(8);
      if (data) {
        setStationResults(data.map(r => ({ ...r, lat: parseFloat(String(r.lat)), lng: parseFloat(String(r.lng)) })));
        setShowStationDropdown(true);
      }
    }, 200);
  };

  const selectStation = async (station: typeof stationResults[0]) => {
    setStartLocation({ label: station.name, lat: station.lat, lng: station.lng, source: 'manual', accuracy: null });
    setStationQuery('');
    setShowStationDropdown(false);
    await addRecentStation(station.name);
  };

  const selectedHour = parseInt(selectedDateTime.split(':')[0]);
  const selectedMinuteVal = parseInt(selectedDateTime.split(':')[1]);



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
        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight text-center mb-2">
            この後の予定？<span className="text-blue-300">Now</span>ろう
          </h2>
          <p className="text-white/50 text-sm mb-8">場所と時間を選ぶだけ</p>

          {/* ── Search Card ── */}
          <div className="w-full max-w-xl">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl">

              {/* 場所 */}
              <div className="p-5 pb-4">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-2xl">
                    <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    {startLocation.label && !stationQuery ? (
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{startLocation.label}</span>
                        <button
                          onClick={() => { setStartLocation({ label: '', lat: null, lng: null, source: 'manual', accuracy: null }); }}
                          className="text-gray-300 hover:text-gray-500 text-xs flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={stationQuery}
                        onChange={e => searchStation(e.target.value)}
                        onFocus={() => { if (stationResults.length > 0) setShowStationDropdown(true); }}
                        placeholder={isGettingLocation ? '取得中...' : '駅名を入力'}
                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none min-w-0"
                      />
                    )}
                  </div>
                  <button
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="p-3.5 bg-gray-50 hover:bg-blue-50 rounded-2xl transition-colors disabled:opacity-40"
                    title="現在地を取得"
                  >
                    <Navigation className={`w-5 h-5 text-blue-500 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
                {/* 候補ドロップダウン */}
                {showStationDropdown && stationResults.length > 0 && (
                  <div className="absolute left-0 right-12 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-30 max-h-52 overflow-y-auto">
                    {stationResults.map(s => (
                      <button
                        key={s.id}
                        onClick={() => selectStation(s)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        {s.line_name && <span className="text-xs text-gray-400 ml-2">{s.line_name}</span>}
                      </button>
                    ))}
                  </div>
                )}
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
                showAdvanced ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-5 pt-2 space-y-5">

                {/* 1. 今日どんな感じで遊ぶ？ */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">今日どんな感じで遊ぶ？</p>
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

                {/* 2. どのくらい歩ける？ */}
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

                {/* 3. いつから遊ぶ？ */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">いつから遊ぶ？</p>
                  {/* 日付（7日分グリッド） */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                      const dow = ['日','月','火','水','木','金','土'][d.getDay()];
                      const isSelected = dateStr === selectedDate;
                      const isSun = d.getDay() === 0;
                      const isSat = d.getDay() === 6;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-all
                            ${isSelected
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                          <span className={`text-[10px] leading-none ${isSelected ? 'text-white/70' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-gray-400'}`}>
                            {i === 0 ? '今日' : i === 1 ? '明日' : dow}
                          </span>
                          <span className={`text-sm font-bold mt-0.5 ${isSelected ? '' : 'text-gray-700'}`}>
                            {d.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* 時刻ドラムロール */}
                  <div className="flex items-center mt-3">
                    <TimeWheel
                      items={HOUR_VALUES}
                      value={selectedHour}
                      onChange={h => setSelectedDateTime(`${h.toString().padStart(2, '0')}:${selectedMinuteVal.toString().padStart(2, '0')}`)}
                    />
                    <span className="text-lg font-bold text-gray-900 px-0.5 flex-shrink-0">:</span>
                    <TimeWheel
                      items={MINUTE_VALUES}
                      value={selectedMinuteVal}
                      onChange={m => setSelectedDateTime(`${selectedHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)}
                    />
                  </div>
                </div>

                {/* 4. どう過ごす？ */}
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

                {/* 5. 天気は？ */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">天気は？</p>
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

    </div>
  );
}
