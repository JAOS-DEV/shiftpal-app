import { settingsService } from "@/services/settingsService";
import { AppSettings } from "@/types/settings";
import { useEffect, useState } from "react";

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      const s = await settingsService.getSettings();
      setSettings(s);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async (): Promise<void> => {
    await loadSettings();
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  return {
    settings,
    loading,
    loadSettings,
    refreshSettings,
  };
};
