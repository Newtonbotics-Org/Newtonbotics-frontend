import { Suspense } from "react";
import InventoryWorkspace from "@/components/inventory/InventoryWorkspace";
import { CardSkeletonGrid } from "@/components/PageSkeletons";

export default function InventoryPage() {
  return <Suspense fallback={<div className="p-8"><CardSkeletonGrid count={6} variant="inventory" /></div>}><InventoryWorkspace /></Suspense>;
}
