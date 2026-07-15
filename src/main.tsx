import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { wireIncidentBus } from "./lib/incidentStore";

// Wire background bus subscribers before the app mounts so events emitted
// during initial page loads are captured (auto-incidents from signals, etc.).
wireIncidentBus();

createRoot(document.getElementById("root")!).render(<App />);
