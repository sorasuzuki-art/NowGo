'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Clock } from 'lucide-react';
import { useNowgoStore } from '@/hooks/useNowgoStore';
import { getRecentStations, addRecentStation } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface Station {
  id: string;
  name: string;
  name_kana?: string;
  line_name?: string;
  lat: number;
  lng: number;
}

interface StationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StationSelectModal({ isOpen, onClose }: StationSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentStations, setRecentStations] = useState<string[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const { setStartLocation } = useNowgoStore();
  const [isSaving, setIsSaving] = useState(false);

  // Load stations from database
  useEffect(() => {
    if (isOpen && allStations.length === 0) {
      loadStations();
    }
  }, [isOpen]);

  // Load recent stations
  useEffect(() => {
    if (isOpen) {
      getRecentStations().then((recent) => {
        setRecentStations(recent.map((s) => s.name));
      });
    }
  }, [isOpen]);

  const loadStations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('id, name, name_kana, line_name, lat, lng')
        .eq('prefecture', '東京都')
        .order('name');

      if (error) throw error;
      if (data) {
        setAllStations(data.map(row => ({
          ...row,
          lat: parseFloat(String(row.lat)),
          lng: parseFloat(String(row.lng)),
        })));
      }
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = useMemo(() => {
    if (!searchQuery) return allStations;
    const query = searchQuery.toLowerCase();
    return allStations.filter((station) =>
      station.name.toLowerCase().includes(query) ||
      station.name_kana?.toLowerCase().includes(query) ||
      station.line_name?.toLowerCase().includes(query)
    );
  }, [searchQuery, allStations]);

  const recentStationData = useMemo(() => {
    return recentStations
      .map((name) => allStations.find((s) => s.name === name))
      .filter((s): s is Station => s !== undefined);
  }, [recentStations, allStations]);

  const handleSelect = async (station: Station) => {
    try {
      setIsSaving(true);
      setStartLocation({
        label: station.name,
        lat: station.lat,
        lng: station.lng,
        source: 'manual',
        accuracy: null,
      });
      await addRecentStation(station.name);
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
              placeholder="駅名・路線名を入力（例：渋谷）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 py-5 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white rounded-xl text-base"
              autoFocus
              disabled={isSaving || loading}
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">読み込み中...</p>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">駅が見つかりません</p>
                {allStations.length === 0 && (
                  <p className="text-xs mt-2">駅データがありません</p>
                )}
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
                          key={station.id}
                          onClick={() => handleSelect(station)}
                          disabled={isSaving}
                          className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 hover:border-blue-200 disabled:opacity-50"
                        >
                          <div className="font-medium text-gray-900">{station.name}</div>
                          {station.line_name && (
                            <div className="text-sm text-gray-500 mt-0.5">{station.line_name}</div>
                          )}
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
                    {filteredStations.slice(0, 100).map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleSelect(station)}
                        disabled={isSaving}
                        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100 hover:border-gray-200 disabled:opacity-50"
                      >
                        <div className="font-medium text-gray-900">{station.name}</div>
                        {station.line_name && (
                          <div className="text-sm text-gray-500 mt-0.5">{station.line_name}</div>
                        )}
                      </button>
                    ))}
                    {filteredStations.length > 100 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        他 {filteredStations.length - 100} 件（検索で絞り込んでください）
                      </p>
                    )}
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
