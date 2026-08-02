import { Link } from "@/lib/router-compat";
import { Trophy, Twitter, Instagram, Youtube, MessageCircle, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { usePWA } from "@/lib/pwa";
import { InstallModal } from "@/components/pwa/install-modal";

const footerLinks = {
  platform: [
    { name: "Tournaments", href: "/tournaments" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "How It Works", href: "/how-it-works" },
  ],
  support: [
    { name: "Help Center", href: "/support" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faqs" },
    { name: "Report Issue", href: "/report" },
  ],
  legal: [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Refund Policy", href: "/refund" },
    { name: "Fair Play", href: "/fair-play" },
  ],
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com" },
  { name: "WhatsApp", icon: MessageCircle, href: "https://wa.me/254704208394" },
];

export function Footer() {
  const { deferredPrompt, promptInstall, isInstalled, isIos, hideInstallLink, hasInstallPrompt } =
    usePWA();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!hasInstallPrompt && !(window as any).__GAMEFLEX_DEFERRED_PROMPT) {
      setShowInstallHelp(true);
      return;
    }

    setShowInstallModal(true);
  };

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight">
                Game<span className="text-primary">Flex</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Kenya's premier gaming tournament platform. Compete, win, and earn with the best
              gamers in the country.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
              {/* Install link: shown when app not installed */}
              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="ml-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  Install GameFlex
                </button>
              )}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* iOS guide modal */}
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card rounded-xl p-6 max-w-sm">
              <h3 className="font-semibold mb-2">Add GameFlex to your Home Screen</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tap the share button in Safari (the box with an arrow), then choose "Add to Home
                Screen" to install GameFlex.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="px-3 py-2 rounded bg-secondary/50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Install help modal for non-iOS when native prompt not available */}
        {showInstallHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card rounded-xl p-6 max-w-sm">
              <h3 className="font-semibold mb-2">Install GameFlex</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To install GameFlex on desktop or Android, open your browser menu and choose
                "Install" or click the install icon in the address bar. On Chrome for desktop, use
                the install option in the three-dot menu → "Install GameFlex".
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowInstallHelp(false)}
                  className="px-3 py-2 rounded bg-secondary/50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* branded install modal */}
        {showInstallModal && (
          <InstallModal open={showInstallModal} onOpenChange={setShowInstallModal} />
        )}

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a
                href="mailto:support@gameflex.co.ke"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@gameflex.co.ke
              </a>
              <a
                href="tel:+254704208394"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                +254 704 208 394
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} GameFlex. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
