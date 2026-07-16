// Applies persisted cockpit preferences (theme + density) to <html> so every
// page reacts without prop-drilling. Renders nothing.
import { useEffect } from "react";
import { subscribePrefs, type Preferences } from "@/lib/settingsStore";

const apply = (p: Preferences) => {
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.dataset.density = p.density;
};

export function PreferencesProvider() {
  useEffect(() => subscribePrefs(apply), []);
  return null;
}
