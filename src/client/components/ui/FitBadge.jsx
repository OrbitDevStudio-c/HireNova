// Resume ↔ job fit as a colored pill: "82% fit". Thresholds match ScoreRing.
export function fitTone(score) {
  if (score >= 75) return { label: 'Strong fit', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  if (score >= 50) return { label: 'Partial fit', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
  return { label: 'Low fit', cls: 'bg-rose-50 text-rose-700 ring-rose-200' };
}

export default function FitBadge({ score, showLabel = false, className = '' }) {
  if (score == null) return null;
  const tone = fitTone(score);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone.cls} ${className}`}
      title={`${tone.label}: ${Math.round(score)}% match with your resume`}
    >
      {Math.round(score)}% fit{showLabel && <span className="font-medium">· {tone.label}</span>}
    </span>
  );
}
