import { redirect } from "next/navigation";

// Sign in lives on the combined /auth page.
export default function SignInPage() {
  redirect("/auth?tab=signin");
}
