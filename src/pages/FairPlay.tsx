// @ts-nocheck
import { Scale, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FairPlay() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Fair Play Policy</h1>
            <p className="text-muted-foreground">Ensuring competitive integrity</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Our Commitment to Fair Play</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                GameFlex is committed to maintaining a fair and competitive environment for all
                players. We take cheating and unsportsmanlike conduct seriously and employ various
                measures to ensure fair play.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Allowed Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>Using standard game controllers and peripherals</li>
                <li>Practicing and improving your skills</li>
                <li>Communicating respectfully with opponents</li>
                <li>Reporting bugs or issues to support</li>
                <li>Streaming your matches (unless tournament rules say otherwise)</li>
                <li>Using in-game features as intended</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Prohibited Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong>Cheating:</strong> Using hacks, mods, or unauthorized software
                </li>
                <li>
                  <strong>Match Fixing:</strong> Deliberately losing or manipulating outcomes
                </li>
                <li>
                  <strong>Account Sharing:</strong> Letting someone else play on your account
                </li>
                <li>
                  <strong>Smurfing:</strong> Using alternate accounts to play against lower-skilled
                  players
                </li>
                <li>
                  <strong>Exploiting:</strong> Using bugs or glitches for unfair advantage
                </li>
                <li>
                  <strong>Harassment:</strong> Toxic behavior, hate speech, or threats
                </li>
                <li>
                  <strong>Collusion:</strong> Teaming up with opponents in solo matches
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Penalties
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">
                    First Offense
                  </Badge>
                  <p className="text-muted-foreground">
                    Warning and possible match disqualification
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 border-yellow-500/50 text-yellow-500">
                    Second Offense
                  </Badge>
                  <p className="text-muted-foreground">
                    Tournament ban (1-3 months) and prize forfeiture
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 border-red-500/50 text-red-500">
                    Severe/Repeat
                  </Badge>
                  <p className="text-muted-foreground">
                    Permanent ban and forfeiture of all earnings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Reporting Violations</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">
                If you witness or suspect unfair play, please report it:
              </p>
              <ol className="text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Go to the Report Issue page</li>
                <li>Select "Fair Play Violation" as the category</li>
                <li>Provide the player's username and match details</li>
                <li>Include any evidence (screenshots, video clips)</li>
                <li>Our team will investigate and take appropriate action</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Anti-Cheat Measures</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>Automated detection systems</li>
                <li>Manual review of reported cases</li>
                <li>Match replay analysis</li>
                <li>Statistical anomaly detection</li>
                <li>Community reporting system</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Appeals Process</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                If you believe you were wrongly penalized, you can submit an appeal by emailing{" "}
                <a href="mailto:appeals@gameflex.co.ke" className="text-primary hover:underline">
                  appeals@gameflex.co.ke
                </a>{" "}
                within 7 days of the penalty. Include your username, the match/tournament in
                question, and any evidence supporting your case.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
