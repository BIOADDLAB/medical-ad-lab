import sanitizeHtml from "sanitize-html";

import { publicOrigin } from "@/bioadd-blog/kit";

/**
 * CMS가 내려주는 본문 HTML을 서버에서 정리한다.
 * sanitize → 헤딩 정규화 → section-N 앵커 → 표 감싸기 순서로만 통과시킨다.
 */

function siteHost() {
  try {
    return new URL(publicOrigin()).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isExternal(href: string) {
  if (!/^https?:\/\//i.test(href)) return false;
  const host = siteHost();
  try {
    const target = new URL(href).host.replace(/^www\./, "");
    return !host || target !== host;
  } catch {
    return false;
  }
}

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "mark", "sup", "sub",
    "h2", "h3", "blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td", "code", "pre", "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    th: ["scope", "colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["id", "class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    // 페이지 h1은 상세 헤더 하나뿐이고, h4 이하는 쓰지 않는다
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    img: (_tag, attribs) => ({
      tagName: "img",
      attribs: {
        ...attribs,
        alt: attribs.alt ?? "",
        loading: attribs.loading ?? "lazy",
        decoding: attribs.decoding ?? "async",
      },
    }),
    a: (_tag, attribs) => {
      const href = attribs.href ?? "";
      if (isExternal(href)) {
        return { tagName: "a", attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } };
      }
      // 자사 페이지로는 링크 가중치를 그대로 넘긴다
      const rel = (attribs.rel ?? "").split(/\s+/).filter((token) => token && token !== "nofollow").join(" ");
      const next = { ...attribs };
      if (rel) next.rel = rel;
      else delete next.rel;
      return { tagName: "a", attribs: next };
    },
  },
};

/** 저장 시 남은 빈 문단을 걷어낸다 */
function dropEmptyBlocks(html: string) {
  return html.replace(/<(p|div|span)(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, "");
}

/** 목차 앵커. h2는 section-N, h3는 section-N-M */
function addHeadingIds(html: string) {
  let h2 = 0;
  let h3 = 0;
  return html.replace(/<(h2|h3)((?:\s[^>]*)?)>/gi, (_full, tag: string, attrs: string) => {
    const level = tag.toLowerCase();
    if (level === "h2") {
      h2 += 1;
      h3 = 0;
    } else {
      h3 += 1;
    }
    const id = level === "h2" ? `section-${h2}` : `section-${h2}-${h3}`;
    const rest = attrs.replace(/\sid\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return `<${level}${rest} id="${id}">`;
  });
}

/** 첫 행이 헤더인데 thead가 없으면 승격한다 */
function promoteThead(table: string) {
  if (/<thead\b/i.test(table)) return table;
  const firstRow = /<tr\b[\s\S]*?<\/tr>/i.exec(table);
  if (!firstRow) return table;
  const head = firstRow[0]
    .replace(/<td(\s[^>]*)?>/gi, '<th scope="col"$1>')
    .replace(/<\/td>/gi, "</th>");
  return table.replace(firstRow[0], "").replace(/<table\b[^>]*>/i, (open) => `${open}<thead>${head}</thead>`);
}

/** 모바일에서 표가 화면을 밀지 않도록 가로 스크롤 컨테이너로 감싼다 */
function wrapTables(html: string) {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (table) => `<div class="table-scroll">${promoteThead(table)}</div>`);
}

export function renderArticleHtml(html: string) {
  return wrapTables(addHeadingIds(dropEmptyBlocks(sanitizeHtml(html ?? "", OPTIONS))));
}

export function extractToc(html: string) {
  const items: { id: string; text: string }[] = [];
  const pattern = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = (match[2] ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const id = /id=["']([^"']+)["']/.exec(match[1] ?? "")?.[1];
    if (text && id) items.push({ id, text });
  }
  return items;
}
