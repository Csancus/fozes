import { redirect } from "next/navigation";

// Egységes gyors táblázat: a bevétel is a /gyors táblázatban megy, soronkénti Típussal.
export default function IncomeBatchRedirect() {
  redirect("/koltsegek/gyors");
}
