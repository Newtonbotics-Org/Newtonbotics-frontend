import ComponentRequests from "@/components/inventory/ComponentRequests";

export const metadata = {
  title: "Component Requests | NewtonBotics",
  robots: { index: false, follow: false },
};

export default function ComponentRequestsPage() {
  return <ComponentRequests />;
}