/** Names only — clubs are never stored here; they are verified live from news. */
export const ROSTER: { latinName: string; displayName: string }[] = [
  ["Mohamed Salah", "محمد صلاح"], ["Kylian Mbappé", "كيليان مبابي"], ["Erling Haaland", "إرلينغ هالاند"],
  ["Lionel Messi", "ليونيل ميسي"], ["Cristiano Ronaldo", "كريستيانو رونالدو"], ["Vinícius Júnior", "فينيسيوس جونيور"],
  ["Jude Bellingham", "جود بيلينغهام"], ["Lamine Yamal", "لامين يامال"], ["Kevin De Bruyne", "كيفن دي بروين"],
  ["Harry Kane", "هاري كين"], ["Robert Lewandowski", "روبرت ليفاندوفسكي"], ["Neymar", "نيمار"],
  ["Karim Benzema", "كريم بنزيما"], ["Riyad Mahrez", "رياض محرز"], ["Achraf Hakimi", "أشرف حكيمي"],
  ["Sadio Mané", "ساديو ماني"], ["Bukayo Saka", "بوكايو ساكا"], ["Florian Wirtz", "فلوريان فيرتز"],
  ["Pedri", "بيدري"], ["Rodri", "رودري"], ["Jamal Musiala", "جمال موسيالا"], ["Phil Foden", "فيل فودين"],
  ["Son Heung-min", "سون هيونغ مين"], ["Victor Osimhen", "فيكتور أوسيمين"], ["Khvicha Kvaratskhelia", "خفيتشا كفاراتسخيليا"],
  ["Lautaro Martínez", "لاوتارو مارتينيز"], ["Antoine Griezmann", "أنطوان غريزمان"], ["Luka Modrić", "لوكا مودريتش"],
  ["Virgil van Dijk", "فيرجيل فان دايك"], ["Alexander Isak", "ألكسندر إيساك"], ["Omar Marmoush", "عمر مرموش"],
  ["Youssef En-Nesyri", "يوسف النصيري"], ["Brahim Díaz", "إبراهيم دياز"], ["Salem Al-Dawsari", "سالم الدوسري"],
  ["Rayan Cherki", "ريان شرقي"], ["Désiré Doué", "ديزيريه دويه"], ["Ousmane Dembélé", "عثمان ديمبيلي"],
  ["Trent Alexander-Arnold", "ترينت ألكسندر أرنولد"], ["Bruno Fernandes", "برونو فرنانديز"], ["Hakim Ziyech", "حكيم زياش"],
].map(([latinName, displayName]) => ({ latinName: latinName!, displayName: displayName! }));
