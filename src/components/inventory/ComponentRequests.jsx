"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, PackagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import inventoryService from "@/lib/inventory";
import { listInventoryProjects } from "@/lib/inventoryProjects";
import { getProjectsLedByUser } from "@/lib/projectMembership";
import { CardSkeletonGrid } from "@/components/PageSkeletons";
import styles from "./inventory.module.css";

function displayName(project) {
  return project.title || project.name || "Untitled project";
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function normalizedStatus(status) {
  return ["approved", "rejected"].includes(status) ? status : "pending";
}

export default function ComponentRequests() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userId = user?.id || user?._id || "";
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [equipmentError, setEquipmentError] = useState("");
  const [requests, setRequests] = useState([]);
  const [componentChoice, setComponentChoice] = useState("");
  const [customComponent, setCustomComponent] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const eligibleProjects = useMemo(
    () => getProjectsLedByUser(projects, userId ? { id: userId } : null),
    [projects, userId]
  );
  const selectedEquipment = equipment.find((item) => String(item._id || item.id) === componentChoice);
  const componentName = componentChoice === "other" ? customComponent.trim() : (selectedEquipment?.name || "");
  const canChooseProject = eligibleProjects.some((project) => String(project._id || project.id) === projectId);
  const submitDisabled = submitting || projectsLoading || eligibleProjects.length === 0 ||
    !isAuthenticated;

  useEffect(() => {
    let active = true;
    if (authLoading) return () => { active = false; };
    if (!isAuthenticated || !userId) {
      setProjects([]);
      setProjectsLoading(false);
      return () => { active = false; };
    }

    setProjectsLoading(true);
    setProjectsError("");
    setEquipmentError("");
    const controller = new AbortController();
    listInventoryProjects({ signal: controller.signal })
      .then((data) => { if (active) setProjects(data.projects || []); })
      .catch((err) => { if (active && err.name !== "AbortError") setProjectsError(err.message); })
      .finally(() => { if (active) setProjectsLoading(false); });
    inventoryService.listEquipment({ limit: 100, skip: 0 })
      .then((data) => { if (active) setEquipment(data.items || []); })
      .catch((err) => { if (active) setEquipmentError(err.message || "General Lab components could not be loaded."); });
    inventoryService.listMyComponentRequests({ limit: 100, skip: 0 })
      .then((data) => { if (active) setRequests(data.items || []); })
      .catch((err) => { if (active) setError(err.message || "Request history could not be loaded."); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, isAuthenticated, userId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!canChooseProject) {
      setError("Choose one of your eligible projects.");
      return;
    }
    if (!componentName) {
      setError("Select a General Lab component or enter a component name.");
      return;
    }
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (!purpose.trim()) {
      setError("Add a purpose or justification for this request.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await inventoryService.createComponentRequest({
        projectId,
        ...(selectedEquipment && componentChoice !== "other" ? { equipmentId: componentChoice } : { componentName }),
        quantity: requestedQuantity,
        purpose: purpose.trim(),
      });
      setRequests((previous) => [created, ...previous]);
      setNotice("Request submitted for team leader review.");
      setComponentChoice("");
      setCustomComponent("");
      setQuantity("1");
      setPurpose("");
      setProjectId("");
    } catch (submitError) {
      setError(submitError.message || "The component request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <main className={styles.scope}><div className={styles.container}><CardSkeletonGrid count={2} variant="inventory" /></div></main>;
  }

  return (
    <main className={styles.scope}>
      <div className={styles.container}>
        <nav className={styles.detailNav} aria-label="Inventory navigation">
          <Link href="/Inventory" className={styles.backLink}><ArrowLeft size={16} /> Back to inventory</Link>
        </nav>

        <header className={styles.requestPageHeader}>
          <p className={styles.eyebrow}><span className={styles.signal} /> NEWTONBOTICS / COMPONENT REQUESTS</p>
          <h1>Request components.</h1>
          <p>Tell us what your project needs. Requests are reviewed separately from inventory checkout and fulfillment.</p>
        </header>

        <div className={styles.requestNotice} role="status">
          <strong>Requests are reviewed by an administrator.</strong>
          <p>Only designated project team leaders can submit component requests.</p>
        </div>

        {!isAuthenticated ? (
          <section className={styles.requestNotice} aria-labelledby="request-signin-title">
            <h2 id="request-signin-title">Sign in to request components</h2>
            <p>Sign in with the account designated as a project team leader.</p>
            <Link href="/auth" className={styles.primaryButton}>Sign in</Link>
          </section>
        ) : (
          <div className={styles.requestGrid}>
            <section className={styles.requestPanel} aria-labelledby="request-form-title">
              <div className={styles.requestSectionHeading}>
                <span className={styles.requestIcon}><PackagePlus size={20} /></span>
                <div><h2 id="request-form-title">New request</h2><p>One item per request. Stock changes only through authorized fulfillment.</p></div>
              </div>

              {projectsLoading ? <CardSkeletonGrid count={2} variant="project" /> : projectsError ? (
                <div className={styles.inlineError} role="alert"><p>Project memberships could not be checked.</p><span>{projectsError}</span></div>
              ) : eligibleProjects.length === 0 ? (
                <div className={styles.requestEmpty} role="status">
                  <ClipboardList size={28} />
                  <h3>No led projects found</h3>
                  <p>Your account must be the designated team leader on a project before you can request components.</p>
                </div>
              ) : null}

              {!projectsLoading && !projectsError && eligibleProjects.length > 0 && (
                <form className={styles.requestForm} onSubmit={handleSubmit}>
                  <label className={styles.requestField} htmlFor="component-request-project">
                    <span>Project <b aria-hidden="true">*</b></span>
                    <select id="component-request-project" required value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                      <option value="">Select your project</option>
                      {eligibleProjects.map((project) => {
                        const id = String(project._id || project.id);
                        return <option key={id} value={id}>{displayName(project)}</option>;
                      })}
                    </select>
                    <small>Only projects where your account is the designated team leader are listed.</small>
                  </label>

                  <label className={styles.requestField} htmlFor="component-request-item">
                    <span>Component <b aria-hidden="true">*</b></span>
                    <select id="component-request-item" required value={componentChoice} onChange={(event) => setComponentChoice(event.target.value)}>
                      <option value="">Choose from General Lab</option>
                      {equipment.map((item) => <option key={item._id || item.id} value={String(item._id || item.id)}>{item.name}</option>)}
                      <option value="other">Other component</option>
                    </select>
                    {equipmentError && <small>{equipmentError} You can still enter a component name manually.</small>}
                  </label>

                  {componentChoice === "other" && (
                    <label className={styles.requestField} htmlFor="component-request-custom">
                      <span>Component name <b aria-hidden="true">*</b></span>
                      <input id="component-request-custom" required maxLength={120} value={customComponent} onChange={(event) => setCustomComponent(event.target.value)} placeholder="Enter the component name" />
                    </label>
                  )}

                  <label className={styles.requestField} htmlFor="component-request-quantity">
                    <span>Quantity <b aria-hidden="true">*</b></span>
                    <input id="component-request-quantity" type="number" required min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                  </label>

                  <label className={styles.requestField} htmlFor="component-request-purpose">
                    <span>Purpose / justification <b aria-hidden="true">*</b></span>
                    <textarea id="component-request-purpose" required maxLength={1000} rows={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="How will these components support the project?" />
                  </label>

                  {error && <p className={styles.requestError} role="alert">{error}</p>}
                  {notice && <p className={styles.requestSuccess} role="status">{notice}</p>}
                  <button className={styles.primaryButton} type="submit" disabled={submitDisabled}>
                    <PackagePlus size={17} /> {submitting ? "Submitting…" : "Submit request"}
                  </button>
                </form>
              )}
            </section>

            <section className={styles.requestPanel} aria-labelledby="request-history-title">
              <div className={styles.requestSectionHeading}>
                <span className={styles.requestIcon}><ClipboardList size={20} /></span>
                <div><h2 id="request-history-title">My Component Requests</h2><p>Track each request through review.</p></div>
              </div>
              <>
                  {requests.length === 0 ? (
                    <div className={styles.requestEmpty}><ClipboardList size={26} /><h3>No requests yet</h3><p>Your submitted requests will appear here.</p></div>
                  ) : (
                    <div className={styles.requestList}>
                      {requests.map((request) => {
                        const status = normalizedStatus(request.status);
                        const requestProjectId = typeof request.projectId === "object" ? request.projectId?._id : request.projectId;
                        const project = eligibleProjects.find((item) => String(item._id || item.id) === String(requestProjectId));
                        return (
                          <article className={styles.requestCard} key={request._id}>
                            <div className={styles.requestCardTop}>
                              <span className={`${styles.requestStatus} ${styles[`requestStatus_${status}`]}`}>{status}</span>
                              <time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time>
                            </div>
                            <h3>{request.componentName} <span>× {request.quantity}</span></h3>
                            <p className={styles.requestProject}>{request.projectTitle || request.projectId?.title || (project && displayName(project))}</p>
                            <p className={styles.requestPurpose}>{request.purpose}</p>
                            {status === "approved" && <p className={styles.requestFulfillmentNote}>Approved quantity: {request.approvedQuantity ?? request.quantity}</p>}
                            {request.reviewNotes && <p className={styles.requestPurpose}>Review note: {request.reviewNotes}</p>}
                          </article>
                        );
                      })}
                    </div>
                  )}
              </>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}