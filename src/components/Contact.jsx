import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Copy, Check, Send, Github, Linkedin, ExternalLink } from 'lucide-react';
import Section, { fadeUp } from './Section.jsx';
import { profile } from '../data/content.js';

const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const CHANNELS = [
  profile.location && { icon: MapPin, label: 'Location', value: profile.location, copyable: false },
  profile.phone && { icon: Phone, label: 'Phone', value: profile.phone, copyable: true },
  profile.email && { icon: Mail, label: 'Email', value: profile.email, copyable: true },
  profile.github && { icon: Github, label: 'GitHub', value: shortUrl(profile.github), href: profile.github },
  profile.linkedin && {
    icon: Linkedin,
    label: 'LinkedIn',
    value: shortUrl(profile.linkedin),
    href: profile.linkedin,
  },
].filter(Boolean);

function ChannelCard({ icon: Icon, label, value, copyable, href }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <motion.div
      variants={fadeUp}
      className="group glow-border relative glass flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:border-cyan-glow/40 hover:shadow-glow-sm"
    >
      <div className="rounded-xl border border-cyan-glow/30 bg-cyan-glow/5 p-3 text-cyan-glow">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate2">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-white">{value}</p>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="rounded-lg border border-white/10 p-2 text-slate2 transition-all duration-300 hover:border-cyan-glow/40 hover:text-cyan-glow"
        >
          {copied ? (
            <Check className="h-4 w-4 text-cyan-glow" strokeWidth={1.8} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${label}`}
          className="rounded-lg border border-white/10 p-2 text-slate2 transition-all duration-300 hover:border-cyan-glow/40 hover:text-cyan-glow"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
        </a>
      )}
    </motion.div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function onSubmit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate2/60 outline-none transition-all duration-300 focus:border-cyan-glow/50 focus:shadow-glow-sm';

  return (
    <Section id="contact" kicker="// 04" title="Get In Touch">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {CHANNELS.map((channel) => (
            <ChannelCard key={channel.label} {...channel} />
          ))}
          {profile.contactNote && (
            <motion.p variants={fadeUp} className="mt-2 text-sm leading-relaxed text-slate2">
              {profile.contactNote}
            </motion.p>
          )}
        </div>

        <motion.form variants={fadeUp} onSubmit={onSubmit} className="glow-border relative glass rounded-2xl p-7 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Your name"
              aria-label="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
            <input
              type="email"
              required
              placeholder="Your email"
              aria-label="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <textarea
            required
            rows={5}
            placeholder="Your message…"
            aria-label="Your message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={`${inputClass} resize-none`}
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2.5 rounded-full border border-cyan-glow/60 px-7 py-3 font-mono text-xs uppercase tracking-[0.25em] text-cyan-glow shadow-glow-sm transition-all duration-300 hover:bg-cyan-glow/10 hover:shadow-glow-md"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
            Send Message
          </button>
        </motion.form>
      </div>
    </Section>
  );
}
