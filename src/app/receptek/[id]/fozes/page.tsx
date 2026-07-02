import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { notFound } from "next/navigation";
import { CookingView } from "./CookingView";

export default async function FozesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adag?: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const recipe = await getRecipe(me.householdId, id);
  if (!recipe) notFound();

  const adagRaw = Number(sp.adag);
  const servingsOverride =
    Number.isFinite(adagRaw) && adagRaw > 0 ? Math.floor(adagRaw) : undefined;

  return <CookingView recipe={recipe} servingsOverride={servingsOverride} />;
}
