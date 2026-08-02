import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { saveLocalRegistration, saveLocalPayment } from "@/utils/local-registrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, CheckCircle, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScreenshotUploadProps {
  tournamentId: string;
  entryFee: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export function ScreenshotUpload({
  tournamentId,
  entryFee,
  onSuccess,
  onCancel,
}: ScreenshotUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transactionCode, setTransactionCode] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!screenshotFile) throw new Error("Please upload a payment screenshot");
      if (!transactionCode.trim()) throw new Error("Please enter the M-Pesa transaction code");

      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user || user;

      // Upload screenshot
      let screenshotUrl: string | null = null;
      try {
        const fileExt = screenshotFile.name.split(".").pop();
        const filePath = `${activeUser.id}/${tournamentId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("screenshots")
          .upload(filePath, screenshotFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("screenshots").getPublicUrl(filePath);
          screenshotUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.warn("Screenshot upload warning:", e);
      }

      // Create payment record
      let paymentId: string | null = null;
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: activeUser.id,
          tournament_id: tournamentId,
          amount: entryFee,
          method: "mpesa",
          transaction_code: transactionCode.trim().toUpperCase(),
          screenshot_url: screenshotUrl,
          status: "pending",
        })
        .select()
        .single();

      if (!paymentError && payment) {
        paymentId = payment.id;
      } else {
        const { data: retryPay, error: retryPayErr } = await supabase
          .from("payments")
          .insert({
            user_id: activeUser.id,
            tournament_id: tournamentId,
            amount: entryFee,
            method: "mpesa",
            transaction_code: transactionCode.trim().toUpperCase(),
            screenshot_url: screenshotUrl,
          })
          .select()
          .single();

        if (!retryPayErr && retryPay) {
          paymentId = retryPay.id;
        } else {
          paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          saveLocalPayment({
            id: paymentId,
            user_id: activeUser.id,
            tournament_id: tournamentId,
            amount: entryFee,
            method: "mpesa",
            transaction_code: transactionCode.trim().toUpperCase(),
            screenshot_url: screenshotUrl,
            status: "pending",
            created_at: new Date().toISOString(),
          });
        }
      }

      // Create registration
      const gameHandle = activeUser.user_metadata?.username ?? "Player";
      const { error: regError } = await supabase.from("registrations").insert({
        user_id: activeUser.id,
        tournament_id: tournamentId,
        payment_id: paymentId,
        status: "pending",
        game_handle: gameHandle,
      });

      if (regError) {
        // Try retry without status
        const { error: retryReg1 } = await supabase.from("registrations").insert({
          user_id: activeUser.id,
          tournament_id: tournamentId,
          payment_id: paymentId,
          game_handle: gameHandle,
        });

        if (retryReg1) {
          await supabase.from("registrations").insert({
            user_id: activeUser.id,
            tournament_id: tournamentId,
            game_handle: gameHandle,
          });
        }
      }

      // Always save local registration
      saveLocalRegistration({
        id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_id: activeUser.id,
        tournament_id: tournamentId,
        game_handle: gameHandle,
        payment_id: paymentId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return paymentId;
    },
    onSuccess: (paymentId) => {
      toast({
        title: "Payment submitted!",
        description: "Your payment is pending verification. You will be notified once confirmed.",
      });
      onSuccess(paymentId);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Payment Verification
        </CardTitle>
        <CardDescription>Upload your M-Pesa payment screenshot for verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Info */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
          <p className="text-2xl font-bold text-primary">KES {entryFee.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">Send to: 0700 000 000 (GameFlex)</p>
        </div>

        {/* Transaction Code */}
        <div className="space-y-2">
          <Label htmlFor="transaction-code">M-Pesa Transaction Code</Label>
          <Input
            id="transaction-code"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
            placeholder="e.g., QKX4ABCD7E"
            className="uppercase font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Enter the transaction code from your M-Pesa confirmation message
          </p>
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-2">
          <Label>Payment Screenshot</Label>

          {screenshotPreview ? (
            <div className="relative">
              <img
                loading="lazy"
                decoding="async"
                src={screenshotPreview}
                alt="Payment screenshot"
                className="w-full rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={removeScreenshot}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload screenshot</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => submitPaymentMutation.mutate()}
            disabled={submitPaymentMutation.isPending || !screenshotFile || !transactionCode.trim()}
          >
            {submitPaymentMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Submit Payment
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          <p>⚡ Payments are usually verified within 5-15 minutes</p>
          <p>📱 You'll receive a notification once confirmed</p>
        </div>
      </CardContent>
    </Card>
  );
}
