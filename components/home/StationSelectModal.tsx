'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { getRecentStations, addRecentStation } from '@/lib/storage';
import { geocode } from '@/lib/geocoding';

const STATION_DATA = [
  { name: '渋谷駅', lines: ['JR山手線', '東急田中線'] },
  { name: '新宿駅', lines: ['JR山手線', '丸ノ内線'] },
  { name: '東京駅', lines: ['JR中央線', '丸ノ内線'] },
  { name: '品川駅', lines: ['JR山手線', '京急本線'] },
  { name: '池袋駅', lines: ['JR山手線', '丸ノ内線'] },
  { name: '浅草駅', lines: ['銀座線', '浅草線'] },
  { name: '表参道駅', lines: ['銀座線', '半蔵門線'] },
  { name: '原宿駅', lines: ['JR山手線', '副都心線'] },
  { name: '六本木駅', lines: ['日比谷線', '南北線'] },
  { name: '丸の内駅', lines: ['丸ノ内線'] },
  { name: '恵比寿駅', lines: ['JR山手線', '日比谷線'] },
  { name: '中目黒駅', lines: ['日比谷線', '東急東横線'] },
  { name: '代官山駅', lines: ['東急東横線'] },
  { name: '自由が丘駅', lines: ['東急東横線', '大井町線'] },
  { name: '二子玉川駅', lines: ['東急田園都市線', '大井町線'] },
];

interface StationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StationSelectModal({ isOpen, onClose }: StationSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentStations, setRecentStations] = useState<string[]>([]);
  const { setStartLocation } = useNowgoStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getRecentStations().then((recent) => {
        setRecentStations(recent.map((s) => s.name));
      });
    }
  }, [isOpen]);

  const filteredStations = useMemo(() => {
    if (!searchQuery) return STATION_DATA;
    return STATION_DATA.filter((station) => station.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const recentStationData = useMemo(() => {
    return recentStations
      .map((name) => STATION_DATA.find((s) => s.name === name))
      .filter((s): s is typeof STATION_DATA[0] => s !== undefined);
  }, [recentStations]);

  const handleSelect = async (stationName: string) => {
    try {
      setIsSaving(true);
      // 駅名を緯度経度に変換（裏で距離計算に使えるように）
      // 失敗しても駅名（label）は確実にセットする
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const result = await geocode(stationName);
        if (result) {
          lat = result.lat;
          lng = result.lng;
        }
      } catch {
        // ignore (prototype)
      }

      setStartLocation({
        label: stationName,
        lat,
        lng,
        source: 'manual',
        accuracy: null,
      });
      await addRecentStation(stationName);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">駅を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="駅名を入力（例：渋谷）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 py-5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white rounded-xl text-base"
              autoFocus
              disabled={isSaving}
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {filteredStations.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">駅が見つかりません</p>
              </div>
            ) : (
              <>
                {!searchQuery && recentStationData.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 py-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">最近使った駅</p>
                    </div>
                    <div className="space-y-2">
                      {recentStationData.map((station) => (
                        <button
                          key={station.name}
                          onClick={() => handleSelect(station.name)}
                          className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 hover:border-blue-200"
                        >
                          <div className="font-medium text-gray-900">{station.name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{station.lines.join(' / ')}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  {!searchQuery && recentStationData.length > 0 && (
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2 mb-2">
                      すべての駅
                    </p>
                  )}
                  <div className="space-y-2">
                    {filteredStations.map((station) => (
                      <button
                        key={station.name}
                        onClick={() => handleSelect(station.name)}
                        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 hover:border-gray-200"
                      >
                        <div className="font-medium text-gray-900">{station.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{station.lines.join(' / ')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
