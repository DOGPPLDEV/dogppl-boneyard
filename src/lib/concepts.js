import { supabase } from './supabase';
import { isCorePillar, PILLAR_TARGETS, CORE_PILLARS } from './pillars';

// Spec sort: status priority, then updatedAt desc.
const STATUS_RANK = { approved: 0, production: 1, sketch: 2, deployed: 3, buried: 4 };

export const STATUS_LABELS = {
  sketch:     'Sketch',
  approved:   'Approved',
  production: 'In Production',
  deployed:   'Deployed',
  buried:     'Buried',
};

export const ACTIVE_STATUSES = new Set(['approved', 'production', 'deployed']);

export async function loadConcepts() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('concept_details')
    .select('*');
  if (error) throw error;
  return (data || []).sort(compareForGrid);
}

export function compareForGrid(a, b) {
  const ar = STATUS_RANK[a.status] ?? 99;
  const br = STATUS_RANK[b.status] ?? 99;
  if (ar !== br) return ar - br;
  const at = a.updated_at ? Date.parse(a.updated_at) : 0;
  const bt = b.updated_at ? Date.parse(b.updated_at) : 0;
  return bt - at;
}

// BY-### display id assigned by creation order. We use updated_at as a
// stable-ish proxy for creation order here since the DB doesn't yet
// carry a created_at — for the seeded 142 the relative order is
// arbitrary but consistent across reloads as long as the array is
// sorted the same way.
export function byNumber(concepts, conceptId) {
  const idx = concepts.findIndex(c => c.id === conceptId);
  if (idx < 0) return '';
  return 'BY-' + String(idx + 1).padStart(3, '0');
}

// Pillar balance counts: only active concepts (approved/production/deployed)
// and only the 5 core pillars contribute to the 3-2-2-2-1 visualization.
export function pillarBalance(concepts) {
  const counts = Object.fromEntries(CORE_PILLARS.map(p => [p, 0]));
  for (const c of concepts) {
    if (!ACTIVE_STATUSES.has(c.status)) continue;
    if (!isCorePillar(c.pillar)) continue;
    counts[c.pillar]++;
  }
  return CORE_PILLARS.map(pillar => {
    const count = counts[pillar];
    const target = PILLAR_TARGETS[pillar];
    let state = 'under';
    if (count > target) state = 'over';
    else if (count === target && count > 0) state = 'match';
    return { pillar, count, target, state };
  });
}
