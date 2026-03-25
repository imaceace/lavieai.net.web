"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 via-green-500 to-blue-500 bg-clip-text text-transparent">Lavie AI</span>
            <span className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>© 2026 All rights reserved.</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors"
                style={{ color: 'var(--gen-text-muted)' }}
              >
                {link.label}
              </Link>
            ))}
            <LocaleSwitcher />
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--gen-text-muted)' }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--gen-text-muted)' }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c1.9998 0 3.9998-.564 5.5888-1.6458a.0767.0767 0 00.0417-.0537c.4616-.6306.8731-1.2952 1.226-1.9942a.076.076 0 00-.0417-.0537 16.8792 16.8792 0 01-1.9127-1.1534.077.077 0 01-.008-.1256c.126-.0932.2517-.2073.3718-.3139a.0753.0753 0 01.0786.01c3.9278 2.4274 8.18 2.4274 12.0614 0a.0739.0739 0 01.0786.01c.1202.1066.2458.2207.3718.3139a.077.077 0 01-.0066.1256 12.2986 12.2986 0 01-1.913.8574.0766.0766 0 00-.0407.0537c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6767 3.8635-1.4078 5.5495-2.19a.086.086 0 00.0321-.0276c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0561zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
