'use client';

import { pillarBalance } from '@/lib/concepts';
import { pillarLabel } from '@/lib/pillars';

export default function HeaderSection({ concepts, onAddConcept }) {
  const total = concepts.length;
  const bars = pillarBalance(concepts);

  return (
    <header className="px-6 sm:px-12 pt-14 pb-8 border-b border-subtle">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mud">
            DOG PPL · Concept Vault
          </div>
          <h1 className="font-display font-light tracking-[-0.04em] leading-[0.95] opsz-144 text-[clamp(48px,7vw,96px)] mt-2">
            The <em className="italic font-light text-sand">Boneyard</em>
          </h1>
        </div>
        <p className="font-display italic font-light text-bone-dim text-base max-w-[320px] text-right leading-snug">
          A working archive of every idea worth keeping. Sketch it, approve it, ship it, bury it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-12 items-center mt-10 pt-6 border-t border-subtle">
        <div className="flex items-baseline gap-3">
          <div className="font-display font-light opsz-144 text-[56px] leading-none">{total}</div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone-dim leading-tight">
            Concepts<br />In Vault
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone-dim">
            Pillar Balance · Active concepts vs 3-2-2-2-1 target
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-9">
            {bars.map(b => (
              <BalanceBar key={b.pillar} {...b} />
            ))}
          </div>
        </div>

        <button
          onClick={onAddConcept}
          className="bg-bone text-paw font-semibold uppercase tracking-[0.08em] text-[13px] px-7 py-[18px] flex items-center gap-2.5 hover:bg-mud hover:text-bone hover:-translate-y-px transition-all"
        >
          <span className="text-lg leading-none font-normal">+</span> New Concept
        </button>
      </div>
    </header>
  );
}

function BalanceBar({ pillar, count, target, state }) {
  const heightPct = target > 0 ? Math.min(100, (count / target) * 100) : 0;
  const fillBg =
    state === 'over'  ? 'rgba(181, 83, 42, 0.6)' :          // rust @ 0.6
    state === 'match' ? 'var(--grass-bright)' :
                        'var(--grass)';
  return (
    <div className="relative bg-paw-card border border-subtle overflow-hidden flex flex-col justify-between px-1.5 py-1">
      <div
        className="absolute inset-x-0 bottom-0 transition-[height] duration-[400ms] ease-out"
        style={{ height: `${heightPct}%`, background: fillBg }}
      />
      <span className="relative z-10 font-mono text-[9px] uppercase tracking-[0.1em] text-bone">
        {pillarLabel(pillar)}
      </span>
      <span className="relative z-10 font-display text-sm text-bone font-normal">
        {count}
        <span className="font-display text-[10px] text-bone-dim ml-0.5">/{target}</span>
      </span>
    </div>
  );
}
