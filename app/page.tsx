import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login by default
  // This will be handled server-side during rendering
  redirect("/login");
}
