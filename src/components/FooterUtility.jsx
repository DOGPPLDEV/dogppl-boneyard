'use client';

import { useRef } from 'react';
import { exportVault, importVault } from '@/lib/concepts';

export default function FooterUtility({ onAfterImport }) {
  const fileRef = useRef(null);

  async function onExport() {
    try {
      const payload = await exportVault();
      if (!payload) return;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boneyard-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + (e.message || e));
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let payload;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      alert('Could not parse that file as JSON.');
      return;
    }
    const count = Array.isArray(payload?.concepts) ? payload.concepts.length : 0;
    if (!count) { alert('That file has no concepts array.'); return; }
    if (!confirm(`Replace the entire shared vault with ${count} concepts from this file? This affects everyone on boneyard.dogppl.co and cannot be undone without a separate export.`)) return;
    try {
      await importVault(payload);
      onAfterImport?.();
    } catch (err) {
      alert('Import failed: ' + (err.message || err));
    }
  }

  return (
    <footer className="px-6 sm:px-12 py-6 border-t border-subtle flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-bone-dim">
      <div>The Boneyard · v1.0 · Supabase</div>
      <div className="flex gap-5">
        <button onClick={onExport} className="text-bone-dim hover:text-bone transition-colors">
          Export JSON
        </button>
        <button onClick={() => fileRef.current?.click()} className="text-bone-dim hover:text-bone transition-colors">
          Import
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
      </div>
    </footer>
  );
}
