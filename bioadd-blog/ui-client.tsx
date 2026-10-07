"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* 블로그 방문·문의 클릭 기록을 CMS로 보낸다 (CMS 수집 형식 v2). */

// 기록을 받는 CMS 주소. 사이트 환경변수 NEXT_PUBLIC_CMS_URL이 있으면 그 값을 쓴다.
const ANALYTICS_URL = `${(process.env.NEXT_PUBLIC_CMS_URL || "https://bioaddlab-cms.vercel.app").replace(/\/$/, "")}/api/public/analytics`;
const SESSION_AGE = 30 * 60 * 1000;
type Session = { id: string; touched: number; referrer: string; landingQuery: string };
let memorySession: Session | null = null;
const lastView = new Map<string, number>();

function uuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID가 없는 오래된 브라우저
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** 30분 동안 이어지는 방문 1회. 처음 들어온 경로(유입처·UTM)를 방문이 끝날 때까지 유지한다. */
function session(hospitalId: string): Session {
  const key = `bioadd-session-v2:${hospitalId}`;
  let current = memorySession;
  try {
    current = JSON.parse(sessionStorage.getItem(key) || "null") as Session | null;
  } catch {
    /* 저장소를 못 쓰면 메모리 값을 쓴다 */
  }
  if (!current || Date.now() - current.touched > SESSION_AGE) {
    const params = new URLSearchParams(location.search);
    const kept = new URLSearchParams();
    for (const name of ["utm_source", "utm_medium", "utm_campaign"]) {
      const value = params.get(name);
      if (value) kept.set(name, value.slice(0, 100));
    }
    for (const name of ["gclid", "gbraid", "wbraid"]) if (params.has(name)) kept.set(name, "present");
    let referrer = "";
    try {
      referrer = new URL(document.referrer).origin;
    } catch {
      /* 직접 방문 */
    }
    current = { id: uuid(), touched: Date.now(), referrer, landingQuery: kept.toString() };
  }
  current.touched = Date.now();
  memorySession = current;
  try {
    sessionStorage.setItem(key, JSON.stringify(current));
  } catch {
    /* 저장하지 못해도 기록은 보낸다 */
  }
  return current;
}

function send(hospitalId: string, type: "pageview" | "click", path: string, eventName: string) {
  const current = session(hospitalId);
  // CMS는 version 2와 eventId가 있는 기록만 받는다
  const payload = JSON.stringify({ eventId: uuid(), hospitalId, type, path, sessionId: current.id, referrer: current.referrer, landingQuery: current.landingQuery, eventName, version: 2 });
  if (navigator.sendBeacon?.(ANALYTICS_URL, new Blob([payload], { type: "text/plain" }))) return;
  void fetch(ANALYTICS_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: payload, keepalive: true }).catch(() => undefined);
}

/** 문의로 이어지는 클릭만 센다: 전화·메일·카카오톡·네이버 예약/톡톡, 그리고 data-track-cta를 붙인 버튼 */
function contactKind(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest("a,button") : null;
  if (!element) return "";
  const href = element.getAttribute("href") || "";
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (/^https:\/\/(pf|open)\.kakao\.com\//.test(href)) return "kakao_click";
  if (/^https:\/\/(m\.)?(booking|talk)\.naver\.com\//.test(href) || element.closest("[data-track-cta]")) return "contact_click";
  return "";
}

function useBlogTracking(hospitalId: string, pathname: string) {
  useEffect(() => {
    if (!hospitalId || !(pathname === "/blog" || pathname.startsWith("/blog/"))) return;
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const now = Date.now();
    if (now - (lastView.get(pathname) || 0) > 1000) {
      lastView.set(pathname, now);
      send(hospitalId, "pageview", pathname, "page_view");
    }
    const onClick = (event: MouseEvent) => {
      const kind = contactKind(event.target);
      if (kind) send(hospitalId, "click", pathname, kind);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [hospitalId, pathname]);
}

export function BlogTracker({ hospitalId }: { hospitalId: string }) {
  useBlogTracking(hospitalId, usePathname() ?? "");
  return null;
}
