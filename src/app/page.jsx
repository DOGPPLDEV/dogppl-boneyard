'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGate from '@/components/AuthGate';
import HeaderSection from '@/components/HeaderSection';
import FilterRow from '@/components/FilterRow';
import ConceptCard from '@/components/ConceptCard';
import ConceptModal from '@/components/ConceptModal';
import FooterUtility from '@/components/FooterUtility';
import { loadConcepts, loadPlacementData, loadAllDeployments, filterAndSearch, byNumber, compareForGrid, getComparator } from '@/lib/concepts';

export default function Page() {
  return (
    <AuthGate>
      <Vault />
    </AuthGate>
  );
}

function Vault() {
  const router = useRouter();
  const params = useSearchParams();
  const wantedConceptId = params.get('concept');

  const [concepts, setConcepts] = useState([]);
  const [deployCounts, setDeployCounts] = useState({});
  const [allDeployments, setAllDeployments] = useState([]);
  const [placementCounts, setPlacementCounts] = useState({});
  const [priorityIds, setPriorityIds] = useState(new Set());
  const [filters, setFilters] = useState({ pillar: [], status: 'all', tier: 'all', prioritizing: false, sort: 'newest' });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConceptId, setModalConceptId] = useState(null); // null = new concept
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const [data, places, deps] = await Promise.all([
        loadConcepts(),
        loadPlacementData(),
        loadAllDeployments(),
      ]);
      setConcepts(data);
      setPlacementCounts(places.counts);
      setPriorityIds(places.priorityIds);
      setAllDeployments(deps);
      const counts = {};
      for (const row of deps || []) counts[row.concept_id] = (counts[row.concept_id] || 0) + 1;
      setDeployCounts(counts);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function refreshDeployCounts() {
    const deps = await loadAllDeployments();
    setAllDeployments(deps);
    const counts = {};
    for (const row of deps || []) counts[row.concept_id] = (counts[row.concept_id] || 0) + 1;
    setDeployCounts(counts);
  }

  // /c/[id] redirects here with ?concept=<id> — open the modal once concepts load.
  useEffect(() => {
    if (!wantedConceptId || loading) return;
    const exists = concepts.some(c => c.id === wantedConceptId);
    if (exists) openExisting(wantedConceptId);
  }, [wantedConceptId, loading, concepts]);

  function openExisting(id)  { setModalConceptId(id); setModalOpen(true); }
  function openNew()         { setModalConceptId(null); setModalOpen(true); }
  function closeModal() {
    setModalOpen(false);
    setModalConceptId(null);
    if (wantedConceptId) router.replace('/', { scroll: false });
  }

  function onSaved(saved, { wasNew = false } = {}) {
    setConcepts(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      const merged = idx >= 0
        ? prev.map(c => c.id === saved.id ? { ...c, ...saved, updated_at: new Date().toISOString() } : c)
        : [{ ...saved, updated_at: new Date().toISOString() }, ...prev];
      return merged.sort(compareForGrid);
    });
    refreshDeployCounts();
    if (wasNew) {
      // Keep modal open, transition to edit state so the Media section
      // (gated to saved concepts) becomes usable without a close/reopen.
      setModalConceptId(saved.id);
    } else {
      closeModal();
    }
  }

  function onDuplicated(dup) {
    setConcepts(prev => [{ ...dup }, ...prev].sort(compareForGrid));
    setModalConceptId(dup.id);
  }

  function onDeleted(id) {
    setConcepts(prev => prev.filter(c => c.id !== id));
    setDeployCounts(prev => { const next = { ...prev }; delete next[id]; return next; });
    closeModal();
  }

  const filtered = useMemo(() => {
    const list = filterAndSearch(concepts, { ...filters, search, priorityIds });
    return [...list].sort(getComparator(filters.sort));
  }, [concepts, filters, search, priorityIds]);

  const editingConcept = modalConceptId ? concepts.find(c => c.id === modalConceptId) || null : null;
  const editingByNumber = editingConcept ? byNumber(concepts, editingConcept.id) : '';

  return (
    <>
      <HeaderSection concepts={concepts} deployments={allDeployments} onAddConcept={openNew} />

      <FilterRow
        filters={filters}
        setFilters={setFilters}
        search={search}
        setSearch={setSearch}
      />

      <section className="px-6 sm:px-12 py-8 pb-24 min-h-[40vh]">
        {loading && (
          <div className="font-display italic text-bone-dim text-lg font-light">Loading the vault…</div>
        )}
        {error && (
          <div className="text-rust text-sm">Error: {error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24">
            <h3 className="font-display italic text-2xl font-light text-sand mb-3">
              {concepts.length === 0 ? 'The boneyard is empty.' : 'Nothing here.'}
            </h3>
            <p className="text-bone-dim text-sm">
              {concepts.length === 0 ? 'Add your first concept to begin.' : 'Try a different filter.'}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
            {filtered.map(c => (
              <ConceptCard
                key={c.id}
                concept={c}
                byId={byNumber(concepts, c.id)}
                deploymentCount={deployCounts[c.id] || 0}
                onOpen={openExisting}
              />
            ))}
          </div>
        )}
      </section>

      <FooterUtility onAfterImport={refresh} />

      <ConceptModal
        open={modalOpen}
        concept={editingConcept}
        byId={editingByNumber}
        allConcepts={concepts}
        placementCount={editingConcept ? (placementCounts[editingConcept.id] || 0) : 0}
        onClose={closeModal}
        onSaved={onSaved}
        onDuplicated={onDuplicated}
        onDeleted={onDeleted}
      />
    </>
  );
}
