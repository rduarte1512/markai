import { AdsStudio } from "@/components/ads-studio";
import { requireAppContext } from "@/lib/auth";
import { getBrands, getModels } from "@/lib/data";

export const metadata = { title: "Ads Studio" };

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const context = await requireAppContext();
  const query = await searchParams;
  const [brands, models] = await Promise.all([getBrands(context.workspace_id), getModels(context.workspace_id)]);

  return (
    <>
      <div className="page-heading"><div><h1>Ads Studio</h1><p>Cria copy e variações A/B alinhadas com cada Brand Kit.</p></div></div>
      <AdsStudio brands={brands} models={models} initialBrandId={query.brand} />
    </>
  );
}
