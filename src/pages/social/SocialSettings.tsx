// @ts-nocheck
import { SocialLayout } from "@/components/social/social-nav";
import { SettingsManager } from "@/components/settings/SettingsManager";

export default function SocialSettings() {
  return (
    <SocialLayout title="Settings">
      <div className="py-4">
        <SettingsManager variant="social" />
      </div>
    </SocialLayout>
  );
}
