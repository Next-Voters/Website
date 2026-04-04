import { redirect } from "next/navigation";

export default function CivicLinePage() {
  // Legacy entrypoint; canonical flow is `/alerts` (also available at `/next-voters-line`).
  redirect("/alerts");
}