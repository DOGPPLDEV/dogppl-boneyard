'use client';

import { useEffect, useState } from 'react';
import {
  STATUSES,
  STATUS_LABELS,
  TIERS,
  FORMAT_OPTIONS,
  saveConcept,
  deleteConcept,
  loadDeployments,
  addDeployment,
  removeDeployment,
  genConceptId,
} from '@/lib/concepts';
import { CORE_PILLARS, pillarLabel } from '@/lib/pillars';

const EMPTY_DRAFT = {
  id: '',
  title: '',
  description: '',
  pillar: 'DOG',
  preferred_format: 'Campaign',
  status: 'sketch',
  tier: 'T2',
  brief: '',
  notes: '',
  asset_links: '',
};

export default function ConceptModal({ open, concept, byId, placementCount = 0, onClose, onSaved, onDeleted }) {
  const isNew = !concept;
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [deployments, setDeployments] = useState([]);
  const [depDraft, setDepDraft] = useState({ date: '', channel: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset draft when the modal opens with a different concept.
  useEffect(() => {
    if (!open) return;
    if (concept) {
      setDraft({
        id: concept.id,
        title: concept.title || '',
        description: concept.description || '',
        pillar: concept.pillar || 'DOG',
        preferred_format: concept.preferred_format || 'Campaign',
        status: concept.status || 'approved',
        tier: concept.tier || 'T2',
        brief: concept.brief || '',
        notes: concept.notes || '',
        asset_links: concept.asset_links || '',
      });
      loadDeployments(concept.id).then(setDeployments).catch(() => setDeployments([]));
    } else {
      setDraft({ ...EMPTY_DRAFT, id: genConceptId() });
      setDeployments([]);
    }
    setDepDraft({ date: '', channel: '', notes: '' });
    setError(null);
  }, [open, concept]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  async function onSave() {
    if (!draft.title.trim()) { setError('A concept needs a name.'); return; }
    setError(null);
    setSaving(true);
    const payload = {
      id: draft.id,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      pillar: draft.pillar,
      preferred_format: draft.preferred_format || null,
      tier: draft.tier || null,
      status: draft.status,
      brief: draft.brief.trim() || null,
      notes: draft.notes.trim() || null,
      asset_links: draft.asset_links.trim() || null,
    };
    const { error } = await saveConcept(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onSaved(payload);
  }

  async function onDelete() {
    if (!concept) return;
    if (!confirm(`Permanently remove "${concept.title}" from the boneyard? This cannot be undone. (Use the Buried status if you just want to retire it.)`)) return;
    setSaving(true);
    const { error } = await deleteConcept(concept.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onDeleted(concept.id);
  }

  async function onAddDeployment() {
    const { date, channel, notes } = depDraft;
    if (!date || !channel.trim()) { setError('Need at least a date and channel for a deployment.'); return; }
    const { error } = await addDeployment({
      conceptId: draft.id,
      deployedAt: date,
      channel: channel.trim(),
      notes: notes.trim() || null,
    });
    if (error) { setError(error.message); return; }
    const fresh = await loadDeployments(draft.id);
    setDeployments(fresh);
    setDepDraft({ date: '', channel: '', notes: '' });
  }

  async function onRemoveDeployment(id) {
    const { error } = await removeDeployment(id);
    if (error) { setError(error.message); return; }
    setDeployments(deps => deps.filter(d => d.id !== id));
  }

  // Include the loaded format in the dropdown even if it's outside the
  // canonical list, so editing a legacy concept doesn't silently lose it.
  const formatOptions = FORMAT_OPTIONS.includes(draft.preferred_format)
    ? FORMAT_OPTIONS
    : [draft.preferred_format, ...FORMAT_OPTIONS];

  // Same for pillar — the DB may carry "Timely", "Events", etc.
  const pillarOptions = CORE_PILLARS.includes(draft.pillar)
    ? CORE_PILLARS
    : [draft.pillar, ...CORE_PILLARS];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-6 py-12 overflow-y-auto"
      style={{ background: 'rgba(14,14,14,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-paw-card border border-strong max-w-[720px] w-full p-8 sm:p-12 mb-12 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-bone-dim hover:text-bone text-2xl"
        >
          ×
        </button>

        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud mb-1">
          {isNew ? 'New Concept' : `${byId || draft.id} · ${STATUS_LABELS[draft.status] || draft.status}`}
        </div>
        <h2 className="font-display text-4xl font-light tracking-[-0.02em] opsz-72 mb-8">
          {isNew ? 'Add to the Boneyard' : (concept.title || '(untitled)')}
        </h2>

        <Field label="Concept Name">
          <Input value={draft.title} onChange={v => set('title', v)} placeholder='e.g. "Worth It"' />
        </Field>

        <Field label="One-Liner">
          <Input value={draft.description} onChange={v => set('description', v)} placeholder="The shortest version of the idea." />
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Pillar">
            <Select value={draft.pillar} onChange={v => set('pillar', v)}>
              {pillarOptions.map(p => <option key={p} value={p}>{pillarLabel(p)}</option>)}
            </Select>
          </Field>
          <Field label="Format">
            <Select value={draft.preferred_format} onChange={v => set('preferred_format', v)}>
              {formatOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={draft.status} onChange={v => set('status', v)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Tier">
          <Select value={draft.tier} onChange={v => set('tier', v)}>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>

        <Field label="Brief — the case for the idea">
          <Textarea value={draft.brief} onChange={v => set('brief', v)} placeholder="What is this? Who is it for? Why does it matter?" rows={4} />
        </Field>

        <Field label="Notes — open thinking, references, riffs">
          <Textarea value={draft.notes} onChange={v => set('notes', v)} placeholder="Anything else worth keeping." rows={3} />
        </Field>

        <Field label="Asset Links — one per line">
          <Textarea value={draft.asset_links} onChange={v => set('asset_links', v)} placeholder="Drive folder, Figma, footage, scripts…" rows={3} />
        </Field>

        {!isNew && (
          <div className="mt-6 pt-5 border-t border-subtle">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-3">
              Deployment History
            </h3>
            {deployments.length === 0 ? (
              <div className="font-display italic text-bone-dim text-[13px] py-2">No deployments logged yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {deployments.map(d => (
                  <div key={d.id} className="bg-paw-deep border border-subtle px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="text-[13px] text-bone">
                      <strong className="font-semibold">{d.channel}</strong>
                      {d.notes ? <span className="text-bone-dim"> — {d.notes}</span> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-bone-dim">
                        {formatDate(d.deployed_at)}
                      </span>
                      <button
                        onClick={() => onRemoveDeployment(d.id)}
                        aria-label="Remove deployment"
                        className="text-bone-dim hover:text-rust text-base px-1"
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-[130px_1fr_1fr_auto] gap-2 mt-2 max-sm:grid-cols-2">
              <input
                type="date"
                value={depDraft.date}
                onChange={e => setDepDraft(d => ({ ...d, date: e.target.value }))}
                className="bg-paw-deep border border-strong text-bone text-xs px-2.5 py-2 outline-none focus:border-bone"
              />
              <input
                type="text"
                value={depDraft.channel}
                onChange={e => setDepDraft(d => ({ ...d, channel: e.target.value }))}
                placeholder="Channel (IG, email, retail…)"
                className="bg-paw-deep border border-strong text-bone text-xs px-2.5 py-2 outline-none focus:border-bone"
              />
              <input
                type="text"
                value={depDraft.notes}
                onChange={e => setDepDraft(d => ({ ...d, notes: e.target.value }))}
                placeholder="Notes (optional)"
                className="bg-paw-deep border border-strong text-bone text-xs px-2.5 py-2 outline-none focus:border-bone"
              />
              <button
                onClick={onAddDeployment}
                className="bg-grass hover:bg-grass-bright text-bone font-mono text-[11px] uppercase tracking-[0.1em] px-4"
              >Log</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 text-rust text-sm border border-rust/30 px-3 py-2">{error}</div>
        )}

        {!isNew && placementCount > 0 && (
          <div className="mt-6 pt-5 border-t border-subtle">
            <a
              href={`https://calendar.dogppl.co/?concept=${encodeURIComponent(concept.id)}`}
              target="_blank"
              rel="noopener"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud hover:text-bone transition-colors"
            >
              Open in Calendar → {placementCount} placement{placementCount === 1 ? '' : 's'}
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-subtle">
          <div>
            {!isNew && (
              <button
                onClick={onDelete}
                disabled={saving}
                className="text-rust border border-rust text-xs font-medium uppercase tracking-[0.08em] px-5 py-3 hover:bg-rust hover:text-bone transition-colors disabled:opacity-60"
              >Bury Forever</button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="text-bone border border-strong text-xs font-medium uppercase tracking-[0.08em] px-5 py-3 hover:border-bone transition-colors"
            >Cancel</button>
            <button
              onClick={onSave}
              disabled={saving}
              className="bg-bone text-paw text-xs font-semibold uppercase tracking-[0.08em] px-5 py-3 hover:bg-mud hover:text-bone transition-colors disabled:opacity-60"
            >{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-6">
      <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-2">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-paw-deep border border-strong text-bone text-sm px-3.5 py-3 outline-none focus:border-bone transition-colors"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-paw-deep border border-strong text-bone text-sm px-3.5 py-3 outline-none focus:border-bone transition-colors resize-y leading-relaxed"
    />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-paw-deep border border-strong text-bone text-sm px-3.5 py-3 outline-none focus:border-bone transition-colors"
    >
      {children}
    </select>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
