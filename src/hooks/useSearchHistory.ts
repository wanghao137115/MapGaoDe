import { useState, useEffect, useCallback } from 'react';

export type SearchHistoryItem = {
  id: string;
  name: string;
  location: { lng: number; lat: number };
  address?: string;
};

const HISTORY_KEY = "place_search_history_v1";

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 从 localStorage 加载历史
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setSearchHistory(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setSearchHistory([]);
    }
  }, []);

  // 将历史保存到 localStorage（安全写入）
  const addToHistory = useCallback((item: SearchHistoryItem) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const next = [item, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      // ignore
    }
    setSearchHistory([]);
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeHistoryItem,
  };
};
