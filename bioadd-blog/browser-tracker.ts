import { classifyReferrer, slugFromPath } from "./classify";
type Attribution = ReturnType<typeof classifyReferrer>;
/** blog: 이 방문에서 마지막으로 본 블로그 주소. 블로그를 본 방문의 문의 클릭만 셉니다. */
type Session = { id: string; touched: number; attribution: Attribution; referrer: string; landingQuery: string; blog?: string };
type Target = { hospitalId: string; endpoint: string; basePath: string; contact: string };
const SESSION_AGE = 30 * 60 * 1000;
let volatileSession: Session | null = null;
const sent = new Map<string, number>();
// 클릭 리스너는 페이지를 새로 열 때 한 번만 붙입니다. 블로그를 나가 다른 페이지(예약·상담)로 옮겨도 계속 셉니다.
let target: Target | null = null;

// 카카오톡 채널은 pf·plus(예전 채널 주소)·open(오픈채팅)·qr 주소와 kakao.me 짧은 주소를 모두 셉니다.
const KAKAO = /^https?:\/\/(?:(?:pf|plus|open|qr)\.kakao\.com|kakao\.me)(?:\/|$)/i,
  BOOKING = /^https?:\/\/(?:m\.)?booking\.naver\.com(?:\/|$)/i,
  TALK = /^https?:\/\/talk\.naver\.com(?:\/|$)/i;
/** 문의로 세는 클릭: 전화·이메일·카카오톡 채널·네이버 예약·네이버 톡톡·문의 페이지 링크·data-track-cta 표시 */
function clickKind(el: Element, contact: string) {
  const href = el.getAttribute("href") || "";
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (KAKAO.test(href)) return "kakao_click";
  if (BOOKING.test(href)) return "booking_click";
  if (TALK.test(href)) return "talk_click";
  if (el.closest("[data-track-cta]")) return "contact_click";
  if (!contact || !href) return "";
  try {
    const url = new URL(href, location.href);
    if (/^https:\/\//i.test(contact)) return url.href.startsWith(contact) ? "contact_click" : "";
    const want = new URL(contact, location.origin);
    if (url.origin !== location.origin) return "";
    // 문의가 앵커(/#contact)면 경로와 앵커가 같은 링크만, 아니면 그 페이지와 하위 페이지로 가는 링크를 셉니다. 홈(/)만 적은 경우는 세지 않습니다.
    if (want.hash) return url.pathname === want.pathname && url.hash === want.hash ? "contact_click" : "";
    const page = want.pathname.replace(/\/+$/, "");
    return page && (url.pathname === page || url.pathname.startsWith(`${page}/`)) ? "contact_click" : "";
  } catch {
    return "";
  }
}

function session(hospitalId: string): Session {
  const key = `bioadd-session-v2:${hospitalId}`;
  let current = volatileSession;
  try {
    current = JSON.parse(sessionStorage.getItem(key) || "null") as Session | null;
  } catch {
    /* 메모리 세션 사용 */
  }
  if (!current || Date.now() - current.touched > SESSION_AGE) {
    const params = new URLSearchParams(location.search);
    const safeQuery = new URLSearchParams();
    for (const name of ["utm_source", "utm_medium", "utm_campaign"]) if (params.get(name)) safeQuery.set(name, params.get(name)!.slice(0, 100));
    for (const name of ["gclid", "gbraid", "wbraid"]) if (params.has(name)) safeQuery.set(name, "present");
    let referrer = "";
    try {
      referrer = new URL(document.referrer).origin;
    } catch {}
    current = { id: crypto.randomUUID(), touched: Date.now(), attribution: classifyReferrer(referrer, location.hostname, params), referrer, landingQuery: safeQuery.toString() };
  }
  current.touched = Date.now();
  return current;
}
function save(hospitalId: string, s: Session) {
  volatileSession = s;
  try {
    sessionStorage.setItem(`bioadd-session-v2:${hospitalId}`, JSON.stringify(s));
  } catch {}
}
function send(t: Target, s: Session, type: "pageview" | "click", path: string, eventName: string) {
  const payload = JSON.stringify({ eventId: crypto.randomUUID(), hospitalId: t.hospitalId, type, path, slug: slugFromPath(s.blog || path, t.basePath), fromPath: s.blog || "", sessionId: s.id, referrer: s.referrer, landingQuery: s.landingQuery, eventName, version: 2 });
  if (navigator.sendBeacon?.(t.endpoint, new Blob([payload], { type: "text/plain" }))) return;
  void fetch(t.endpoint, { method: "POST", headers: { "Content-Type": "text/plain" }, body: payload, keepalive: true }).catch(() => undefined);
}
function onClick(event: MouseEvent) {
  const t = target,
    el = (event.target as Element | null)?.closest?.("a,button,[data-track-cta]");
  if (!t || !el) return;
  const kind = clickKind(el, t.contact);
  if (!kind) return;
  const s = session(t.hospitalId);
  save(t.hospitalId, s);
  // 블로그를 보지 않은 방문의 클릭은 블로그 성과가 아니라 보내지 않습니다.
  if (s.blog) send(t, s, "click", location.pathname, kind);
}

/**
 * 블로그 조회와, 블로그를 본 방문의 문의 클릭을 CMS로 보냅니다.
 * 블로그 layout에 두면 블로그를 본 뒤 다른 페이지로 옮겨서 한 클릭도 셉니다. 사이트 전체 layout에 함께 둬도 두 번 세지 않습니다.
 * contactUrl: 문의 페이지 경로(/reservation, /#contact) 또는 https 주소. 이 주소로 가는 링크 클릭을 문의로 셉니다.
 */
export function startBlogTracking(hospitalId: string, path: string, endpoint: string, basePath = "/blog", contactUrl = "") {
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  if (!target) document.addEventListener("click", onClick, true);
  target = { hospitalId, endpoint, basePath, contact: contactUrl.trim() };
  if (path !== basePath && !path.startsWith(`${basePath}/`)) return;
  const s = session(hospitalId);
  s.blog = path;
  save(hospitalId, s);
  const signature = `${hospitalId}:${path}`,
    now = Date.now();
  if (now - (sent.get(signature) || 0) > 1000) {
    sent.set(signature, now);
    send(target, s, "pageview", path, "page_view");
  }
}
