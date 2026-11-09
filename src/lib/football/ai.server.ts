const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export class AiUnavailableError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/** Circuit breaker: after a credit/permission refusal the AI is skipped for a while (no wasted calls). */
const PAUSE_MS = 30 * 60 * 1000;
let pausedUntil = 0;

export function aiAvailable(): boolean {
  return !!process.env["LOVABLE_API_KEY"] && Date.now() >= pausedUntil;
}

/** Test hook. */
export function resetAiBreaker() {
  pausedUntil = 0;
}

/**
 * Structured research call. Returns parsed JSON matching the given schema.
 * Never called from the browser — LOVABLE_API_KEY stays server-side.
 * The app works fully without it; this is an optional enhancement.
 */
export async function researchJson<T>(args: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiUnavailableError("missing_api_key");
  if (Date.now() < pausedUntil) throw new AiUnavailableError("ai_paused", 402);

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: args.schemaName, strict: true, schema: args.schema },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 402 || res.status === 403) pausedUntil = Date.now() + PAUSE_MS;
    else if (res.status === 429) pausedUntil = Date.now() + 60 * 1000;
    throw new AiUnavailableError(`gateway_${res.status}: ${body.slice(0, 300)}`, res.status);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new AiUnavailableError("empty_completion");
  try {
    return JSON.parse(content) as T;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(content.slice(start, end + 1)) as T;
    throw new AiUnavailableError("unparsable_completion");
  }
}

export const NO_HALLUCINATION_RULES = [
  "أنت طبقة بحث ذكية لتطبيق عربي عن لاعبي كرة القدم.",
  "الدقة أهم من الاكتمال. لا تخترع أبدًا أخبارًا أو مصادر أو روابط أو تواريخ أو أرقامًا أو تصريحات.",
  "إذا لم تكن متأكدًا من قيمة حقل، أعد سلسلة فارغة \"\" لذلك الحقل.",
  "استخدم صيغة \"بحسب تقارير\" للمعلومات غير المؤكدة، ولا تحوّل الشائعة إلى حقيقة.",
  "أسماء اللاعبين والأندية تُكتب بالعربية، مع الاسم اللاتيني في حقله المخصص.",
].join(" ");
