"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderKanban, Search } from "lucide-react";
import { listInventoryProjects } from "@/lib/inventoryProjects";
import { CardSkeletonGrid } from "@/components/PageSkeletons";
import styles from "./inventory.module.css";

const projectGroups = [
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
  { key: "other", label: "Other" },
];

function projectGroupForStatus(status) {
  if (status === "ongoing" || status === "completed") return status;
  return "other";
}

export default function ProjectInventories() {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ongoing");
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const data = await listInventoryProjects({ q: query, signal: controller.signal });
        if (!controller.signal.aborted) { setProjects(data.projects); setPagination(data.pagination); }
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, retry]);

  const groupedProjects = projects.filter((project) => projectGroupForStatus(project.status) === selectedGroup);

  return (
    <section aria-labelledby="projects-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>02 / PROJECT WORKSPACES</p><h2 id="projects-title">Every project. Its own space.</h2><p>Browse projects from the club directory and open their inventory workspace.</p></div></div>
      <div className={styles.toolbar}>
        <label className={styles.search}><Search size={18} /><span className={styles.srOnly}>Search projects</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" /></label>
      </div>
      {loading ? <CardSkeletonGrid count={3} variant="project" /> : error ? <div className={styles.empty} role="alert"><h3>Projects couldn&apos;t be loaded</h3><p>{error}</p><button className={styles.secondaryButton} onClick={() => setRetry((n) => n + 1)}>Try again</button></div> : projects.length === 0 ? <div className={styles.empty}><FolderKanban size={36} /><h3>{query ? "No matching projects" : "No projects available"}</h3><p>{query ? "Try a different project name." : "Projects will appear here when they are available in the club directory."}</p>{query && <button className={styles.secondaryButton} onClick={() => setQuery("")}>Clear search</button>}</div> : <>
        <div className={styles.projectTabs} role="tablist" aria-label="Project inventory status">
          {projectGroups.map((group) => {
            const count = projects.filter((project) => projectGroupForStatus(project.status) === group.key).length;
            return <button key={group.key} type="button" role="tab" aria-selected={selectedGroup === group.key} onClick={() => setSelectedGroup(group.key)}>
              {group.label}<span>{count}</span>
            </button>;
          })}
        </div>
        <p className={styles.resultCount}>{groupedProjects.length} {selectedGroup} projects{pagination?.hasMore || pagination?.total > projects.length ? " · Showing up to 100 matches. Refine your search to find another project." : ""}</p>
        {groupedProjects.length === 0 ? <div className={styles.empty}><FolderKanban size={36} /><h3>No {selectedGroup} projects</h3><p>{query ? "Try a different project name." : "Projects in this status will appear here when available."}</p>{query && <button className={styles.secondaryButton} onClick={() => setQuery("")}>Clear search</button>}</div> : <div className={styles.projectGrid}>{groupedProjects.map((project) => {
          const id = project._id || project.id;
          return <article key={id} className={styles.projectCard}>
            <div className={styles.projectCardTop}><span className={styles.projectIcon}><FolderKanban size={24} /></span><span className={styles.neutralBadge}>{(project.status || "Project").replace(/_/g, " ")}</span></div>
            <p className={styles.eyebrow}>{project.category || "ROBOTICS PROJECT"}</p><h3>{project.title || "Untitled project"}</h3>
            <p className={styles.projectDescription}>{project.description || "Open this project's workspace to view inventory availability."}</p>
            <div className={styles.projectStock}>
              <span>Project-owned stock</span>
            </div>
            {id && <Link className={styles.projectLink} href={`/Inventory/projects/${encodeURIComponent(id)}`}>Open workspace <ArrowUpRight size={18} /></Link>}
          </article>;
        })}</div>}
      </>}
    </section>
  );
}
