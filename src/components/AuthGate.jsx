'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Login from './Login';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecked(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!checked) return <div className="min-h-screen" />;
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="font-display italic text-2xl text-sand mb-2 font-light">Not configured.</div>
          <div className="text-bone-dim text-sm">
            Set <code className="font-mono text-mud">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-mud">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
            <code className="font-mono text-mud">.env.local</code>.
          </div>
        </div>
      </div>
    );
  }
  if (!session) return <Login />;
  return children;
}
