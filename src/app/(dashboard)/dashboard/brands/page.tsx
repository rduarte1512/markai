import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getBrands } from "@/lib/data";
import { getInitials } from "@/lib/format";

export const metadata = { title: "Marcas" };

export default async function BrandsPage() {
  const context = await requireAppContext();
  const brands = await getBrands(context.workspace_id);

  return (
    <>
      <div className="page-heading">
        <div><h1>Marcas e clientes</h1><p>Um Brand Kit central para cada cliente da agência.</p></div>
        <Link className="button button-primary" href="/dashboard/brands/new"><Plus size={16}/> Adicionar marca</Link>
      </div>

      {brands.length ? (
        <section className="brand-grid">
          {brands.map((brand) => (
            <Link className="brand-card" href={`/dashboard/brands/${brand.id}`} key={brand.id}>
              <div className="brand-card-top">
                <div className="brand-avatar" style={{background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})`}}>{getInitials(brand.name)}</div>
                <span className={`badge ${brand.onboarding_completed ? "badge-green" : "badge-yellow"}`}>{brand.onboarding_completed ? "Brand Kit pronto" : "Em configuração"}</span>
              </div>
              <h3>{brand.name}</h3>
              <p>{brand.description || brand.industry || "Marca sem descrição."}</p>
              <div className="brand-card-footer"><span>{brand.industry || "Sem setor"}</span><span>Abrir <ArrowRight size={12} style={{verticalAlign: "middle"}}/></span></div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="card empty-state">
          <div className="empty-icon"><BriefcaseBusiness size={23}/></div>
          <h3>Adiciona a primeira marca</h3>
          <p>O contexto da marca é usado no Ads Studio e no Agente de Marketing.</p>
          <Link className="button button-primary" href="/dashboard/brands/new"><Plus size={16}/> Criar Brand Kit</Link>
        </div>
      )}
    </>
  );
}
