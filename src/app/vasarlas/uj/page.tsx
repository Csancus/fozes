import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewPurchaseForm } from "./NewPurchaseForm";

export default async function UjVasarlasPage() {
  await requireUser();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új vásárlás" back="/vasarlas" />
      <div className="mt-5 animate-fade-up">
        <NewPurchaseForm />
      </div>
    </main>
  );
}
