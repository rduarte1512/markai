export type AiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string | AiContentPart[];
};

type AiRequest = {
  modelKey: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  demoKind?: "ads" | "copilot" | "brand_onboarding";
};

function getModelMap(): Record<string, string> {
  try {
    return JSON.parse(process.env.AI_MODEL_MAP || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function contentToText(content: AiMessage["content"]) {
  if (typeof content === "string") return content;
  return content.map((part) => part.type === "text" ? part.text : "[imagem anexada]").join("\n");
}

function demoResponse(request: AiRequest) {
  const lastMessage = contentToText(request.messages.at(-1)?.content ?? "");

  if (request.demoKind === "ads") {
    return JSON.stringify({
      ads: [
        {
          title: "Transforma resultados, não apenas campanhas",
          primaryText:
            "Chega de marketing sem direção. Cria campanhas alinhadas com a tua marca, testa novas abordagens e transforma cada ideia numa oportunidade real de crescimento.",
          description: "Estratégia, criatividade e execução num único fluxo.",
          cta: "Saber mais",
          angle: "Resultado e clareza",
        },
        {
          title: "A próxima campanha começa com uma ideia melhor",
          primaryText:
            "Descobre mensagens que chamam a atenção do público certo e convertem interesse em ação. Uma proposta clara, criada para a tua marca.",
          description: "Variação focada em curiosidade e benefício.",
          cta: "Começar agora",
          angle: "Curiosidade e benefício",
        },
        {
          title: "Menos tentativa. Mais crescimento.",
          primaryText:
            "Usa uma estratégia de comunicação consistente para lançar anúncios mais rápidos, com mais variações e decisões apoiadas por contexto de marca.",
          description: "Variação direta para decisores.",
          cta: "Ver solução",
          angle: "Eficiência e controlo",
        },
      ],
      note: "Resposta de demonstração. Liga um gateway de IA nas variáveis de ambiente para gerar conteúdo real.",
    });
  }

  if (request.demoKind === "brand_onboarding") {
    return JSON.stringify({
      audience: "PME e equipas que valorizam rapidez, confiança e resultados mensuráveis.",
      toneOfVoice: "Claro, confiante, próximo e orientado a resultados.",
      values: ["Clareza", "Inovação", "Confiança", "Resultados"],
      personas: [
        {
          name: "Decisor pragmático",
          role: "Fundador ou diretor",
          pain: "Precisa de crescer sem aumentar a complexidade operacional.",
          goal: "Obter resultados rápidos e previsíveis.",
        },
      ],
      source: lastMessage.slice(0, 120),
    });
  }

  return [
    "Aqui está uma análise inicial com base no contexto disponível:",
    "",
    "1. Clarifica uma única proposta de valor e repete-a em todos os pontos da campanha.",
    "2. Cria pelo menos três ângulos: problema, transformação e prova.",
    "3. Define uma métrica principal antes de publicar e evita otimizar várias metas ao mesmo tempo.",
    "4. Testa primeiro a mensagem; só depois aumenta o investimento no criativo vencedor.",
    "",
    `Pedido analisado: ${lastMessage.slice(0, 220)}`,
    "",
    "Esta é uma resposta de demonstração. Configura AI_GATEWAY_BASE_URL, AI_GATEWAY_API_KEY e AI_MODEL_MAP para usar modelos reais.",
  ].join("\n");
}

export async function generateAiText(request: AiRequest) {
  const baseUrl = process.env.AI_GATEWAY_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const mappedModel = getModelMap()[request.modelKey];

  if (!baseUrl || !apiKey || !mappedModel) {
    return { text: demoResponse(request), demoMode: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: mappedModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1400,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`AI_GATEWAY_ERROR_${response.status}: ${details.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      output_text?: string;
    };

    const text = data.choices?.[0]?.message?.content ?? data.output_text;
    if (!text) throw new Error("AI_GATEWAY_EMPTY_RESPONSE");
    return { text, demoMode: false };
  } finally {
    clearTimeout(timeout);
  }
}

export function parseJsonFromAi<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return null;

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
}
