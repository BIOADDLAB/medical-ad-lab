"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { startBlogTracking } from "./browser-tracker";
import { HOSPITAL } from "./hospital.config";
// 블로그 layout에 들어 있습니다. app/layout.tsx에도 <BlogTracker />를 넣으면 블로그를 본 방문자가 예약·상담 페이지에 바로 들어와 누른 클릭까지 셉니다(두 번 세지 않음).
export function BlogTracker(){const path=usePathname()||"";useEffect(()=>startBlogTracking(HOSPITAL.id,path,HOSPITAL.cmsUrl+"/api/public/analytics",HOSPITAL.blogPath,HOSPITAL.contactUrl),[path]);return null;}
// 목차에서 지금 읽는 소제목을 표시합니다(넓은 화면에서 왼쪽에 따라오는 목차). 소제목이 화면 위쪽 140px을 지나면 그 항목이 켜집니다.
// 목차가 길어 스크롤되면 지금 읽는 항목이 보이게 목차 안을 옮깁니다. 본문 끝이 목차 아래보다 위로 올라가면 목차를 감춥니다(data-ended). 좁은 화면에서는 목차가 본문 위에 있어 감춰지지 않습니다.
export function BlogTocSpy(){const path=usePathname()||"";useEffect(()=>{const nav=document.querySelector<HTMLElement>(".blog-toc"),body=document.querySelector(".blog-content"),links=[...document.querySelectorAll<HTMLAnchorElement>(".blog-toc a[href^='#']")],heads=links.map((a)=>document.getElementById(decodeURIComponent(a.hash.slice(1))));let frame=0,last=-2;const update=()=>{frame=0;let on=-1;heads.forEach((h,i)=>{if(h&&h.getBoundingClientRect().top<140)on=i;});links.forEach((a,i)=>i===on?a.setAttribute("aria-current","location"):a.removeAttribute("aria-current"));if(on!==last&&nav&&links[on]&&nav.scrollHeight>nav.clientHeight){const r=links[on].getBoundingClientRect(),n=nav.getBoundingClientRect();if(r.top<n.top||r.bottom>n.bottom-72)nav.scrollTop+=r.top-n.top-n.height/3;}last=on;if(nav&&body)nav.toggleAttribute("data-ended",body.getBoundingClientRect().bottom<nav.getBoundingClientRect().bottom);};const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};update();addEventListener("scroll",onScroll,{passive:true});return()=>{removeEventListener("scroll",onScroll);cancelAnimationFrame(frame);};},[path]);return null;}
