export const metadata = {
  title: "Inventory - Lab Equipment",
  description:
    "Browse NewtonBotics lab inventory and equipment available for robotics projects, workshops, and research at Rishihood University.",
  keywords: [
    "robotics inventory",
    "lab equipment",
    "NewtonBotics equipment",
    "Rishihood robotics tools",
  ],
  alternates: {
    canonical: "/Inventory",
  },
  openGraph: {
    title: "Inventory - NewtonBotics Robotics Lab",
    description:
      "Explore lab equipment and inventory used by NewtonBotics for robotics and AI projects.",
    type: "website",
  },
};

export default function InventoryLayout({ children }) {
  return children;
}
