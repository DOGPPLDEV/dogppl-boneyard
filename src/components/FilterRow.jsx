'use client';

import { STATUSES, STATUS_LABELS, TIERS, SORT_OPTIONS } from '@/lib/concepts';
import { PILLAR_CHIPS } from '@/lib/pillars';

export default function FilterRow({ filters, setFilters, search, setSearch }) {
  const pillarSel = Array.isArray(filters.pillar) ? filters.pillar : [];

  function togglePillar(id) {
    setFilters(f => {
      const cur = Array.isArray(f.pillar) ? f.pillar : [];
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
      return { ...f, pillar: next };
    });
  }

  function clearPillars() {
    setFilters(f => ({ ...f, pillar: [] }));
  }

  const prioritizing = !!filters.prioritizing;
  const sortValue = filters.sort || 'newest';

  return (
    <div
      className="sticky top-0 z-10 px-6 sm:px-12 py-5 flex flex-col gap-3 border-b border-subtle"
      style={{ background: 'rgba(24,24,24,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mr-1">Pillar</span>
          <Chip
            active={pillarSel.length === 0}
            onClick={clearPillars}
            label="All"
          />
          {PILLAR_CHIPS.map(chip => (
            <Chip
              key={chip.id}
              active={pillarSel.includes(chip.id)}
              onClick={() => togglePillar(chip.id)}
              label={chip.label}
            />
          ))}
        </div>

        <FilterGroup
          label="Status"
          value={filters.status}
          onChange={v => setFilters(f => ({ ...f, status: v }))}
          options={[{ value: 'all', label: 'All' }, ...STATUSES.map(s => ({ value: s, label: STATUS_LABELS[s] }))]}
        />
        <FilterGroup
          label="Tier"
          value={filters.tier}
          onChange={v => setFilters(f => ({ ...f, tier: v }))}
          options={[{ value: 'all', label: 'All' }, ...TIERS.map(t => ({ value: t, label: t }))]}
        />
        <FilterGroup
          label="Scheduled"
          value={filters.scheduled || 'all'}
          onChange={v => setFilters(f => ({ ...f, scheduled: v }))}
          options={[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'unscheduled', label: 'Not yet scheduled' },
          ]}
        />

        <div className="relative ml-auto">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-base text-bone-dim">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search concepts…"
            className="bg-transparent border-0 border-b border-strong text-bone text-sm pl-6 pr-0 py-2 w-56 outline-none focus:border-b-bone transition-colors placeholder:italic placeholder:text-bone-dim"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilters(f => ({ ...f, prioritizing: !f.prioritizing }))}
          aria-pressed={prioritizing}
          className={`px-3 py-1.5 text-xs border tracking-[0.02em] transition-colors inline-flex items-center gap-1.5 ${
            prioritizing
              ? 'bg-grass-bright text-paw border-grass-bright'
              : 'bg-transparent text-bone-dim border-strong hover:border-bone hover:text-bone'
          }`}
        >
          <span aria-hidden className="text-[10px] leading-none">{prioritizing ? '●' : '○'}</span>
          Currently prioritizing
        </button>
        <span className="font-display italic text-[12px] text-bone-dim">
          In production or placed in the next 14 days.
        </span>

        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim ml-4">Sort</span>
        <div className="relative">
          <select
            value={sortValue}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            className="appearance-none bg-transparent text-bone-dim text-xs tracking-[0.02em] border border-strong px-3 py-1.5 pr-7 hover:border-bone hover:text-bone focus:border-bone focus:text-bone outline-none transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-paw text-bone">
                {opt.label}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-bone-dim">▾</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs border tracking-[0.02em] transition-colors ${
        active
          ? 'bg-bone text-paw border-bone'
          : 'bg-transparent text-bone-dim border-strong hover:border-bone hover:text-bone'
      }`}
    >
      {label}
    </button>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mr-1">{label}</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs border tracking-[0.02em] transition-colors ${
            value === opt.value
              ? 'bg-bone text-paw border-bone'
              : 'bg-transparent text-bone-dim border-strong hover:border-bone hover:text-bone'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
