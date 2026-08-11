import { redirect } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Coins,
  Layers3,
  LayoutDashboard,
  Megaphone,
  Plus,
  Settings2,
  Workflow,
  Bot,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginV2Form } from "@/components/login-v2-form";
import styles from "@/components/login-v2.module.css";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Brand Kits", icon: Layers3, active: true },
  { label: "Ads Studio", icon: Megaphone },
  { label: "Agente", icon: Bot },
  { label: "Funis", icon: Workflow },
  { label: "Content OS", icon: CalendarDays },
];

const kits = [
  { initials: "MD", name: "Maison Digital", tone: "Premium · Minimalista", status: "Em produção", color: "teal", channels: ["Meta", "Google", "TikTok"] },
  { initials: "LS", name: "Lumen Studio", tone: "Criativo · Editorial", status: "Ativo", color: "amber", channels: ["Instagram", "LinkedIn"] },
  { initials: "BD", name: "Braga Digital", tone: "Performance · Data", status: "Ativo", color: "emerald", channels: ["Google", "Meta"] },
  { initials: "AL", name: "Alta Living", tone: "Elegante · Premium", status: "Em revisão", color: "rose", channels: ["Pinterest", "Meta"] },
];

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <aside className={styles.sidebar}>
          <div className={styles.brand}><Logo /></div>
          <span className={styles.navLabel}>Workspace</span>
          {navItems.map(({ label, icon: Icon, active }) => (
            <span className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} key={label}>
              <Icon size={16} strokeWidth={1.8} /> {label}
            </span>
          ))}
          <span className={styles.navLabel}>Sistema</span>
          <span className={styles.navItem}><Coins size={16} strokeWidth={1.8} /> Créditos</span>
          <span className={styles.navItem}><Settings2 size={16} strokeWidth={1.8} /> Definições</span>
          <div className={styles.planCard}>
            <strong>Plano Free</strong>
            <small>60 créditos por mês</small>
            <span>Ver planos <ChevronRight size={12} /></span>
          </div>
        </aside>

        <section className={styles.shellMain}>
          <header className={styles.topbar}>
            <span className={styles.crumb}>Lumen Studio <ChevronRight size={12} /> <strong>Visão geral</strong></span>
            <div className={styles.topActions}>
              <span className={styles.iconButton}><Bell size={16} /></span>
              <span className={styles.avatar}>M</span>
            </div>
          </header>

          <div className={styles.shellContent}>
            <span className={styles.eyebrow}>Workspace · Lumen Studio</span>
            <div className={styles.shellHead}>
              <h2>Brand Kits</h2>
              <span className={styles.shellNew}><Plus size={13} /> Novo brand</span>
            </div>
            <p className={styles.shellSub}>Tom, público, valores e decisões de cada marca, sempre ligados.</p>

            <div className={styles.kits}>
              {kits.map((kit, index) => (
                <article className={styles.kit} key={kit.name}>
                  <div className={styles.kitTop}>
                    <span className={`${styles.kitAvatar} ${styles[kit.color as keyof typeof styles]}`}>{kit.initials}</span>
                    <span className={`${styles.kitBadge} ${index === 0 ? styles.kitBadgeGreen : ""}`}>{kit.status}</span>
                  </div>
                  <h3>{kit.name}</h3>
                  <p>{kit.tone}</p>
                  <div className={styles.chips}>{kit.channels.map((channel) => <span key={channel}>{channel}</span>)}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={styles.overlay}>
        <section className={styles.card} aria-label="Iniciar sessão">
          <div className={styles.cardBrand}><Logo /></div>
          <h1>Bem-vindo de <em>volta</em></h1>
          <p className={styles.cardSub}>Entra para continuar a trabalhar nas tuas marcas e campanhas.</p>
          <LoginV2Form />
          <p className={styles.legal}>Ao entrar, confirmas que aceitas os termos e a política de privacidade.</p>
        </section>
      </div>
    </main>
  );
}
