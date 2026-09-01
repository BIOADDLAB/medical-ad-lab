"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { classifyReferrer, slugFromPath } from "@/bioadd-blog/kit";

function sessionId() {
  const key = "bioadd-blog-sid";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID?.() ?? `s${Date.now()}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return "anon";
  }
}

function send(body: Record<string, unknown>) {
  const cms = (process.env.NEXT_PUBLIC_CMS_URL ?? "").replace(/\/$/, "");
  if (!cms) return;
  const payload = JSON.stringify(body);
  const url = `${cms}/api/public/analytics`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: "text/plain" }));
    return;
  }
  void fetch(url, { method: "POST", body: payload, keepalive: true, mode: "cors" });
}

export function BlogTracker({ hospitalId }: { hospitalId: string }) {
  const pathname = usePathname() ?? "";
  useEffect(() => {
    if (!hospitalId || !pathname.startsWith("/blog")) return;
    try {
      const { source, organic } = classifyReferrer(document.referrer, window.location.host);
      send({
        hospitalId,
        type: "pageview",
        path: pathname,
        slug: slugFromPath(pathname),
        referrer: document.referrer,
        source,
        organic,
        sessionId: sessionId(),
      });
      function onClick(event: MouseEvent) {
        const target = (event.target as HTMLElement | null)?.closest("a");
        if (!target?.getAttribute("href")) return;
        send({
          hospitalId,
          type: "click",
          path: pathname,
          slug: slugFromPath(pathname),
          referrer: target.getAttribute("href"),
          source: "click",
          organic: false,
          sessionId: sessionId(),
        });
      }
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    } catch {
      return undefined;
    }
  }, [hospitalId, pathname]);
  return null;
}
