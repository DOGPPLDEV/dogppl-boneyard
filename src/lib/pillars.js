// The calendar's DB schema uses these pillar values:
//   DOG, Culture, Bond, Edu, Brand   ← the five "core" pillars
//   Timely, Paid, Events, Alerts, Partners   ← calendar-only categories
//
// The Boneyard UI surfaces the five core pillars as nice display names
// and files everything else under a single "Other" filter, so calendar-
// authored concepts (events, paid, etc.) still appear in the vault but
// don't clutter the pillar balance.

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

export function pillarLabel(rawPillar) {
  if (!rawPillar) return 'Other';
  return DISPLAY[rawPillar] || 'Other';
}

export function pillarRaw(displayLabel) {
  return RAW[displayLabel] || displayLabel;
}

export function isCorePillar(rawPillar) {
  return CORE_PILLARS.includes(rawPillar);
}

// Returns true if a concept matches a UI filter chip value.
// Filter values are display labels ("Dog", "Culture", ..., "Other", "all").
export function matchesPillarFilter(rawPillar, filterValue) {
  if (filterValue === 'all') return true;
  if (filterValue === 'Other') return !isCorePillar(rawPillar);
  return pillarLabel(rawPillar) === filterValue;
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
