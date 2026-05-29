'use client';

import { useEffect, useRef, useState } from 'react';
import {
  STATUSES,
  STATUS_LABELS,
  TIERS,
  FORMAT_OPTIONS,
  EPIGRAM_FORMATS,
  EPIGRAM_TYPES,
  saveConcept,
  deleteConcept,
  duplicateConcept,
  loadDeployments,
  addDeployment,
  removeDeployment,
  genConceptId,
} from '@/lib/concepts';
import { CORE_PILLARS, pillarLabel } from '@/lib/pillars';
import {
  listConceptMedia,
  uploadMedia,
  deleteMedia,
  signedUrl,
  validateFile,
  isImage,
  isVideo,
} from '@/lib/media';

const EMPTY_DRAFT = {
  id: '',
  title: '',
  description: '',
  pillar: 'DOG',
  preferred_format: 'IG Single Image',
  epigram_type: '',
  status: 'sketch',
  tier: 'T2',
  budget: '',
  brief: '',
  notes: '',
  caption: '',
  mentions: '',
  source: '',
  asset_links: '',
  series: '',
};

// Pointing the cross-app links at the calendar. In production both apps
// live at their dogppl.co subdomains; in local development the boneyard
// runs on next dev and the calendar on Vite (5173 by default), so we
// resolve to whichever target is reachable. NEXT_PUBLIC_CALENDAR_ORIGIN
// (if set) wins, then localhost defaults to the Vite port, otherwise we
// fall back to the production hostname.
function calendarOrigin() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CALENDAR_ORIGIN) {
    return process.env.NEXT_PUBLIC_CALENDAR_ORIGIN;
  }
  if (typeof window !== 'undefined' && /^localhost$|^127\.0\.0\.1$/.test(window.location.hostname)) {
    return 'http://localhost:5173';
  }
  return 'https://calendar.dogppl.co';
}

function buildCalendarUrl(conceptId, { place = false } = {}) {
  const params = new URLSearchParams();
  params.set('concept', conceptId);
  if (place) params.set('place', '1');
  return `${calendarOrigin()}/?${params.toString()}`;
}

const TIER_TOOLTIP = [
  { tier: 'T1 (Heavy lift)', body: 'Anchors the brand. Full production, quarterly cadence. Brand films, anniversary pieces, major partnerships. Typical budget: $25k–100k+.' },
  { tier: 'T2 (Medium lift)', body: 'Recurring series. 1–2 week lead time. Member episodes, Rufferee tips, themed series. Typical budget: $1k–10k per piece.' },
  { tier: 'T3 (Low lift)', body: 'Fast-turn, repeatable. 0–3 day lead. Single images, simple Reels, templates. Typical budget: under $500 / mostly internal team time.' },
];

export default function ConceptModal({ open, concept, byId, allConcepts = [], placementCount = 0, onClose, onSaved, onDeleted, onDuplicated }) {
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
        preferred_format: concept.preferred_format || 'IG Single Image',
        epigram_type: concept.epigram_type || '',
        status: concept.status || 'approved',
        tier: concept.tier || 'T2',
        budget: concept.budget == null ? '' : String(concept.budget),
        brief: concept.brief || '',
        notes: concept.notes || '',
        caption: concept.caption || '',
        mentions: concept.mentions || '',
        source: concept.source || '',
        asset_links: concept.asset_links || '',
        series: concept.series || '',
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
    const budgetApplies = draft.tier === 'T1' || draft.tier === 'T2';
    const budgetRaw = String(draft.budget || '').replace(/[^\d]/g, '');
    const budgetVal = budgetApplies && budgetRaw ? parseInt(budgetRaw, 10) : null;
    const epigramApplies = EPIGRAM_FORMATS.has(draft.preferred_format);
    const payload = {
      id: draft.id,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      pillar: draft.pillar,
      preferred_format: draft.preferred_format || null,
      epigram_type: epigramApplies ? (draft.epigram_type || null) : null,
      tier: draft.tier || null,
      budget: budgetVal,
      status: draft.status,
      brief: draft.brief.trim() || null,
      notes: draft.notes.trim() || null,
      caption: draft.caption.trim() || null,
      mentions: draft.mentions.trim() || null,
      source: draft.source.trim() || null,
      asset_links: draft.asset_links.trim() || null,
      series: draft.series.trim() || null,
    };
    const { error } = await saveConcept(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    // For a freshly created concept, hand the parent a flag so it can
    // keep the modal open and transition into edit state in place
    // (exposing the media section, deployment log, etc.) instead of
    // closing the modal. Existing concepts close as before.
    onSaved(payload, { wasNew: isNew });
  }

  async function onDuplicate() {
    if (!concept) return;
    setError(null);
    setSaving(true);
    const { error, concept: dup } = await duplicateConcept(concept, allConcepts);
    setSaving(false);
    if (error) { setError(error.message); return; }
    onDuplicated?.(dup);
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

        <div className="flex items-start justify-between gap-4 mb-1 pr-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud flex items-center gap-2 flex-wrap">
            <span>{isNew ? 'New Concept' : `${byId || draft.id} · ${STATUS_LABELS[draft.status] || draft.status}`}</span>
            {!isNew && concept?.is_scheduled && draft.status !== 'deployed' && draft.status !== 'buried' && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em] px-1.5 py-0.5"
                style={{ background: 'rgba(229,188,42,0.14)', color: '#E5BC2A' }}
              >
                Scheduled
              </span>
            )}
          </div>
          {!isNew && (
            <button
              onClick={onDuplicate}
              disabled={saving}
              title="Create a copy of this concept as a new Sketch"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-mud border border-mud px-3 py-1.5 hover:text-bone hover:border-bone transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              + Duplicate
            </button>
          )}
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

        {EPIGRAM_FORMATS.has(draft.preferred_format) && (
          <Field label="Epigram type">
            <Select value={draft.epigram_type} onChange={v => set('epigram_type', v)}>
              <option value="">— pick one —</option>
              {(EPIGRAM_TYPES.includes(draft.epigram_type) || !draft.epigram_type
                ? EPIGRAM_TYPES
                : [draft.epigram_type, ...EPIGRAM_TYPES]
              ).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        )}

        <div className={`grid gap-4 ${(draft.tier === 'T1' || draft.tier === 'T2') ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">Tier</label>
              <TierInfo />
            </div>
            <Select value={draft.tier} onChange={v => set('tier', v)}>
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          {(draft.tier === 'T1' || draft.tier === 'T2') && (
            <Field label="Budget (USD)">
              <CurrencyInput value={draft.budget} onChange={v => set('budget', v)} />
            </Field>
          )}
        </div>

        <Field label="Brief — the case for the idea">
          <Textarea value={draft.brief} onChange={v => set('brief', v)} placeholder="What is this? Who is it for? Why does it matter?" rows={4} />
        </Field>

        <Field label="Caption">
          <Textarea value={draft.caption} onChange={v => set('caption', v)} placeholder="The post copy as it will read on the feed." rows={3} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mentions">
            <Input value={draft.mentions} onChange={v => set('mentions', v)} placeholder="@dogppl, @collaborator…" />
          </Field>
          <Field label="Source">
            <Input value={draft.source} onChange={v => set('source', v)} placeholder="Who or where this came from." />
          </Field>
        </div>

        <Field label="Asset Links — one per line">
          <Textarea value={draft.asset_links} onChange={v => set('asset_links', v)} placeholder="Drive folder, Figma, footage, scripts…" rows={3} />
        </Field>

        <Field label='Series — optional grouping ("Meet the Dog", "Rufferee Canine Edu"…)'>
          <Input value={draft.series} onChange={v => set('series', v)} placeholder="Leave blank for one-off concepts." />
        </Field>

        {!isNew && <MediaSection conceptId={draft.id} />}

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

        {!isNew && concept?.id && placementCount > 0 && (
          <div className="mt-6 pt-5 border-t border-subtle">
            <a
              href={buildCalendarUrl(concept.id)}
              target="_blank"
              rel="noopener"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud hover:text-bone transition-colors"
            >
              Open in Calendar → {placementCount} placement{placementCount === 1 ? '' : 's'}
            </a>
          </div>
        )}

        {!isNew
          && concept?.id
          && draft.status === 'approved'
          && !concept.is_scheduled
          && concept.status !== 'deployed'
          && (
          <div className="mt-6 pt-5 border-t border-subtle">
            <a
              href={buildCalendarUrl(concept.id, { place: true })}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-grass hover:bg-grass-bright text-bone font-mono text-[11px] uppercase tracking-[0.12em] px-4 py-3 transition-colors"
            >
              Send to Calendar →
            </a>
            <div className="font-mono text-[10px] text-bone-dim mt-2 tracking-[0.08em]">
              Opens the calendar with this concept ready to drop on a day.
            </div>
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

function CurrencyInput({ value, onChange }) {
  // Strip non-digits as the user types so the stored draft is always a
  // clean whole-dollar string. Empty string = null on save.
  const handle = e => {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    onChange(cleaned);
  };
  const display = value === '' || value == null
    ? ''
    : Number(String(value).replace(/[^\d]/g, '')).toLocaleString('en-US');
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-bone-dim text-sm pointer-events-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handle}
        placeholder="—"
        className="w-full bg-paw-deep border border-strong text-bone text-sm pl-7 pr-3.5 py-3 outline-none focus:border-bone transition-colors"
      />
    </div>
  );
}

function TierInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="What do the tiers mean?"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        className="w-3.5 h-3.5 rounded-full border border-mud text-mud hover:text-bone hover:border-bone text-[9px] leading-none flex items-center justify-center font-mono"
      >
        i
      </button>
      {open && (
        <div
          role="tooltip"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full mt-2 z-20 w-[320px] bg-paw-deep border border-strong p-4 text-[12px] leading-relaxed text-bone shadow-lg"
        >
          {TIER_TOOLTIP.map(t => (
            <div key={t.tier} className="mb-2.5 last:mb-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mud mb-0.5">{t.tier}</div>
              <div className="text-bone-dim">{t.body}</div>
            </div>
          ))}
        </div>
      )}
    </span>
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

function MediaSection({ conceptId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listConceptMedia(conceptId)
      .then(rows => { if (!cancelled) setItems(rows); })
      .catch(e => { if (!cancelled) setError(e.message || String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [conceptId]);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    const errs = [];
    const uploaded = [];
    for (const f of files) {
      const v = validateFile(f);
      if (v) { errs.push(v); continue; }
      try {
        const row = await uploadMedia(conceptId, f);
        uploaded.push(row);
      } catch (e) {
        errs.push(`"${f.name}" failed: ${e.message || e}`);
      }
    }
    if (uploaded.length) setItems(prev => [...prev, ...uploaded]);
    if (errs.length) setError(errs.join('  '));
    setBusy(false);
  }

  async function handleRemove(row) {
    if (!confirm('Remove this file? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteMedia(row);
      setItems(prev => prev.filter(r => r.id !== row.id));
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="mt-6 pt-5 border-t border-subtle">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-3">
        Media
      </h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer border border-dashed px-4 py-6 text-center text-sm transition-colors ${
          dragOver ? 'border-bone text-bone bg-paw-elev' : 'border-strong text-bone-dim hover:border-bone hover:text-bone'
        }`}
      >
        {busy
          ? 'Uploading…'
          : 'Drop images or video here, or click to choose. PNG / JPG / WebP / MP4 / MOV. 50 MB max.'}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {error && (
        <div className="mt-2 text-rust text-xs border border-rust/30 px-3 py-2">{error}</div>
      )}

      {loading ? (
        <div className="font-display italic text-bone-dim text-[13px] py-3">Loading media…</div>
      ) : items.length === 0 ? (
        <div className="font-display italic text-bone-dim text-[13px] py-3">No media yet.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 mt-3">
          {items.map(row => (
            <MediaThumb key={row.id} row={row} onRemove={() => handleRemove(row)} disabled={busy} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaThumb({ row, onRemove, disabled }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    signedUrl(row.file_path).then(u => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [row.file_path]);

  const img = isImage(row.file_type);
  const vid = isVideo(row.file_type);

  return (
    <div className="relative group bg-paw-deep border border-subtle aspect-square overflow-hidden">
      {url && img && (
        <img src={url} alt={row.alt_text || ''} className="w-full h-full object-cover" />
      )}
      {url && vid && (
        <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
      )}
      {!url && (
        <div className="absolute inset-0 flex items-center justify-center text-bone-dim text-[10px] font-mono">
          loading…
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove media"
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-paw/80 text-bone text-base leading-none opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rust"
      >
        ×
      </button>
      <div className="absolute bottom-0 inset-x-0 bg-paw/80 px-1.5 py-0.5 font-mono text-[9px] text-bone-dim opacity-0 group-hover:opacity-100 transition-opacity">
        {formatBytes(row.file_size)}
      </div>
    </div>
  );
}

function formatBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
