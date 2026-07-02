import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { NewPurchaseForm } from "./NewPurchaseForm";

export default async function UjVasarlasPage() {
  await requireUser();

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Új vásárlás" back="/vasarlas" />
      <div className="mt-6">
        <NewPurchaseForm />
      </div>
    </main>
  );
}
