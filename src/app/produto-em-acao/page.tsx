"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CirclePlay,
  Layers3,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/logo";
import styles from "./product-demo.module.css";

const DURATION = 12_000;

const sceneCopy = [
  {
    label: "Brand Kit",
    title: "A marca entra no contexto",
    description: "Público, tom de voz, posicionamento e mensagem ficam disponíveis para toda a operação.",
  },
  {
    label: "Agente",
    title: "O copiloto já conhece a marca",
    description: "O agente cruza o contexto com o objetivo e prepara uma direção estratégica sem começar do zero.",
  },
  {
    label: "Ads Studio",
    title: "A campanha nasce pronta para testar",
    description: "Copy, criativo e scoring são gerados em conjunto, sempre alinhados com o Brand Kit.",
  },
  {
    label: "Execução",
    title: "A equipa aprova e continua",
    description: "A decisão fica guardada no workspace e passa a melhorar o próximo fluxo da mesma marca.",
  },
];

export default function ProductActionPage() {
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    setProgress(0);

    const timer = window.setInterval(() => {
      const next = Math.min((Date.now() - startedAt) / DURATION, 1);
      setProgress(next);
      if (next >= 1) window.clearInterval(timer);
    }, 70);

    return () => window.clearInterval(timer);
  }, [run]);

  const scene = Math.min(Math.floor(progress * 4), 3);
  const percent = Math.round(progress * 100);

  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.back} href="/">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <Logo />
          <Link className={styles.login} href="/login">Entrar</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <span className={styles.kicker}><CirclePlay size={14} /> Demonstração · 12 segundos</span>
        <h1>Vê o MarkAI <span>em ação.</span></h1>
        <p>Uma demonstração rápida do fluxo que liga Brand Kit, agente, criação e execução no mesmo workspace.</p>
      </section>

      <section className={styles.playerWrap}>
        <div className={styles.player} key={run}>
          <div className={styles.chrome}>
            <span className={styles.dots}><i /><i /><i /></span>
            <span className={styles.address}><ShieldCheck size={13} /> app.markai.pt</span>
            <span className={styles.live}><i /> PRODUCT DEMO</span>
          </div>

          <div className={styles.app}>
            <aside className={styles.sidebar}>
              <span className={styles.appLogo}><Sparkles size={18} /></span>
              <button className={scene === 0 ? styles.activeNav : ""}><Layers3 size={17} /></button>
              <button className={scene === 1 ? styles.activeNav : ""}><Bot size={17} /></button>
              <button className={scene === 2 ? styles.activeNav : ""}><Megaphone size={17} /></button>
              <button className={scene === 3 ? styles.activeNav : ""}><Workflow size={17} /></button>
            </aside>

            <section className={styles.workspace}>
              <header className={styles.workspaceTop}>
                <div>
                  <small>Workspace</small>
                  <strong>Lumen Studio</strong>
                </div>
                <span><span className={styles.avatar}>RD</span> Agência principal</span>
              </header>

              <div className={styles.workspaceBody}>
                <section className={styles.mainPanel}>
                  <div className={styles.panelHeading}>
                    <span>{scene === 0 ? "Brand intelligence" : scene === 1 ? "Marketing copilot" : scene === 2 ? "Creative performance" : "Workspace memory"}</span>
                    <h2>{scene === 0 ? "Brand Kit" : scene === 1 ? "Agente estratégico" : scene === 2 ? "Ads Studio" : "Campanha aprovada"}</h2>
                  </div>

                  <div className={`${styles.brandCard} ${scene === 0 ? styles.sceneFocus : ""}`}>
                    <div className={styles.brandIdentity}>
                      <i>LU</i>
                      <span><strong>Lumen</strong><small>Design premium · Portugal</small></span>
                      <span className={styles.connected}><Check size={12} /> Contexto ligado</span>
                    </div>
                    <div className={styles.fieldGrid}>
                      <article><small>Público-alvo</small><strong>Equipas premium e founders</strong></article>
                      <article><small>Tom de voz</small><strong>Claro · confiante · minimalista</strong></article>
                      <article><small>Posicionamento</small><strong>Mais estratégia, menos ruído</strong></article>
                      <article><small>Mensagem-chave</small><strong>Transforma contexto em execução</strong></article>
                    </div>
                  </div>

                  <div className={`${styles.agentCard} ${scene === 1 ? styles.sceneFocus : ""}`}>
                    <div className={styles.agentHead}><span><Bot size={16} /> MarkAI Agent</span><small>Contexto: Lumen</small></div>
                    <div className={styles.userBubble}>Cria uma campanha para aquisição de leads B2B sem perder o posicionamento premium.</div>
                    <div className={styles.agentBubble}>
                      <Sparkles size={15} />
                      <span>Vou usar o posicionamento da Lumen e construir 3 ângulos: autoridade, transformação e eficiência.</span>
                    </div>
                    <div className={styles.typing}><i /><i /><i /></div>
                  </div>

                  <div className={`${styles.adCard} ${scene === 2 ? styles.sceneFocus : ""}`}>
                    <div className={styles.adTop}><span><WandSparkles size={15} /> Variação recomendada</span><strong>92/100</strong></div>
                    <div className={styles.adCreative}>
                      <small>LUMEN · PERFORMANCE SYSTEM</small>
                      <h3>Menos ferramentas.<br />Mais trabalho que move receita.</h3>
                      <span>Campanha alinhada com o contexto da marca.</span>
                    </div>
                    <div className={styles.scoreRow}>
                      <span><Target size={13} /> Marca <b>97%</b></span>
                      <span><ShieldCheck size={13} /> Risco <b>Baixo</b></span>
                      <span><Sparkles size={13} /> Copy <b>3 versões</b></span>
                    </div>
                  </div>

                  <div className={`${styles.approval} ${scene === 3 ? styles.sceneFocus : ""}`}>
                    <span className={styles.approvalIcon}><Check size={19} /></span>
                    <div><strong>Campanha guardada no workspace</strong><small>A aprendizagem fica disponível para o próximo fluxo.</small></div>
                    <button>Ver campanha <ArrowRight size={13} /></button>
                  </div>
                </section>

                <aside className={styles.activity}>
                  <span className={styles.activityLabel}>Fluxo da demonstração</span>
                  {sceneCopy.map((item, index) => (
                    <article className={index === scene ? styles.currentStep : index < scene ? styles.doneStep : ""} key={item.label}>
                      <span>{index < scene ? <Check size={13} /> : `0${index + 1}`}</span>
                      <div><strong>{item.label}</strong><small>{item.title}</small></div>
                    </article>
                  ))}
                  <div className={styles.creditCard}>
                    <small>Créditos usados nesta demo</small>
                    <strong>0</strong>
                    <span>Demonstração sem consumo real</span>
                  </div>
                </aside>
              </div>
            </section>
          </div>

          <div className={styles.caption}>
            <span className={styles.captionIndex}>0{scene + 1}</span>
            <div><strong>{sceneCopy[scene].title}</strong><small>{sceneCopy[scene].description}</small></div>
            <span className={styles.time}>{Math.min(12, Math.ceil(progress * 12))}s / 12s</span>
          </div>
          <div className={styles.progress}><i style={{ width: `${percent}%` }} /></div>
        </div>

        <div className={styles.controls}>
          <button onClick={() => setRun((value) => value + 1)}><RefreshCw size={15} /> Repetir demonstração</button>
          <Link href="/register">Experimentar o MarkAI <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className={styles.bottom}>
        <span><Check size={14} /> Sem cartão</span>
        <span><Check size={14} /> 60 créditos incluídos</span>
        <span><Check size={14} /> Workspace em minutos</span>
      </section>
    </main>
  );
}
