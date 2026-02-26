'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import {
  ArrowLeft,
  User,
  LogOut,
  ChevronRight,
  Heart,
  MapPin,
  Clock,
  Settings,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { getFavoriteSpotCount, getVisitedSpotCount, getPlanHistoryCount } from '@/lib/storage';

const GENDER_OPTIONS = ['男', '女', 'その他'] as const;

export function ProfileScreen() {
  const { profile, signOut, user, isGuest, updateProfile } = useAuth();
  const { setScreen } = useNowgoStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  // 設定画面
  const [showSettings, setShowSettings] = useState(false);
  const [editGender, setEditGender] = useState(profile?.gender || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birth_date || '');
  const [editNickname, setEditNickname] = useState(profile?.nickname || '');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (isGuest) return;
    getFavoriteSpotCount().then(setFavCount);
    getVisitedSpotCount().then(setVisitedCount);
    getPlanHistoryCount().then(setHistoryCount);
  }, [isGuest]);

  const handleSignOut = async () => {
    await signOut();
    setScreen('auth');
  };

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ nickname: nicknameInput.trim() });
      setIsEditingNickname(false);
    } catch {
      // エラー時は何もしない
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSettings = () => {
    setEditNickname(profile?.nickname || '');
    setEditGender(profile?.gender || '');
    setEditBirthDate(profile?.birth_date || '');
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateProfile({
        nickname: editNickname.trim() || undefined,
        gender: editGender || undefined,
        birth_date: editBirthDate || undefined,
      });
      setShowSettings(false);
    } catch {
      // エラー時は何もしない
    } finally {
      setSavingSettings(false);
    }
  };

  const nickname = profile?.nickname || 'ユーザー';
  const email = user?.email || '';
  const initial = nickname.charAt(0);

  // ── ゲスト表示 ──
  if (isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
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
              className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold active:scale-[0.97] transition-all"
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

  // ── 設定画面 ──
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100">
          <div className="max-w-2xl mx-auto flex items-center h-12 px-5">
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <span className="ml-2 text-base font-semibold text-gray-900">設定</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 pt-6 space-y-5">
          {/* ニックネーム */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-gray-500 mb-2">ニックネーム</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900"
              maxLength={20}
            />
          </div>

          {/* 性別 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-gray-500 mb-2">性別</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGender(g)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    editGender === g
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 生年月日 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-gray-500 mb-2">生年月日</label>
            <input
              type="date"
              value={editBirthDate}
              onChange={(e) => setEditBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition-all text-gray-900"
            />
          </div>

          {/* メールアドレス（読み取り専用） */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-medium text-gray-500 mb-2">メールアドレス</label>
            <p className="px-4 py-3 text-gray-400 text-sm">{email}</p>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {savingSettings ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    );
  }

  const menuSections = [
    {
      items: [
        { icon: Heart, label: 'お気に入りスポット', color: 'text-pink-500', count: favCount },
        { icon: MapPin, label: '行ったスポット', color: 'text-emerald-500', count: visitedCount },
        { icon: Clock, label: 'プラン履歴', color: 'text-violet-500', count: historyCount },
      ],
    },
    {
      items: [
        { icon: Settings, label: '設定', color: 'text-gray-400', action: handleOpenSettings },
        { icon: HelpCircle, label: 'ヘルプ', color: 'text-gray-400' },
        { icon: Shield, label: 'プライバシーポリシー', color: 'text-gray-400' },
      ],
    },
  ];

  // ── メイン表示 ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex items-center h-12 px-5">
          <button
            onClick={() => setScreen('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <span className="ml-2 text-base font-semibold text-gray-900">プロフィール</span>
        </div>
      </div>

      {/* ── Profile card ── */}
      <div className="max-w-2xl mx-auto px-5 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{initial}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="flex-1 text-lg font-bold text-gray-900 bg-gray-50 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-gray-900 min-w-0"
                    autoFocus
                    maxLength={20}
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={saving}
                    className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? '...' : '保存'}
                  </button>
                  <button
                    onClick={() => { setIsEditingNickname(false); setNicknameInput(nickname); }}
                    className="px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsEditingNickname(true); setNicknameInput(nickname); }}
                  className="group text-left"
                >
                  <h1 className="text-lg font-bold text-gray-900 group-hover:text-gray-600 transition-colors">
                    {nickname}
                    <span className="ml-1.5 text-xs text-gray-300 group-hover:text-gray-400">編集</span>
                  </h1>
                </button>
              )}
              {email && (
                <p className="text-sm text-gray-400 mt-0.5 truncate">{email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu sections ── */}
      <div className="max-w-2xl mx-auto px-5 pt-5 space-y-4">
        {menuSections.map((section, si) => (
          <div key={si} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {section.items.map((item, ii) => (
              <button
                key={ii}
                onClick={'action' in item ? (item as any).action : undefined}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                <span className="flex-1 text-[15px] text-gray-900">{item.label}</span>
                {'count' in item && (
                  <span className="text-sm text-gray-300 tabular-nums">{(item as any).count}</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── Logout ── */}
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-12">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-red-500 active:scale-[0.97] transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>

      {/* ── ログアウト確認 ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 w-full sm:max-w-sm shadow-2xl">
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
