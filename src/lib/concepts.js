import { supabase } from './supabase';
import { isCorePillar, PILLAR_TARGETS, CORE_PILLARS, matchesPillarFilter } from './pillars';

// Spec sort: status priority, then updatedAt desc.
const STATUS_RANK = { approved: 0, production: 1, sketch: 2, deployed: 3, buried: 4 };

export const STATUSES = ['sketch', 'approved', 'production', 'deployed', 'buried'];

export const STATUS_LABELS = {
  sketch:     'Sketch',
  approved:   'Approved',
  production: 'In Production',
  deployed:   'Deployed',
  buried:     'Buried',
};

export const STATUS_ACCENT = {
  sketch:     'var(--sand)',
  approved:   'var(--grass-bright)',
  production: 'var(--mud)',
  deployed:   'var(--rust)',
  buried:     'var(--bone-dim)',
};

export const ACTIVE_STATUSES = new Set(['approved', 'production', 'deployed']);

export const TIERS = ['T1', 'T2', 'T3'];

// Editorial format options shown in the modal dropdown. Existing
// preferred_format values from the calendar (Reel, Carousel, ...) are
// preserved when loaded and still selectable, but new concepts created
// in the Boneyard reach for the broader editorial vocabulary.
export const FORMAT_OPTIONS = [
  'Campaign',
  'Brand Film',
  'IG Reel',
  'IG Post',
  'IG Story',
  'Member Email',
  'Retail / Physical',
  'Event',
  'Editorial',
  'Series',
  'Reel',
  'Carousel',
  'Single image',
  'Video',
  'Story',
  'Other',
];

export async function loadConcepts() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('concept_details').select('*');
  if (error) throw error;
  return (data || []).sort(compareForGrid);
}

// Read calendar_state.placements (a single id=1 row keyed by day-id ->
// array of concept ids) and return a flat map of conceptId -> count.
// Used to decide whether to surface the "Open in Calendar" cross-link
// inside a concept's modal.
export async function loadPlacementCounts() {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('calendar_state')
    .select('placements')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data?.placements) return {};
  const counts = {};
  for (const ids of Object.values(data.placements)) {
    if (!Array.isArray(ids)) continue;
    for (const cid of ids) counts[cid] = (counts[cid] || 0) + 1;
  }
  return counts;
}

export function compareForGrid(a, b) {
  const ar = STATUS_RANK[a.status] ?? 99;
  const br = STATUS_RANK[b.status] ?? 99;
  if (ar !== br) return ar - br;
  const at = a.updated_at ? Date.parse(a.updated_at) : 0;
  const bt = b.updated_at ? Date.parse(b.updated_at) : 0;
  return bt - at;
}

export function byNumber(concepts, conceptId) {
  const idx = concepts.findIndex(c => c.id === conceptId);
  if (idx < 0) return '';
  return 'BY-' + String(idx + 1).padStart(3, '0');
}

// Pillar balance — only the 5 core pillars, only active statuses.
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

export function filterAndSearch(concepts, { pillar = 'all', status = 'all', tier = 'all', search = '' } = {}) {
  const q = search.trim().toLowerCase();
  return concepts.filter(c => {
    if (!matchesPillarFilter(c.pillar, pillar)) return false;
    if (status !== 'all' && c.status !== status) return false;
    if (tier !== 'all' && c.tier !== tier) return false;
    if (q) {
      const haystack = [
        c.title || '',
        c.description || '',
        c.brief || '',
        c.notes || '',
        c.preferred_format || '',
      ].join('  ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function genConceptId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `c-${rand}`;
}

export async function saveConcept(detail) {
  if (!supabase) return { error: null };
  const payload = { ...detail, updated_at: new Date().toISOString() };
  return await supabase.from('concept_details').upsert(payload);
}

export async function deleteConcept(id) {
  if (!supabase) return { error: null };
  return await supabase.from('concept_details').delete().eq('id', id);
}

export async function loadDeployments(conceptId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('concept_deployments')
    .select('*')
    .eq('concept_id', conceptId)
    .order('deployed_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addDeployment({ conceptId, deployedAt, channel, notes }) {
  if (!supabase) return { error: null };
  return await supabase.from('concept_deployments').insert({
    concept_id: conceptId,
    deployed_at: deployedAt,
    channel,
    notes: notes || null,
  });
}

export async function removeDeployment(id) {
  if (!supabase) return { error: null };
  return await supabase.from('concept_deployments').delete().eq('id', id);
}

// ─── JSON Export / Import ───────────────────────────────────────────────
// Export pulls concepts + deployments into a single JSON document.
// Import replaces the entire vault (with strong confirmation upstream).

export async function exportVault() {
  if (!supabase) return null;
  const [{ data: concepts }, { data: deployments }] = await Promise.all([
    supabase.from('concept_details').select('*'),
    supabase.from('concept_deployments').select('*'),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    concepts: concepts || [],
    deployments: deployments || [],
  };
}

export async function importVault(payload) {
  if (!supabase) throw new Error('Supabase not configured');
  if (!payload || !Array.isArray(payload.concepts)) {
    throw new Error('Invalid payload — expected { concepts: [...] }');
  }
  // Wipe and replace. The FK cascade on concept_deployments handles the
  // dependent rows when concept_details rows are deleted.
  const { error: delErr } = await supabase.from('concept_details').delete().neq('id', '');
  if (delErr) throw delErr;
  const conceptsToInsert = payload.concepts.map(c => ({
    ...c,
    updated_at: c.updated_at || new Date().toISOString(),
  }));
  const { error: insErr } = await supabase.from('concept_details').insert(conceptsToInsert);
  if (insErr) throw insErr;
  if (Array.isArray(payload.deployments) && payload.deployments.length > 0) {
    const { error: depErr } = await supabase.from('concept_deployments').insert(payload.deployments);
    if (depErr) throw depErr;
  }
}
