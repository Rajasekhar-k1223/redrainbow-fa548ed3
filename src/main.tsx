import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { wireIncidentBus } from "./lib/incidentStore";
import { wireAuditBus } from "./lib/auditStore";
import { wireDriftBus } from "./lib/driftStore";
import { wireSoarBus } from "./lib/soarStore";

// Wire background bus subscribers before the app mounts so events emitted
// during initial page loads are captured (auto-incidents from signals, etc.).
wireAuditBus();
wireIncidentBus();
wireDriftBus();
wireSoarBus();

createRoot(document.getElementById("root")!).render(<App />);
