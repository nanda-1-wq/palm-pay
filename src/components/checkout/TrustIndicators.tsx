import ReservesBadge from "@/components/ReservesBadge";

const INDICATORS = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    label: "Non-freezable",
    detail: "No admin freeze keys",
    color: "#14F195",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    label: "No blacklist",
    detail: "Your address is never blocked",
    color: "#9945FF",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    label: "Instant settlement",
    detail: "Confirmed in ~400ms on Solana",
    color: "#FFD700",
  },
];

export default function TrustIndicators() {
  return (
    <div className="w-full max-w-md space-y-3">
      {/* Three trust pills */}
      <div className="grid grid-cols-3 gap-2">
        {INDICATORS.map(({ icon, label, detail, color }) => (
          <div
            key={label}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 flex flex-col items-center text-center gap-1.5"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}30`,
              }}
            >
              {icon}
            </div>
            <div>
              <p className="text-bone text-xs font-medium leading-tight">{label}</p>
              <p className="text-[#5A5A5A] text-[10px] leading-tight mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reserves badge */}
      <ReservesBadge />
    </div>
  );
}
