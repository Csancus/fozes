import { redirect } from "next/navigation";

// Egységes felvitel: a bevétel is az /uj űrlapon megy, a Kiadás/Bevétel kapcsolóval.
export default function BevetelRedirect() {
  redirect("/koltsegek/uj?tipus=bevetel");
}
