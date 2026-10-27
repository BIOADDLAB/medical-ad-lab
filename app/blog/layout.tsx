import type { CSSProperties, ReactNode } from "react";
import { HOSPITAL } from "@/medicaladlab-blog/hospital.config";
import { BlogTracker } from "@/medicaladlab-blog/tracker";
import { PageBanner } from "@/components/layout/page-banner";
import "@/medicaladlab-blog/styles.css";
// 글 색상(CMS 프로젝트 정보 → 글쓰기 색상). 색을 바꾸면 CMS에서 블로그 코드를 다시 받아 hospital.config.ts만 바꿉니다.
const theme = Object.fromEntries(Object.entries(HOSPITAL.theme).map(([name, color]) => [`--bb-${name}`, color])) as CSSProperties;
// 바깥 감싸기(배경·PageBanner)는 이 사이트가 붙인 부분입니다. 배너가 투명 헤더 밑까지 깔리도록 상단 여백은 두지 않습니다. 블로그 코드를 다시 받아 덮을 때 남겨 두세요.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen bg-[#faf9f7] text-slate-900">
      <PageBanner variant="journal" />
      <div className="medicaladlab-blog" style={theme}><BlogTracker />{children}</div>
    </main>
  );
}
