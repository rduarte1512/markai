"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  GitBranch,
  Home,
  Loader2,
  LogOut,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { getInitials } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/constants";
import type { PlanKey } from "@/lib/types";
import { WorkspaceQuickCreate } from "@/components/workspace-quick-create";

type WorkspaceOption = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type SearchResult = {
  id: string;
  kind: "brand" | "campaign" | "funnel" | "content" | "page";
  title: string;
  subtitle: string;
  href: string;
};

const pageResults: SearchResult[] = [
  { id: "page-dashboard", kind: "page", title: "Dashboard", subtitle: "Visão geral da operação", href: "/dashboard" },
  { id: "page-ads", kind: "page", title: "Ads Studio", subtitle: "Criar anúncios e variações com IA", href: "/dashboard/ads" },
  { id: "page-agent", kind: "page", title: "Agente de Marketing", subtitle: "Estratégia, análise e execução", href: "/dashboard/copilot" },
  { id: "page-funnels", kind: "page", title: "Funis", subtitle: "Construir e gerir funis", href: "/dashboard/funnels" },
  { id: "page-content", kind: "page", title: "Conteúdo", subtitle: "Calendário e pipeline editorial", href: "/dashboard/content" },
  { id: "page-brands", kind: "page", title: "Marcas", subtitle: "Brand Kits e clientes", href: "/dashboard/brands" },
  { id: "page-credits", kind: "page", title: "Créditos", subtitle: "Consumo, modelos e saldo", href: "/dashboard/credits" },
  { id: "page-plans", kind: "page", title: "Planos", subtitle: "Comparar e gerir o plano", href: "/dashboard/plans" },
  { id: "page-settings", kind: "page", title: "Definições", subtitle: "Workspace, equipa e faturação", href: "/dashboard/settings" },
];

function resultIcon(kind: SearchResult["kind"]) {
  if (kind === "brand") return BriefcaseBusiness;
  if (kind === "campaign") return Megaphone;
  if (kind === "funnel") return GitBranch;
  if (kind === "content") return CalendarDays;
  return Search;
}

export function Topbar({
  workspaceName,
  workspaceId,
  userName,
  userEmail,
  planKey,
  workspaces,
}: {
  workspaceName: string;
  workspaceId: string;
  userName: string;
  userEmail: string;
  planKey: PlanKey;
  workspaces: WorkspaceOption[];
}) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setWorkspaceOpen(false);
        setAccountOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWorkspaceOpen(false);
        setAccountOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
        searchRef.current?.blur();
      }
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 2) {
      setRemoteResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("SEARCH_FAILED");
        const payload = (await response.json()) as { results?: SearchResult[] };
        setRemoteResults(payload.results || []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setRemoteResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const localResults = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("pt-PT");
    if (!clean) return pageResults.slice(0, 6);
    return pageResults.filter((item) => `${item.title} ${item.subtitle}`.toLocaleLowerCase("pt-PT").includes(clean));
  }, [query]);

  const results = useMemo(() => [...localResults, ...remoteResults].slice(0, 12), [localResults, remoteResults]);

  async function switchWorkspace(nextWorkspaceId: string) {
    if (nextWorkspaceId === workspaceId) {
      setWorkspaceOpen(false);
      return;
    }

    setSwitchingWorkspace(nextWorkspaceId);
    try {
      const response = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId: nextWorkspaceId }),
      });
      if (!response.ok) throw new Error("WORKSPACE_SWITCH_FAILED");
      window.location.assign("/dashboard");
    } catch {
      setSwitchingWorkspace(null);
      window.alert("Não foi possível mudar de workspace. Tenta novamente.");
    }
  }

  function closeMenus() {
    setWorkspaceOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
  }

  return (
    <header className="dashboard-topbar premium-topbar-v2" ref={rootRef}>
      <div className="premium-topbar-left">
        <div className="topbar-popover-wrap workspace-popover-wrap">
          <button
            className={`workspace-switch premium-workspace-switch ${workspaceOpen ? "open" : ""}`}
            type="button"
            onClick={() => {
              setWorkspaceOpen((value) => !value);
              setAccountOpen(false);
              setNotificationsOpen(false);
            }}
            aria-expanded={workspaceOpen}
          >
            <div className="workspace-switch-icon"><Building2 size={18}/></div>
            <div className="workspace-switch-copy">
              <small>Workspace</small>
              <strong>{workspaceName}</strong>
            </div>
            <ChevronDown size={15} className="workspace-chevron"/>
          </button>

          {workspaceOpen && (
            <div className="topbar-popover workspace-menu-v2">
              <div className="popover-heading">
                <div><span>Workspaces da agência</span><small>Troca de contexto em segurança</small></div>
              </div>
              <div className="workspace-options-v2">
                {workspaces.map((workspace) => {
                  const active = workspace.id === workspaceId;
                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      className={active ? "active" : ""}
                      disabled={Boolean(switchingWorkspace)}
                      onClick={() => switchWorkspace(workspace.id)}
                    >
                      <span className="workspace-option-avatar">{getInitials(workspace.name)}</span>
                      <span className="workspace-option-copy">
                        <strong>{workspace.name}</strong>
                        <small>{workspace.role} · /{workspace.slug}</small>
                      </span>
                      {switchingWorkspace === workspace.id ? <Loader2 className="spin" size={16}/> : active ? <Check size={16}/> : null}
                    </button>
                  );
                })}
              </div>
              <WorkspaceQuickCreate planKey={planKey} workspaceCount={workspaces.length} />
              <Link href="/dashboard/settings" className="workspace-manage-link" onClick={closeMenus}>
                <Settings size={15}/> Gerir workspace
              </Link>
            </div>
          )}
        </div>

        <div className={`global-search-v2 ${searchOpen ? "active" : ""}`}>
          <Search size={17}/>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder="Pesquisar marcas, funis, conteúdo..."
            aria-label="Pesquisar em toda a aplicação"
          />
          {searching ? <Loader2 className="spin" size={15}/> : <kbd>/</kbd>}

          {searchOpen && (
            <div className="global-search-results">
              <div className="search-results-head">
                <div>
                  <strong>{query.trim() ? "Resultados" : "Acesso rápido"}</strong>
                  <small>{query.trim() ? "Pesquisa no workspace atual" : "Começa a escrever para pesquisar tudo"}</small>
                </div>
                <span><Sparkles size={13}/> Pesquisa global</span>
              </div>

              {results.length ? (
                <div className="search-results-list">
                  {results.map((result) => {
                    const Icon = resultIcon(result.kind);
                    return (
                      <Link href={result.href} key={`${result.kind}-${result.id}`} onClick={closeMenus}>
                        <span className={`search-result-icon kind-${result.kind}`}><Icon size={16}/></span>
                        <span className="search-result-copy"><strong>{result.title}</strong><small>{result.subtitle}</small></span>
                        <span className="search-result-kind">{result.kind === "page" ? "Página" : result.kind}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="search-empty-v2">
                  <Search size={20}/>
                  <strong>Nada encontrado</strong>
                  <small>Tenta outro nome, canal, marca ou funcionalidade.</small>
                </div>
              )}

              <div className="search-results-foot"><span><kbd>ESC</kbd> fechar</span><span>Procura páginas e dados do workspace</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-actions premium-topbar-actions">
        <div className="topbar-popover-wrap">
          <button
            className={`icon-button premium-notification-button ${notificationsOpen ? "active" : ""}`}
            aria-label="Notificações"
            type="button"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setAccountOpen(false);
              setWorkspaceOpen(false);
            }}
          >
            <Bell size={18}/><span className="notification-dot"/>
          </button>
          {notificationsOpen && (
            <div className="topbar-popover notifications-menu-v2">
              <div className="popover-heading"><div><span>Notificações</span><small>Centro de atividade do workspace</small></div></div>
              <div className="notification-empty"><span><Bell size={19}/></span><strong>Está tudo em dia</strong><small>As novas aprovações, limites e atividades importantes vão aparecer aqui.</small></div>
            </div>
          )}
        </div>

        <div className="topbar-popover-wrap">
          <button
            className={`account-trigger-v2 ${accountOpen ? "open" : ""}`}
            type="button"
            onClick={() => {
              setAccountOpen((value) => !value);
              setWorkspaceOpen(false);
              setNotificationsOpen(false);
            }}
            aria-expanded={accountOpen}
          >
            <span className="avatar">{getInitials(userName)}</span>
            <span className="account-trigger-copy"><strong>{userName.split(" ")[0]}</strong><small>{PLAN_LABELS[planKey]}</small></span>
            <ChevronDown size={14}/>
          </button>

          {accountOpen && (
            <div className="topbar-popover account-menu-v2">
              <div className="account-menu-profile">
                <span className="account-menu-avatar">{getInitials(userName)}</span>
                <div><strong>{userName}</strong><small>{userEmail}</small></div>
              </div>
              <div className="account-plan-strip"><span><Sparkles size={15}/></span><div><small>Plano atual</small><strong>{PLAN_LABELS[planKey]}</strong></div><Link href="/dashboard/plans" onClick={closeMenus}>Gerir</Link></div>
              <nav>
                <Link href="/dashboard/settings" onClick={closeMenus}><User size={16}/><span><strong>Conta e definições</strong><small>Perfil, workspace e preferências</small></span></Link>
                <Link href="/dashboard/credits" onClick={closeMenus}><Coins size={16}/><span><strong>Créditos e utilização</strong><small>Saldo, modelos e histórico</small></span></Link>
                <Link href="/dashboard/plans" onClick={closeMenus}><CreditCard size={16}/><span><strong>Plano e faturação</strong><small>Upgrade, renovação e limites</small></span></Link>
              </nav>
              <form action="/api/auth/logout" method="post" className="logout-form-v2">
                <button type="submit"><span><LogOut size={17}/></span><div><strong>Terminar sessão</strong><small>Sair em segurança da MarkAI</small></div></button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
