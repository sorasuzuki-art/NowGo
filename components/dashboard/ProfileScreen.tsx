'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  User,
  LogOut,
  ChevronRight,
  Star,
  Edit3,
} from 'lucide-react';

const SAMPLE_FAVORITE_SPOTS = [
  {
    id: '1',
    name: 'スターバックス 渋谷スカイ店',
    category: 'カフェ',
    rating: 5,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '2',
    name: '代々木公園',
    category: '公園',
    rating: 5,
    image: 'https://images.pexels.com/photos/1462935/pexels-photo-1462935.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: '3',
    name: '明治神宮',
    category: '観光',
    rating: 4,
    image: 'https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const SAMPLE_FAVORITE_PLANS = [
  {
    id: '1',
    name: '渋谷カフェ巡りプラン',
    description: 'おしゃれなカフェを3軒巡る2時間コース',
    spots: 3,
    duration: '2時間',
  },
  {
    id: '2',
    name: '自然散策プラン',
    description: '代々木公園〜明治神宮を散歩するリフレッシュコース',
    spots: 2,
    duration: '3時間',
  },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    '観光': { bg: 'bg-blue-50', text: 'text-blue-700' },
    '公園': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'ショップ': { bg: 'bg-violet-50', text: 'text-violet-700' },
    'カフェ': { bg: 'bg-amber-50', text: 'text-amber-700' },
  };
  return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

export function ProfileScreen() {
  const { profile, signOut, user, isGuest } = useAuth();
  const { setScreen } = useNowgoStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setScreen('auth');
  };

  const userInfo = {
    nickname: profile?.nickname || 'ユーザー',
    email: user?.email || 'user@example.com',
    age: profile?.age || 25,
  };

  // ── ゲスト表示 ──
  if (isGuest) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <style>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.92); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div
          className="bg-gray-50 rounded-3xl p-8 max-w-md w-full text-center"
          style={{ animation: 'scaleIn 0.4s ease-out both' }}
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ゲストモード</h2>
          <p className="text-gray-400 text-sm mb-6">
            プロフィール機能を利用するには<br />会員登録が必要です
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setScreen('auth')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-bold active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/25"
            >
              会員登録・ログイン
            </button>
            <button
              onClick={() => setScreen('dashboard')}
              className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-medium hover:bg-gray-200 active:scale-[0.97] transition-all"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── メイン表示 ──
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl px-5 pt-4 pb-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── Profile hero ── */}
      <div
        className="px-5 pt-6 pb-8"
        style={{ animation: 'scaleIn 0.4s ease-out both' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Avatar with gradient ring */}
          <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-blue-400 via-violet-400 to-pink-400 p-[3px] mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <User className="w-10 h-10 text-gray-300" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{userInfo.nickname}</h1>
          <p className="text-gray-400 text-sm mt-1">{userInfo.email}</p>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-blue-50 rounded-2xl py-3 px-2">
              <p className="text-2xl font-bold text-blue-600">{SAMPLE_FAVORITE_SPOTS.length}</p>
              <p className="text-[11px] text-blue-400 mt-0.5">スポット</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl py-3 px-2">
              <p className="text-2xl font-bold text-emerald-600">{SAMPLE_FAVORITE_PLANS.length}</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">プラン</p>
            </div>
            <div className="bg-amber-50 rounded-2xl py-3 px-2">
              <p className="text-2xl font-bold text-amber-600">{userInfo.age}</p>
              <p className="text-[11px] text-amber-400 mt-0.5">歳</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-5">

        {/* お気に入りスポット */}
        <div
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 200ms both' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">お気に入りスポット</h2>
            <button className="text-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all">
              すべて見る
            </button>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {SAMPLE_FAVORITE_SPOTS.map((spot, i) => {
              const catColor = getCategoryColor(spot.category);
              return (
                <div
                  key={spot.id}
                  className="flex-shrink-0 w-40 snap-start group cursor-pointer active:scale-[0.97] transition-transform"
                  style={{ animation: `fadeInUp 0.4s ease-out ${i * 80 + 300}ms both` }}
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={spot.image}
                      alt={spot.name}
                      className="w-40 h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                      <div className="flex items-center gap-0.5">
                        {[...Array(spot.rating)].map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${catColor.bg} ${catColor.text} backdrop-blur-sm`}>
                        {spot.category}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 truncate">{spot.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* お気に入りプラン */}
        <div
          className="mb-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 400ms both' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">お気に入りプラン</h2>
            <button className="text-sm text-gray-400 hover:text-gray-600 active:scale-95 transition-all">
              すべて見る
            </button>
          </div>
          <div className="space-y-3">
            {SAMPLE_FAVORITE_PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100/80 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-4"
                style={{ animation: `fadeInUp 0.4s ease-out ${i * 80 + 500}ms both` }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{plan.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                      {plan.spots} スポット
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {plan.duration}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ログアウト */}
        <div className="pb-12">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-red-500 active:scale-[0.97] transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* ── ログアウト確認 ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 w-full sm:max-w-sm shadow-2xl"
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">ログアウトしますか？</h3>
            <p className="text-sm text-gray-500 mb-6">いつでもまた戻ってきてください。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.97] transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-red-500 text-white font-medium hover:bg-red-600 active:scale-[0.97] transition-all"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
