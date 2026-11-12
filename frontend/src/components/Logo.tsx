/**
 * COMPTALINK - Logo officiel (icône + nom du produit)
 */
export function Logo({ compact = false, clair = false }: { compact?: boolean; clair?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="38" height="38" viewBox="0 0 48 48" aria-label="Logo COMPTALINK" role="img">
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#2E86AB" />
        <path
          d="M15 15h13l7 7v11a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V17a2 2 0 0 1 2-2Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path d="M28 15v7h7" fill="#1E3A5F" opacity="0.25" />
        <path
          d="M18 27h12M18 31h8"
          stroke="#1E3A5F"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="35" cy="35" r="6" fill="#F18F01" />
        <path
          d="m32.6 35.2 1.8 1.8 3.2-3.4"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className={`text-lg font-bold tracking-wide ${clair ? 'text-white' : 'text-nuit'}`}>
            COMPTALINK
          </p>
          <p className={`text-[11px] ${clair ? 'text-white/70' : 'text-gris'}`}>
            Factures fournisseurs · Maroc
          </p>
        </div>
      )}
    </div>
  );
}
