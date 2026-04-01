"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const t = useTranslations("footer");
  const tHome = useTranslations("home");

  return (
    <footer className="border-t" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          {/* Logo, Copyright and SEO Text */}
          <div className="flex flex-col gap-3 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">Lavie AI</span>
            </div>
            {/* SEO Text Block integrated into footer */}
            <p className="text-xs text-justify leading-relaxed opacity-80" style={{ color: 'var(--gen-text-muted)' }}>
              {tHome('seoText')}
            </p>
            <span className="text-sm mt-2" style={{ color: 'var(--gen-text-muted)' }}>© 2026 All rights reserved.</span>
          </div>

          {/* Links */}
          <nav className="flex flex-col md:items-end gap-4">
            <div className="flex items-center gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors hover:text-rose-500"
                  style={{ color: 'var(--gen-text-muted)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

       
      </div>
    </footer>
  );
}
