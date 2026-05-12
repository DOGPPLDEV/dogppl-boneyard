'use client';

import { STATUSES, STATUS_LABELS, TIERS } from '@/lib/concepts';

const PILLAR_FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'Dog',       label: 'Dog' },
  { value: 'Culture',   label: 'Culture' },
  { value: 'Bond',      label: 'Bond' },
  { value: 'Education', label: 'Education' },
  { value: 'Brand',     label: 'Brand' },
  { value: 'Other',     label: 'Other' },
];

export default function FilterRow({ filters, setFilters, search, setSearch }) {
  return (
    <div
      className="sticky top-0 z-10 px-6 sm:px-12 py-5 flex flex-wrap items-center gap-6 border-b border-subtle"
      style={{ background: 'rgba(24,24,24,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <FilterGroup
        label="Pillar"
        value={filters.pillar}
        onChange={v => setFilters(f => ({ ...f, pillar: v }))}
        options={PILLAR_FILTERS}
      />
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
