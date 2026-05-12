'use client';

import { STATUS_ACCENT, STATUS_LABELS } from '@/lib/concepts';
import { pillarLabel, pillarTagStyle } from '@/lib/pillars';

export default function ConceptCard({ concept, byId, deploymentCount = 0, onOpen }) {
  const status = concept.status || 'approved';
  const accent = STATUS_ACCENT[status] || 'var(--grass)';
  const buried = status === 'buried';

  return (
    <button
      type="button"
      onClick={() => onOpen(concept.id)}
      data-status={status}
      className="group relative text-left bg-paw-card border border-subtle pl-7 pr-6 py-6 cursor-pointer flex flex-col min-h-[220px] hover:bg-paw-elev hover:border-strong hover:-translate-y-0.5 transition-all duration-200"
      style={{ opacity: buried ? 0.55 : 1, animation: 'fadeUp 0.4s ease backwards' }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] group-hover:w-[5px] transition-[width]"
        style={{ background: accent, opacity: buried ? 0.4 : 1 }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-mono text-[10px] tracking-[0.1em] text-bone-dim">{byId}</span>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-[3px] border whitespace-nowrap"
          style={{ color: accent, borderColor: accent }}
        >
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      <h3 className="font-display text-2xl font-normal leading-[1.15] tracking-[-0.02em] opsz-48 mb-2.5">
        {concept.title || '(untitled)'}
      </h3>

      <p className="font-display italic font-light text-[15px] text-bone-dim leading-[1.4] mb-auto">
        {concept.description || ''}
      </p>

      <div className="flex flex-wrap gap-2 mt-5">
        <Tag style={pillarTagStyle(concept.pillar)}>{pillarLabel(concept.pillar)}</Tag>
        {concept.preferred_format && <Tag>{concept.preferred_format}</Tag>}
        {concept.tier && <Tag>{concept.tier}</Tag>}
        {deploymentCount > 0 && (
          <Tag>{deploymentCount} deploy{deploymentCount > 1 ? 's' : ''}</Tag>
        )}
      </div>
    </button>
  );
}

function Tag({ children, style }) {
  const defaultStyle = { background: 'rgba(243,241,238,0.06)', color: 'var(--bone)' };
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1"
      style={style || defaultStyle}
    >
      {children}
    </span>
  );
}
