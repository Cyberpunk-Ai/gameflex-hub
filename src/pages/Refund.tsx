import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Refund() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <CreditCard className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>1. General Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                GameFlex strives to provide a fair and transparent refund process. Please read this
                policy carefully to understand when refunds are applicable.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>2. Eligible Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">
                Refunds are provided in the following cases:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong>Tournament Cancellation:</strong> Full refund if GameFlex cancels a
                  tournament
                </li>
                <li>
                  <strong>Registration Before Deadline:</strong> 90% refund if you cancel before
                  registration closes
                </li>
                <li>
                  <strong>Technical Issues:</strong> Full refund if platform errors prevent
                  participation
                </li>
                <li>
                  <strong>Double Payment:</strong> Full refund for duplicate transactions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>3. Non-Refundable Situations</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>After the tournament has started</li>
                <li>Disqualification due to rule violations</li>
                <li>No-show or failure to check in on time</li>
                <li>Personal internet or device issues</li>
                <li>Change of mind after registration closes</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>4. How to Request a Refund</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ol className="text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Go to the Support page and create a ticket</li>
                <li>Select "Payment Issue" as the category</li>
                <li>Provide your M-Pesa transaction code</li>
                <li>Explain the reason for the refund request</li>
                <li>Our team will review and respond within 24-48 hours</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>5. Refund Processing Time</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong>Review:</strong> 24-48 hours
                </li>
                <li>
                  <strong>Processing:</strong> 3-5 business days after approval
                </li>
                <li>
                  <strong>M-Pesa Transfer:</strong> Instant once processed
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>6. Wallet Balance Refunds</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                Approved refunds are credited to your GameFlex wallet. You can then withdraw to
                M-Pesa or use the balance for future tournaments. Minimum withdrawal is KES 100.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>7. Disputes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                If you disagree with a refund decision, you can escalate by emailing{" "}
                <a href="mailto:disputes@gameflex.co.ke" className="text-primary hover:underline">
                  disputes@gameflex.co.ke
                </a>{" "}
                with your case details.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
