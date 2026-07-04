interface TrustRowProps {
  items: [string, string][];
  className?: string;
}

export default function TrustRow({ items, className = "" }: TrustRowProps) {
  return (
    <div
      className={`grid grid-cols-4 gap-px mt-[42px] max-w-[720px] border border-kore-border bg-kore-border rounded-kore overflow-hidden max-md:grid-cols-2 max-sm:grid-cols-1 ${className}`}
    >
      {items.map(([value, label]) => (
        <div className="bg-kore-panelStrong p-[18px]" key={label}>
          <strong className="block text-kore-accent font-mono text-[22px]">{value}</strong>
          <span className="text-kore-dim font-mono text-[11px] tracking-[1.2px] uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
