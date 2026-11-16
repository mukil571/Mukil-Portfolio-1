import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Sparkles, FolderGit2, GraduationCap, ExternalLink, Save, Check, AlertTriangle } from 'lucide-react';
import { ProfileTab, SkillsTab, ProjectsTab, EducationTab } from './tabs.jsx';
import { validate, errorsForTab } from './validate.js';

const TABS = [
  { id: 'profile', label: 'Profile & Contact', icon: User, Panel: ProfileTab },
  { id: 'skills', label: 'Skills', icon: Sparkles, Panel: SkillsTab },
  { id: 'projects', label: 'Projects', icon: FolderGit2, Panel: ProjectsTab },
  { id: 'education', label: 'Education', icon: GraduationCap, Panel: EducationTab },
];

export default function AdminApp() {
  const [draft, setDraft] = useState(null);
  const [savedJson, setSavedJson] = useState('');
  const [tab, setTab] = useState('profile');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { kind: 'ok' | 'error', text }
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    fetch('/__content')
      .then((r) => {
        if (!r.ok) throw new Error('The editor only works while `npm run dev` (or `npm run edit`) is running.');
        return r.json();
      })
      .then((data) => {
        setDraft(data);
        setSavedJson(JSON.stringify(data));
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const dirty = draft !== null && JSON.stringify(draft) !== savedJson;
  const errors = useMemo(() => (draft ? validate(draft) : {}), [draft]);
  const errorCount = Object.keys(errors).length;

  const update = useCallback((fn) => {
    setDraft((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!draft || saving) return;
    if (errorCount) {
      setShowErrors(true);
      const first = TABS.find((t) => errorsForTab(errors, t.id));
      if (first) setTab(first.id);
      setToast({ kind: 'error', text: `Fix ${errorCount} highlighted field${errorCount > 1 ? 's' : ''} before saving.` });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/__content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setDraft(data.content);
      setSavedJson(JSON.stringify(data.content));
      setShowErrors(false);
      setToast({ kind: 'ok', text: 'Saved — your site is updated.' });
    } catch (err) {
      setToast({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }, [draft, saving, errorCount, errors]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const active = TABS.find((t) => t.id === tab);
  const visibleErrors = showErrors ? errors : {};

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-glow/50 font-mono text-xs font-semibold text-cyan-glow shadow-glow-sm">
            MP
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight">Portfolio Editor</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate2">
              {dirty ? (
                <span className="text-amber-300">● Unsaved changes</span>
              ) : (
                'All changes saved'
              )}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate2 transition-colors hover:border-white/40 hover:text-white sm:inline-flex"
            >
              View site <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              title="Save (Ctrl+S)"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/60 bg-cyan-glow/10 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-glow shadow-glow-sm transition-all hover:bg-cyan-glow/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-slate2 disabled:shadow-none"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </header>

      {loadError ? (
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-amber-300" />
          <p className="text-slate2">{loadError}</p>
        </div>
      ) : !draft ? (
        <p className="py-24 text-center font-mono text-xs uppercase tracking-[0.3em] text-slate2">Loading…</p>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[220px_1fr]">
          <nav aria-label="Editor sections" className="md:sticky md:top-24 md:self-start">
            <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {TABS.map(({ id, label, icon: Icon }) => {
                const count = showErrors ? errorsForTab(errors, id) : 0;
                const isActive = id === tab;
                return (
                  <li key={id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setTab(id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                        isActive
                          ? 'border border-cyan-glow/40 bg-cyan-glow/10 text-white'
                          : 'border border-transparent text-slate2 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-glow' : ''}`} strokeWidth={1.8} />
                      <span className="whitespace-nowrap">{label}</span>
                      {count > 0 && (
                        <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 hidden rounded-xl border border-white/10 p-4 text-xs leading-relaxed text-slate2 md:block">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-glow">How it works</p>
              Save writes your changes and the site reloads with them. To update the published site, run{' '}
              <code className="text-white">npm run build</code> and redeploy.
            </div>
          </nav>

          <main>
            <h2 className="mb-2 text-2xl font-bold">{active.label}</h2>
            <active.Panel draft={draft} update={update} errors={visibleErrors} />
          </main>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border px-5 py-3 text-sm shadow-glow-md backdrop-blur-md ${
              toast.kind === 'ok'
                ? 'border-cyan-glow/50 bg-[#05121a]/90 text-white'
                : 'border-rose-400/50 bg-[#1a0508]/90 text-rose-200'
            }`}
          >
            {toast.kind === 'ok' ? (
              <Check className="h-4 w-4 text-cyan-glow" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-300" />
            )}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
