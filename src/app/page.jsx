'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Scaffold-only health check. Confirms the Supabase client is wired up.
// The real vault UI lands once the HTML mockup is in hand.
export default function Home() {
  const [status, setStatus] = useState('connecting…');
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setStatus('missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }
    supabase
      .from('concept_details')
      .select('*', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          setStatus(`error: ${error.message}`);
          return;
        }
        setCount(count);
        setStatus('connected');
      });
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.15em', opacity: 0.55 }}>
        DOG PPL · CONCEPT VAULT
      </div>
      <h1 style={{ fontSize: 32, marginTop: 8, marginBottom: 32, letterSpacing: '0.02em' }}>
        THE BONEYARD <span style={{ opacity: 0.4, fontSize: 14 }}>scaffold</span>
      </h1>
      <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>
        <div>supabase: {status}</div>
        {count !== null && <div>concept_details rows: {count}</div>}
      </div>
    </main>
  );
}
