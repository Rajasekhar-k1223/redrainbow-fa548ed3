// ---------------------------------------------------------------------------
// RedRainbow — Centralized Event Bus
// Strongly-typed pub/sub. Every module publishes and/or subscribes here so
// the cockpit behaves as a single organism: an Assets scan can cascade into
// Signals → Telemetry → Dashboard KPIs → Missions → Vault → Compliance.
//
// Backend swap: replace the in-memory `listeners` map with a transport
// (WebSocket, Supabase Realtime, SSE) while keeping the same public API.
// ---------------------------------------------------------------------------

import { useEffect } from "react";

// ---------- Event payload contracts ----------------------------------------

export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface AssetScanStartedPayload {
  scanId: string;
  kind: "subdomain" | "port" | "cloud-posture" | "cidr";
  target: string;
  startedAt: number;
}

export interface AssetScanCompletedPayload {
  scanId: string;
  kind: AssetScanStartedPayload["kind"];
  target: string;
  hostsFound: number;
  newAssets: number;
  finding: string;
  finishedAt: number;
}

export interface AssetDiscoveredPayload {
  assetId: string;
  identifier: string;
  type: "Domain" | "Cloud" | "Server" | "Container";
  env: "Prod" | "Staging" | "Lab";
  criticality: Severity;
}

export interface AssetUpdatedPayload {
  assetId: string;
  status: "Healthy" | "Drift" | "Patch";
}

export interface PortDiscoveredPayload {
  host: string;
  port: number;
  service: string;
  unexpected?: boolean;
}

export interface VulnerabilityDetectedPayload {
  id: string;
  cve?: string;
  title: string;
  asset: string;
  severity: Severity;
  cvss?: string;
}

export interface SignalCreatedPayload {
  id: string;
  source: string;
  type: string;
  severity: Severity;
  count: number;
  cause?: keyof EventMap; // which event spawned it
}

export interface SignalUpdatedPayload {
  id: string;
  severity?: Severity;
  acknowledged?: boolean;
}

export interface TelemetryReceivedPayload {
  source: string;
  type: string;
  message: string;
  severity: Severity;
  at: number;
}

export interface MissionCreatedPayload {
  id: string;
  name: string;
  type: "Red" | "Blue" | "Purple";
  team: string;
  origin?: string; // signal id / scan id
}

export interface MissionStartedPayload {
  id: string;
  startedAt: number;
}

export interface MissionCompletedPayload {
  id: string;
  outcome: "success" | "partial" | "failed";
  completedAt: number;
}

export interface VaultSavedPayload {
  id: string;
  name: string;
  type: string;
  size: string;
  hash: string;
  source?: string;
}

export interface ComplianceUpdatedPayload {
  framework?: string;
  deltaScore: number;   // -x..+x — nudged by new vulns / sealed evidence
  reason: string;
}

export interface NotificationCreatedPayload {
  level: "info" | "success" | "warn" | "error";
  title: string;
  detail?: string;
}

// ---------- Master event map -----------------------------------------------

export interface EventMap {
  "asset.scan.started":      AssetScanStartedPayload;
  "asset.scan.completed":    AssetScanCompletedPayload;
  "asset.discovered":        AssetDiscoveredPayload;
  "asset.updated":           AssetUpdatedPayload;
  "port.discovered":         PortDiscoveredPayload;
  "vulnerability.detected":  VulnerabilityDetectedPayload;
  "signal.created":          SignalCreatedPayload;
  "signal.updated":          SignalUpdatedPayload;
  "telemetry.received":      TelemetryReceivedPayload;
  "mission.created":         MissionCreatedPayload;
  "mission.started":         MissionStartedPayload;
  "mission.completed":       MissionCompletedPayload;
  "vault.saved":             VaultSavedPayload;
  "compliance.updated":      ComplianceUpdatedPayload;
  "notification.created":    NotificationCreatedPayload;
}

export type EventName = keyof EventMap;
export type EventHandler<E extends EventName> = (payload: EventMap[E]) => void;

// ---------- Bus implementation ---------------------------------------------

type AnyHandler = (payload: unknown) => void;

class EventBus {
  private handlers = new Map<EventName, Set<AnyHandler>>();
  private debug = false;

  setDebug(v: boolean) { this.debug = v; }

  on<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
    let set = this.handlers.get(event);
    if (!set) { set = new Set(); this.handlers.set(event, set); }
    set.add(handler as AnyHandler);
    return () => { set!.delete(handler as AnyHandler); };
  }

  once<E extends EventName>(event: E, handler: EventHandler<E>): () => void {
    const off = this.on(event, (p) => { off(); handler(p); });
    return off;
  }

  emit<E extends EventName>(event: E, payload: EventMap[E]): void {
    if (this.debug && typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug(`[bus] ${event}`, payload);
    }
    const set = this.handlers.get(event);
    if (!set) return;
    // Copy to array so handlers that unsubscribe mid-dispatch don't corrupt iteration.
    for (const h of Array.from(set)) {
      try { (h as EventHandler<E>)(payload); }
      catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[bus] handler for ${event} threw`, err);
      }
    }
  }

  clear(event?: EventName) {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
  }
}

export const bus = new EventBus();

// ---------- React hook: auto-cleanup on unmount ----------------------------

/**
 * Subscribe to a bus event for the lifetime of a component.
 * Handler is re-registered whenever the dependency array changes.
 */
export function useBusEvent<E extends EventName>(
  event: E,
  handler: EventHandler<E>,
  deps: ReadonlyArray<unknown> = [],
): void {
  useEffect(() => {
    const off = bus.on(event, handler);
    return () => { off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

// ---------- Small helpers used across modules ------------------------------

export const busIds = {
  scan:     () => `SCAN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  signal:   () => `SIG-${Math.floor(Math.random() * 90000) + 10000}`,
  mission:  () => `M-0${48 + Math.floor(Math.random() * 40)}`,
  vuln:     () => `VLN-${Math.floor(Math.random() * 9000) + 1000}`,
};
