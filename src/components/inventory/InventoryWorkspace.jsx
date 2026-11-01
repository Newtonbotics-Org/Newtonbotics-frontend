"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import GeneralLabInventory from "./GeneralLabInventory";
import ProjectInventories from "./ProjectInventories";
import styles from "./inventory.module.css";

export default function InventoryWorkspace() {
  const search = useSearchParams();
  const section = search.get("section") === "projects" ? "projects" : "general";
  return (
    <main className="bg-paper text-ink">
      <header className="nb-blueprint border-b border-line">
        <div className="nb-container flex flex-wrap items-end justify-between gap-6 pb-12 pt-16 sm:pt-20">
          <div className="flex min-w-0 flex-col gap-5">
            <span className="nb-eyebrow">
              <span className="nb-eyebrow-num">[INV]</span> Lab operations
            </span>
            <h1 className="nb-h1 m-0">Lab inventory</h1>
            <p className="nb-lead m-0 max-w-[620px]">
              Find the right component, check what&apos;s available, and keep every build moving.
            </p>
          </div>
          <Link href="/Inventory/requests" className="nb-btn nb-btn-secondary">
            <ClipboardList size={18} aria-hidden="true" /> Request components
          </Link>
        </div>
      </header>

      <div className="nb-container flex flex-col gap-8 pb-28 pt-8">
        <nav className={styles.tabs} aria-label="Inventory sections">
          <Link
            href="/Inventory"
            scroll={false}
            aria-current={section === "general" ? "page" : undefined}
            className={styles.tab}
          >
            General lab
          </Link>
          <Link
            href="/Inventory?section=projects"
            scroll={false}
            aria-current={section === "projects" ? "page" : undefined}
            className={styles.tab}
          >
            Project inventories
          </Link>
          <Link href="/Inventory/requests" className={styles.tab}>
            Component requests
          </Link>
        </nav>

        {section === "general" ? <GeneralLabInventory /> : <ProjectInventories />}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-xs uppercase tracking-[0.06em] text-ink-muted">
          <span>NewtonBotics · Make something that moves</span>
          <Link href="/Projects" className="nb-link inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.06em]">
            Explore our projects <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
