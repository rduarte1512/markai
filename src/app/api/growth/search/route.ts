import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { cleanText, enforceFeature, enforceLimit, generateGrowthAi, GrowthError, requireGrowthContext } from "@/lib/growth-server";

export const runtime = "nodejs";

function privateIp(ip: string) {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}

async function safeUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new GrowthError("URL inválido."); }
  if (!["http:", "https:"].includes(url.protocol)) throw new GrowthError("A auditoria aceita apenas URLs HTTP/HTTPS.");
  const host = url.hostname.toLowerCase();
  if (["localhost", "localhost.localdomain"].includes(host) || host.endsWith(".local")) throw new GrowthError("Host não permitido.");
  if (isIP(host) && privateIp(host)) throw new GrowthError("Endereço privado não permitido.");
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => privateIp(item.address))) throw new GrowthError("O domínio resolve para uma rede não permitida.");
  return url;
}

function first(html: string, regex: RegExp) {
  return (html.match(regex)?.[1] || "").replace(/\s+/g, " ").trim();
}

function count(html: string, regex: RegExp) {
  return [...html.matchAll(regex)].length;
}

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const rule = enforceFeature(plan, "searchIntelligence");
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = cleanText(body.brandId, 80);
    const rawUrl = cleanText(body.url, 1000);
    if (!brandId || !rawUrl) throw new GrowthError("Seleciona a marca e indica o URL.");

    const brandRows = (await sql`
      select id, name, industry, website, audience, tone_of_voice from brands
      where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active' limit 1
    `) as unknown as Array<{ id: string; name: string; industry?: string; website?: string; audience?: string; tone_of_voice?: string }>;
    const brand = brandRows[0];
    if (!brand) throw new GrowthError("Marca inválida.", 403);

    const countRows = (await sql`
      select count(*)::int as count from search_audits sa join brands b on b.id = sa.brand_id
      where b.workspace_id = ${session.workspaceId}::uuid and sa.created_at >= date_trunc('month', now())
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `Atingiste o limite do plano: ${rule.label}.`);

    const url = await safeUrl(rawUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18_000);
    let html = "";
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "MarkAI-SearchIntelligence/1.0 (+SEO-GEO-audit)" },
        redirect: "follow",
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new GrowthError(`A página devolveu HTTP ${response.status}.`, 422);
      const type = response.headers.get("content-type") || "";
      if (!type.includes("text/html")) throw new GrowthError("O URL não devolveu uma página HTML.", 422);
      html = (await response.text()).slice(0, 1_500_000);
    } finally {
      clearTimeout(timeout);
    }

    const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = first(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || first(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
    const canonical = first(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
    const lang = first(html, /<html[^>]+lang=["']([^"']+)["']/i);
    const h1 = count(html, /<h1\b[^>]*>/gi);
    const h2 = count(html, /<h2\b[^>]*>/gi);
    const jsonLd = count(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
    const images = count(html, /<img\b[^>]*>/gi);
    const imagesWithAlt = count(html, /<img\b[^>]+alt=["'][^"']+["'][^>]*>/gi);
    const ogTitle = Boolean(/<meta[^>]+property=["']og:title["']/i.test(html));
    const ogDescription = Boolean(/<meta[^>]+property=["']og:description["']/i.test(html));
    const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
    const rawText = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
    const words = rawText ? rawText.split(" ").length : 0;
    const questionHeadings = count(html, /<h[1-4][^>]*>[^<]*(como|o que|qual|quando|porquê|porque|how|what|why|when)[^<]*<\/h[1-4]>/gi);
    const directAnswerSignals = count(rawText, /\b(em resumo|resposta curta|passo a passo|significa|é uma|é um|refere-se a)\b/gi);
    const keywords = cleanText(body.keywords, 2000).split(/[,\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 20);

    let seo = 0;
    seo += title.length >= 25 && title.length <= 65 ? 18 : title ? 9 : 0;
    seo += description.length >= 80 && description.length <= 170 ? 16 : description ? 8 : 0;
    seo += h1 === 1 ? 14 : h1 > 0 ? 7 : 0;
    seo += h2 >= 2 ? 8 : h2 ? 4 : 0;
    seo += canonical ? 8 : 0;
    seo += lang ? 5 : 0;
    seo += jsonLd ? 10 : 0;
    seo += words >= 500 ? 9 : words >= 250 ? 5 : 0;
    seo += images === 0 || imagesWithAlt / Math.max(images, 1) >= .8 ? 6 : 2;
    seo += ogTitle && ogDescription ? 6 : ogTitle || ogDescription ? 3 : 0;
    if (robotsNoindex) seo -= 25;

    let geo = 18;
    geo += jsonLd ? 18 : 0;
    geo += questionHeadings >= 2 ? 14 : questionHeadings ? 8 : 0;
    geo += directAnswerSignals >= 2 ? 12 : directAnswerSignals ? 6 : 0;
    geo += words >= 700 ? 12 : words >= 350 ? 7 : 0;
    geo += h2 >= 3 ? 10 : h2 ? 5 : 0;
    geo += title && description ? 8 : 0;
    geo += lang ? 5 : 0;
    geo += canonical ? 5 : 0;
    geo += keywords.length >= 3 ? 8 : keywords.length ? 4 : 0;

    const metrics = { title, titleLength: title.length, description, descriptionLength: description.length, canonical, lang, h1, h2, jsonLd, images, imagesWithAlt, wordCount: words, questionHeadings, directAnswerSignals, ogTitle, ogDescription, robotsNoindex };
    const seoScore = clamp(seo);
    const geoScore = clamp(geo);
    const baseInsights = [
      !title ? "Adicionar um title claro e específico." : title.length > 65 ? "Encurtar o title para melhorar leitura e SERP." : "Title presente.",
      !description ? "Adicionar meta description." : "Meta description presente.",
      h1 !== 1 ? `Rever H1: foram encontrados ${h1}.` : "Estrutura H1 correta.",
      jsonLd === 0 ? "Adicionar dados estruturados relevantes (JSON-LD)." : `${jsonLd} bloco(s) JSON-LD detetados.`,
      questionHeadings === 0 ? "Adicionar secções que respondam diretamente a perguntas reais do público para melhorar GEO readiness." : "A página já contém headings orientados a perguntas.",
    ].join("\n");

    let insights = baseInsights;
    if (rule.ai) {
      const generated = await generateGrowthAi({
        workspaceId: session.workspaceId,
        userId: session.userId,
        brandId,
        operation: "search_intelligence_beta",
        system: "És o especialista SEO/GEO do MarkAI. Responde em português de Portugal. A funcionalidade está em Beta. Usa apenas os dados fornecidos, não afirmes rankings reais nem presença real em motores de IA. Prioriza 5 ações concretas por impacto.",
        user: `Marca: ${brand.name}; setor: ${brand.industry || "não definido"}; público: ${brand.audience || "não definido"}; URL: ${url.toString()}; keywords: ${keywords.join(", ")}; SEO score: ${seoScore}; GEO readiness score: ${geoScore}; métricas: ${JSON.stringify(metrics)}.`,
      });
      insights = generated.text;
    }

    const rows = await sql`
      insert into search_audits(brand_id, created_by, url, keywords, seo_score, geo_score, metrics, insights, status)
      values (${brandId}::uuid, ${session.userId}::uuid, ${url.toString()}, ${JSON.stringify(keywords)}::jsonb, ${seoScore}, ${geoScore}, ${JSON.stringify(metrics)}::jsonb, ${insights}, 'ready')
      returning id, seo_score, geo_score, created_at
    `;
    return NextResponse.json({ ok: true, audit: rows[0], message: `Auditoria Beta concluída · SEO ${seoScore}/100 · GEO ${geoScore}/100.` });
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Search Intelligence Beta failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível auditar a página." }, { status });
  }
}
