import { Hero } from "@/components/landing/Hero";
import { TrustRow } from "@/components/landing/TrustRow";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Safety } from "@/components/landing/Safety";
import { UseCases } from "@/components/landing/UseCases";
import { FinalCta } from "@/components/landing/FinalCta";

export default function LandingPage() {
  return (
    <main className="w-screen bg-gray-950 text-white font-sans">
      <Hero />
      <TrustRow />
      <HowItWorks />
      <Safety />
      <UseCases />
      <FinalCta />
    </main>
  );
}
