import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import threeDPaperSource from "./sources/3d-paper.html?raw";
import "../threeui.css";

export type ThreeDPaperReport = {
  studentName?: string;
  issueSummary?: string;
  location?: string;
  category?: string;
  priority?: string;
  expectedResolution?: string;
  assignedTeam?: string;
  status?: string;
  evidenceImages?: string[];
};

export type ThreeDPaperProps = {
  className?: string;
  style?: CSSProperties;
  report?: ThreeDPaperReport;
};

function buildReportDocument(report: ThreeDPaperReport = {}) {
  const safeReport = JSON.stringify(report).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return threeDPaperSource
    .replace("<title>3D Paper</title>", "<title>CampusFix · Report Created</title>")
    .replace("<div id=\"bg\"><h1>NOCTURNE</h1></div>", "<div id=\"bg\"><h1>CAMPUSFIX</h1></div>")
    .replace("<div id=\"hint\"><b>Drag</b> to turn it<span class=\"ptr\"> &nbsp;·&nbsp; <b>Hover</b> to light it</span></div>", "<div id=\"hint\"><b>CampusFix report</b><span class=\"ptr\"> &nbsp;·&nbsp; <b>Drag</b> to turn the paper</span></div>")
    .replace("<script>", `<script>window.CAMPUSFIX_REPORT=${safeReport};</script>\\n<script>`);
}

export function ThreeDPaper({ className = "", style, report = {} }: ThreeDPaperProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [hostVisible, setHostVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const srcDoc = useMemo(() => buildReportDocument(report), [report]);
  useEffect(() => { const host = hostRef.current; if (!host || typeof IntersectionObserver === "undefined") return undefined; const observer = new IntersectionObserver(([entry]) => setHostVisible(entry?.isIntersecting ?? true), { rootMargin: "80px" }); observer.observe(host); return () => observer.disconnect(); }, []);
  useEffect(() => { if (typeof document === "undefined") return undefined; const update = () => setDocumentVisible(!document.hidden); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
  const mounted = hostVisible && documentVisible;
  useEffect(() => { setReady(false); setFailed(false); if (!mounted) return undefined; const handleMessage = (event: MessageEvent) => { if (event.source !== iframeRef.current?.contentWindow) return; if (event.data?.type === "campusfix-paper-ready") setReady(true); if (event.data?.type === "campusfix-paper-failed") setFailed(true); }; window.addEventListener("message", handleMessage); const timeout = window.setTimeout(() => setFailed(true), 20000); return () => { window.removeEventListener("message", handleMessage); window.clearTimeout(timeout); }; }, [mounted, srcDoc]);
  const fallbackTitle = report.issueSummary || "CampusFix report";
  const fallbackStatus = report.status || "Received";
  const detailFields = [["Student name", report.studentName], ["Problem location", report.location], ["Category", report.category], ["Priority", report.priority], ["Assigned team", report.assignedTeam], ["Expected resolution", report.expectedResolution]];
  return <div ref={hostRef} className={`threeui-background three-d-paper${className ? ` ${className}` : ""}`} role="group" aria-label="Interactive physical CampusFix complaint report" data-state={!mounted ? "paused" : failed ? "fallback" : ready ? "ready" : "loading"} style={{ position: "relative", overflow: "hidden", background: "transparent", pointerEvents: "auto", ...style }}>
    {mounted && !failed ? <iframe ref={iframeRef} title="CampusFix physical complaint report" srcDoc={srcDoc} sandbox="allow-scripts allow-same-origin" allow="webgl" loading="eager" onLoad={() => setReady(true)} onError={() => setFailed(true)} style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%", border: 0, background: "transparent", opacity: 1, pointerEvents: "auto", transition: "opacity 240ms ease-out" }} /> : null}
    {failed && <div role="status" style={{ position: "absolute", inset: 0, zIndex: 2, display: "grid", placeItems: "center", padding: "1rem", perspective: 1100, pointerEvents: "auto" }}><style>{`@keyframes campusfixPaperFloat { 0%,100% { transform: perspective(1100px) rotateX(7deg) rotateY(-9deg) rotateZ(-2deg) translateY(0); } 50% { transform: perspective(1100px) rotateX(3deg) rotateY(8deg) rotateZ(1deg) translateY(-10px); } } @media (prefers-reduced-motion: reduce) { .campusfix-css-paper { animation: none !important; } }`}</style><div className="campusfix-css-paper" style={{ display: "flex", flexDirection: "column", gap: ".72rem", width: "min(680px, 94%)", minHeight: 430, maxHeight: "calc(100% - 1rem)", overflow: "auto", padding: "clamp(1.4rem, 4vw, 2.4rem)", border: "1px solid rgba(102,77,74,.22)", borderRadius: 8, background: "linear-gradient(145deg,#fffefa 0%,#f6f0e5 72%,#e5d9ca 100%)", boxShadow: "22px 30px 55px rgba(0,0,0,.42), inset 0 0 34px rgba(130,105,80,.12)", color: "#27212d", transformStyle: "preserve-3d", animation: "campusfixPaperFloat 6s ease-in-out infinite", cursor: "grab" }}><span style={{ color: "#8b5cf6", font: "700 .7rem/1 'DM Mono', monospace", letterSpacing: ".18em" }}>CAMPUSFIX · REPORT CREATED</span><strong style={{ font: "650 clamp(1.1rem, 2.5vw, 1.5rem)/1.3 Inter, sans-serif", maxWidth: "32ch" }}>{fallbackTitle}</strong><span style={{ color: "#77707b", fontSize: ".85rem" }}>Status: {fallbackStatus}</span><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: ".65rem .9rem", padding: ".9rem 0", borderTop: "1px solid rgba(102,77,74,.18)", borderBottom: "1px solid rgba(102,77,74,.18)" }}>{detailFields.map(([label, value]) => <span key={label} style={{ display: "grid", gap: ".22rem" }}><small style={{ color: "#77707b", font: "600 .62rem/1.2 'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</small><span style={{ fontSize: ".82rem", fontWeight: 600 }}>{value || "To be confirmed"}</span></span>)}</div><span style={{ height: 1, width: "100%", background: "rgba(102,77,74,.18)", margin: ".3rem 0" }} /><span style={{ color: "#27212d", fontSize: ".95rem", fontWeight: 650 }}>Your report was created successfully.</span><span style={{ color: "#77707b", font: ".7rem/1.5 'DM Mono', monospace", letterSpacing: ".08em", marginTop: "auto" }}>PHYSICAL REPORT · CAMPUSFIX</span></div></div>}
  </div>;
}
