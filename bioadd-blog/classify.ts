const matches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);
export function classifyReferrer(referrer: string, pageHost: string, params = new URLSearchParams()) {
  const utmSource = params.get("utm_source")?.trim().toLowerCase();
  const utmMedium = params.get("utm_medium")?.trim().toLowerCase();
  const campaign = (params.get("utm_campaign") || "").slice(0,100);
  if (params.has("gclid") || params.has("gbraid") || params.has("wbraid")) return { source:utmSource||"google",medium:"cpc",channel:"paid",organic:false,campaign };
  if (utmSource || utmMedium) return { source:utmSource||"(not set)",medium:utmMedium||"(not set)",channel:utmMedium==="organic"?"search":["cpc","ppc","paid","paid_social"].includes(utmMedium||"")?"paid":"campaign",organic:utmMedium==="organic",campaign };
  let host=""; try { host = new URL(referrer).hostname.toLowerCase(); } catch { /* referrer가 전달되지 않은 방문 */ }
  if (!host) return {source:"direct / unknown",medium:"none",channel:"unknown",organic:false,campaign};
  if (host.replace(/^www\./,"")===pageHost.replace(/^www\./,"")) return {source:"internal",medium:"internal",channel:"internal",organic:false,campaign};
  if (["chatgpt.com","chat.openai.com","perplexity.ai","claude.ai","gemini.google.com","copilot.microsoft.com"].some(d=>matches(host,d))) return {source:host,medium:"referral",channel:"ai",organic:false,campaign};
  const naverSearch = ["naver.com", "www.naver.com", "m.naver.com", "search.naver.com", "m.search.naver.com"].includes(host);
  const search = naverSearch || ["google.com","google.co.kr","bing.com","daum.net","yahoo.com","search.yahoo.co.jp","duckduckgo.com"].some(d=>matches(host,d));
  return {source:host,medium:search?"organic":"referral",channel:search?"search":"referral",organic:search,campaign};
}
export function slugFromPath(path: string, basePath="/blog") {
  return path.startsWith(`${basePath}/`) ? path.slice(basePath.length+1).split(/[/?#]/)[0] : "";
}
