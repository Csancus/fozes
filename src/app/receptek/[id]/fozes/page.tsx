import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { notFound } from "next/navigation";
import { CookingView } from "./CookingView";

export default async function FozesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const recipe = await getRecipe(me.householdId, id);
  if (!recipe) notFound();

  return <CookingView recipe={recipe} />;
}
