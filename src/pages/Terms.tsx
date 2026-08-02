// @ts-nocheck
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                By accessing and using GameFlex, you agree to be bound by these Terms of Service. If
                you do not agree with any part of these terms, you may not use our platform.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>2. Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>You must be at least 18 years old to participate in paid tournaments</li>
                <li>You must provide accurate and complete registration information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>One account per user - multiple accounts are prohibited</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>3. Tournament Participation</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>Entry fees must be paid before the registration deadline</li>
                <li>Players must check in at the designated time</li>
                <li>Match schedules must be followed; no-shows result in disqualification</li>
                <li>All matches must be played fairly without cheating or exploitation</li>
                <li>GameFlex reserves the right to modify or cancel tournaments</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>4. Payments & Prizes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>All payments are processed through M-Pesa</li>
                <li>Entry fees are non-refundable once the tournament begins</li>
                <li>Prizes are distributed within 48 hours of tournament completion</li>
                <li>Minimum withdrawal amount is KES 100</li>
                <li>GameFlex is not responsible for incorrect payment details</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>5. Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>Using cheats, hacks, or unauthorized modifications</li>
                <li>Match-fixing or intentional losing</li>
                <li>Harassment or abusive behavior towards other players</li>
                <li>Creating multiple accounts or account sharing</li>
                <li>Exploiting bugs or glitches for competitive advantage</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>6. Account Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                GameFlex reserves the right to suspend or terminate accounts that violate these
                terms. Terminated accounts may forfeit any pending prizes or wallet balance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                GameFlex is provided "as is" without warranties. We are not liable for any indirect,
                incidental, or consequential damages arising from your use of the platform.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>8. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:legal@gameflex.co.ke" className="text-primary hover:underline">
                  legal@gameflex.co.ke
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
