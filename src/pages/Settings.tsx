// @ts-nocheck
import React from "react";
import { SettingsManager } from "@/components/settings/SettingsManager";

const Settings = () => {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <SettingsManager variant="standard" />
    </div>
  );
};

export default Settings;
