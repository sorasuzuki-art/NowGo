'use client';

<<<<<<< HEAD
import { useState, useRef } from 'react';
=======
import { useState, useRef, useEffect } from 'react';
>>>>>>> 939b30f (first commit)
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ChevronDown,
  MapPin,
  Clock,
  User,
  Train,
  ChevronRight,
<<<<<<< HEAD
  Coffee,
  Camera,
  Compass,
  Moon,
  Cloud,
  Sparkles,
  Star,
  ArrowRight,
} from 'lucide-react';
import { StationSelectModal } from '../home/StationSelectModal';

const TIME_OPTIONS = ['30分', '1時間', '2時間', '3時間', '半日'];
const WEATHER_OPTIONS = ['晴れ', '曇り', '雨', '風強め'];
const SCENE_OPTIONS = ['１人', 'デート', '友達', '家族', '未定'];
const MODE_OPTIONS = ['新規開拓', '冒険', '定番', 'バランス', 'おまかせ'];

// Generate time slots in 15-minute intervals starting from 10 minutes from now
const generateTimeSlots = () => {
  const slots = [];
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const startMinutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(startMinutes);
  now.setSeconds(0);

  for (let i = 0; i < 48; i++) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    now.setMinutes(now.getMinutes() + 15);
=======
} from 'lucide-react';
import { StationSelectModal } from '../home/StationSelectModal';
import { reverseGeocode } from '@/lib/geocoding';

// 検索条件.txtに基づく新しい条件設定
const TIME_OPTIONS = ['60分', '90分', '120分', '150分', '半日', '1日'];
const MODE_OPTIONS = ['定番', '新規開拓', '冒険'];
const STYLE_OPTIONS = ['ゆっくり', 'ほどほど', 'アクティブ'];
const MEGURI_OPTIONS = ['カフェ', '服', '雑貨'];
const WEATHER_OPTIONS = ['晴れ', '曇り', '雨', '雪'];
const WALK_RANGE_OPTIONS = [10, 20, 30, 40, 50, 60];

// 時間スロット生成（15分間隔）
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
>>>>>>> 939b30f (first commit)
  }
  return slots;
};

<<<<<<< HEAD
const CATEGORIES = [
  { icon: Coffee, label: 'カフェ', color: 'from-amber-400 to-amber-600' },
  { icon: Camera, label: '映え', color: 'from-rose-400 to-rose-600' },
  { icon: Compass, label: '新規開拓', color: 'from-emerald-400 to-emerald-600' },
  { icon: Moon, label: 'ナイト', color: 'from-indigo-400 to-indigo-600' },
  { icon: Cloud, label: '雨の日', color: 'from-slate-400 to-slate-600' },
  { icon: Sparkles, label: 'おすすめ', color: 'from-cyan-400 to-cyan-600' },
];

const NEARBY_SPOTS = [
  {
    name: 'Blue Bottle Coffee 渋谷店',
    address: '東京都渋谷区神南1-7-11',
    description: '洗練された空間でスペシャルティコーヒーを楽しめる人気カフェ',
    tags: ['癒し', 'カフェ'],
    weather: '晴れ',
    rating: 4.5,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: '代々木公園',
    address: '東京都渋谷区代々木神園町2-1',
    description: '都心のオアシス。散歩やピクニックに最適な緑豊かな公園',
    tags: ['アクティブ', '自然'],
    weather: '晴れ',
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'MIYASHITA PARK',
    address: '東京都渋谷区神宮前6-20-10',
    description: '屋上公園とショッピングが融合した新しい都市型施設',
    tags: ['映え', 'ショッピング'],
    weather: '曇り',
    rating: 4.3,
    image: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: '渋谷スクランブルスクエア',
    address: '東京都渋谷区渋谷2-24-12',
    description: '展望台SHIBUYA SKYからの絶景と多彩なショップ',
    tags: ['映え', '新規開拓'],
    weather: '晴れ',
    rating: 4.6,
    image: 'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Bunkamura',
    address: '東京都渋谷区道玄坂2-24-1',
    description: '美術館・劇場・映画館が集まる複合文化施設',
    tags: ['知的', 'カルチャー'],
    weather: '雨',
    rating: 4.4,
    image: 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

const FEATURED_PLANS = [
  {
    title: '渋谷カフェ巡り',
    description: '人気カフェ3軒を巡るプラン',
    duration: '3時間',
    spots: 3,
    image: 'https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: '雨の日アート散歩',
    description: '美術館とギャラリーを楽しむ',
    duration: '4時間',
    spots: 4,
    image: 'https://images.pexels.com/photos/3004909/pexels-photo-3004909.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: '夜景デートコース',
    description: 'ロマンチックな夜を過ごす',
    duration: '3時間',
    spots: 3,
    image: 'https://images.pexels.com/photos/2346216/pexels-photo-2346216.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: '写真映えスポット',
    description: 'SNS映え間違いなし',
    duration: '2時間',
    spots: 4,
    image: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export function DashboardScreen() {
  const { profile, signOut } = useAuth();
  const { selectedStation, setScreen, setPlan } = useNowgoStore();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const timeSlots = generateTimeSlots();
    return timeSlots[0] || '';
  });
  const [selectedScene, setSelectedScene] = useState('友達');
  const [selectedMode, setSelectedMode] = useState('おまかせ');
  const [selectedWeather, setSelectedWeather] = useState('晴れ');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showDateTimeDropdown, setShowDateTimeDropdown] = useState(false);
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  const handleGo = () => {
    setPlan({
      spots: [
        {
          id: '1',
          name: 'カフェ モーニング',
          category: 'カフェ',
          description: '落ち着いた雰囲気のカフェ',
          time: '14:00',
          duration: 60,
          lat: 35.6595,
          lng: 139.7004,
        },
        {
          id: '2',
          name: '公園散策',
          category: '公園',
          description: '緑豊かな公園でリフレッシュ',
          time: '15:15',
          duration: 45,
          lat: 35.6595,
          lng: 139.7004,
        },
      ],
      startTime: '14:00',
      totalDuration: 120,
=======
const TIME_SLOTS = generateTimeSlots();

// 現在時刻を取得
const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = Math.floor(now.getMinutes() / 15) * 15; // 15分単位に丸める
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// 今日の日付を取得
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 現在の天気を取得（シミュレーション）
const getCurrentWeather = () => {
  // 実際の実装では天気APIから取得
  const weathers = ['晴れ', '曇り', '雨'];
  return weathers[Math.floor(Math.random() * weathers.length)];
};

import { getRandomSpots } from '@/lib/testData';
import { getPlaceImageUrl } from '@/lib/osm-service';

// テストデータからスポット情報を生成
const generateNearbySpots = () => {
  const weatherOptions = ['晴れ', '曇り', '雨'];
  const tagGroups = [
    ['癒し', 'カフェ'],
    ['アクティブ', '自然'],
    ['映え', 'ショッピング'],
    ['知的', 'カルチャー'],
    ['新規開拓', '散歩'],
  ];

  return getRandomSpots(6).map((spot, index) => ({
    name: spot.name,
    address: spot.address,
    description: spot.description,
    tags: tagGroups[index % tagGroups.length],
    weather: weatherOptions[index % weatherOptions.length],
    rating: spot.rating,
    image: getPlaceImageUrl(spot.category),
  }));
};


export function DashboardScreen() {
  const { profile } = useAuth();
  const { startLocation, setStartLocation, walkRangeMinutes, setWalkRangeMinutes, setScreen, setPlan } = useNowgoStore();
  // 新しい検索条件に基づくstate
  const [selectedTime, setSelectedTime] = useState('90分'); // デフォルト90分
  const [selectedMode, setSelectedMode] = useState('定番'); // デフォルト定番
  const [selectedStyle, setSelectedStyle] = useState('ほどほど'); // デフォルトほどほど
  const [selectedMeguri, setSelectedMeguri] = useState(''); // 任意選択
  // 新しい条件: 日時・時間・天気
  const [selectedDate, setSelectedDate] = useState(getCurrentDate()); // デフォルトは今日
  const [selectedDateTime, setSelectedDateTime] = useState(getCurrentTime()); // デフォルトは現在時刻
  const [selectedWeather, setSelectedWeather] = useState(getCurrentWeather()); // デフォルトは現在天気
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showMeguriDropdown, setShowMeguriDropdown] = useState(false);
  const [showDateTimeDropdown, setShowDateTimeDropdown] = useState(false);
  const [showWeatherDropdown, setShowWeatherDropdown] = useState(false);
  const [showWalkRangeDropdown, setShowWalkRangeDropdown] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  // 詳細プランモーダル用state
  const [isDetailPlanModalOpen, setIsDetailPlanModalOpen] = useState(false);

  // GPS位置取得状態
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside all dropdown containers
      if (!target.closest('.dropdown-container')) {
        setShowTimeDropdown(false);
        setShowModeDropdown(false);
        setShowStyleDropdown(false);
        setShowMeguriDropdown(false);
        setShowDateTimeDropdown(false);
        setShowWeatherDropdown(false);
        setShowWalkRangeDropdown(false);
        // Weather dropdown removed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // GPS位置取得関数（モーダル/アラートは出さず、入力欄に住所を反映する）
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('GPS機能が利用できません');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      // 住所（表示用）を取得。失敗しても緯度経度は保持する。
      let addressLabel = '現在地';
      try {
        const addr = await reverseGeocode(latitude, longitude);
        if (addr) addressLabel = addr;
      } catch {
        // ignore (prototype)
      }

      setStartLocation({
        label: addressLabel,
        lat: latitude,
        lng: longitude,
        source: 'gps',
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
      });
    } catch (error) {
      console.error('GPS位置取得エラー:', error);
      setLocationError('位置情報を取得できませんでした');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // 初回のみGPS位置を取得（アラート等は出さず、入力欄に反映）
  useEffect(() => {
    if (!startLocation.label) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGo = async () => {
    // 新しい検索ロジックを使用してプランを生成
    const { searchSpots } = await import('@/lib/searchLogic');

    // 新しい条件設定から検索パラメータを作成
    // 選択された日時から時間を抽出
    const [selectedHour] = selectedDateTime.split(':').map(Number);

    // 時間の値を数値に変換
    const timeInMinutes = selectedTime === '60分' ? 60 :
                         selectedTime === '90分' ? 90 :
                         selectedTime === '120分' ? 120 :
                         selectedTime === '150分' ? 150 :
                         selectedTime === '半日' ? 240 :
                         selectedTime === '1日' ? 480 : 90;

    const searchParams = {
      availableTime: timeInMinutes,
      currentHour: selectedHour, // 選択された時刻を使用
      companion: '友達' as any, // デフォルト値（検索条件.txtには同伴者の項目がない）
      mode: selectedMode as any,
      weather: selectedWeather as any,
      style: selectedStyle as 'ゆっくり' | 'ほどほど' | 'アクティブ' | undefined,
      meguri: (selectedMeguri as 'カフェ' | '服' | '雑貨') || undefined,
      // 追加: 出発地（緯度経度）と遊ぶ範囲（徒歩分）
      origin: startLocation.lat != null && startLocation.lng != null ? { lat: startLocation.lat, lng: startLocation.lng } : undefined,
      walkRangeMinutes,
    };

    const searchResults = searchSpots(searchParams);
    const topSpots = searchResults.slice(0, 3);

    setPlan({
      spots: topSpots.map((spot, index) => ({
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
        duration: Math.floor(180 / topSpots.length),
        lat: spot.coordinates.latitude,
        lng: spot.coordinates.longitude,
      })),
      startTime: '14:00',
      totalDuration: 180,
>>>>>>> 939b30f (first commit)
      pinnedSpots: [],
    });
    setScreen('plan');
  };

<<<<<<< HEAD
  const handleSignOut = async () => {
    await signOut();
    setScreen('auth');
  };
=======
>>>>>>> 939b30f (first commit)

  return (
    <div className="min-h-screen bg-gray-50">
      <div
<<<<<<< HEAD
        className="relative min-h-[520px] bg-cover bg-center"
=======
        className="relative min-h-[300px] md:min-h-[400px] bg-cover bg-center"
>>>>>>> 939b30f (first commit)
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

        <header className="relative z-10 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">Now Go</h1>
<<<<<<< HEAD
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{profile?.nickname || 'User'}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-14 w-52 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{profile?.nickname}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Premium Member</p>
                  </div>
                  <button
                    onClick={() => { setScreen('profile'); setShowUserMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
=======
            <button
              onClick={() => setScreen('profile')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{profile?.nickname || 'User'}</span>
            </button>
>>>>>>> 939b30f (first commit)
          </div>
        </header>

        <div className="relative z-10 px-6 pt-10 pb-20">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              この後の予定？Nowろう
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/50">
<<<<<<< HEAD
              <button
                onClick={() => setIsStationModalOpen(true)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-2xl mb-4 text-left hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className={selectedStation ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {selectedStation || '出発駅を選択'}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="relative">
                  <button
                    onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowDateTimeDropdown(false); setShowSceneDropdown(false); setShowModeDropdown(false); setShowWeatherDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{selectedTime || '空き時間'}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showTimeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showTimeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                      {TIME_OPTIONS.map((time) => (
                        <button
                          key={time}
                          onClick={() => { setSelectedTime(time); setShowTimeDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedTime === time ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setShowDateTimeDropdown(!showDateTimeDropdown); setShowTimeDropdown(false); setShowSceneDropdown(false); setShowModeDropdown(false); setShowWeatherDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedDateTime}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showDateTimeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showDateTimeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                      {generateTimeSlots().map((time) => (
                        <button
                          key={time}
                          onClick={() => { setSelectedDateTime(time); setShowDateTimeDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedDateTime === time ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setShowSceneDropdown(!showSceneDropdown); setShowTimeDropdown(false); setShowDateTimeDropdown(false); setShowModeDropdown(false); setShowWeatherDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedScene}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showSceneDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showSceneDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      {SCENE_OPTIONS.map((scene) => (
                        <button
                          key={scene}
                          onClick={() => { setSelectedScene(scene); setShowSceneDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedScene === scene ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {scene}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setShowModeDropdown(!showModeDropdown); setShowTimeDropdown(false); setShowDateTimeDropdown(false); setShowSceneDropdown(false); setShowWeatherDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedMode}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showModeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showModeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      {MODE_OPTIONS.map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setSelectedMode(mode); setShowModeDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedMode === mode ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setShowWeatherDropdown(!showWeatherDropdown); setShowTimeDropdown(false); setShowDateTimeDropdown(false); setShowSceneDropdown(false); setShowModeDropdown(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedWeather}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showWeatherDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showWeatherDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      {WEATHER_OPTIONS.map((weather) => (
                        <button
                          key={weather}
                          onClick={() => { setSelectedWeather(weather); setShowWeatherDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedWeather === weather ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {weather}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
=======
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsStationModalOpen(true)}
                  className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-2xl text-left hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                    <Train className="w-5 h-5 text-white" />
                  </div>
                  <span className={startLocation.label ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {startLocation.label || (isGettingLocation ? '現在地を取得中…' : '現在地（タップして変更）')}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="px-4 py-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="GPSで現在位置を取得"
                >
                  <MapPin className={`w-5 h-5 text-green-600 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                </button>
              </div>

              {locationError && (
                <div className="mb-4 text-xs text-red-500 px-1">
                  {locationError}
                </div>
              )}

              {/* 新しい検索条件.txt準拠のUI */}
              <div className="space-y-2 mb-4">

                {/* 第1行: 日付・時刻・天気 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-1">日付</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 border-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="relative dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-1">時刻</label>
                    <button
                      onClick={() => { setShowDateTimeDropdown(!showDateTimeDropdown); setShowTimeDropdown(false); setShowModeDropdown(false); setShowStyleDropdown(false); setShowMeguriDropdown(false); setShowWeatherDropdown(false); setShowWalkRangeDropdown(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <span className="truncate text-xs">{selectedDateTime}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-1 ${showDateTimeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showDateTimeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                        {TIME_SLOTS.map((timeSlot) => (
                          <button
                            key={timeSlot}
                            onClick={() => { setSelectedDateTime(timeSlot); setShowDateTimeDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors ${selectedDateTime === timeSlot ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {timeSlot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-1">天気</label>
                    <button
                      onClick={() => { setShowWeatherDropdown(!showWeatherDropdown); setShowTimeDropdown(false); setShowModeDropdown(false); setShowStyleDropdown(false); setShowMeguriDropdown(false); setShowDateTimeDropdown(false); setShowWalkRangeDropdown(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <span className="truncate text-xs">{selectedWeather}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-1 ${showWeatherDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showWeatherDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        {WEATHER_OPTIONS.map((weather) => (
                          <button
                            key={weather}
                            onClick={() => { setSelectedWeather(weather); setShowWeatherDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors ${selectedWeather === weather ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {weather}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 第2行: 空き時間・遊ぶ範囲 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-1">空き時間</label>
                    <button
                      onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowModeDropdown(false); setShowStyleDropdown(false); setShowMeguriDropdown(false); setShowDateTimeDropdown(false); setShowWeatherDropdown(false); setShowWalkRangeDropdown(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <span className="flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-xs">{selectedTime}</span>
                      </span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showTimeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showTimeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                        {TIME_OPTIONS.map((time) => (
                          <button
                            key={time}
                            onClick={() => { setSelectedTime(time); setShowTimeDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors ${selectedTime === time ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative dropdown-container">
                    <label className="block text-xs font-medium text-gray-600 mb-1">遊ぶ範囲</label>
                    <button
                      onClick={() => {
                        setShowWalkRangeDropdown(!showWalkRangeDropdown);
                        setShowTimeDropdown(false);
                        setShowModeDropdown(false);
                        setShowStyleDropdown(false);
                        setShowMeguriDropdown(false);
                        setShowDateTimeDropdown(false);
                        setShowWeatherDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <span className="truncate text-xs">徒歩{walkRangeMinutes}分</span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-1 ${showWalkRangeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showWalkRangeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        {WALK_RANGE_OPTIONS.map((minutes) => (
                          <button
                            key={minutes}
                            onClick={() => {
                              setWalkRangeMinutes(minutes);
                              setShowWalkRangeDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs transition-colors ${walkRangeMinutes === minutes ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            徒歩{minutes}分
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 詳細プランボタン */}
                <button
                  onClick={() => setIsDetailPlanModalOpen(true)}
                  className="w-full px-4 py-3.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <span>遊びの詳細プラン</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

>>>>>>> 939b30f (first commit)
              </div>

              <button
                onClick={handleGo}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99]"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <main className="px-6 pb-12 pt-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Featured Plans</h3>
                <p className="text-sm text-gray-500 mt-1">今すぐ使えるおすすめプラン</p>
              </div>
              <button
                onClick={() => setScreen('themes')}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
              >
                すべて見る
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div
              ref={featuredScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            >
              {FEATURED_PLANS.map((plan, index) => (
                <button
                  key={index}
                  onClick={handleGo}
                  className="flex-shrink-0 w-64 md:w-72 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left group snap-start"
                >
                  <div className="relative h-36 md:h-40 overflow-hidden">
                    <img
                      src={plan.image}
                      alt={plan.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-bold text-white text-base md:text-lg">{plan.title}</h4>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {plan.spots} spots
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Nearby Spots</h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedStation || '現在地'}周辺のスポット
                </p>
              </div>
              <button
                onClick={() => setScreen('nearby')}
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
              >
                すべて見る
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {NEARBY_SPOTS.slice(0, 6).map((spot, index) => (
                <button
                  key={index}
                  onClick={handleGo}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 text-left group"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={spot.image}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-gray-900">{spot.rating}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {spot.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-1">{spot.address}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {spot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <StationSelectModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} />
=======

      <StationSelectModal isOpen={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} />

      {/* 詳細プランモーダル */}
      {isDetailPlanModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-75" onClick={() => setIsDetailPlanModalOpen(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-visible shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">詳細プラン設定</h3>
                <button
                  onClick={() => setIsDetailPlanModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">閉じる</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 今日はどんな感じ？ */}
                <div className="relative dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">今日はどんな感じ？</label>
                  <button
                    onClick={() => {
                      setShowModeDropdown(!showModeDropdown);
                      setShowStyleDropdown(false);
                      setShowMeguriDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedMode}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showModeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showModeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                      {MODE_OPTIONS.map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setSelectedMode(mode); setShowModeDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedMode === mode ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 遊びのスタイル */}
                <div className="relative dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">遊びのスタイル</label>
                  <button
                    onClick={() => {
                      setShowStyleDropdown(!showStyleDropdown);
                      setShowModeDropdown(false);
                      setShowMeguriDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedStyle}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showStyleDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showStyleDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                      {STYLE_OPTIONS.map((style) => (
                        <button
                          key={style}
                          onClick={() => { setSelectedStyle(style); setShowStyleDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedStyle === style ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 何か巡る？ */}
                <div className="relative dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">何か巡る？（任意）</label>
                  <button
                    onClick={() => {
                      setShowMeguriDropdown(!showMeguriDropdown);
                      setShowModeDropdown(false);
                      setShowStyleDropdown(false);
                      setShowWalkRangeDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <span className="truncate">{selectedMeguri || '未選択'}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${showMeguriDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showMeguriDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-visible z-[9999] border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { setSelectedMeguri(''); setShowMeguriDropdown(false); }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedMeguri === '' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        未選択
                      </button>
                      {MEGURI_OPTIONS.map((meguri) => (
                        <button
                          key={meguri}
                          onClick={() => { setSelectedMeguri(meguri); setShowMeguriDropdown(false); }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${selectedMeguri === meguri ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {meguri}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDetailPlanModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailPlanModalOpen(false);
                    handleGo();
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  検索実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
>>>>>>> 939b30f (first commit)
    </div>
  );
}
