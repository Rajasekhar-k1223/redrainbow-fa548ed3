// ---------------------------------------------------------------------------
// RedRainbow — MITRE ATT&CK mapping layer
// Lightweight, client-only tactic/technique catalogue plus keyword heuristics
// used to map hunt hits and detection rules onto ATT&CK coverage.
// ---------------------------------------------------------------------------

export interface MitreTactic {
  id: string;   // TA00xx
  name: string;
  shortName: string;
}

export interface MitreTechnique {
  id: string;   // Txxxx(.xxx)
  name: string;
  tactic: string; // tactic id
  keywords: string[];
}

export const tactics: MitreTactic[] = [
  { id: "TA0001", name: "Initial Access",      shortName: "initial-access" },
  { id: "TA0002", name: "Execution",           shortName: "execution" },
  { id: "TA0003", name: "Persistence",         shortName: "persistence" },
  { id: "TA0004", name: "Privilege Escalation", shortName: "priv-esc" },
  { id: "TA0005", name: "Defense Evasion",     shortName: "defense-evasion" },
  { id: "TA0006", name: "Credential Access",   shortName: "cred-access" },
  { id: "TA0007", name: "Discovery",           shortName: "discovery" },
  { id: "TA0008", name: "Lateral Movement",    shortName: "lateral-movement" },
  { id: "TA0009", name: "Collection",          shortName: "collection" },
  { id: "TA0010", name: "Exfiltration",        shortName: "exfiltration" },
  { id: "TA0011", name: "Command & Control",   shortName: "c2" },
  { id: "TA0040", name: "Impact",              shortName: "impact" },
];

export const tacticById = (id: string) => tactics.find((t) => t.id === id);

export const techniques: MitreTechnique[] = [
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "TA0001", keywords: ["exploit", "cve", "rce", "webshell", "waf", "sqli", "injection"] },
  { id: "T1566", name: "Phishing",                          tactic: "TA0001", keywords: ["phish", "lure", "attachment", "smishing"] },
  { id: "T1059", name: "Command and Scripting Interpreter",  tactic: "TA0002", keywords: ["powershell", "bash", "cmd", "script", "python", "encodedcommand"] },
  { id: "T1053", name: "Scheduled Task/Job",                 tactic: "TA0003", keywords: ["schtask", "cron", "scheduled", "systemd"] },
  { id: "T1543", name: "Create or Modify System Process",    tactic: "TA0003", keywords: ["service", "daemon", "launchd", "persistence"] },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "TA0004", keywords: ["privesc", "escalation", "kernel", "sudo", "setuid"] },
  { id: "T1070", name: "Indicator Removal",                  tactic: "TA0005", keywords: ["clear", "wipe", "log delete", "timestomp", "purge"] },
  { id: "T1027", name: "Obfuscated Files or Information",    tactic: "TA0005", keywords: ["obfuscat", "packed", "base64", "encoded", "encrypt"] },
  { id: "T1562", name: "Impair Defenses",                    tactic: "TA0005", keywords: ["disable", "tamper", "bypass", "custody", "evasion"] },
  { id: "T1003", name: "OS Credential Dumping",              tactic: "TA0006", keywords: ["lsass", "mimikatz", "sam", "ntds", "credential", "dump", "memory"] },
  { id: "T1110", name: "Brute Force",                        tactic: "TA0006", keywords: ["brute", "password spray", "login fail", "spray"] },
  { id: "T1046", name: "Network Service Discovery",          tactic: "TA0007", keywords: ["nmap", "port scan", "portscan", "scan", "enum", "subdomain"] },
  { id: "T1018", name: "Remote System Discovery",            tactic: "TA0007", keywords: ["discovery", "arp", "netview", "host enum"] },
  { id: "T1021", name: "Remote Services",                    tactic: "TA0008", keywords: ["smb", "winrm", "rdp", "ssh", "psexec", "lateral"] },
  { id: "T1005", name: "Data from Local System",             tactic: "TA0009", keywords: ["collect", "archive", "staging", "zip", "tar"] },
  { id: "T1113", name: "Screen Capture",                     tactic: "TA0009", keywords: ["screenshot", "screen capture", "png"] },
  { id: "T1041", name: "Exfiltration Over C2 Channel",       tactic: "TA0010", keywords: ["exfil", "upload", "transfer", "egress"] },
  { id: "T1048", name: "Exfiltration Over Alternative Protocol", tactic: "TA0010", keywords: ["dns tunnel", "ftp", "icmp", "tunnel"] },
  { id: "T1071", name: "Application Layer Protocol",         tactic: "TA0011", keywords: ["http", "dns", "pcap", "packet", "traffic"] },
  { id: "T1090", name: "Proxy",                              tactic: "TA0011", keywords: ["tor", "proxy", "relay", "exit node", "vpn"] },
  { id: "T1102", name: "Web Service",                        tactic: "TA0011", keywords: ["pastebin", "cdn", "webhook"] },
  { id: "T1573", name: "Encrypted Channel",                  tactic: "TA0011", keywords: ["tls", "certificate", "cert", "ssl"] },
  { id: "T1105", name: "Ingress Tool Transfer",              tactic: "TA0011", keywords: ["beacon", "c2", "implant", "payload", "download", "malware", "sample", "bin"] },
  { id: "T1486", name: "Data Encrypted for Impact",          tactic: "TA0040", keywords: ["ransom", "encrypt files", "locker"] },
  { id: "T1489", name: "Service Stop",                       tactic: "TA0040", keywords: ["service stop", "outage", "denial"] },
];

export const techniqueById = (id: string) => techniques.find((t) => t.id === id);

export interface MitreMatch {
  technique: MitreTechnique;
  tactic: MitreTactic;
  matchedOn: string;
}

/** Heuristically map any free text (artifact name, IOC, summary) to ATT&CK techniques. */
export const mapText = (text: string, limit = 3): MitreMatch[] => {
  const h = text.toLowerCase();
  const out: MitreMatch[] = [];
  for (const t of techniques) {
    const kw = t.keywords.find((k) => h.includes(k));
    if (!kw) continue;
    const tac = tacticById(t.tactic);
    if (!tac) continue;
    out.push({ technique: t, tactic: tac, matchedOn: kw });
    if (out.length >= limit) break;
  }
  return out;
};

/** Compact "T1090 · Proxy" labels for badges. */
export const labelOf = (m: MitreMatch) => `${m.technique.id} · ${m.technique.name}`;

/** Aggregate matches into a tactic-level coverage map. */
export const coverageOf = (matches: MitreMatch[]) => {
  const map = new Map<string, { tactic: MitreTactic; techniques: Set<string>; count: number }>();
  matches.forEach((m) => {
    const e = map.get(m.tactic.id) ?? { tactic: m.tactic, techniques: new Set<string>(), count: 0 };
    e.techniques.add(m.technique.id);
    e.count += 1;
    map.set(m.tactic.id, e);
  });
  return tactics
    .map((t) => map.get(t.id))
    .filter((e): e is { tactic: MitreTactic; techniques: Set<string>; count: number } => !!e);
};
