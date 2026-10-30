"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Boxes, ClipboardList, FlaskConical, FolderKanban } from "lucide-react";
import GeneralLabInventory from "./GeneralLabInventory";
import ProjectInventories from "./ProjectInventories";
import styles from "./inventory.module.css";

export default function InventoryWorkspace() {
  const search = useSearchParams();
  const section = search.get("section") === "projects" ? "projects" : "general";
  return (
    <main className={styles.scope}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}><span className={styles.signal} /> NEWTONBOTICS / LAB OPERATIONS</p>
            <h1>Built to build.<br /><span>Inventory workspace.</span></h1>
            <p className={styles.intro}>Find the right component. Know what’s available.<br className={styles.desktopBreak} /> Keep every build moving.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/Inventory/requests" className={`${styles.primaryButton} ${styles.requestCta}`}>
              <ClipboardList size={18} /> Request Components
            </Link>
            <div className={styles.heroMark} aria-hidden="true"><Boxes size={72} strokeWidth={1} /><span>PARTS → POSSIBILITIES</span></div>
          </div>
        </header>
        <nav className={styles.scopeNav} aria-label="Inventory sections">
          <Link href="/Inventory" scroll={false} aria-current={section === "general" ? "page" : undefined} className={section === "general" ? styles.activeScope : ""}>
            <FlaskConical size={22} /><span><strong>General Lab</strong><small>Shared components & equipment</small></span><span className={styles.scopeIndex}>01</span>
          </Link>
          <Link href="/Inventory?section=projects" scroll={false} aria-current={section === "projects" ? "page" : undefined} className={section === "projects" ? styles.activeScope : ""}>
            <FolderKanban size={22} /><span><strong>Project inventories</strong><small>Explore individual project workspaces</small></span><span className={styles.scopeIndex}>02</span>
          </Link>
        </nav>
        {section === "general" ? <GeneralLabInventory /> : <ProjectInventories />}
        <footer className={styles.workspaceFooter}><span>NEWTONBOTICS · MAKE SOMETHING THAT MOVES.</span><Link href="/Projects">Explore our projects <ArrowUpRight size={14} /></Link></footer>
      </div>
    </main>
  );
}
