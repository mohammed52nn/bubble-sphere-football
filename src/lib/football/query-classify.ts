/** Pure, AI-free query understanding: league and nationality keywords. Clubs/players resolve via Wikidata. */

export function normAr(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface LeagueDef { qid: string; label: string; keys: string[] }
export interface NationDef { qid: string; label: string; keys: string[] }

export const LEAGUES: LeagueDef[] = [
  { qid: "Q9448", label: "الدوري الإنجليزي الممتاز", keys: ["الدوري الانجليزي", "البريميرليج", "بريميرليغ", "البريمرليج", "premier league", "epl"] },
  { qid: "Q324867", label: "الدوري الإسباني", keys: ["الدوري الاسباني", "الليغا", "الليجا", "لاليغا", "la liga", "laliga"] },
  { qid: "Q15804", label: "الدوري الإيطالي", keys: ["الدوري الايطالي", "الكالتشيو", "سيري ا", "serie a"] },
  { qid: "Q82595", label: "الدوري الألماني", keys: ["الدوري الالماني", "البوندسليغا", "البوندسليجا", "bundesliga"] },
  { qid: "Q13394", label: "الدوري الفرنسي", keys: ["الدوري الفرنسي", "ليغ 1", "ليج 1", "ligue 1"] },
  { qid: "Q255633", label: "الدوري السعودي", keys: ["الدوري السعودي", "دوري روشن", "روشن", "saudi pro league", "saudi league"] },
  { qid: "Q680619", label: "الدوري المصري", keys: ["الدوري المصري", "egyptian premier league", "egyptian league"] },
  { qid: "Q570246", label: "الدوري المغربي", keys: ["الدوري المغربي", "البطوله المغربيه", "botola"] },
  { qid: "Q167541", label: "الدوري الهولندي", keys: ["الدوري الهولندي", "eredivisie"] },
  { qid: "Q182994", label: "الدوري البرتغالي", keys: ["الدوري البرتغالي", "primeira liga", "liga portugal"] },
  { qid: "Q18741", label: "الدوري التركي", keys: ["الدوري التركي", "super lig", "süper lig"] },
  { qid: "Q18543", label: "الدوري الأمريكي", keys: ["الدوري الامريكي", "mls", "major league soccer"] },
].map((l) => ({ ...l, keys: l.keys.map(normAr) }));

const N = (qid: string, label: string, ...keys: string[]): NationDef => ({ qid, label, keys: keys.map(normAr) });
export const NATIONS: NationDef[] = [
  N("Q79", "مصر", "مصري", "مصريين", "مصر", "egypt", "egyptian"),
  N("Q851", "السعودية", "سعودي", "سعوديين", "السعوديه", "saudi"),
  N("Q1028", "المغرب", "مغربي", "مغاربه", "المغرب", "morocco", "moroccan"),
  N("Q262", "الجزائر", "جزائري", "جزائريين", "الجزائر", "algeria", "algerian"),
  N("Q948", "تونس", "تونسي", "تونسيين", "تونس", "tunisia", "tunisian"),
  N("Q796", "العراق", "عراقي", "العراق", "iraq", "iraqi"),
  N("Q810", "الأردن", "اردني", "الاردن", "jordan", "jordanian"),
  N("Q846", "قطر", "قطري", "قطر", "qatar", "qatari"),
  N("Q878", "الإمارات", "اماراتي", "الامارات", "uae", "emirati"),
  N("Q858", "سوريا", "سوري", "سوريا", "syria", "syrian"),
  N("Q822", "لبنان", "لبناني", "لبنان", "lebanon"),
  N("Q842", "عُمان", "عماني", "عمان", "oman"),
  N("Q142", "فرنسا", "فرنسي", "فرنسيين", "فرنسا", "france", "french"),
  N("Q155", "البرازيل", "برازيلي", "برازيليين", "البرازيل", "brazil", "brazilian"),
  N("Q414", "الأرجنتين", "ارجنتيني", "الارجنتين", "argentina", "argentine", "argentinian"),
  N("Q29", "إسبانيا", "اسباني", "اسبانيا", "spain", "spanish"),
  N("Q21", "إنجلترا", "انجليزي", "انجلترا", "england", "english"),
  N("Q183", "ألمانيا", "الماني", "المانيا", "germany", "german"),
  N("Q45", "البرتغال", "برتغالي", "البرتغال", "portugal", "portuguese"),
  N("Q38", "إيطاليا", "ايطالي", "ايطاليا", "italy", "italian"),
  N("Q55", "هولندا", "هولندي", "هولندا", "netherlands", "dutch"),
  N("Q31", "بلجيكا", "بلجيكي", "بلجيكا", "belgium", "belgian"),
  N("Q224", "كرواتيا", "كرواتي", "كرواتيا", "croatia", "croatian"),
  N("Q1041", "السنغال", "سنغالي", "السنغال", "senegal", "senegalese"),
  N("Q1033", "نيجيريا", "نيجيري", "نيجيريا", "nigeria", "nigerian"),
  N("Q117", "غانا", "غاني", "غانا", "ghana"),
  N("Q1008", "ساحل العاج", "ايفواري", "ساحل العاج", "ivory coast", "ivorian"),
  N("Q1009", "الكاميرون", "كاميروني", "الكاميرون", "cameroon"),
  N("Q77", "الأوروغواي", "اوروغوياني", "الاوروغواي", "uruguay", "uruguayan"),
  N("Q739", "كولومبيا", "كولومبي", "كولومبيا", "colombia", "colombian"),
  N("Q20", "النرويج", "نرويجي", "النرويج", "norway", "norwegian"),
  N("Q43", "تركيا", "تركي", "تركيا", "turkey", "turkish"),
  N("Q17", "اليابان", "ياباني", "اليابان", "japan", "japanese"),
  N("Q884", "كوريا الجنوبية", "كوري", "كوريا", "korea", "korean"),
  N("Q30", "الولايات المتحدة", "امريكي", "امريكا", "usa", "american"),
];

export type QueryIntent =
  | { kind: "league"; league: LeagueDef }
  | { kind: "nation"; nation: NationDef }
  | { kind: "entity"; text: string };

const FILLER = /\b(لاعبين|لاعبي|لاعبو|لاعب|نجوم|نجم|افضل|اشهر|منتخب|من|في|players?|best|top|stars?|from|of|the)\b/g;

/** Classify a free-text query without AI. League/nation by keyword; everything else is a name to resolve. */
export function classifyQuery(query: string): QueryIntent {
  const q = normAr(query);
  const padded = ` ${q} `;
  // Leagues first ("الدوري السعودي" must not be read as the nation "سعودي").
  for (const league of LEAGUES) if (league.keys.some((k) => padded.includes(` ${k} `) || q === k)) return { kind: "league", league };
  if (/\bدوري\b/.test(q) || /\bleague\b/.test(q)) {
    for (const nation of NATIONS) {
      const league = LEAGUES.find((l) => l.label.includes(nation.label));
      if (league && nation.keys.some((k) => padded.includes(` ${k} `))) return { kind: "league", league };
    }
  }
  const stripped = ` ${q.replace(FILLER, " ").replace(/\s+/g, " ").trim()} `;
  for (const nation of NATIONS) {
    if (nation.keys.some((k) => stripped.trim() === k || (padded.includes(` ${k} `) && stripped.trim().split(" ").length <= 2))) {
      return { kind: "nation", nation };
    }
  }
  return { kind: "entity", text: query.trim() };
}
