import { MarketingCopilot } from "@/components/marketing-copilot";
import { requireAppContext } from "@/lib/auth";
import { getBrands, getModels } from "@/lib/data";

export const metadata = { title: "Agente de Marketing" };

export default async function CopilotPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const context = await requireAppContext();
  const query = await searchParams;
  const [brands, models] = await Promise.all([getBrands(context.workspace_id), getModels(context.workspace_id)]);

  return (
    <>
      <div className="page-heading"><div><h1>Agente de Marketing</h1><p>Um copiloto com contexto permanente da marca ativa.</p></div></div>
      <MarketingCopilot brands={brands} models={models} initialBrandId={query.brand} userName={context.user_name} />
    </>
  );
}
