import { LayoutTemplate, Plus, Workflow } from "lucide-react";

export const metadata = { title: "Funis" };

export default function FunnelsPage() {
  return (
    <>
      <div className="page-heading"><div><h1>Construtor de Funis</h1><p>O módulo seguinte do MarkAI: páginas, upsells e sequências de email.</p></div><button className="button button-primary" disabled><Plus size={16}/> Novo funil</button></div>
      <section className="feature-grid">
        <article className="feature-card"><div className="feature-icon"><LayoutTemplate size={20}/></div><h3>Templates por negócio</h3><p>Estruturas para serviços, e-commerce, imobiliário, clínicas e captação de leads.</p></article>
        <article className="feature-card"><div className="feature-icon"><Workflow size={20}/></div><h3>Etapas visuais</h3><p>Landing page, formulário, checkout, upsell, página de obrigado e emails.</p></article>
        <article className="feature-card"><div className="feature-icon"><Plus size={20}/></div><h3>Próximo módulo</h3><p>A base de dados já inclui funnels e funnel_steps. A interface será construída na próxima fase.</p></article>
      </section>
    </>
  );
}
