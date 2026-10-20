"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startBlogTracking } from "./browser-tracker";
import { HOSPITAL } from "./hospital.config";
// 블로그 layout에 들어 있습니다. app/layout.tsx에도 <BlogTracker />를 넣으면 블로그를 본 방문자가 예약·상담 페이지에 바로 들어와 누른 클릭까지 셉니다(두 번 세지 않음).
export function BlogTracker(){const path=usePathname()||"";useEffect(()=>startBlogTracking(HOSPITAL.id,path,HOSPITAL.cmsUrl+"/api/public/analytics",HOSPITAL.blogPath,HOSPITAL.contactUrl),[path]);return null;}
