import type { PlayerSeed } from "./types";

interface CatalogPlayer {
  displayName: string;
  latinName: string;
  nationality: string;
  position: string;
  fame: PlayerSeed["fame"];
  aliases: string[];
}

/**
 * Stable, factual identities used to keep discovery available without AI.
 * Mutable facts such as current club, shirt number and market value are
 * deliberately omitted and left to live sources.
 */
const PLAYERS: CatalogPlayer[] = [
  { displayName: "محمد صلاح", latinName: "Mohamed Salah", nationality: "مصر", position: "جناح", fame: "global", aliases: ["صلاح", "egypt", "مصر"] },
  { displayName: "ليونيل ميسي", latinName: "Lionel Messi", nationality: "الأرجنتين", position: "مهاجم", fame: "global", aliases: ["ميسي", "argentina", "الأرجنتين"] },
  { displayName: "كريستيانو رونالدو", latinName: "Cristiano Ronaldo", nationality: "البرتغال", position: "مهاجم", fame: "global", aliases: ["رونالدو", "portugal", "البرتغال"] },
  { displayName: "كيليان مبابي", latinName: "Kylian Mbappe", nationality: "فرنسا", position: "مهاجم", fame: "global", aliases: ["مبابي", "france", "فرنسا"] },
  { displayName: "إيرلينغ هالاند", latinName: "Erling Haaland", nationality: "النرويج", position: "مهاجم", fame: "global", aliases: ["هالاند", "norway", "النرويج"] },
  { displayName: "فينيسيوس جونيور", latinName: "Vinicius Junior", nationality: "البرازيل", position: "جناح", fame: "global", aliases: ["فينيسيوس", "brazil", "البرازيل"] },
  { displayName: "جود بيلينغهام", latinName: "Jude Bellingham", nationality: "إنجلترا", position: "وسط", fame: "global", aliases: ["بيلينغهام", "england", "إنجلترا"] },
  { displayName: "لامين يامال", latinName: "Lamine Yamal", nationality: "إسبانيا", position: "جناح", fame: "global", aliases: ["يامال", "spain", "إسبانيا"] },
  { displayName: "كيفن دي بروين", latinName: "Kevin De Bruyne", nationality: "بلجيكا", position: "وسط", fame: "global", aliases: ["دي بروين", "belgium", "بلجيكا"] },
  { displayName: "روبرت ليفاندوفسكي", latinName: "Robert Lewandowski", nationality: "بولندا", position: "مهاجم", fame: "known", aliases: ["ليفاندوفسكي", "poland", "بولندا"] },
  { displayName: "سون هيونغ مين", latinName: "Son Heung-min", nationality: "كوريا الجنوبية", position: "مهاجم", fame: "known", aliases: ["سون", "korea", "كوريا"] },
  { displayName: "أشرف حكيمي", latinName: "Achraf Hakimi", nationality: "المغرب", position: "ظهير", fame: "known", aliases: ["حكيمي", "morocco", "المغرب"] },
  { displayName: "رياض محرز", latinName: "Riyad Mahrez", nationality: "الجزائر", position: "جناح", fame: "known", aliases: ["محرز", "algeria", "الجزائر"] },
  { displayName: "سالم الدوسري", latinName: "Salem Al-Dawsari", nationality: "السعودية", position: "جناح", fame: "known", aliases: ["الدوسري", "saudi", "السعودية"] },
  { displayName: "عمر مرموش", latinName: "Omar Marmoush", nationality: "مصر", position: "مهاجم", fame: "known", aliases: ["مرموش", "egypt", "مصر"] },
  { displayName: "فيكتور أوسيمين", latinName: "Victor Osimhen", nationality: "نيجيريا", position: "مهاجم", fame: "known", aliases: ["أوسيمين", "nigeria", "نيجيريا"] },
  { displayName: "فلوريان فيرتز", latinName: "Florian Wirtz", nationality: "ألمانيا", position: "وسط", fame: "emerging", aliases: ["فيرتز", "germany", "ألمانيا"] },
  { displayName: "جمال موسيالا", latinName: "Jamal Musiala", nationality: "ألمانيا", position: "وسط", fame: "emerging", aliases: ["موسيالا", "germany", "ألمانيا"] },
  { displayName: "بيدري", latinName: "Pedri", nationality: "إسبانيا", position: "وسط", fame: "known", aliases: ["spain", "إسبانيا"] },
  { displayName: "رودري", latinName: "Rodri", nationality: "إسبانيا", position: "وسط", fame: "global", aliases: ["spain", "إسبانيا"] },
  { displayName: "أليسون بيكر", latinName: "Alisson Becker", nationality: "البرازيل", position: "حارس مرمى", fame: "known", aliases: ["أليسون", "brazil", "البرازيل"] },
  { displayName: "فيرجيل فان دايك", latinName: "Virgil van Dijk", nationality: "هولندا", position: "مدافع", fame: "known", aliases: ["فان دايك", "netherlands", "هولندا"] },
  { displayName: "خفيتشا كفاراتسخيليا", latinName: "Khvicha Kvaratskhelia", nationality: "جورجيا", position: "جناح", fame: "emerging", aliases: ["خفيتشا", "georgia", "جورجيا"] },
  { displayName: "ديزيريه دويه", latinName: "Desire Doue", nationality: "فرنسا", position: "جناح", fame: "emerging", aliases: ["دويه", "france", "فرنسا"] },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .trim();
}

function idOf(value: string) {
  return normalize(value).replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "");
}

export function catalogPlayers(query: string | null, exclude: string[]): PlayerSeed[] {
  const needle = normalize(query ?? "");
  const excluded = new Set(exclude);
  const ranked = PLAYERS.map((player, index) => {
    const searchable = normalize(
      [player.displayName, player.latinName, player.nationality, player.position, ...player.aliases].join(" "),
    );
    const exactName = needle && [player.displayName, player.latinName, ...player.aliases].some(
      (value) => normalize(value) === needle,
    );
    return { player, index, matches: !needle || searchable.includes(needle), exactName };
  })
    .filter(({ player, matches }) => matches && !excluded.has(idOf(player.latinName)))
    .sort((a, b) => Number(b.exactName) - Number(a.exactName) || a.index - b.index);

  return ranked.slice(0, 8).map(({ player }) => ({
    id: idOf(player.latinName),
    displayName: player.displayName,
    latinName: player.latinName,
    club: null,
    nationality: player.nationality,
    position: player.position,
    fame: player.fame,
    reason: needle ? "نتيجة مطابقة لبحثك" : null,
    image: null,
    imageSource: null,
    imageKind: "fallback",
    hasNews: false,
  }));
}