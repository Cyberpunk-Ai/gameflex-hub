import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  showNotification,
} from "@/lib/push-notifications";

export function NotificationSettings() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [preferences, setPreferences] = useState({
    rewards: true,
    matches: true,
    tournaments: true,
    followers: true,
    messages: true,
  });

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());

    if (granted) {
      toast({
        title: "Notifications enabled!",
        description: "You'll receive alerts for important updates",
      });
      // Send test notification
      showNotification({
        title: "🎮 GameFlex",
        body: "Notifications are now enabled! You'll be notified of rewards, matches, and more.",
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // In a real app, save to database
  };

  if (!isNotificationSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Your browser doesn't support push notifications</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>Get notified about rewards, matches, and more</CardDescription>
          </div>
          <Badge
            variant={permission === "granted" ? "default" : "secondary"}
            className={permission === "granted" ? "bg-green-500/20 text-green-500" : ""}
          >
            {permission === "granted"
              ? "Enabled"
              : permission === "denied"
                ? "Blocked"
                : "Not enabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission !== "granted" ? (
          <div className="text-center py-6">
            <BellRing className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Enable notifications to never miss important updates
            </p>
            <Button onClick={handleEnableNotifications}>
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Rewards</Label>
                <p className="text-sm text-muted-foreground">Get notified when you earn rewards</p>
              </div>
              <Switch
                checked={preferences.rewards}
                onCheckedChange={() => handlePreferenceChange("rewards")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Match Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts when your matches are starting
                </p>
              </div>
              <Switch
                checked={preferences.matches}
                onCheckedChange={() => handlePreferenceChange("matches")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Tournament Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about tournaments you've joined
                </p>
              </div>
              <Switch
                checked={preferences.tournaments}
                onCheckedChange={() => handlePreferenceChange("tournaments")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>New Followers</Label>
                <p className="text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch
                checked={preferences.followers}
                onCheckedChange={() => handlePreferenceChange("followers")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Messages</Label>
                <p className="text-sm text-muted-foreground">New message notifications</p>
              </div>
              <Switch
                checked={preferences.messages}
                onCheckedChange={() => handlePreferenceChange("messages")}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
