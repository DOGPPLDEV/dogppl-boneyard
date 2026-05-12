'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import HeaderSection from '@/components/HeaderSection';
import { loadConcepts } from '@/lib/concepts';

export default function Page() {
  return (
    <AuthGate>
      <Vault />
    </AuthGate>
  );
}

function Vault() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConcepts()
      .then(setConcepts)
      .catch(e => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeaderSection concepts={concepts} onAddConcept={() => { /* modal hook lands next */ }} />

      <section className="px-6 sm:px-12 py-8 min-h-[60vh]">
        {loading && (
          <div className="font-display italic text-bone-dim text-lg font-light">Loading the vault…</div>
        )}
        {error && (
          <div className="text-rust text-sm">Error: {error}</div>
        )}
        {!loading && !error && (
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
            {concepts.length} concept{concepts.length === 1 ? '' : 's'} loaded · filter row + card grid next
          </div>
        )}
      </section>
    </>
  );
}
