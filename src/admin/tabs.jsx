import { useRef, useState } from 'react';
import { ChevronDown, FileText, Upload, X, Plus } from 'lucide-react';
import { ICONS, COLORS } from '../data/options.js';
import {
  TextField,
  ChipInput,
  IconPicker,
  ColorPicker,
  ItemControls,
  AddButton,
  Card,
  Label,
  moveItem,
} from './fields.jsx';

function Intro({ children }) {
  return <p className="mb-6 text-sm leading-relaxed text-slate2">{children}</p>;
}

// ---------------- Profile & Contact ----------------

function ResumeUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file) {
    if (!file) return;
    setError('');
    if (file.type && file.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/__resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.path);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove() {
    onChange('');
  }

  return (
    <div>
      <Label hint="PDF, up to 10 MB">Resume</Label>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-glow/40 bg-cyan-glow/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-white">
            <FileText className="h-4 w-4 text-cyan-glow" /> resume.pdf
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-cyan-glow underline">
              open
            </a>
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate2 hover:text-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={remove}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate2 hover:border-rose-400/60 hover:text-rose-400"
            >
              Remove
            </button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm text-slate2 transition-colors hover:border-cyan-glow/60 hover:text-cyan-glow disabled:opacity-60"
        >
          <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload your resume (PDF)'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {error && <span className="mt-1.5 block text-xs text-rose-400">{error}</span>}
    </div>
  );
}

export function ProfileTab({ draft, update, errors }) {
  const field = (key, props) => (
    <TextField
      value={draft[key] || ''}
      onChange={(v) => update((d) => (d[key] = v))}
      error={errors[`profile.${key}`]}
      {...props}
    />
  );

  return (
    <div className="space-y-6">
      <Intro>Your name, headline and contact details. Leave a field empty to hide it on the site.</Intro>
      <Card className="space-y-5">
        {field('name', { label: 'Name', hint: 'Formed by the particles in the hero', placeholder: 'Mukil P' })}
        <div className="grid gap-5 sm:grid-cols-2">
          {field('role', { label: 'Role', placeholder: 'Full Stack Developer' })}
          {field('subtitle', { label: 'Subtitle', placeholder: 'B.E. CSE Student' })}
        </div>
        {field('tagline', { label: 'About you', hint: 'Shown under your name', multiline: true, rows: 4 })}
      </Card>
      <Card className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {field('email', { label: 'Email', type: 'email', placeholder: 'you@example.com' })}
          {field('phone', { label: 'Phone', placeholder: '+91 …' })}
        </div>
        {field('location', { label: 'Location', placeholder: 'City, State' })}
        {field('contactNote', { label: 'Contact message', multiline: true, rows: 2 })}
      </Card>
      <Card className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {field('github', { label: 'GitHub URL', placeholder: 'https://github.com/username' })}
          {field('linkedin', { label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' })}
        </div>
        <ResumeUpload value={draft.resume} onChange={(v) => update((d) => (d.resume = v))} />
        {field('siteUrl', {
          label: 'Website address',
          hint: 'Fill in after you publish — used for share previews',
          placeholder: 'https://your-site.com',
        })}
      </Card>
    </div>
  );
}

// ---------------- Skills ----------------

export function SkillsTab({ draft, update, errors }) {
  const groups = draft.skills;
  return (
    <div className="space-y-5">
      <Intro>
        Skills appear as glowing stars in the 3D constellation, coloured by category. Type a skill and press Enter
        to add it.
      </Intro>
      {groups.map((g, i) => (
        <Card key={i} className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <TextField
                label="Category"
                value={g.category}
                placeholder="e.g. Frameworks"
                error={errors[`skills.${i}.category`]}
                onChange={(v) => update((d) => (d.skills[i].category = v))}
              />
            </div>
            <div className="pt-6">
              <ItemControls
                index={i}
                count={groups.length}
                label="category"
                onMove={(dir) => update((d) => (d.skills = moveItem(d.skills, i, dir)))}
                onRemove={() => update((d) => d.skills.splice(i, 1))}
              />
            </div>
          </div>
          <ColorPicker value={g.color} onChange={(v) => update((d) => (d.skills[i].color = v))} />
          <ChipInput
            label="Skills"
            hint="Enter or comma to add"
            values={g.items}
            color={COLORS[g.color] || COLORS.cyan}
            placeholder="e.g. React"
            onChange={(v) => update((d) => (d.skills[i].items = v))}
          />
        </Card>
      ))}
      <AddButton
        onClick={() =>
          update((d) =>
            d.skills.push({
              category: '',
              color: Object.keys(COLORS)[d.skills.length % Object.keys(COLORS).length],
              items: [],
            })
          )
        }
      >
        Add skill category
      </AddButton>
    </div>
  );
}

// ---------------- Projects ----------------

function HighlightsEditor({ values, onChange }) {
  return (
    <div>
      <Label hint="Shown in the project's detail panel">Highlights</Label>
      <div className="space-y-2">
        {values.map((h, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={h}
              onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="What's a key feature or achievement?"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-slate2/50 outline-none focus:border-cyan-glow/60"
            />
            <button
              type="button"
              aria-label="Remove highlight"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="rounded-xl border border-white/10 px-3 text-slate2 hover:border-rose-400/60 hover:text-rose-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-glow hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add highlight
        </button>
      </div>
    </div>
  );
}

function LinkStatus({ label, set }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
        set ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow' : 'border-white/10 text-slate2/70'
      }`}
    >
      {label} {set ? '✓' : '—'}
    </span>
  );
}

export function ProjectsTab({ draft, update, errors }) {
  const [open, setOpen] = useState(null);
  const projects = draft.projects;

  return (
    <div className="space-y-4">
      <Intro>
        Click a project to edit it, including its Live Demo and Source Code links. Projects without a link show a
        dimmed “Coming soon” button. Use the arrows to change the order they appear in.
      </Intro>
      {projects.map((p, i) => {
        const Icon = ICONS[p.icon] || ICONS.code;
        const isOpen = open === i;
        const hasError = Object.keys(errors).some((k) => k.startsWith(`projects.${i}.`));
        return (
          <Card key={i} className={hasError ? 'border-rose-400/50' : ''}>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-glow/30 bg-cyan-glow/5 text-cyan-glow">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white">{p.title || 'Untitled project'}</span>
                  <span className="block truncate text-xs text-slate2">{p.tags.join(' · ') || 'No tags yet'}</span>
                  <span className="mt-1.5 flex gap-1.5">
                    <LinkStatus label="Demo" set={!!p.demo} />
                    <LinkStatus label="Source" set={!!p.repo} />
                  </span>
                </span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 text-slate2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <ItemControls
                index={i}
                count={projects.length}
                label="project"
                onMove={(dir) => {
                  update((d) => (d.projects = moveItem(d.projects, i, dir)));
                  if (isOpen) setOpen(i + dir);
                }}
                onRemove={() => {
                  update((d) => d.projects.splice(i, 1));
                  setOpen(null);
                }}
              />
            </div>

            {isOpen && (
              <div className="mt-6 space-y-5 border-t border-white/10 pt-6">
                <TextField
                  label="Title"
                  value={p.title}
                  error={errors[`projects.${i}.title`]}
                  onChange={(v) => update((d) => (d.projects[i].title = v))}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Live demo link"
                    hint="Empty shows “Coming soon”"
                    placeholder="https://…"
                    value={p.demo}
                    error={errors[`projects.${i}.demo`]}
                    onChange={(v) => update((d) => (d.projects[i].demo = v))}
                  />
                  <TextField
                    label="Source code link"
                    hint="Empty shows “Coming soon”"
                    placeholder="https://github.com/…"
                    value={p.repo}
                    error={errors[`projects.${i}.repo`]}
                    onChange={(v) => update((d) => (d.projects[i].repo = v))}
                  />
                </div>
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={p.description}
                  onChange={(v) => update((d) => (d.projects[i].description = v))}
                />
                <IconPicker value={p.icon} onChange={(v) => update((d) => (d.projects[i].icon = v))} />
                <ChipInput
                  label="Tech tags"
                  hint="Enter or comma to add"
                  placeholder="e.g. React"
                  values={p.tags}
                  onChange={(v) => update((d) => (d.projects[i].tags = v))}
                />
                <HighlightsEditor
                  values={p.highlights}
                  onChange={(v) => update((d) => (d.projects[i].highlights = v))}
                />
              </div>
            )}
          </Card>
        );
      })}
      <AddButton
        onClick={() => {
          update((d) =>
            d.projects.push({ title: '', description: '', icon: 'code', tags: [], highlights: [], repo: '', demo: '' })
          );
          setOpen(projects.length);
        }}
      >
        Add project
      </AddButton>
    </div>
  );
}

// ---------------- Education ----------------

export function EducationTab({ draft, update, errors }) {
  const entries = draft.education;
  return (
    <div className="space-y-5">
      <Intro>Each entry becomes a glowing card on the education timeline, top to bottom.</Intro>
      {entries.map((e, i) => (
        <Card key={i} className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <TextField
                label="Degree / title"
                placeholder="Bachelor of Engineering (B.E.) in …"
                value={e.degree}
                error={errors[`education.${i}.degree`]}
                onChange={(v) => update((d) => (d.education[i].degree = v))}
              />
            </div>
            <div className="pt-6">
              <ItemControls
                index={i}
                count={entries.length}
                label="entry"
                onMove={(dir) => update((d) => (d.education = moveItem(d.education, i, dir)))}
                onRemove={() => update((d) => d.education.splice(i, 1))}
              />
            </div>
          </div>
          <TextField
            label="School / college"
            value={e.institution}
            onChange={(v) => update((d) => (d.education[i].institution = v))}
          />
          <TextField
            label="Years"
            placeholder="2025 — 2029 (Expected)"
            value={e.period}
            onChange={(v) => update((d) => (d.education[i].period = v))}
          />
        </Card>
      ))}
      <AddButton onClick={() => update((d) => d.education.push({ degree: '', institution: '', period: '' }))}>
        Add education entry
      </AddButton>
    </div>
  );
}
