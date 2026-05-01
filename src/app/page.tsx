import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: "🔒",
    title: "Non-Freezable",
    description:
      "PUSD has no admin freeze keys. Once sent, funds are yours. No issuer can freeze or seize your balance.",
  },
  {
    icon: "⚡",
    title: "Instant Settlement",
    description:
      "Transactions confirm on Solana in under 400ms. Funds hit your wallet immediately — no holding periods.",
  },
  {
    icon: "🛡️",
    title: "Zero Custodial Risk",
    description:
      "Palm Pay never holds your funds. Direct peer-to-peer SPL transfers. You keep your keys.",
  },
  {
    icon: "📱",
    title: "Solana Pay Compatible",
    description:
      "Drop-in checkout widget with QR code support. Works with any Solana wallet — Phantom, Solflare, and more.",
  },
  {
    icon: "🌍",
    title: "Built for MENA",
    description:
      "PUSD is 1:1 backed by AED + SAR with monthly ISAE 3000 attestations. Designed for emerging markets.",
  },
  {
    icon: "✅",
    title: "No Blacklist",
    description:
      "Unlike USDC or USDT, PUSD has no address blacklist. Your merchant wallet can never be blocked.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 bg-ink overflow-hidden">
        {/* Radial glow overlays */}
        <div className="absolute inset-0 bg-hero-glow-green pointer-events-none" />
        <div className="absolute inset-0 bg-hero-glow-gold pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent-bright text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-accent-bright rounded-full animate-pulse-dot" />
            Live on Solana Devnet
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-medium tracking-tight max-w-4xl leading-tight mb-6 text-bone">
            Payments That{" "}
            <em className="not-italic text-accent-bright">
              Can&apos;t Be Frozen
            </em>
          </h1>

          <p className="text-lg sm:text-xl text-[#C8C8C8] max-w-2xl mb-10 leading-relaxed">
            Accept PUSD payments on Solana. No admin keys. No blacklist. No
            pause. Palm Pay gives merchants the first checkout that guarantees
            settlement finality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="bg-bone hover:bg-bone-2 text-ink font-semibold px-8 py-3.5 rounded-pill text-base transition-colors"
            >
              Merchant Dashboard →
            </Link>
            <Link
              href="/demo-store"
              className="bg-transparent hover:bg-white/[0.05] text-[#C8C8C8] hover:text-bone font-semibold px-8 py-3.5 rounded-pill text-base transition-colors border border-white/[0.14]"
            >
              Try Demo Store
            </Link>
          </div>

          <p className="text-sm text-[#5A5A5A] mt-6">
            No sign-up needed &mdash; connect your Solana wallet to get started
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-ink">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4 text-bone">
            How It Works
          </h2>
          <p className="text-[#C8C8C8] text-center mb-14 max-w-xl mx-auto">
            Three steps from invoice to settled PUSD in your wallet
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create Invoice",
                desc: "Connect your wallet to the merchant dashboard and generate a payment link in seconds.",
              },
              {
                step: "02",
                title: "Customer Pays",
                desc: "Your customer opens the link or scans a QR code and pays with PUSD from any Solana wallet.",
              },
              {
                step: "03",
                title: "Instant Settlement",
                desc: "PUSD lands directly in your wallet. On-chain verification confirms the payment automatically.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="bg-ink-2 border border-white/[0.06] rounded-2xl p-6"
              >
                <div className="text-4xl font-bold text-gold/30 mb-3 font-mono">
                  {step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-bone">
                  {title}
                </h3>
                <p className="text-[#8A8A8A] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-4 bg-ink-2">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-4 text-bone">
            Why PUSD Over USDC?
          </h2>
          <p className="text-[#C8C8C8] text-center mb-14 max-w-xl mx-auto">
            USDC can freeze your funds. PUSD can&apos;t. Here&apos;s what that
            means for your business.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-ink border border-white/[0.06] rounded-2xl p-6 hover:border-accent/30 transition-colors"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold mb-2 text-bone">{title}</h3>
                <p className="text-[#8A8A8A] text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USDC vs PUSD comparison */}
      <section className="py-24 px-4 bg-ink">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-14 text-bone">
            The Difference Is Real
          </h2>
          <div className="bg-ink-2 border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-[#8A8A8A] font-medium">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-[#8A8A8A] font-medium text-center">
                    USDC / USDT
                  </th>
                  <th className="px-6 py-4 text-accent-bright font-semibold text-center">
                    PUSD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  ["Admin Freeze", "✗ Yes", "✓ Never"],
                  ["Address Blacklist", "✗ Yes", "✓ None"],
                  ["Pause Function", "✗ Yes", "✓ None"],
                  ["Reserve Attestation", "Monthly", "Monthly ISAE 3000"],
                  ["Settlement Finality", "Custodial risk", "✓ Guaranteed"],
                ].map(([feature, usdc, pusd]) => (
                  <tr key={feature} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-[#C8C8C8]">{feature}</td>
                    <td className="px-6 py-4 text-center text-red-400">
                      {usdc}
                    </td>
                    <td className="px-6 py-4 text-center text-accent-bright font-medium">
                      {pusd}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-ink-2 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-medium mb-4 text-bone">
            Ready to accept PUSD?
          </h2>
          <p className="text-[#C8C8C8] mb-8">
            Connect your wallet and create your first invoice in under a
            minute. No sign-up, no KYC, no custodian.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-bone hover:bg-bone-2 text-ink font-semibold px-10 py-4 rounded-pill text-base transition-colors"
          >
            Open Merchant Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-4 bg-ink">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5A5A5A]">
          <div className="flex items-center gap-2">
            <Image
              src="/palm-tree.svg"
              alt="Palm Pay"
              width={16}
              height={22}
              className="opacity-50"
            />
            <span className="text-[#8A8A8A]">Palm Pay</span>
            <span className="text-[#3A3A3A]">—</span>
            <span>Powered by Solana + PUSD</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/nanda-1-wq/palm-pay"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-bone transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/demo-store"
              className="hover:text-bone transition-colors"
            >
              Demo
            </Link>
            <a
              href="https://palmusd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-bone transition-colors"
            >
              Palm USD
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-bone transition-colors"
            >
              Solana
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
