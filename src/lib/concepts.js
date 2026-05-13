import { supabase } from './supabase';
import { isCorePillar, PILLAR_TARGETS, CORE_PILLARS, matchesPillarFilters } from './pillars';

// Spec sort: status priority, then updatedAt desc.
const STATUS_RANK = { approved: 0, production: 1, sketch: 2, deployed: 3, buried: 4 };

export const STATUSES = ['sketch', 'approved', 'production', 'deployed', 'buried'];

export const STATUS_LABELS = {
  sketch:     'Sketch',
  approved:   'Approved',
  production: 'In Production',
  deployed:   'Published',
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
// array of concept ids). Returns:
//   counts:      { conceptId -> total placement count }   for the modal cross-link
//   priorityIds: Set<conceptId> placed in the next 14 days from `now`
// The calendar keys days as `day-YYYY-M-D` where M is 0-indexed.
export async function loadPlacementData(now = new Date()) {
  if (!supabase) return { counts: {}, priorityIds: new Set() };
  const { data, error } = await supabase
    .from('calendar_state')
    .select('placements')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data?.placements) return { counts: {}, priorityIds: new Set() };

  const counts = {};
  for (const ids of Object.values(data.placements)) {
    if (!Array.isArray(ids)) continue;
    for (const cid of ids) counts[cid] = (counts[cid] || 0) + 1;
  }

  const priorityKeys = new Set();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    priorityKeys.add(`day-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  const priorityIds = new Set();
  for (const [dayId, ids] of Object.entries(data.placements)) {
    if (!priorityKeys.has(dayId) || !Array.isArray(ids)) continue;
    for (const cid of ids) priorityIds.add(cid);
  }
  return { counts, priorityIds };
}

// Backwards-compat shim: old callers that only want counts.
export async function loadPlacementCounts() {
  const { counts } = await loadPlacementData();
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

export function filterAndSearch(concepts, { pillar = [], status = 'all', tier = 'all', search = '', prioritizing = false, priorityIds = null } = {}) {
  const q = search.trim().toLowerCase();
  return concepts.filter(c => {
    if (!matchesPillarFilters(c.pillar, pillar)) return false;
    if (status !== 'all' && c.status !== status) return false;
    if (tier !== 'all' && c.tier !== tier) return false;
    if (prioritizing) {
      const inProduction = c.status === 'production';
      const placedSoon = priorityIds && priorityIds.has(c.id);
      if (!inProduction && !placedSoon) return false;
    }
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

export async function loadAllDeployments() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('concept_deployments')
    .select('concept_id,deployed_at');
  if (error) throw error;
  return data || [];
}

// Budget summary used by the stats bar:
//   ytd:                 sum of budget on Published concepts deployed this year
//                        (each concept counted once)
//   quarters:            [Q1, Q2, Q3, Q4] sum of budget on concepts deployed in
//                        that quarter this year (a concept deployed in two
//                        quarters contributes its budget to both)
//   currentQuarterIdx:   0..3 index into quarters for the current quarter
//   currentQuarterSpend: convenience accessor for quarters[currentQuarterIdx]
//   allocated:           sum of budget on Approved/In-Production concepts
//                        (not yet "Published") — the upcoming spend
//   coverage:            { published, budgetedPublished } so we can show
//                        "x of y published concepts have a budget" if needed
export function computeBudgetSummary(concepts, deployments, now = new Date()) {
  const year = now.getFullYear();
  const currentQuarterIdx = Math.floor(now.getMonth() / 3);

  const budgetById = {};
  let published = 0;
  let budgetedPublished = 0;
  let allocated = 0;
  for (const c of concepts) {
    if (c.status === 'deployed') {
      published++;
      if (c.budget != null) {
        budgetedPublished++;
        budgetById[c.id] = Number(c.budget) || 0;
      }
    } else if ((c.status === 'approved' || c.status === 'production') && c.budget != null) {
      allocated += Number(c.budget) || 0;
    }
  }

  // For each concept that has both budget and a Published status, find the
  // set of quarters (current year) it was deployed in.
  const conceptQuarters = new Map(); // conceptId -> Set<0..3>
  for (const d of deployments || []) {
    if (!d.deployed_at || !(d.concept_id in budgetById)) continue;
    const dt = new Date(d.deployed_at);
    if (Number.isNaN(dt.getTime()) || dt.getFullYear() !== year) continue;
    const q = Math.floor(dt.getMonth() / 3);
    if (!conceptQuarters.has(d.concept_id)) conceptQuarters.set(d.concept_id, new Set());
    conceptQuarters.get(d.concept_id).add(q);
  }

  const quarters = [0, 0, 0, 0];
  let ytd = 0;
  for (const [cid, qs] of conceptQuarters) {
    const b = budgetById[cid];
    if (!b) continue;
    if (qs.size > 0) ytd += b;
    for (const q of qs) quarters[q] += b;
  }

  return {
    ytd,
    quarters,
    currentQuarterIdx,
    currentQuarterSpend: quarters[currentQuarterIdx],
    allocated,
    coverage: { published, budgetedPublished },
  };
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
