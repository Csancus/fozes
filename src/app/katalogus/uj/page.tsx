import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogForm } from "../CatalogForm";

export default async function UjKatalogusPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader title="Új termék" back="/katalogus" />
      <div className="mt-5">
        <CatalogForm />
      </div>
    </main>
  );
}
