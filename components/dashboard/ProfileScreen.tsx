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
  FolderOpen,
  Plus,
  Heart,
  Clock,
  Star,
  MoreHorizontal,
  X,
  Check,
} from 'lucide-react';

const VISITED_PLACES = [
  { id: '1', name: 'Blue Bottle Coffee 渋谷店', date: '2024/01/08', category: 'カフェ', rating: 5, folder: 'お気に入りカフェ' },
  { id: '2', name: '代々木公園', date: '2024/01/05', category: '公園', rating: 4, folder: null },
  { id: '3', name: 'MIYASHITA PARK', date: '2024/01/03', category: 'ショッピング', rating: 4, folder: '渋谷エリア' },
  { id: '4', name: '渋谷スクランブルスクエア', date: '2023/12/28', category: '展望', rating: 5, folder: '渋谷エリア' },
  { id: '5', name: 'Bunkamura', date: '2023/12/20', category: 'カルチャー', rating: 4, folder: null },
  { id: '6', name: '六本木ヒルズ', date: '2023/12/15', category: 'ショッピング', rating: 3, folder: '六本木エリア' },
  { id: '7', name: 'カフェ モーニング', date: '2023/12/10', category: 'カフェ', rating: 5, folder: 'お気に入りカフェ' },
  { id: '8', name: '上野恩賜公園', date: '2023/12/05', category: '公園', rating: 4, folder: null },
];

const FOLDERS = [
  { id: '1', name: 'お気に入りカフェ', count: 5, color: 'bg-amber-500' },
  { id: '2', name: '渋谷エリア', count: 8, color: 'bg-blue-500' },
  { id: '3', name: '六本木エリア', count: 3, color: 'bg-emerald-500' },
  { id: '4', name: 'デートスポット', count: 12, color: 'bg-rose-500' },
];

type TabType = 'history' | 'folders' | 'favorites';

export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { setScreen } = useNowgoStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-blue-500');

  const handleSignOut = async () => {
    await signOut();
    setScreen('auth');
  };

  const FOLDER_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-cyan-500',
  ];

  const favoriteSpots = VISITED_PLACES.filter((p) => p.rating === 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/1420709/pexels-photo-1420709.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
        <header className="relative z-10 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setScreen('dashboard')}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>
      </div>

      <div className="relative px-6 -mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.nickname || 'User'}</h2>
                <p className="text-sm text-gray-500 mt-1">Now Goを使い始めて30日</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{VISITED_PLACES.length}</span>
                    <span>places</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{FOLDERS.length}</span>
                    <span>folders</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900">{VISITED_PLACES.length}</p>
                <p className="text-xs text-gray-500 mt-1">Visited</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900">{favoriteSpots.length}</p>
                <p className="text-xs text-gray-500 mt-1">Favorites</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-bold text-gray-900">{FOLDERS.length}</p>
                <p className="text-xs text-gray-500 mt-1">Collections</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'history' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>History</span>
                </div>
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('folders')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'folders' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>Collections</span>
                </div>
                {activeTab === 'folders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'favorites' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>Favorites</span>
                </div>
                {activeTab === 'favorites' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {VISITED_PLACES.map((place) => (
                    <button
                      key={place.id}
                      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {place.name}
                          </h4>
                          {place.rating === 5 && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{place.date}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">{place.category}</span>
                          {place.folder && (
                            <span className="text-xs px-2 py-0.5 bg-blue-50 rounded-full text-blue-600">{place.folder}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'folders' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowNewFolderModal(true)}
                    className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-blue-100">
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-500 group-hover:text-blue-600">New Collection</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Create a new folder for your places</p>
                    </div>
                  </button>

                  {FOLDERS.map((folder) => (
                    <button
                      key={folder.id}
                      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                    >
                      <div className={`w-12 h-12 rounded-xl ${folder.color} flex items-center justify-center`}>
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {folder.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{folder.count} spots</p>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-3">
                  {favoriteSpots.length === 0 ? (
                    <div className="py-12 text-center">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No favorites yet</p>
                      <p className="text-sm text-gray-400 mt-1">Rate places 5 stars to add them here</p>
                    </div>
                  ) : (
                    favoriteSpots.map((place) => (
                      <button
                        key={place.id}
                        className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {place.name}
                            </h4>
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{place.date}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">{place.category}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Logout?</h3>
            <p className="text-sm text-gray-500 mb-6">You can always come back anytime.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">New Collection</h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="My favorite spots"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center transition-transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  >
                    {selectedColor === color && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowNewFolderModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all"
            >
              Create Collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
