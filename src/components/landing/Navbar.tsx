"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { scrollToSection } from "@/lib/scroll";
import { useActiveSection } from "@/lib/hooks/use-active-section";

const NAV_LINKS = [
  { id: "how-it-works", label: "How it Works" },
  { id: "safety", label: "Safety" },
  { id: "use-cases", label: "Use Cases" },
] as const;

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

export function Navbar() {
  const activeSection = useActiveSection(SECTION_IDS);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 h-14 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-1">
        <Image src="/logo.png" alt="logo" width={24} height={20} />
        <span className="font-semibold text-base tracking-wide lowercase text-white">
          chainflow
        </span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(id);
            }}
            className={cn(
              "text-sm font-medium transition-colors duration-150",
              activeSection === id
                ? "text-violet-400"
                : "text-white/60 hover:text-white",
            )}
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        href="/app"
        className="text-sm font-medium text-white border border-white/30 rounded-full px-4 py-1.5 hover:border-white/70 hover:text-white transition-colors duration-150"
      >
        Launch App
      </a>
    </header>
  );
}
