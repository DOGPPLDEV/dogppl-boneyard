// The calendar's DB schema uses these pillar values:
//   DOG, Culture, Bond, Edu, Brand   ← the five "core" pillars
//   Timely, Paid, Events, Alerts, Partners   ← calendar-only categories
//
// The Boneyard UI surfaces 8 multi-select pillar chips. The five core
// pillars stay 1:1 with the DB. The remaining three chips fold the
// "calendar-only" values into the closest semantic home:
//   Timely        → Timely + Alerts (alerts are time-sensitive notices)
//   Events        → Events
//   Partnerships  → Partners (DB value stays "Partners")
//   (Paid folds into Brand — paid creative is brand work cut for spend)
//
// Pillar balance bars at the top stay tied to the 5 canonical pillars
// only; the filter chips are display-only.

export const CORE_PILLARS = ['DOG', 'Culture', 'Bond', 'Edu', 'Brand'];
export const OTHER_PILLARS = ['Timely', 'Paid', 'Events', 'Alerts', 'Partners'];

// 3-2-2-2-1 balance targets the calendar enforces, keyed on the DB value.
export const PILLAR_TARGETS = { DOG: 3, Culture: 2, Bond: 2, Edu: 2, Brand: 1 };

// DB value -> display label
const DISPLAY = {
  DOG: 'Dog',
  Culture: 'Culture',
  Bond: 'Bond',
  Edu: 'Education',
  Brand: 'Brand',
};

// Display label -> DB value (inverse of DISPLAY, used when saving)
const RAW = Object.fromEntries(Object.entries(DISPLAY).map(([raw, label]) => [label, raw]));

// Multi-select filter chips. Each chip maps to one or more DB pillar
// values (OR logic). Order is the rendering order in the filter row.
export const PILLAR_CHIPS = [
  { id: 'Dog',          label: 'Dog',          raws: ['DOG'] },
  { id: 'Culture',      label: 'Culture',      raws: ['Culture'] },
  { id: 'Bond',         label: 'Bond',         raws: ['Bond'] },
  { id: 'Education',    label: 'Education',    raws: ['Edu'] },
  { id: 'Brand',        label: 'Brand',        raws: ['Brand', 'Paid'] },
  { id: 'Timely',       label: 'Timely',       raws: ['Timely', 'Alerts'] },
  { id: 'Events',       label: 'Events',       raws: ['Events'] },
  { id: 'Partnerships', label: 'Partnerships', raws: ['Partners'] },
];

const CHIP_BY_ID = Object.fromEntries(PILLAR_CHIPS.map(c => [c.id, c]));

export function pillarLabel(rawPillar) {
  if (!rawPillar) return 'Other';
  return DISPLAY[rawPillar] || rawPillar;
}

export function pillarRaw(displayLabel) {
  return RAW[displayLabel] || displayLabel;
}

export function isCorePillar(rawPillar) {
  return CORE_PILLARS.includes(rawPillar);
}

// Returns true if a concept's raw pillar matches the multi-select chip
// selection. An empty selection ([] or null) matches everything.
export function matchesPillarFilters(rawPillar, selectedChipIds) {
  if (!Array.isArray(selectedChipIds) || selectedChipIds.length === 0) return true;
  for (const id of selectedChipIds) {
    const chip = CHIP_BY_ID[id];
    if (chip && chip.raws.includes(rawPillar)) return true;
  }
  return false;
}

// Pillar tag color, matching the mockup's .tag.pillar-* rules.
// Returns CSS color values directly so consumers can inline them.
export function pillarTagStyle(rawPillar) {
  switch (rawPillar) {
    case 'DOG':     return { background: 'var(--mud)',       color: 'var(--bone)' };
    case 'Culture': return { background: 'var(--grass)',     color: 'var(--bone)' };
    case 'Bond':    return { background: 'var(--rust)',      color: 'var(--bone)' };
    case 'Edu':     return { background: 'var(--dry-sage)',  color: 'var(--paw)'  };
    case 'Brand':   return { background: 'var(--bone)',      color: 'var(--paw)'  };
    default:        return { background: 'rgba(243,241,238,0.06)', color: 'var(--bone)' };
  }
}
