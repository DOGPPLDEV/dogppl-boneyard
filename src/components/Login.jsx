'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? "That email and password don't match. Try again."
        : error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-paw-card border border-strong p-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud mb-3">DOG PPL · Concept Vault</div>
        <h1 className="font-display text-4xl opsz-72 font-light leading-none mb-1 tracking-tight">
          The <em className="not-italic font-light text-sand italic">Boneyard</em>
        </h1>
        <div className="font-display italic text-bone-dim text-base mb-8 font-light">Sign in to continue.</div>

        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-2">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-paw-deep border border-strong text-bone text-sm px-3.5 py-3 outline-none focus:border-bone transition-colors mb-4"
        />

        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim mb-2">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-paw-deep border border-strong text-bone text-sm px-3.5 py-3 outline-none focus:border-bone transition-colors mb-5"
        />

        {error && (
          <div className="text-xs text-rust border border-rust/30 px-3 py-2 mb-4">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-bone text-paw text-xs font-semibold tracking-[0.08em] uppercase py-3 hover:bg-mud hover:text-bone transition-colors disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
