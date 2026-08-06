import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, Megaphone, Palette, Target } from "lucide-react";
import { requireAppContext } from "@/lib/auth";
import { getBrand } from "@/lib/data";
import { getInitials } from "@/lib/format";

export const metadata = { title: "Brand Kit" };

export default async function BrandDetailPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const context = await requireAppContext();
  const brand = await getBrand(context.workspace_id, brandId);
  if (!brand) {
    notFound();
    throw new Error("UNREACHABLE");
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <Link className="button button-ghost button-sm" href="/dashboard/brands"><ArrowLeft size={14}/> Marcas</Link>
          <div style={{display: "flex", gap: 14, alignItems: "center", marginTop: 14}}>
            <div className="brand-avatar" style={{background: `linear-gradient(135deg, ${brand.primary_color}, ${brand.secondary_color})`}}>{getInitials(brand.name)}</div>
            <div><h1>{brand.name}</h1><p>{brand.industry || "Setor por definir"}</p></div>
          </div>
        </div>
        <div className="page-actions">
          <Link className="button button-secondary" href={`/dashboard/copilot?brand=${brand.id}`}><Bot size={16}/> Falar com agente</Link>
          <Link className="button button-primary" href={`/dashboard/ads?brand=${brand.id}`}><Megaphone size={16}/> Criar anúncio</Link>
        </div>
      </div>

      <section className="stats-grid" style={{gridTemplateColumns: "repeat(3, 1fr)"}}>
        <article className="stat-card"><div className="stat-card-top"><span>Público-alvo</span><span className="stat-icon"><Target size={16}/></span></div><p className="muted" style={{lineHeight: 1.6, marginTop: 16}}>{brand.audience || "Ainda não definido."}</p></article>
        <article className="stat-card"><div className="stat-card-top"><span>Tom de voz</span><span className="stat-icon"><Bot size={16}/></span></div><p className="muted" style={{lineHeight: 1.6, marginTop: 16}}>{brand.tone_of_voice || "Ainda não definido."}</p></article>
        <article className="stat-card"><div className="stat-card-top"><span>Identidade visual</span><span className="stat-icon"><Palette size={16}/></span></div><div style={{display: "flex", gap: 10, marginTop: 20}}><span style={{height: 42, flex: 1, borderRadius: 10, background: brand.primary_color}}/><span style={{height: 42, flex: 1, borderRadius: 10, background: brand.secondary_color}}/></div></article>
      </section>

      <section className="card" style={{marginTop: 14}}>
        <div className="card-header"><div><h2>Contexto principal</h2><p>Descrição usada pelos modelos de IA</p></div></div>
        <div className="card-body"><p className="muted" style={{lineHeight: 1.8, whiteSpace: "pre-wrap"}}>{brand.description || "Sem descrição."}</p>{brand.website && <a className="button button-secondary button-sm" href={brand.website} target="_blank" rel="noreferrer" style={{marginTop: 14}}>Abrir website</a>}</div>
      </section>
    </>
  );
}
