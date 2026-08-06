"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleAlert,
  CreditCard, Database, Globe2, KeyRound, LockKeyhole, Mail, Moon,
  Palette, PlugZap, Save, Server, ShieldCheck, SlidersHorizontal,
  Sparkles, Sun, Users, Zap,
} from "lucide-react";
import { CancelPlanButton } from "@/components/cancel-plan-button";
import { PLAN_LABELS } from "@/lib/constants";
import { getPlan } from "@/lib/plans";
import type { PlanKey } from "@/lib/types";

type Tab = "workspace" | "team" | "integrations" | "billing" | "preferences";

export function SettingsConsole({
  workspaceName,
  workspaceSlug,
  email,
  userName,
  planKey,
  gatewayReady,
  renewalDate,
  cancelAtPeriodEnd,
}: {
  workspaceName: string;
  workspaceSlug: string;
  email: string;
  userName: string;
  planKey: PlanKey;
  gatewayReady: boolean;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  const [tab, setTab] = useState<Tab>("workspace");
  const [compactMode, setCompactMode] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [saved, setSaved] = useState(false);
  const plan = getPlan(planKey);

  useEffect(() => {
    setCompactMode(window.localStorage.getItem("markai-compact-mode") === "true");
    setWeeklyReport(window.localStorage.getItem("markai-weekly-report") !== "false");
    setProductUpdates(window.localStorage.getItem("markai-product-updates") !== "false");
  }, []);

  function savePreferences() {
    window.localStorage.setItem("markai-compact-mode", String(compactMode));
    window.localStorage.setItem("markai-weekly-report", String(weeklyReport));
    window.localStorage.setItem("markai-product-updates", String(productUpdates));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof BriefcaseBusiness }> = [
    { key: "workspace", label: "Workspace", icon: BriefcaseBusiness },
    { key: "team", label: "Equipa e acesso", icon: Users },
    { key: "integrations", label: "Integrações", icon: PlugZap },
    { key: "billing", label: "Plano e faturação", icon: CreditCard },
    { key: "preferences", label: "Preferências", icon: SlidersHorizontal },
  ];

  return (
    <div className="settings-console">
      <section className="studio-hero settings-hero">
        <div>
          <span className="studio-kicker"><SlidersHorizontal size={14}/> Workspace administration</span>
          <h1>Controlo profissional para toda a operação.</h1>
          <p>Gere identidade, equipa, integrações, segurança, notificações e faturação numa experiência organizada e previsível.</p>
        </div>
        <div className="settings-health-card"><span className="settings-health-icon"><ShieldCheck size={24}/></span><div><small>Estado do workspace</small><strong>Operacional</strong><p>Base de dados, aplicação e sessão estão ativas.</p></div><span className="online-pill">Saudável</span></div>
      </section>

      <div className="settings-console-grid">
        <aside className="settings-nav-v2">
          <div className="settings-account"><span>{userName.slice(0, 2).toUpperCase()}</span><div><strong>{userName}</strong><small>{email}</small></div></div>
          <nav>{tabs.map(({ key, label, icon: Icon }) => <button className={tab === key ? "active" : ""} onClick={() => setTab(key)} key={key}><Icon size={16}/><span>{label}</span><ChevronRight size={14}/></button>)}</nav>
          <div className="settings-plan-mini"><span><Sparkles size={15}/></span><div><small>Plano atual</small><strong>{PLAN_LABELS[planKey]}</strong></div><Link href="/dashboard/plans">Gerir</Link></div>
        </aside>

        <main className="settings-main-v2">
          {tab === "workspace" && <>
            <header className="settings-section-head"><div><span>Identidade da organização</span><h2>Workspace</h2><p>Informação apresentada à equipa e nos relatórios.</p></div><button className="button button-primary button-sm" onClick={() => setSaved(true)}><Save size={15}/> Guardar alterações</button></header>
            {saved && <div className="studio-success-banner"><CheckCircle2 size={15}/> Alterações guardadas.</div>}
            <section className="settings-surface">
              <div className="workspace-profile-row"><span className="workspace-logo-large"><Sparkles size={26}/></span><div><strong>Logótipo do workspace</strong><p>PNG, JPG ou SVG. Recomendado 512×512 px.</p><div><button className="button button-secondary button-sm">Carregar imagem</button><button className="button button-ghost button-sm">Remover</button></div></div></div>
              <div className="settings-form-grid"><label><span>Nome do workspace</span><input value={workspaceName} readOnly/></label><label><span>URL do workspace</span><div className="input-prefix"><em>markai.app/</em><input value={workspaceSlug} readOnly/></div></label><label className="wide"><span>Email de faturação</span><input value={email} readOnly/></label><label className="wide"><span>Descrição interna</span><textarea defaultValue="Workspace principal para estratégia, produção e gestão de marcas com inteligência artificial."/></label></div>
            </section>
            <section className="settings-surface danger-zone"><header><div><LockKeyhole size={17}/><span><strong>Zona de segurança</strong><small>Ações críticas do workspace</small></span></div></header><div><span><strong>Exportar dados</strong><small>Descarrega uma cópia dos dados, marcas e atividade.</small></span><button className="button button-secondary button-sm">Pedir exportação</button></div><div><span><strong>Terminar todas as sessões</strong><small>Obriga todos os membros a iniciar sessão novamente.</small></span><button className="button button-secondary button-sm">Terminar sessões</button></div></section>
          </>}

          {tab === "team" && <>
            <header className="settings-section-head"><div><span>Colaboração</span><h2>Equipa e permissões</h2><p>Controla quem pode ver, criar, aprovar e gerir o workspace.</p></div><button className="button button-primary button-sm"><Users size={15}/> Convidar membro</button></header>
            <section className="team-overview-grid"><article><span><Users size={18}/></span><div><small>Lugares utilizados</small><strong>1 de {planKey === "agency" ? 50 : planKey === "pro" ? 10 : planKey === "starter" ? 3 : 1}</strong></div></article><article><span><ShieldCheck size={18}/></span><div><small>Administradores</small><strong>1</strong></div></article><article><span><Mail size={18}/></span><div><small>Convites pendentes</small><strong>0</strong></div></article></section>
            <section className="settings-surface team-table"><header><strong>Membros</strong><button><SlidersHorizontal size={15}/> Funções</button></header><div className="team-member-row"><span className="member-avatar">{userName.slice(0, 2).toUpperCase()}</span><div><strong>{userName}</strong><small>{email}</small></div><span className="role-pill">Proprietário</span><span className="status-dot-text"><i/>Ativo</span><button><ChevronRight size={15}/></button></div></section>
            <section className="settings-surface permissions-preview"><header><div><ShieldCheck size={17}/><span><strong>Funções profissionais</strong><small>Permissões preparadas para equipas maiores.</small></span></div></header>{["Administrador", "Estratega", "Criador", "Aprovador", "Cliente"].map((role, index) => <div key={role}><span><strong>{role}</strong><small>{["Gestão total do workspace", "Estratégia, IA e relatórios", "Conteúdo, anúncios e assets", "Revisão e aprovação", "Portal e leitura"][index]}</small></span><button className="button button-ghost button-sm">Configurar</button></div>)}</section>
          </>}

          {tab === "integrations" && <>
            <header className="settings-section-head"><div><span>Ecossistema</span><h2>Integrações</h2><p>Liga os canais e serviços que mantêm a operação em movimento.</p></div><button className="button button-secondary button-sm"><PlugZap size={15}/> Ver marketplace</button></header>
            <section className="integration-status-banner"><span><CheckCircle2 size={18}/></span><div><strong>Infraestrutura principal operacional</strong><p>Os serviços essenciais estão ligados e a responder normalmente.</p></div><button>Ver diagnóstico</button></section>
            <div className="integration-grid-v2">
              <IntegrationCard icon={Database} name="Neon Postgres" description="Base de dados, créditos e faturação." connected/>
              <IntegrationCard icon={Server} name="Vercel" description="Deploy, runtime e distribuição global." connected/>
              <IntegrationCard icon={KeyRound} name="AI Gateway" description="Acesso unificado aos modelos de IA." connected={gatewayReady}/>
              <IntegrationCard icon={Instagram} name="Meta Business" description="Publicação e performance de campanhas." connected={false}/>
              <IntegrationCard icon={Globe2} name="Google Ads" description="Campanhas de pesquisa e conversão." connected={false}/>
              <IntegrationCard icon={Mail} name="Email provider" description="Automação, newsletters e sequências." connected={false}/>
            </div>
          </>}

          {tab === "billing" && <>
            <header className="settings-section-head"><div><span>Capacidade e cobrança</span><h2>Plano e faturação</h2><p>Consulta limites, renovação, utilização e método de pagamento.</p></div><Link className="button button-secondary button-sm" href="/dashboard/plans">Comparar planos</Link></header>
            <section className="billing-hero-card"><div className="billing-plan-icon"><Sparkles size={24}/></div><div><small>Plano atual</small><h2>{PLAN_LABELS[planKey]}</h2><p>{plan.credits.toLocaleString("pt-PT")} créditos por mês · {plan.brands} · {plan.seats}</p></div><div className="billing-plan-state"><span className={`subscription-status ${cancelAtPeriodEnd ? "warning" : "active"}`}>{cancelAtPeriodEnd ? "Cancelamento agendado" : "Ativo"}</span><small>{renewalDate ? `${cancelAtPeriodEnd ? "Termina" : "Renova"} a ${renewalDate}` : "Sem renovação"}</small></div></section>
            <div className="billing-detail-grid"><section className="settings-surface"><header><div><CreditCard size={17}/><span><strong>Método de pagamento</strong><small>Usado para renovações e créditos extra.</small></span></div><button>Editar</button></header><div className="payment-method"><span>VISA</span><div><strong>•••• •••• •••• 4242</strong><small>Expira 12/29</small></div><CheckCircle2 size={16}/></div></section><section className="settings-surface"><header><div><Zap size={17}/><span><strong>Utilização incluída</strong><small>Capacidade mensal do plano.</small></span></div><Link href="/dashboard/credits">Ver detalhes</Link></header><div className="billing-usage-row"><span><strong>{plan.credits.toLocaleString("pt-PT")}</strong><small>créditos mensais</small></span><span><strong>{plan.brands}</strong><small>capacidade de marcas</small></span></div></section></div>
            <section className="settings-surface invoices-table"><header><div><FileInvoiceIcon/><span><strong>Faturas</strong><small>Histórico de pagamentos e documentos.</small></span></div></header><div className="invoice-empty"><CreditCard size={22}/><strong>Ainda não existem faturas.</strong><p>As cobranças reais aparecerão aqui quando o Stripe estiver ligado.</p></div></section>
            {planKey === "free" ? <div className="free-upgrade-banner"><div><CreditCard size={20}/><span><strong>Leva o workspace para o próximo nível</strong><small>O Starter inclui 3.000 créditos, cinco marcas e relatórios.</small></span></div><Link className="button button-primary" href="/dashboard/checkout?plan=starter&cycle=annual">Fazer upgrade</Link></div> : <CancelPlanButton/>}
          </>}

          {tab === "preferences" && <>
            <header className="settings-section-head"><div><span>Experiência pessoal</span><h2>Preferências</h2><p>Personaliza a interface, notificações e comportamento do produto.</p></div><button className="button button-primary button-sm" onClick={savePreferences}>{saved ? <CheckCircle2 size={15}/> : <Save size={15}/>} {saved ? "Guardado" : "Guardar"}</button></header>
            <section className="settings-surface preference-section"><header><div><Palette size={17}/><span><strong>Aparência</strong><small>Escolhe como a aplicação é apresentada.</small></span></div></header><div className="theme-picker"><button className={darkMode ? "active" : ""} onClick={() => setDarkMode(true)}><span className="theme-preview dark"><Moon size={17}/></span><strong>Escuro</strong><small>Experiência premium atual</small></button><button className={!darkMode ? "active" : ""} onClick={() => setDarkMode(false)}><span className="theme-preview light"><Sun size={17}/></span><strong>Claro</strong><small>Preparado para futura ativação</small></button></div><PreferenceToggle icon={SlidersHorizontal} title="Modo compacto" description="Reduz espaços em tabelas, listas e cards." enabled={compactMode} onChange={setCompactMode}/></section>
            <section className="settings-surface preference-section"><header><div><Bell size={17}/><span><strong>Notificações</strong><small>Define o que deve chegar ao teu email.</small></span></div></header><PreferenceToggle icon={BarChartIcon} title="Relatório semanal" description="Resumo de consumo, campanhas e oportunidades." enabled={weeklyReport} onChange={setWeeklyReport}/><PreferenceToggle icon={Sparkles} title="Novidades do produto" description="Funcionalidades, modelos e melhorias relevantes." enabled={productUpdates} onChange={setProductUpdates}/></section>
          </>}
        </main>
      </div>
    </div>
  );
}

function IntegrationCard({ icon: Icon, name, description, connected }: { icon: typeof Database; name: string; description: string; connected: boolean }) {
  return <article className="integration-card-v2"><header><span><Icon size={20}/></span>{connected ? <em className="connected"><CheckCircle2 size={13}/> Ligado</em> : <em><CircleAlert size={13}/> Por ligar</em>}</header><h3>{name}</h3><p>{description}</p><button>{connected ? "Gerir ligação" : "Ligar integração"}<ChevronRight size={14}/></button></article>;
}

function PreferenceToggle({ icon: Icon, title, description, enabled, onChange }: { icon: typeof Sparkles; title: string; description: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return <div className="preference-row"><span><Icon size={16}/></span><div><strong>{title}</strong><small>{description}</small></div><button className={`toggle-switch ${enabled ? "active" : ""}`} onClick={() => onChange(!enabled)}><i/></button></div>;
}

function FileInvoiceIcon() {
  return <CreditCard size={17}/>;
}

function BarChartIcon() {
  return <Zap size={16}/>;
}

function Instagram({ size = 20 }: { size?: number }) {
  return <Globe2 size={size}/>;
}
