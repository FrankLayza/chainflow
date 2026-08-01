import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function LandingPage() {
  return (
    <main className="w-screen bg-gray-950 text-white font-sans">
      <Hero />
      <HowItWorks />
    </main>
  );
}
