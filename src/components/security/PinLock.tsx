'use client';

import { useState } from 'react';
import { Shield, Delete } from 'lucide-react';

interface PinLockProps {
  onUnlock: (pin: string) => boolean;
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length >= 4) {
      setTimeout(() => {
        const ok = onUnlock(next);
        if (!ok) {
          setError(true);
          setShake(true);
          setPin('');
          setTimeout(() => setShake(false), 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center">
          <Shield size={32} className="text-violet-400" />
        </div>
        <h1 className="text-white text-2xl font-bold">Locked</h1>
        <p className="text-slate-400 text-sm">Enter your PIN to continue</p>
      </div>

      <div className={`flex gap-3 ${shake ? 'animate-bounce' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${
            i < pin.length
              ? error ? 'bg-red-500 border-red-500' : 'bg-violet-400 border-violet-400'
              : 'border-slate-600'
          }`} />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm -mt-4">Incorrect PIN</p>}

      <div className="grid grid-cols-3 gap-3 w-64">
        {DIGITS.map((d, i) => (
          d === '⌫' ? (
            <button
              key={i}
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors active:scale-95"
            >
              <Delete size={20} />
            </button>
          ) : d === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-violet-700 text-white text-2xl font-light transition-all active:scale-95"
            >
              {d}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
