// @ts-nocheck
import { useState } from "react";
import { Flag, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const reportTypes = [
  { value: "cheating", label: "Cheating / Hacking", icon: "🎮" },
  { value: "fair_play", label: "Fair Play Violation", icon: "⚖️" },
  { value: "harassment", label: "Harassment / Abuse", icon: "🚫" },
  { value: "bug", label: "Bug / Technical Issue", icon: "🐛" },
  { value: "payment", label: "Payment Problem", icon: "💳" },
  { value: "other", label: "Other Issue", icon: "📝" },
];

export default function Report() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    playerUsername: "",
    matchId: "",
    description: "",
    evidence: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to submit a report.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: `[${formData.type.toUpperCase()}] ${formData.subject}`,
        description: `
Type: ${formData.type}
Player Reported: ${formData.playerUsername || "N/A"}
Match ID: ${formData.matchId || "N/A"}

Description:
${formData.description}

Evidence:
${formData.evidence || "None provided"}
        `.trim(),
        priority:
          formData.type === "cheating" || formData.type === "harassment" ? "high" : "medium",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Report Submitted",
        description: "Our team will review your report within 24-48 hours.",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold font-display mb-4">Report Submitted</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for helping us maintain a fair gaming environment. Our team will review
                your report and take appropriate action within 24-48 hours.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Submit Another Report
                </Button>
                <Button asChild>
                  <a href="/support">View My Tickets</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Flag className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-display">Report an Issue</h1>
            <p className="text-muted-foreground">Help us keep GameFlex fair and safe</p>
          </div>
        </div>

        <Card className="border-yellow-500/30 bg-yellow-500/5 mb-8">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Before reporting:</strong> Make sure you have
              evidence (screenshots, video clips, match IDs) to support your report. False reports
              may result in penalties.
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Submit a Report</CardTitle>
            <CardDescription>
              {user
                ? "Fill out the form below with as much detail as possible"
                : "Please log in to submit a report"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need to be logged in to submit a report.
                </p>
                <Button asChild>
                  <a href="/auth">Log In</a>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Report Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the type of issue" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="mr-2">{type.icon}</span>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of the issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                {/* Player & Match Info */}
                {(formData.type === "cheating" ||
                  formData.type === "fair_play" ||
                  formData.type === "harassment") && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="playerUsername">Player Username</Label>
                      <Input
                        id="playerUsername"
                        placeholder="Username of the reported player"
                        value={formData.playerUsername}
                        onChange={(e) =>
                          setFormData({ ...formData, playerUsername: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matchId">Match/Tournament ID</Label>
                      <Input
                        id="matchId"
                        placeholder="If applicable"
                        value={formData.matchId}
                        onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail. Include what happened, when it happened, and any other relevant information."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                  />
                </div>

                {/* Evidence */}
                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence Links</Label>
                  <Textarea
                    id="evidence"
                    placeholder="Paste links to screenshots, video clips, or other evidence (YouTube, Google Drive, etc.)"
                    value={formData.evidence}
                    onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Upload evidence to Google Drive or YouTube and paste the links here
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
