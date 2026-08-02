// @ts-nocheck
import { useState } from "react";
import { SocialLayout } from "@/components/social/social-nav";
import { Shield, Users, Trophy, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Teams() {
  const [notified, setNotified] = useState(() => {
    try {
      return localStorage.getItem("gameflex_teams_notify") === "true";
    } catch {
      return false;
    }
  });

  const handleNotify = () => {
    try {
      localStorage.setItem("gameflex_teams_notify", "true");
    } catch (e) {
      /* ignore storage errors */
    }
    setNotified(true);
    toast.success("You're on the list! We'll let you know when Teams launches.");
  };

  return (
    <SocialLayout title="Teams" subtitle="Squad up, recruit, and compete together">
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
        <Shield className="h-14 w-14 text-primary mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold mb-2">Teams are coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Create clans, invite friends, register as a squad for team tournaments, and track your
          team's leaderboard rank.
        </p>
        <div className="grid md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left mb-6">
          <Feature icon={Users} title="Roster & roles" desc="Captain, players, subs" />
          <Feature icon={Trophy} title="Team ladder" desc="Weekly team ranks" />
          <Feature icon={Shield} title="Team tags" desc="Show your clan tag" />
        </div>
        {notified ? (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            You're on the notify list
          </div>
        ) : (
          <Button className="mt-0" onClick={handleNotify}>
            <Bell className="h-4 w-4 mr-2" />
            Notify me when it launches
          </Button>
        )}
      </div>
    </SocialLayout>
  );
}

function Feature({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-4 rounded-lg bg-secondary/50">
      <Icon className="h-5 w-5 text-primary mb-2" />
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
