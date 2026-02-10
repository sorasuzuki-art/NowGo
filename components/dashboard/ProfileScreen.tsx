'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  User,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  Heart,
  Clock,
  Star,
  Edit3,
  Mail,
  Calendar,
  Users,
  FolderOpen,
} from 'lucide-react';

// サンプルデータ
const SAMPLE_FAVORITE_SPOTS = [
  {
    id: '1',
    name: 'スターバックス 渋谷スカイ店',
    category: 'カフェ',
    rating: 5,
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    address: '渋谷区渋谷2-24-12',
    lastVisited: '2024/01/15'
  },
  {
    id: '2',
    name: '代々木公園',
    category: '公園',
    rating: 5,
    image: 'https://images.pexels.com/photos/1462935/pexels-photo-1462935.jpeg?auto=compress&cs=tinysrgb&w=400',
    address: '渋谷区代々木神園町2-1',
    lastVisited: '2024/01/12'
  },
  {
    id: '3',
    name: '明治神宮',
    category: '観光',
    rating: 4,
    image: 'https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=400',
    address: '渋谷区代々木神園町1-1',
    lastVisited: '2024/01/08'
  }
];

const SAMPLE_FAVORITE_PLANS = [
  {
    id: '1',
    name: '渋谷カフェ巡りプラン',
    description: 'おしゃれなカフェを3軒巡る2時間コース',
    spots: 3,
    duration: '2時間',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024/01/10'
  },
  {
    id: '2',
    name: '自然散策プラン',
    description: '代々木公園〜明治神宮を散歩するリフレッシュコース',
    spots: 2,
    duration: '3時間',
    image: 'https://images.pexels.com/photos/1462935/pexels-photo-1462935.jpeg?auto=compress&cs=tinysrgb&w=400',
    createdAt: '2024/01/05'
  }
];

export function ProfileScreen() {
  const { profile, signOut, user, isGuest } = useAuth();
  const { setScreen } = useNowgoStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setScreen('auth');
  };

  // ダミーデータ（実際のアプリではプロフィールから取得）
  const userInfo = {
    loginName: profile?.nickname || 'ユーザー',
    nickname: profile?.nickname || 'ユーザー',
    email: user?.email || 'user@example.com',
    gender: profile?.gender || '未設定',
    age: profile?.age || 25
  };

  if (isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">ゲストモード</h2>
          <p className="text-gray-500 text-sm mb-6">
            プロフィール機能を利用するには<br />会員登録が必要です
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setScreen('auth')}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              会員登録・ログイン
            </button>
            <button
              onClick={() => setScreen('dashboard')}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">プロフィール</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Edit3 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* 個人情報セクション */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              個人情報
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-lg">{userInfo.loginName}</h3>
                  <p className="text-gray-500 text-sm">ログイン名</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">ニックネーム</span>
                  </div>
                  <p className="font-medium text-gray-900">{userInfo.nickname}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">メールアドレス</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{userInfo.email}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">性別</span>
                  </div>
                  <p className="font-medium text-gray-900">{userInfo.gender}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">年齢</span>
                  </div>
                  <p className="font-medium text-gray-900">{userInfo.age}歳</p>
                </div>
              </div>
            </div>
          </div>

          {/* お気に入りスポット一覧 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                お気に入りスポット ({SAMPLE_FAVORITE_SPOTS.length})
              </h2>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                すべて見る
              </button>
            </div>

            <div className="space-y-3">
              {SAMPLE_FAVORITE_SPOTS.map((spot) => (
                <div key={spot.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{spot.name}</h3>
                      <div className="flex items-center">
                        {[...Array(spot.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        {spot.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        最終訪問: {spot.lastVisited}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* お気に入りプラン一覧 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                お気に入りプラン ({SAMPLE_FAVORITE_PLANS.length})
              </h2>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                すべて見る
              </button>
            </div>

            <div className="space-y-3">
              {SAMPLE_FAVORITE_PLANS.map((plan) => (
                <div key={plan.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <img
                    src={plan.image}
                    alt={plan.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{plan.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {plan.spots} スポット
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {plan.duration}
                      </span>
                      <span className="text-xs text-gray-500">
                        作成: {plan.createdAt}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* ログアウトボタン */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* ログアウト確認モーダル */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ログアウトしますか？</h3>
            <p className="text-sm text-gray-500 mb-6">いつでもまた戻ってきてください。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
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