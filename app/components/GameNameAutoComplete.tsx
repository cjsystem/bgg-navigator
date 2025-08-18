// app/components/GameNameAutoComplete.tsx
'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';

type GameNameItem = {
  id: number;
  primaryName: string;
  japaneseName: string | null;
  yearReleased: number | null;
  imageUrl: string | null;
};

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function GameNameAutoComplete({ value, onChange, placeholder = 'ゲーム名' }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GameNameItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const inputCls =
      'w-full border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 p-2 rounded text-sm ' +
      'focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500';
  const panelCls =
      'absolute z-30 w-full bg-gray-900 border border-gray-700 rounded-md shadow-lg mt-1 max-h-72 overflow-y-auto';
  const itemClsBase =
      'px-3 py-2 text-sm border-b border-gray-800 last:border-b-0 cursor-pointer flex items-center gap-2';
  const itemCls = (active: boolean) =>
      `${itemClsBase} ${active ? 'bg-gray-800 text-gray-100' : 'text-gray-100 hover:bg-gray-800'}`;
  const thumbCls = 'w-6 h-6 rounded object-cover flex-shrink-0 bg-gray-800';

  // 候補検索（デバウンス）
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!value?.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/names?search=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data: GameNameItem[] = await res.json();
          setItems(data);
          setOpen(data.length > 0);
          setHighlight(data.length > 0 ? 0 : -1);
        } else {
          setItems([]);
          setOpen(false);
        }
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  // 外側クリックで閉じる
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current || !inputRef.current) return;
      if (!panelRef.current.contains(t) && !inputRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const choose = (it: GameNameItem) => {
    // 単一選択：primaryName があればそれを、なければ日本語名をセット
    const next = it.primaryName || it.japaneseName || '';
    onChange(next);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && items[highlight]) choose(items[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
      <div className="relative">
        <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            className={inputCls}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (items.length > 0) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
        />

        {open && (
            <div ref={panelRef} className={panelCls}>
              {loading ? (
                  <div className="px-3 py-2 text-gray-400 text-sm">検索中...</div>
              ) : items.length === 0 ? (
                  <div className="px-3 py-2 text-gray-400 text-sm">候補がありません</div>
              ) : (
                  items.map((it, idx) => (
                      <div
                          key={it.id}
                          className={itemCls(idx === highlight)}
                          onMouseEnter={() => setHighlight(idx)}
                          onClick={() => choose(it)}
                      >
                        <img src={it.imageUrl || ''} alt="" className={thumbCls} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                        <div className="min-w-0">
                          <div className="truncate">{it.primaryName}</div>
                          {(it.japaneseName || it.yearReleased) && (
                              <div className="text-xs text-gray-400 truncate">
                                {it.japaneseName ? it.japaneseName : ''}{it.japaneseName && it.yearReleased ? ' ・ ' : ''}
                                {it.yearReleased ? `${it.yearReleased}` : ''}
                              </div>
                          )}
                        </div>
                      </div>
                  ))
              )}
            </div>
        )}
      </div>
  );
}