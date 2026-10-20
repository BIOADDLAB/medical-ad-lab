import "server-only";
import Image from "next/image";
import parse, { Element } from "html-react-parser";
import sanitize from "sanitize-html";
import { imageSize } from "image-size";
import { cache, type CSSProperties } from "react";
import { HOSPITAL } from "./hospital.config";
import { origin } from "./kit";

export function prepareHtml(content: string) {
  let section = 0, hasSection = false;
  const site = origin();
  const heading = (tag: string, attrs: Record<string, string>) => {
    const level = tag === "h1" || tag === "h2" || !hasSection ? "h2" : "h3";
    hasSection = true;
    return { tagName: level, attribs: { ...attrs, id: `section-${++section}` } };
  };
  // 다른 사이트 링크는 새 창 + noopener, 우리 사이트 링크는 nofollow 없이 그대로 둡니다.
  const link = (_tag: string, attrs: Record<string, string>) => {
    let external = false;
    try {
      const url = new URL(attrs.href || "", site);
      external = /^https?:$/.test(url.protocol) && url.origin !== site;
    } catch {}
    return { tagName: "a", attribs: { href: attrs.href || "", ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}) } };
  };
  let html = sanitize(content, {
    allowedTags: ["p", "h2", "h3", "strong", "em", "u", "s", "a", "ul", "ol", "li", "blockquote", "div", "span", "mark", "br", "hr", "img", "table", "thead", "tbody", "tr", "th", "td", "code", "pre"],
    // mark[data-tone]: 핵심·정보·주의 표시, p[data-role=summary]: 소제목 아래 요약 줄
    allowedAttributes: { "*": ["id"], span: ["style"], a: ["href", "target", "rel"], img: ["src", "alt", "width", "height", { name: "data-size", values: ["s", "m", "l", "full"] }], th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"], div: ["data-callout"], mark: [{ name: "data-tone", values: ["key", "info", "caution"] }], p: [{ name: "data-role", values: ["summary"] }] },
    allowedClasses: { div: ["cms-callout"] },
    allowedStyles: { span: { color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/], "font-size": [/^(?:1\d|2\d|3[0-2])px$/] } },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: { h1: heading, h2: heading, h3: heading, h4: heading, h5: heading, h6: heading, a: link },
  });
  // 내용 없는 문단은 지웁니다. 엔터로 넣은 빈 줄(<p><br></p>)은 글쓴이가 띄운 간격이라 둡니다.
  html = html.replace(/<p>(?:\s|&nbsp;)*<\/p>/g, "");
  html = html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => {
    if (!/<thead\b/i.test(table))
      table = table
        .replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/i, (_, cells: string) => `<thead><tr>${cells.replace(/<td\b/gi, '<th scope="col"').replace(/<\/td>/gi, "</th>")}</tr></thead>`)
        .replace(/<tbody>\s*(<thead>[\s\S]*?<\/thead>)/i, "$1<tbody>");
    return `<div class="blog-table-scroll">${table.replace(/<th(?!ead)\b(?![^>]*scope=)/gi, '<th scope="col"')}</div>`;
  });
  return html;
}

export const allowedImage = (src: string) => {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && HOSPITAL.imageHosts.includes(url.hostname);
  } catch {
    return false;
  }
};
export const imageDimensions = cache(async (src: string) => {
  if (!allowedImage(src)) throw new Error("hospital.config.ts의 imageHosts에 없는 이미지 주소입니다.");
  const response = await fetch(src, { redirect: "error", next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("이미지 크기를 확인할 수 없습니다.");
  if (Number(response.headers.get("content-length")) > 8 * 1024 * 1024) throw new Error("이미지가 8MB를 넘습니다.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("이미지 응답이 비어 있습니다.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8 * 1024 * 1024) throw new Error("이미지가 8MB를 넘습니다.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const dimensions = imageSize(Buffer.concat(chunks));
  if (!dimensions.width || !dimensions.height) throw new Error("이미지 크기를 확인할 수 없습니다.");
  return { width: dimensions.width, height: dimensions.height };
});

type Size = { width: number; height: number } | null;
// 편집기에서 고른 사진 크기는 본문 폭(792px) 대비 비율입니다.
// 고르지 않은 사진은 높이 560px 안으로 줄이고 원본보다 키우지 않아, 세로·정사각형 사진이 화면을 덮지 않습니다.
const PERCENT: Record<string, number> = { s: 33, m: 50, l: 75, full: 100 };
function fit(choice: string | undefined, size: Size): { style: CSSProperties; sizes: string } {
  const percent = PERCENT[choice || ""];
  if (percent) return { style: { width: `${percent}%` }, sizes: `(max-width: 840px) ${percent}vw, ${Math.ceil(7.92 * percent)}px` };
  if (!size) return { style: { maxHeight: 560 }, sizes: "" };
  const px = Math.min(792, size.width, Math.round((560 * size.width) / size.height));
  return { style: { width: `min(100%, ${px}px)` }, sizes: `(max-width: ${px + 48}px) 100vw, ${px}px` };
}

/** 이미지 하나 때문에 글 전체가 오류 나지 않게, 크기를 못 읽으면 일반 img로 보여 주고 서버 로그에 남깁니다. */
export async function ArticleBody({ html }: { html: string }) {
  const dims = new Map<string, Size>();
  const pending: Element[] = [];
  parse(html, { replace(node) { if (node instanceof Element && node.name === "img") pending.push(node); } });
  for (let i = 0; i < pending.length; i += 4)
    await Promise.all(pending.slice(i, i + 4).map(async (node) => {
      const { src = "", alt = "" } = node.attribs;
      if (!alt.trim()) console.error(`[bioadd-blog] 본문 이미지 ALT가 비어 있습니다: ${src}`);
      if (dims.has(src)) return;
      dims.set(src, await imageDimensions(src).catch((e: Error) => (console.error(`[bioadd-blog] ${e.message} ${src}`), null)));
    }));
  return (
    <div className="blog-content">
      {parse(html, {
        replace(node) {
          if (!(node instanceof Element) || node.name !== "img") return;
          const { src = "", alt = "", "data-size": choice } = node.attribs, size = dims.get(src) ?? null, { style, sizes } = fit(choice, size);
          // eslint-disable-next-line @next/next/no-img-element
          if (!size) return <img src={src} alt={alt.trim()} style={style} loading="lazy" decoding="async" />;
          return <Image src={src} alt={alt.trim()} width={size.width} height={size.height} sizes={sizes} style={style} loading="lazy" decoding="async" />;
        },
      })}
    </div>
  );
}
