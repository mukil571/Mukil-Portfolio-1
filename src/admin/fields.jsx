import { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, X } from 'lucide-react';
import { ICONS, COLORS } from '../data/options.js';

const inputBase =
  'w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate2/50 outline-none transition-all focus:border-cyan-glow/60 focus:shadow-glow-sm';

export function Label({ children, hint }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate2">{children}</span>
      {hint && <span className="text-[11px] text-slate2/60">{hint}</span>}
    </span>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <span className="mt-1.5 block text-xs text-rose-400">{children}</span>;
}

export function TextField({ label, hint, value, onChange, placeholder, error, multiline, rows = 3, type = 'text' }) {
  const cls = `${inputBase} ${error ? 'border-rose-400/60' : 'border-white/10'}`;
  return (
    <label className="block">
      <Label hint={hint}>{label}</Label>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y leading-relaxed`}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      <ErrorText>{error}</ErrorText>
    </label>
  );
}

/** Type and press Enter (or comma) to add a chip; × removes it. */
export function ChipInput({ label, hint, values, onChange, placeholder, color = '#00F0FF' }) {
  const [text, setText] = useState('');

  function addMany(raw) {
    const fresh = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s, i, all) => s && !values.includes(s) && all.indexOf(s) === i);
    if (fresh.length) onChange([...values, ...fresh]);
  }

  function add() {
    addMany(text);
    setText('');
  }

  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 focus-within:border-cyan-glow/60">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-white"
            style={{ borderColor: `${color}66`, background: `${color}14` }}
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-slate2 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          placeholder={values.length ? 'Add more…' : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(',')) {
              // typing or pasting a comma commits everything before the last comma
              const cut = v.lastIndexOf(',');
              addMany(v.slice(0, cut));
              setText(v.slice(cut + 1));
            } else setText(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !text && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={add}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-white placeholder:text-slate2/50 outline-none"
        />
      </div>
    </div>
  );
}

export function IconPicker({ value, onChange }) {
  return (
    <div>
      <Label>Icon</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(ICONS).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            title={key}
            aria-label={`Icon: ${key}`}
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              value === key
                ? 'border-cyan-glow bg-cyan-glow/15 text-cyan-glow shadow-glow-sm'
                : 'border-white/10 text-slate2 hover:border-white/30 hover:text-white'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorPicker({ value, onChange }) {
  return (
    <div>
      <Label>Colour</Label>
      <div className="flex flex-wrap gap-2.5">
        {Object.entries(COLORS).map(([key, hex]) => (
          <button
            key={key}
            type="button"
            title={key}
            aria-label={`Colour: ${key}`}
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={`h-8 w-8 rounded-full border-2 transition-transform ${
              value === key ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
            }`}
            style={{ background: hex, boxShadow: value === key ? `0 0 14px ${hex}` : 'none' }}
          />
        ))}
      </div>
    </div>
  );
}

/** Move up / move down / delete buttons for an item in a list. */
export function ItemControls({ index, count, onMove, onRemove, label }) {
  const btn =
    'rounded-lg border border-white/10 p-1.5 text-slate2 transition-colors hover:border-white/30 hover:text-white disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-slate2';
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)} className={btn}>
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        className={btn}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${label}`}
        onClick={() => {
          if (window.confirm(`Delete this ${label}?`)) onRemove();
        }}
        className="rounded-lg border border-white/10 p-1.5 text-slate2 transition-colors hover:border-rose-400/60 hover:text-rose-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AddButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-dashed border-cyan-glow/40 py-4 font-mono text-xs uppercase tracking-[0.2em] text-cyan-glow transition-all hover:border-cyan-glow hover:bg-cyan-glow/5"
    >
      + {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function moveItem(list, index, dir) {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
