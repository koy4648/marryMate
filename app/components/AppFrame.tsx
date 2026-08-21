"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/venues", label: "웨딩홀", eyebrow: "VENUE TOUR" },
] as const;

export default function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="product-frame">
      <header className="product-header">
        <div className="product-header-inner">
          <Link className="product-brand" href="/venues" aria-label="Marry Mate 홈">
            <strong>marry mate</strong>
            <span>우리의 결혼 준비 공간</span>
          </Link>
          <nav className="product-navigation" aria-label="주요 기능">
            {navigation.map((item) => {
              const active = pathname === "/" || pathname.startsWith(item.href);
              return (
                <Link className={active ? "active" : ""} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
                  <small>{item.eyebrow}</small>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="product-context" aria-label="현재 저장 방식">
            <i />
            <span>기기 저장 + 공유 DB</span>
          </div>
        </div>
      </header>
      <div className="product-content">{children}</div>
    </div>
  );
}
