// @ts-nocheck
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">
                We collect the following types of information:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong>Account Information:</strong> Username, email address, phone number
                </li>
                <li>
                  <strong>Profile Data:</strong> Gaming handles, avatar, bio
                </li>
                <li>
                  <strong>Payment Information:</strong> M-Pesa transaction details
                </li>
                <li>
                  <strong>Usage Data:</strong> Tournament history, match results, platform
                  interactions
                </li>
                <li>
                  <strong>Device Information:</strong> IP address, browser type, device identifiers
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>To provide and maintain our tournament platform</li>
                <li>To process payments and distribute prizes</li>
                <li>To communicate with you about tournaments and updates</li>
                <li>To prevent fraud and ensure fair play</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">We may share your information with:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong>Other Players:</strong> Your username and game handle are visible to
                  opponents
                </li>
                <li>
                  <strong>Payment Providers:</strong> M-Pesa for transaction processing
                </li>
                <li>
                  <strong>Legal Authorities:</strong> When required by law
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We do not sell your personal information to third parties.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>4. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data, including
                encryption, secure servers, and regular security audits. However, no method of
                transmission over the internet is 100% secure.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>5. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                We retain your data for as long as your account is active or as needed to provide
                services. You may request deletion of your account and associated data at any time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>6. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>7. Cookies & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                We use cookies and similar technologies to improve your experience, remember your
                preferences, and analyze platform usage. You can manage cookie preferences in your
                browser settings.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>8. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                For privacy-related inquiries, contact us at{" "}
                <a href="mailto:privacy@gameflex.co.ke" className="text-primary hover:underline">
                  privacy@gameflex.co.ke
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
