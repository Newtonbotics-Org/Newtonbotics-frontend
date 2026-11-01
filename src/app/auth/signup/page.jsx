import { redirect } from "next/navigation";

// Sign up lives on the combined /auth page.
export default function SignUpPage() {
  redirect("/auth?tab=signup");
}
