import { CalendarDays, FileSearch, Plus, Sparkles } from "lucide-react";

export const metadata = { title: "Conteúdo" };

export default function ContentPage() {
  return (
    <>
      <div className="page-heading"><div><h1>Conteúdo e calendário</h1><p>Planeamento editorial, briefs SEO e agendamento social.</p></div><button className="button button-primary" disabled><Plus size={16}/> Criar conteúdo</button></div>
      <section className="feature-grid">
        <article className="feature-card"><div className="feature-icon"><CalendarDays size={20}/></div><h3>Calendário editorial</h3><p>Organiza posts, reels, stories, artigos e emails por marca e estado de aprovação.</p></article>
        <article className="feature-card"><div className="feature-icon"><FileSearch size={20}/></div><h3>SEO</h3><p>Gera palavras-chave, clusters, intenções de pesquisa e briefs completos para artigos.</p></article>
        <article className="feature-card"><div className="feature-icon"><Sparkles size={20}/></div><h3>Próximo módulo</h3><p>A tabela content_items já está preparada no Neon para suportar este fluxo.</p></article>
      </section>
    </>
  );
}
