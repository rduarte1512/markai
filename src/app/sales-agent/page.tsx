"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Headphones,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./sales-agent.module.css";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

const navigation: NavItem[] = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pipeline", icon: Target, badge: "18" },
  { label: "Contactos", icon: UsersRound },
  { label: "Chamadas", icon: PhoneCall, badge: "7" },
  { label: "WhatsApp", icon: MessageCircle, badge: "4" },
  { label: "Email", icon: Mail },
  { label: "Agenda", icon: CalendarDays },
  { label: "Relatórios", icon: BarChart3 },
];

const metrics = [
  { label: "Chamadas hoje", value: "42", delta: "+18%", icon: PhoneCall },
  { label: "Conversas ativas", value: "16", delta: "+5", icon: MessageCircle },
  { label: "Reuniões marcadas", value: "6", delta: "+2", icon: CalendarDays },
  { label: "Receita potencial", value: "€38.400", delta: "+24%", icon: TrendingUp },
];

const leads = [
  { company: "Ambulâncias Vale do Tejo", contact: "Miguel Santos", stage: "Demonstração", score: 92, value: "€8.400", next: "Hoje, 16:30" },
  { company: "TransMed Lisboa", contact: "Ana Ferreira", stage: "Proposta", score: 86, value: "€12.000", next: "Amanhã, 10:00" },
  { company: "Socorro Rápido", contact: "João Matos", stage: "Qualificado", score: 78, value: "€6.800", next: "Sex, 14:00" },
  { company: "AmbuNorte", contact: "Carla Rocha", stage: "Contacto", score: 64, value: "€4.200", next: "Seg, 09:30" },
];

const conversations = [
  { initials: "AV", name: "Ambulâncias Vale do Tejo", text: "Sim, podemos ver a demonstração hoje.", time: "14:32", channel: "WhatsApp", unread: true },
  { initials: "TM", name: "TransMed Lisboa", text: "Envie a proposta para análise da direção.", time: "13:18", channel: "Email", unread: true },
  { initials: "SR", name: "Socorro Rápido", text: "Tem integração com mapas e turnos?", time: "11:47", channel: "WhatsApp", unread: false },
];

const activity = [
  { icon: Phone, title: "Chamada concluída", detail: "TransMed Lisboa · 8m 42s", time: "Há 12 min" },
  { icon: Send, title: "Proposta enviada", detail: "Ambulâncias Vale do Tejo", time: "Há 34 min" },
  { icon: CalendarDays, title: "Reunião confirmada", detail: "Demonstração · Hoje, 16:30", time: "Há 1h" },
  { icon: Bot, title: "Lead qualificado pela IA", detail: "Socorro Rápido · Score 78", time: "Há 2h" },
];

export default function SalesAgentPage() {
  const [active, setActive] = useState("Visão geral");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [query, setQuery] = useState("");

  const filteredLeads = useMemo(
    () => leads.filter((lead) => `${lead.company} ${lead.contact} ${lead.stage}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <main className={styles.shell}>
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><Zap size={20} /></div>
          <div><strong>Sem Fumo</strong><span>Sales Agent AI</span></div>
          <button className={styles.mobileClose} onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={19} /></button>
        </div>

        <div className={styles.agentStatus}>
          <div className={styles.agentAvatar}><Bot size={21} /></div>
          <div><strong>Agente comercial</strong><span><i className={agentEnabled ? styles.onlineDot : styles.offlineDot} /> {agentEnabled ? "Ativo e a trabalhar" : "Em pausa"}</span></div>
          <button className={`${styles.toggle} ${agentEnabled ? styles.toggleOn : ""}`} onClick={() => setAgentEnabled((value) => !value)} aria-label="Ativar ou pausar agente"><span /></button>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Operação</span>
          {navigation.map(({ label, icon: Icon, badge }) => (
            <button key={label} onClick={() => { setActive(label); setMobileOpen(false); }} className={active === label ? styles.navActive : ""}>
              <Icon size={18} /><span>{label}</span>{badge && <em>{badge}</em>}
            </button>
          ))}
          <span className={styles.navLabel}>Sistema</span>
          <button onClick={() => setActive("Configurações")} className={active === "Configurações" ? styles.navActive : ""}><Settings size={18} /><span>Configurações</span></button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.profileAvatar}>RD</div>
          <div><strong>Rodrigo Duarte</strong><span>Administrador</span></div>
          <MoreHorizontal size={18} />
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <button className={styles.menuButton} onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
          <div className={styles.searchBox}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar empresas, contactos ou chamadas..." /><kbd>⌘ K</kbd></div>
          <div className={styles.topActions}>
            <button className={styles.iconButton}><Bell size={19} /><span /></button>
            <button className={styles.helpButton}><Headphones size={17} /> Suporte</button>
            <button className={styles.primaryButton}><Plus size={17} /> Novo contacto</button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.headingRow}>
            <div><span className={styles.eyebrow}><Sparkles size={14} /> Centro de comando comercial</span><h1>{active}</h1><p>Acompanha o trabalho do agente, intervém quando necessário e fecha mais serviços.</p></div>
            <div className={styles.headingActions}><button className={styles.secondaryButton}><FileText size={17} /> Exportar</button><button className={styles.primaryButton}><Phone size={17} /> Iniciar campanha</button></div>
          </div>

          <div className={styles.liveBanner}>
            <div className={styles.liveIcon}><Activity size={20} /></div>
            <div><strong>O agente está numa chamada com a TransMed Lisboa</strong><span>Identificou interesse elevado e está a apresentar o módulo de gestão de turnos.</span></div>
            <div className={styles.waveform}>{Array.from({ length: 18 }).map((_, index) => <i key={index} />)}</div>
            <span className={styles.callTimer}>06:24</span>
            <button>Ouvir chamada</button>
          </div>

          <div className={styles.metricGrid}>
            {metrics.map(({ label, value, delta, icon: Icon }) => <article key={label} className={styles.metricCard}><div className={styles.metricTop}><span><Icon size={19} /></span><em>{delta}</em></div><strong>{value}</strong><small>{label}</small><div className={styles.miniChart}>{[28, 45, 36, 58, 52, 78, 88].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article>)}
          </div>

          <div className={styles.mainGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><h2>Pipeline prioritário</h2><p>Oportunidades ordenadas pela probabilidade de fecho</p></div><button>Ver pipeline <ChevronDown size={15} /></button></div>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Empresa</th><th>Fase</th><th>Score IA</th><th>Valor</th><th>Próxima ação</th><th /></tr></thead>
                  <tbody>{filteredLeads.map((lead) => <tr key={lead.company}><td><div className={styles.companyCell}><span>{lead.company.slice(0, 2).toUpperCase()}</span><div><strong>{lead.company}</strong><small>{lead.contact}</small></div></div></td><td><span className={styles.stage}>{lead.stage}</span></td><td><div className={styles.score}><span><i style={{ width: `${lead.score}%` }} /></span><strong>{lead.score}</strong></div></td><td><strong>{lead.value}</strong></td><td><span className={styles.nextAction}><Clock3 size={14} /> {lead.next}</span></td><td><button className={styles.rowButton}><MoreHorizontal size={18} /></button></td></tr>)}</tbody>
                </table>
              </div>
            </section>

            <aside className={styles.panel}>
              <div className={styles.panelHeader}><div><h2>Conversas recentes</h2><p>WhatsApp e email centralizados</p></div><button className={styles.rowButton}><MoreHorizontal size={18} /></button></div>
              <div className={styles.conversationList}>{conversations.map((item) => <button key={item.name} className={styles.conversation}><span className={styles.conversationAvatar}>{item.initials}</span><div><strong>{item.name}</strong><p>{item.text}</p><small>{item.channel}</small></div><time>{item.time}</time>{item.unread && <i />}</button>)}</div>
              <button className={styles.fullButton}>Abrir caixa de entrada <MessageCircle size={16} /></button>
            </aside>
          </div>

          <div className={styles.bottomGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><h2>Desempenho semanal</h2><p>Chamadas realizadas e leads qualificados</p></div><button>Últimos 7 dias <ChevronDown size={15} /></button></div>
              <div className={styles.chartArea}>
                <div className={styles.chartLabels}><span>60</span><span>45</span><span>30</span><span>15</span><span>0</span></div>
                <div className={styles.chartBars}>{[38, 52, 44, 68, 82, 61, 91].map((height, index) => <div key={index}><span style={{ height: `${height}%` }}><i style={{ height: `${Math.max(20, height - 24)}%` }} /></span><small>{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index]}</small></div>)}</div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><h2>Atividade em tempo real</h2><p>Últimas ações executadas pelo agente</p></div></div>
              <div className={styles.activityList}>{activity.map(({ icon: Icon, title, detail, time }) => <article key={`${title}-${detail}`}><span><Icon size={16} /></span><div><strong>{title}</strong><p>{detail}</p></div><time>{time}</time></article>)}</div>
            </section>

            <section className={`${styles.panel} ${styles.aiPanel}`}>
              <div className={styles.aiGlow} />
              <span className={styles.aiBadge}><Bot size={17} /> Recomendação IA</span>
              <h2>Foca a equipa na TransMed Lisboa</h2>
              <p>A probabilidade de fecho subiu para 86%. A direção abriu a proposta duas vezes e respondeu hoje.</p>
              <div className={styles.aiStats}><span><strong>86%</strong>Probabilidade</span><span><strong>€12k</strong>Valor estimado</span></div>
              <button><Zap size={16} /> Preparar próxima ação</button>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
