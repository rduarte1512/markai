"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bot, BriefcaseBusiness, CalendarDays, Coins, Command, LayoutDashboard,
  Megaphone, Search, Settings, Sparkles, Workflow, X,
} from "lucide-react";

const commands = [
  { href: "/dashboard", label: "Abrir visão geral", description: "Resumo do workspace e atividade", icon: LayoutDashboard, keywords: "dashboard visão geral resumo" },
  { href: "/dashboard/ads", label: "Criar anúncios", description: "Abrir o Ads Studio premium", icon: Megaphone, keywords: "ads anúncios copy campanha" },
  { href: "/dashboard/copilot", label: "Perguntar ao agente", description: "Estratégia com contexto da marca", icon: Bot, keywords: "agente chat estratégia ia" },
  { href: "/dashboard/funnels", label: "Construir um funil", description: "Landing, checkout, upsell e emails", icon: Workflow, keywords: "funil landing checkout upsell" },
  { href: "/dashboard/content", label: "Planear conteúdo", description: "Calendário e pipeline editorial", icon: CalendarDays, keywords: "conteúdo calendário social seo" },
  { href: "/dashboard/brands", label: "Gerir marcas", description: "Brand Kits, público e tom de voz", icon: BriefcaseBusiness, keywords: "marca brand kit cliente" },
  { href: "/dashboard/credits", label: "Ver créditos", description: "Consumo, modelos e movimentos", icon: Coins, keywords: "créditos consumo modelos" },
  { href: "/dashboard/settings", label: "Abrir definições", description: "Workspace, faturação e preferências", icon: Settings, keywords: "definições conta faturação" },
];

export function CommandCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <>
      <button className="command-trigger" type="button" onClick={() => setOpen(true)} aria-label="Abrir centro de comandos">
        <Sparkles size={17}/><span>Comandos</span><kbd>Ctrl K</kbd>
      </button>
      {open && (
        <div className="command-backdrop" role="dialog" aria-modal="true" aria-label="Centro de comandos" onMouseDown={() => setOpen(false)}>
          <section className="command-panel" onMouseDown={(event) => event.stopPropagation()}>
            <header className="command-header">
              <div className="command-search"><Search size={18}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar ações, páginas ou ferramentas..."/></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X size={17}/></button>
            </header>
            <div className="command-meta"><span><Command size={13}/> Centro operacional MarkAI</span><small>{filtered.length} ações disponíveis</small></div>
            <div className="command-list">
              {filtered.map(({ href, label, description, icon: Icon }) => (
                <Link href={href} key={href} onClick={() => setOpen(false)}>
                  <span className="command-icon"><Icon size={17}/></span>
                  <span><strong>{label}</strong><small>{description}</small></span>
                  <span className="command-arrow">↵</span>
                </Link>
              ))}
              {!filtered.length && <div className="command-empty">Nenhuma ação encontrada.</div>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
