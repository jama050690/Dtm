import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { readFileSync } from "fs";
import { resolve } from "path";

// DTM javoblarni txt fayldan o'qish
function parseJavoblar(): Map<number, string> {
  const answers = new Map<number, string>();
  const possiblePaths = [
    resolve(process.cwd(), "..", "tests", "ijtimoiy-fan", "javoblar.txt"),
    resolve(process.cwd(), "tests", "ijtimoiy-fan", "javoblar.txt"),
    resolve(process.cwd(), "..", "..", "tests", "ijtimoiy-fan", "javoblar.txt"),
  ];

  let content = "";
  for (const p of possiblePaths) {
    try {
      content = readFileSync(p, "utf-8");
      break;
    } catch {
      continue;
    }
  }

  if (!content) return answers;

  for (const line of content.split("\n")) {
    const match = line.trim().match(/^(\d+)-([A-Da-d])$/);
    if (match) {
      answers.set(parseInt(match[1], 10), match[2].toUpperCase());
    }
  }
  return answers;
}

// DTM ball tizimi
const DTM_SCORING = {
  fan1: 3.1,      // 1-fan: har bir to'g'ri javobga 3.1 ball
  fan2: 2.1,      // 2-fan: har bir to'g'ri javobga 2.1 ball
  majburiy: 1.1,  // majburiy fanlar: har bir to'g'ri javobga 1.1 ball
};

type Subject = {
  id: number;
  directionId: number;
  name: string;
  description: string;
};

type TestQuestion = {
  id: number;
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  correct: "A" | "B" | "C" | "D";
};

type Direction = {
  id: number;
  name: string;
  description: string;
};

const defaultDirections: Direction[] = [
  { id: 1, name: "Aniq fanlar", description: "Matematika va fizika yo'nalishi" },
  { id: 2, name: "Tabiiy fanlar", description: "Kimyo va biologiya yo'nalishi" },
  { id: 3, name: "Ijtimoiy fanlar", description: "Tarix, huquq va geografiya yo'nalishi" },
  { id: 4, name: "Til va adabiyot fanlari", description: "Ona tili, adabiyot va xorijiy tillar yo'nalishi" },
  { id: 5, name: "Kasbiy ijodiy imtihon", description: "Kasbiy va ijodiy yo'nalishlar bo'yicha imtihonlar" },
];

const defaultSubjects: Subject[] = [
  {
    id: 1,
    directionId: 1,
    name: "Matematika",
    description: "Algebra va geometriya",
  },
  {
    id: 2,
    directionId: 1,
    name: "Fizika",
    description: "Mexanika va elektr",
  },
  {
    id: 3,
    directionId: 2,
    name: "Kimyo",
    description: "Organik va noorganik kimyo",
  },
  {
    id: 4,
    directionId: 2,
    name: "Biologiya",
    description: "Tirik organizmlar dunyosi",
  },
  // Direction 3 - Ijtimoiy fanlar
  {
    id: 5,
    directionId: 3,
    name: "Tarix",
    description: "O'zbekiston va jahon tarixi",
  },
  {
    id: 6,
    directionId: 3,
    name: "Huquq",
    description: "Davlat va huquq asoslari",
  },
  {
    id: 7,
    directionId: 3,
    name: "Geografiya",
    description: "O'zbekiston va jahon geografiyasi",
  },
  // Direction 4 - Til va adabiyot fanlari
  {
    id: 8,
    directionId: 4,
    name: "Ona tili va adabiyoti",
    description: "O'zbek tili grammatikasi va adabiyot",
  },
  {
    id: 9,
    directionId: 4,
    name: "Ingliz tili",
    description: "Ingliz tili grammatikasi va lug'at",
  },
  {
    id: 10,
    directionId: 4,
    name: "Nemis tili",
    description: "Nemis tili grammatikasi va lug'at",
  },
  {
    id: 11,
    directionId: 4,
    name: "Fransuz tili",
    description: "Fransuz tili grammatikasi va lug'at",
  },
  {
    id: 12,
    directionId: 4,
    name: "Rus tili",
    description: "Rus tili grammatikasi va lug'at",
  },
];

const defaultTestsBySubject: Record<string, Omit<TestQuestion, "id">[]> = {
  Matematika: [
    {
      question: "Kubning qirrasi 3 dm bo'lsa, hajmini (dm3) toping.",
      A: "16",
      B: "27",
      C: "64",
      D: "81",
      correct: "B",
    },
    {
      question: "Tenglamani yeching: 2(2x-3)-3(x+3)=0",
      A: "3",
      B: "15",
      C: "-15",
      D: "-3",
      correct: "B",
    },
    {
      question: "Hisoblang: (7 + 1/9) : 64/81 - 3",
      A: "7",
      B: "6",
      C: "5",
      D: "4",
      correct: "A",
    },
    {
      question: "Yangi qurilgan supermarketga sotish uchun 2 tonna shakar keltirildi. Birinchi kuni bu shakardan 320 kg, ikkinchi kuni esa 2,5 sentener sotildi. Supermarketda qancha (kg) shakar sotilmay qoldi?",
      A: "1470",
      B: "1430",
      C: "1450",
      D: "1380",
      correct: "B",
    },
    {
      question: "Ming so'mlik puldan nechtasi 1 mln so'mni tashkil qiladi?",
      A: "1000",
      B: "100",
      C: "10000",
      D: "10",
      correct: "A",
    },
    {
      question: "Tenglamani yeching: 4,6x - 9,4x = 4 - 5,8x",
      A: "3,7",
      B: "2,3",
      C: "7,1",
      D: "4",
      correct: "D",
    },
    {
      question: "Rasmdagi qopning og'irligi necha kilogrammga teng?",
      A: "4",
      B: "3",
      C: "5",
      D: "2",
      correct: "C",
    },
    {
      question: "Metall qotishmasi massasining o'rtacha 2/5 qismini temir tashkil qiladi. 70 kg metall qotishmasining o'rtacha necha kilogrammini temir tashkil qiladi?",
      A: "30",
      B: "24",
      C: "28",
      D: "35",
      correct: "C",
    },
    {
      question: "8 <= x < 14 qo'sh tengsizlikni qanoatlantiruvchi sonlardan eng kattasini 2 marta oshiring.",
      A: "28",
      B: "26",
      C: "13",
      D: "14",
      correct: "B",
    },
    {
      question: "EKUB(18; 24) = ?",
      A: "4",
      B: "6",
      C: "9",
      D: "3",
      correct: "B",
    },
  ],
  Fizika: [],
  Kimyo: [],
  Biologiya: [],
  Tarix: [
    // 1-30: Asosiy tarix savollari
    {
      question: "Ismoil G'aspirali yashagan yillarni aniqlang?",
      A: "1851-1914-yillar",
      B: "1869-1932-yillar",
      C: "1878-1931-yillar",
      D: "1874-1919-yillar",
      correct: "B",
    },
    {
      question: "Fors shohligi tomonidan Bobil zabt etilgan asrda yuz bergan voqeani aniqlang.",
      A: "Qadimgi Baqtriya davlati tashkil topdi",
      B: "Apennin yarimorolida Etrusk shahar-davlatlari tashkil topgan",
      C: "Frada boshchiligidagi qo'zg'olon yuz bergan",
      D: "Afina o'z kuch-qudratining cho'qqisiga ko'tarilgan",
      correct: "A",
    },
    {
      question: "Afinada demokratiyaga o'tilganidan qancha vaqt o'tib, Rimda respublika tuzumi o'rnatildi?",
      A: "112 yil",
      B: "102 yil",
      C: "75 yil",
      D: "85 yil",
      correct: "B",
    },
    {
      question: "Italiyaning Florensiya shahrida italiyalik olim Perondinoning \"Skifiyalik Tamerlanning ulug'vorligi\" asari (a) va Seveliyada mashhur Ispaniya elchisi Klavixoning \"Esdaliklari\" kitobi (b) nashrdan chiqqan yillarni belgilang.",
      A: "a) 1556-yili, b) 1587-yili",
      B: "a) 1558-yili, b) 1589-yili",
      C: "a) 1553-yili, b) 1582-yili",
      D: "a) 1551-yili, b) 1583-yili",
      correct: "A",
    },
    {
      question: "Quyidagilardan Xo'jand shahri bilan bog'liq to'g'ri ma'lumotlarni belgilang. 1) mo'g'ullar bosqini vaqtida Xo'jand 7 oy qamal qilingan; 2) 1137-yilda Qoraxitoylar Xo'jand shahri yaqinida qoraxoniylar eloqxoni Mahmudga qaqshatqich zarba berdi; 3) Temur Malik Xo'jand hokimi bo'lgan; 4) Chig'atoy Xo'jand shahrini o'ziga qarorgoh qilib olgan; 5) Xo'jand shahri Sirdaryo ikkiga ayrilgan yerda joylashgan",
      A: "2, 3, 4",
      B: "1, 3, 5",
      C: "2, 3, 5",
      D: "1, 3, 4",
      correct: "C",
    },
    {
      question: "Qaysi G'aznaviy hukmdor davrida Qoraxoniylar Xurosonni o'z davlatiga qo'shib olish uchun ikki marta hujum qilgan?",
      A: "Alptegin",
      B: "Sobuqtegin",
      C: "Ma'sud G'aznaviy",
      D: "Mahmud G'aznaviy",
      correct: "D",
    },
    {
      question: "Quyida berilgan yillarda bo'lib o'tgan voqealar mos ravishda berilgan javobni toping. 1) 1336-yil; 2) 1366-1370-yillar; 3) 1395-yil; 4) 1398-1399-yillar. a) Amir Temur Hindistonga yurish qildi; b) Kesh viloyatida Amir Temur tavallud topdi; c) Amir Temur va Husayn o'rtasida to'qnashuvlar; d) Amir Temur To'xtamishxon ustidan g'alaba qozondi.",
      A: "1-b, 2-c, 3-a, 4-d",
      B: "1-b, 2-d, 3-c, 4-a",
      C: "1-b, 2-c, 3-d, 4-a",
      D: "1-b, 2-a, 3-d, 4-c",
      correct: "A",
    },
    {
      question: "Quyidagi shaxslardan qaysi biri o'rta asrlarda Vizantiyada hukmronlik qilmagan?",
      A: "Aleksey I",
      B: "Vilgelm I",
      C: "Issak II Angel",
      D: "Roman IV Diogen",
      correct: "B",
    },
    {
      question: "Quyidagilardan Germaniyada XII asr ikkinchi yarmi – XIII asr boshlarida hukmronlik qilgan sulolani toping.",
      A: "lyuksemburglar",
      B: "karolinglar",
      C: "shtaufenlar",
      D: "saksoniyaliklar",
      correct: "C",
    },
    {
      question: "Ilk o'rta asrlarda hukmronlik qilgan hukmdorlarni boshqaruv davri boshlanishiga qarab to'g'ri xronologik tartibda berilgan javobni toping. 1) Otton I; 2) Buyuk Karl; 3) Yustinian I; 4) Buyuk Alfred",
      A: "2, 3, 1, 4",
      B: "2, 3, 4, 1",
      C: "3, 2, 4, 1",
      D: "3, 2, 1, 4",
      correct: "C",
    },
    {
      question: "1831-1832-yillarda yozilgan asarni aniqlang.",
      A: "Tarixlar sarasi",
      B: "Tarixi Rashidiy",
      C: "Sulton voqealarining majmuasi",
      D: "Dili g'aroyib",
      correct: "A",
    },
    {
      question: "Tarixiy-mantiqiy ketma-ketlik (moslik) berilgan javobni toping. (\"Uch xonlik davri\" tarixi)",
      A: "Abulxayrxon – Poytaxtni ko'chirgan – Gulbadanbegimni nikohiga olgan",
      B: "Shayboniyxon – Turkistonda ta'lim olgan – Sulton Ali Mirzoni qatl etgan",
      C: "Ubaydullaxon – Poytaxtni ko'chirgan – Safaviylar hujumini qaytargan",
      D: "Abdullaxon II – band va tim qurdirgan – \"Kulliyot\" nomli devon yozgan",
      correct: "B",
    },
    {
      question: "Xiva xoni Arab Muhammadxon davri bilan bog'liq xato ma'lumotlarni aniqlang. 1) parokandalikning yuqori nuqtaga chiqishi; 2) poytaxtning boshqa shaharga ko'chirilishi; 3) Yoyiq kazaklariga qarshi kurash; 4) xon o'g'illarining otasiga qarshi bosh ko'tarishi; 5) 32 qabilaning to'rt guruhga bo'linishi; 6) Buxoro xonligi hududlarini xonavayronlikka olib kelgan yurishlar; 7) Eron shohi Shoh Abbos yordamida taxtni qaytarish; 8) qoraqalpoqlar Xiva xonligiga bo'ysundirilgani",
      A: "1, 2, 3, 8",
      B: "2, 4, 6, 7",
      C: "1, 3, 5, 7",
      D: "5, 6, 7, 8",
      correct: "C",
    },
    {
      question: "Quyidagi asrlar bilan Germaniyada sodir bo'lgan voqealarni muvofiq keltiring. 1) XVII asrning ikkinchi yarmi; 2) XVII asr; 3) XVII asr oxiri; 4) XVIII asr oxiri.",
      A: "1-d, 2-c, 3-b, 4-a",
      B: "1-a, 2-c, 3-b, 4-d",
      C: "1-b, 2-c, 3-a, 4-d",
      D: "1-c, 2-d, 3-b, 4-a",
      correct: "C",
    },
    {
      question: "Buyuk Britaniya sanoat rivojlanishi, savdo ko'lami va dengizdagi qudrati jihatidan dunyoda o'z ustunligining cho'qqisiga erishgan davrni ko'rsating.",
      A: "XIX asrning 40-yillari",
      B: "XIX asrning 50-yillari",
      C: "XIX asrning birinchi choragi",
      D: "XIX asrning 70-yillari",
      correct: "B",
    },
    {
      question: "XVIII asr oxiriga kelib, Qohira shahrining o'zida chet elliklar bilan savdo qiladigan nechta savdogar faoliyat yuritgan?",
      A: "5 ming",
      B: "7 ming",
      C: "9 ming",
      D: "12 ming",
      correct: "C",
    },
    {
      question: "Rossiya imperiyasi tomonidan bosib olingan hududlarda tashkil etilgan ma'muriy birliklarning gubernatori lavozimiga tayinlangan shaxslarni to'g'ri moslang. 1) Zarafshon okrugi; 2) Namangan bo'limi; 3) Turkiston viloyati. a) general Skobelev; b) general Abramov; c) general Chernyayev.",
      A: "1-a, 2-b, 3-c",
      B: "1-b, 2-a, 3-c",
      C: "1-c, 2-a, 3-b",
      D: "1-b, 2-c, 3-a",
      correct: "B",
    },
    {
      question: "Quyidagi atamalarning ma'nolari to'g'ri ko'rsatilgan javobni belgilang. 1) moliya; 2) trest; 3) kapital; 4) ssuda.",
      A: "1-d, 2-c, 3-b, 4-a",
      B: "1-b, 2-d, 3-c, 4-a",
      C: "1-d, 2-a, 3-b, 4-c",
      D: "1-b, 2-d, 3-a, 4-c",
      correct: "A",
    },
    {
      question: "Xaritada ajratib ko'rsatilgan hududdan bo'lgan shaxsni aniqlang.",
      A: "J.Ferri",
      B: "E.Sapata",
      C: "A.Shpis",
      D: "N.Chemberlen",
      correct: "B",
    },
    {
      question: "To'g'ri ma'lumot berilgan javobni toping.",
      A: "1905-yil Tanganikada Germaniyaga qarshi ozodlik uchun boshlangan qo'zg'olon 2 yildan ortiq davom etdi",
      B: "1891-yilda Otto fon Bismark Reyxstag oldiga sotsialistlarga qarshi qonunga doimiy tus berish masalasini qo'ydi",
      C: "1878-yilda Germaniya sotsial-demokratik partiyasi tashkil topdi",
      D: "1890-yilda Germaniya imperiyasi taxtiga Vilgelm II o'tirdi",
      correct: "A",
    },
    {
      question: "Farg'ona vodiysi vakillari RSFSR tarkibida Farg'ona muxtor viloyatini tashkil etish to'g'risidagi taklif bilan chiqqan yilda jahon tarixida yuz bergan voqeani toping.",
      A: "Buyuk Britaniya dominion huquqiga ega bo'lgan «Ozod Irlandiya davlatini» tan oldi",
      B: "Eronda Ta'sis majlisi Rizoxonni Pahlaviylar sulolasining shohi deb e'lon qildi",
      C: "Turkiya Respublika deb e'lon qilindi",
      D: "Millatlar Ligasi tomonidan «Qullik haqida» konvensiya qabul qilingan",
      correct: "A",
    },
    {
      question: "Turor Risqulov nechanchi yilda o'lka Musulmonlar byurosi (Musbyuro) raisi bo'lgan?",
      A: "1919-yilda",
      B: "1920-yilda",
      C: "1923-yilda",
      D: "1922-yilda",
      correct: "B",
    },
    {
      question: "Quyidagi voqealarning sanasini to'g'ri muvofiqlashtiring. 1) \"Tashselmash\" zavodi paxta terish mashinalarining dastlabki partiyasini ishlab chiqardi; 2) O'zbekiston metallurgiya zavodida yangi prokat sexi ishga tushirildi; 3) Toshkentda ilk marta trolleybuslar qatnay boshladi. a) 1946-yil; b) 1947-yil; c) 1948-yil.",
      A: "1-a, 2-b, 3-c",
      B: "1-b, 2-a, 3-c",
      C: "1-a, 2-c, 3-b",
      D: "1-c, 2-a, 3-b",
      correct: "C",
    },
    {
      question: "To'g'ri ma'lumot berilgan javobni toping.",
      A: "1918-1920-yillarda Parij tinchlik konferensiyasi o'tkazilgan",
      B: "1924-yilda Sovet Rossiyasi va Germaniya o'rtasida Rapallo shartnomasi imzolangan",
      C: "1918-yil 28-iyunda Germaniya Versal tinchlik shartnomasini imzoladi",
      D: "1921-1922-yillarda Vashington konferensiyasi bo'lib o'tgan",
      correct: "D",
    },
    {
      question: "Buyuk Britaniya tarixiga oid quyidagi voqealarning yilini aniqlang. 1) Misrning mustaqilligini tan olishga majbur bo'ldi; 2) dominion huquqiga ega bo'lgan «Ozod Irlandiya davlatini» tan oldi; 3) Hindistonning Armitsar shahrida tinch namoyishchilarni o'qqa tutdi. a) 1919-yilda; b) 1921-yilda; c) 1922-yilda.",
      A: "1-c, 2-b, 3-a",
      B: "1-b, 2-a, 3-c",
      C: "1-a, 2-c, 3-b",
      D: "1-c, 2-a, 3-b",
      correct: "A",
    },
    {
      question: "Respublikamiz rahbariyatining tashabbusi bilan intensiv texnologiyalar asosida parvarishlanadigan pakana va yarim pakana olma, nok, olxo'ri, gilos, shaftoli ko'chatlari 2010-yili qaysi davlatlardan olib kelingan edi?",
      A: "Ukraina va Polsha",
      B: "Yaponiya va Daniya",
      C: "Polsha va Latviya",
      D: "Belgiya va Shvetsiya",
      correct: "C",
    },
    {
      question: "O'zbekiston oliy ta'lim muassasalarida ta'lim olishda kontrakt-shartnoma to'lovi asosida o'qish qachon joriy etildi?",
      A: "1997-yil",
      B: "1994-yil",
      C: "1995-yil",
      D: "1996-yil",
      correct: "A",
    },
    {
      question: "Qarorlar qabul qilish bo'yicha vakolat va majburiyatlarni markazdan boshqa tashkilotlarga o'tkazish bu...?",
      A: "Kontingent",
      B: "Devalvatsiya",
      C: "Tolerantlik",
      D: "Detsentralizatsiya",
      correct: "D",
    },
    {
      question: "Rio-de-Janeyro shahrida atrof-muhitni himoya qilish va barqaror taraqqiyot bo'yicha konferensiya o'tkazilgan yili o'z mustaqilligini e'lon qilgan davlatni aniqlang.",
      A: "Ukraina",
      B: "Tatariston",
      C: "Moldaviya",
      D: "Litva",
      correct: "A",
    },
    {
      question: "XXI asr boshlarida quyidagi qaysi mamlakatda \"tirik tovar\" savdosi keng avj olgan bo'lib, ota-onalar bolalarini arzimagan pulga sotardi?",
      A: "Tailand",
      B: "Laos",
      C: "Kambodja",
      D: "Myanma",
      correct: "C",
    },
    // 81-90: Majburiy Tarix savollari
    {
      question: "Quyidagilardan yunon-makedonlarga qarshi kurashgan shaxsni belgilang.",
      A: "To'maris",
      B: "Spitamen",
      C: "Shiroq",
      D: "Frada",
      correct: "B",
    },
    {
      question: "O'rta Osiyodagi bronza davriga oid manzilgohni belgilang.",
      A: "Machay",
      B: "Teshiktosh",
      C: "Afrosiyob",
      D: "Jarqo'ton",
      correct: "D",
    },
    {
      question: "G'arbiy turk xoqonligining VII asr birinchi yarmida quyidagi qaysi davlat bilan iqtisodiy aloqalari faollashgan?",
      A: "Vizantiya",
      B: "Eron",
      C: "Xitoy",
      D: "Hindiston",
      correct: "C",
    },
    {
      question: "Toxarlar kimlarning avlodlari bo'lgan?",
      A: "massagetlar",
      B: "saklar",
      C: "xunnlar",
      D: "kushonlar",
      correct: "B",
    },
    {
      question: "Manbalarda ta'rif etilishicha, Toxariston aholisi qaysi dinga e'tiqod qilgan?",
      A: "zardusht",
      B: "budda",
      C: "islom",
      D: "xristian",
      correct: "B",
    },
    {
      question: "Nechachi yilda yurtimizda Jaloliddin Manguberdining tavalludi 800 yilligi nishonlangan?",
      A: "1998-yilda",
      B: "1999-yilda",
      C: "2000-yilda",
      D: "2001-yilda",
      correct: "C",
    },
    {
      question: "Abu Nasr Forobiyni Sharqda kim deb atashardi?",
      A: "O'z davrining Ptolomeyi",
      B: "Shayx ur-rais",
      C: "Sharq Arastusi",
      D: "Jorulloh",
      correct: "C",
    },
    {
      question: "Amudaryo xazinasidan topilgan oltin va kumush buyumlar hozirgi kunda qayerda saqlanmoqda?",
      A: "Britaniya muzeyida",
      B: "Ermitajda",
      C: "Temuriylar davlati tarixi muzeyida",
      D: "Luvrda",
      correct: "A",
    },
    {
      question: "1533-1536-yillarda Buxoroda qurilgan madrasani toping.",
      A: "Baroqxon",
      B: "Mir Arab",
      C: "Norbo'tabiy",
      D: "Tillakori",
      correct: "B",
    },
    {
      question: "1706-yilda kim o'zini Balx hukmdori deb e'lon qildi?",
      A: "Ubaydullaxon II",
      B: "Ibrohimbey",
      C: "Mahmudbey otaliq",
      D: "Abulfayzxon",
      correct: "C",
    },
  ],
  Huquq: [],
  Geografiya: [],
  "Ona tili va adabiyoti": [
    {
      question: "Men \"Registon\" bilan birgalikda albatta o'z maqsadimga yuqori natijalarga erishaman. Ushbu gap haqida noto'g'ri fikrni aniqlang?",
      A: "Ushbu gapda metonomiya asosida ma'no ko'chish holati kuzatilgan",
      B: "Ushbu gapda imloviy xatolik kuzatiladi",
      C: "Tinish belgisi bilan bog'liq xatolik mavjud",
      D: "Ushbu gap ifoda-maqsadiga ko'ra darak gap hisoblanadi",
      correct: "C",
    },
    {
      question: "Ikki unli o'rtasida talaffuzda y undoshi orttirib aytilsa-da, lekin bu yozuvda aks etmaydigan so'zlar berilgan qatorni aniqlang.",
      A: "Maorif, oid",
      B: "Shoir, doim",
      C: "Tarbiya, shoir",
      D: "Ilm, tabiat",
      correct: "A",
    },
    {
      question: "Qaysi javobda chiziqcha bilan yozish qoidasi buzilgan?",
      A: "5-sinf",
      B: "siz-chi?",
      C: "aka-uka",
      D: "ertaga-yoq",
      correct: "D",
    },
    {
      question: "\"Hafsalasi pir bo'ldi\" iborasiga ma'nodosh ibora ishtirok etgan gapni aniqlang?",
      A: "Og'ziga talqon solganday jim o'tirdi",
      B: "Shu payt ko'cha darvoza taraqlab ochildi, tarvuzi qo'ltig'idan tushib Alijon kirib keldi",
      C: "Sobir yulduzni benarvon uradiganlar sirasiga kiradi",
      D: "Mehmon joyiga o'tirdi-yu, ammo ko'ngli joyiga tushmadi",
      correct: "D",
    },
    {
      question: "Qaysi gapda // shartli belgisi o'rnida tire (—) tinish belgisi tushirib qoldirilgan?",
      A: "Tarixni o'rganishdan asosiy maqsad // milliy o'zligimizni chuqurroq anglash",
      B: "Mening opam ham // talaba, bu yil oliygohga kirdilar",
      C: "Bildi ota // foydasizdir kurashmoq",
      D: "Ehtimol, sizda ham shunday hollar bo'lgandir // tun yarmidan og'ganda birdan uyg'onib ketasiz",
      correct: "A",
    },
    {
      question: "Ibora qo'llanmagan gapni aniqlang?",
      A: "Tengqurlarim ichida yuzim yorug' bo'ldi",
      B: "Tilga ixtiyorsiz – elga e'tiborsiz",
      C: "Uni qo'lga oluvchi kishilarimiz nihoyatda pixini yorgan bo'lmog'i shart",
      D: "Kishilikning dushmanlari yer bilan yakson bo'lur",
      correct: "B",
    },
    {
      question: "\"e\" harfi qaysi so'zlarda \"i\" tovushiga monand aytiladi, lekin \"e\" yoziladi?",
      A: "Material, ekran, ne'mat, teatr",
      B: "Okean, kecha",
      C: "Kecha, telefon, ekran, ne'mat",
      D: "Material, teatr, okean",
      correct: "A",
    },
    {
      question: "Yana ular futbol haqida nazariy bilimlarga ega bo'lishimizni talab qiladilar. Ushbu gapdagi ko'makchining ma'no turini belgilang.",
      A: "maqsad ma'nosi",
      B: "yo'nalish ma'nosi",
      C: "chegara ma'nosi",
      D: "fikr mavzusi ma'nosi",
      correct: "D",
    },
    {
      question: "Qaysi gapda \"ma'lum vaqt, fursat uchun yig'ib tayyorlab qo'ymoq\" ma'nosini bildiruvchi so'z ajratilgan?",
      A: "Kitob sifatli chiqishi uchun yangi testlar tuzish kerak",
      B: "Yuklarni ko'chishga tayyorlab qo'ydik",
      C: "Bu sohaga oid barcha terminlarni bir kitobga jamladim",
      D: "Qish uchun o'tin g'amlash kerak hali, bolam",
      correct: "D",
    },
    {
      question: "Qaysi javobdagi so'zlar o'zaro ma'nodosh bo'la olmaydi?",
      A: "ayon, aniq",
      B: "ko'rk, chiroy",
      C: "gavdali, norg'ul",
      D: "mazali, lazzat",
      correct: "D",
    },
  ],
  "Ingliz tili": [
    {
      question: "Choose the answer which correctly completes the sentence. Faced with petroleum shortages in the 1970's, scientists and ... in the United States stepped up their efforts to develop more efficient heating systems.",
      A: "engineer's",
      B: "engineers'",
      C: "engineer",
      D: "engineers",
      correct: "D",
    },
    {
      question: "Choose the answer which correctly completes the sentence. Lettuce ... good for you. Eat more fresh fruit and vegetables.",
      A: "been",
      B: "being",
      C: "are",
      D: "is",
      correct: "D",
    },
    {
      question: "Choose the answer which correctly completes the sentence. The money I make ... enough to live on.",
      A: "are",
      B: "were",
      C: "has been",
      D: "is",
      correct: "D",
    },
    {
      question: "Choose the best answer. Money is a spoiling thing: the more you have ... the more you want ....",
      A: "it / them",
      B: "- / them",
      C: "them / it",
      D: "it / it",
      correct: "D",
    },
    {
      question: "Choose the right answer. I've just heard the weather forecast and ... say there's going to be more snow.",
      A: "they",
      B: "he",
      C: "we",
      D: "it",
      correct: "A",
    },
    {
      question: "Choose the suitable pronouns instead of the underlined nouns. A woman was sitting in the armchair watching the birds' flight.",
      A: "he / it / them",
      B: "she / she / them",
      C: "she / in / them",
      D: "she / it / their",
      correct: "D",
    },
    {
      question: "Choose the appropriate pronouns. The high prices affected the poor.",
      A: "they / them",
      B: "you / them",
      C: "they / her",
      D: "he / him",
      correct: "A",
    },
    {
      question: "Choose the appropriate pronouns. I've never heard ... speak to ....",
      A: "she / he",
      B: "them / they",
      C: "her / him",
      D: "you / they",
      correct: "C",
    },
    {
      question: "Choose the appropriate form of the adjective. This film is as ... as that one.",
      A: "more interesting",
      B: "the most interesting",
      C: "interesting",
      D: "most interesting",
      correct: "C",
    },
    {
      question: "Choose the best answer. We don't read ... books ... they do.",
      A: "as more / as",
      B: "as most / as",
      C: "as many / as",
      D: "as many / so",
      correct: "C",
    },
    {
      question: "Choose the best answer. I wanted to go but I've gone ... the idea.",
      A: "off",
      B: "away",
      C: "on",
      D: "of",
      correct: "A",
    },
    {
      question: "Choose the answer which correctly completes the sentence. The farmer was really very upset and warned us to get ... his land.",
      A: "off",
      B: "over",
      C: "from",
      D: "of",
      correct: "A",
    },
    {
      question: "Choose the answer which correctly completes the sentence. I wish you'd turn the radio ..., it's too loud!",
      A: "down",
      B: "on",
      C: "up",
      D: "of",
      correct: "A",
    },
    {
      question: "Choose the appropriate form of the adjective. Unfortunately she was ... seriously hurt than we thought at first.",
      A: "the most",
      B: "-",
      C: "more",
      D: "most",
      correct: "C",
    },
    {
      question: "Choose the answer which correctly completes the sentence. The smaller a garden is ... it is to look after.",
      A: "the easier",
      B: "easier",
      C: "more easy",
      D: "more difficult",
      correct: "A",
    },
    {
      question: "Choose the answer which correctly completes the sentence. The louder he shouted, ... he convinced anyone.",
      A: "more",
      B: "lesser",
      C: "the most",
      D: "the less",
      correct: "D",
    },
    {
      question: "Choose the answer which correctly completes the sentence. It is a well-known fact that William Shakespeare was both a playwright ... an actor.",
      A: "but also",
      B: "as well as",
      C: "such",
      D: "and",
      correct: "D",
    },
    {
      question: "He was tired. ... he went to bed early.",
      A: "but",
      B: "also",
      C: "because",
      D: "so",
      correct: "D",
    },
    {
      question: "Complete the sentence. I got up very early yesterday, ...?",
      A: "do I",
      B: "haven't I",
      C: "isn't he",
      D: "didn't I",
      correct: "D",
    },
    {
      question: "Complete the sentence. This winter is not very cold, ...?",
      A: "isn't it",
      B: "is it",
      C: "does it",
      D: "won't it",
      correct: "B",
    },
    {
      question: "Choose the appropriate form of the verb. If you think he ... a liar why do you consult him?",
      A: "be",
      B: "to be",
      C: "being",
      D: "is",
      correct: "D",
    },
    {
      question: "Choose the right answer. Could you give me Setora's telephone number? I wonder ... Setora's telephone number.",
      A: "if could you give me",
      B: "if I could give you",
      C: "if you could give me",
      D: "could you give me",
      correct: "C",
    },
    {
      question: "Choose the answer which correctly completes the sentence. Mother said to her children, \"Don't make so much noise, father is sleeping\" Mother told her children ... sleeping.",
      A: "not to make so much noise, father was",
      B: "not to make so much noise, father is",
      C: "don't make so much noise, father was",
      D: "don't make much noise, father is",
      correct: "A",
    },
    {
      question: "Choose the correct answer. He said: \"Let's go out\".",
      A: "He suggested going out",
      B: "He suggested me that we shall go out",
      C: "He said that they will go out",
      D: "He suggested to go out",
      correct: "A",
    },
    {
      question: "Complete the extract. Those who are fond of sports watch football and hockey games on TV.",
      A: "I am fond of football",
      B: "People should take care of themselves",
      C: "They also go to the stadium and enjoy the game there",
      D: "Where is the sport club",
      correct: "C",
    },
    {
      question: "Choose the appropriate conclusion which may be taken from the following facts. He has a good tan.",
      A: "he is going to live in the South next year",
      B: "he needn't have to live in the South",
      C: "he must have lived in the South for a long time",
      D: "he could have lived in the South",
      correct: "C",
    },
    {
      question: "Choose the best answer. Don't worry if ....",
      A: "we didn't come",
      B: "it rained heavily",
      C: "they don't come on time",
      D: "was late for the train",
      correct: "C",
    },
    {
      question: "Choose the best sentence to continue the idea. You'd better take a bus to the city centre.",
      A: "It's too far to walk",
      B: "It's easy to find",
      C: "It's too early to sleep",
      D: "It's too close to go",
      correct: "A",
    },
    {
      question: "Complete the sentence. - Their parents are very intelligent, ...",
      A: "- but their children are stupid",
      B: "- I saw them yesterday",
      C: "- I don't know where they work",
      D: "- yes, you are right. They are not a tight family",
      correct: "A",
    },
    {
      question: "Choose the best answer. If x equals 10, what is 5x equal to?",
      A: "fifty",
      B: "forty",
      C: "ten",
      D: "fifteen",
      correct: "A",
    },
  ],
  "Nemis tili": [],
  "Fransuz tili": [],
  "Rus tili": [],
};

let isSeeded = false;

async function ensureDtmSeedData() {
  if (isSeeded) return;
  const activeDirectionIds = defaultDirections.map((direction) => direction.id);

  await prisma.direction.updateMany({
    where: { id: { notIn: activeDirectionIds } },
    data: { isActive: false },
  });

  for (const direction of defaultDirections) {
    await prisma.direction.upsert({
      where: { id: direction.id },
      update: {
        name: direction.name,
        description: direction.description,
        isActive: true,
      },
      create: {
        id: direction.id,
        name: direction.name,
        description: direction.description,
        isActive: true,
      },
    });
  }

  for (const subject of defaultSubjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {
        description: subject.description,
        directionId: subject.directionId,
      },
      create: {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        directionId: subject.directionId,
      },
    });
  }

  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true },
  });

  for (const subject of subjects) {
    const existingCount = await prisma.testQuestion.count({
      where: { subjectId: subject.id },
    });

    if (existingCount > 0) continue;

    const tests = defaultTestsBySubject[subject.name] ?? [];
    if (tests.length === 0) continue;

    await prisma.testQuestion.createMany({
      data: tests.map((test) => ({
        subjectId: subject.id,
        question: test.question,
        optionA: test.A,
        optionB: test.B,
        optionC: test.C,
        optionD: test.D,
        correct: test.correct,
      })),
    });
  }

  isSeeded = true;
}

function getCorrectIndex(correct: string): number {
  const normalized = correct.toUpperCase();
  if (normalized === "A") return 0;
  if (normalized === "B") return 1;
  if (normalized === "C") return 2;
  return 3;
}

export async function dtmRoutes(app: FastifyInstance) {
  // 1) Home page data
  // GET /api/dashboard
  app.get(
    "/dashboard",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const userId = request.user.id;

      const stats = await prisma.testResult.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { score: true, totalQuestions: true, coinsEarned: true },
      });

      const recentResults = await prisma.testResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { subject: { select: { id: true, name: true } } },
      });

      return {
        stats: {
          totalTests: stats._count.id ?? 0,
          correctAnswers: stats._sum.score ?? 0,
          totalQuestions: stats._sum.totalQuestions ?? 0,
          coins: stats._sum.coinsEarned ?? 0,
        },
        recentResults: recentResults.map((result) => ({
          id: result.id,
          subjectId: result.subject.id,
          subjectName: result.subject.name,
          score: result.score,
          totalQuestions: result.totalQuestions,
          createdAt: result.createdAt.toISOString(),
          coinsEarned: result.coinsEarned,
        })),
      };
    }
  );

  // 2) Directions page
  // GET /api/directions
  app.get("/directions", async () => {
    await ensureDtmSeedData();
    return prisma.direction.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  });

  // 3) Subjects page
  // GET /api/directions/:directionId/subjects
  app.get(
    "/directions/:directionId/subjects",
    async (
      request: FastifyRequest<{ Params: { directionId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const directionId = Number.parseInt(request.params.directionId, 10);
      if (Number.isNaN(directionId)) {
        return reply.code(400).send({ error: "directionId noto'g'ri" });
      }

      const subjects = await prisma.subject.findMany({
        where: { directionId },
        orderBy: { id: "asc" },
        select: {
          id: true,
          directionId: true,
          name: true,
          description: true,
          _count: { select: { testQuestions: true } },
        },
      });

      return subjects.map((subject) => ({
        id: subject.id,
        directionId: subject.directionId,
        name: subject.name,
        description: subject.description,
        questionCount: subject._count.testQuestions,
      }));
    }
  );

  // Legacy support: GET /api/subjects?directionId=...
  app.get(
    "/subjects",
    async (request: FastifyRequest<{ Querystring: { directionId?: string } }>) => {
    await ensureDtmSeedData();
    const directionId = request.query.directionId
      ? Number.parseInt(request.query.directionId, 10)
      : undefined;

    if (request.query.directionId && Number.isNaN(directionId)) {
      return [];
    }

    const subjects = await prisma.subject.findMany({
      where: directionId ? { directionId } : undefined,
      orderBy: { id: "asc" },
      select: {
        id: true,
        directionId: true,
        name: true,
        description: true,
      },
    });

    return subjects;
    }
  );

  // 4) Test list/start page
  // GET /api/subjects/:subjectId/tests
  app.get(
    "/subjects/:subjectId/tests",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: { _count: { select: { testQuestions: true } } },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      return [
        {
          id: subject.id,
          subjectId: subject.id,
          title: `${subject.name} testi`,
          description: subject.description,
          questionCount: subject._count.testQuestions,
          durationSec: Math.max(subject._count.testQuestions * 60, 300),
        },
      ];
    }
  );

  // GET /api/tests/:subjectId (legacy)
  app.get(
    "/tests/:subjectId",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const tests = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
      });

      return tests.map((test) => ({
        id: test.id,
        question: test.question,
        A: test.optionA,
        B: test.optionB,
        C: test.optionC,
        D: test.optionD,
        correct: test.correct as "A" | "B" | "C" | "D",
      }));
    }
  );

  // 5) Test page
  // GET /api/tests/:subjectId/start
  app.get(
    "/tests/:subjectId/start",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, description: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      const questions = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
      });

      return {
        test: {
          id: subject.id,
          subjectId: subject.id,
          title: `${subject.name} testi`,
          description: subject.description,
          durationSec: Math.max(questions.length * 60, 300),
          questionCount: questions.length,
        },
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: [
            { key: "A", text: q.optionA },
            { key: "B", text: q.optionB },
            { key: "C", text: q.optionC },
            { key: "D", text: q.optionD },
          ],
        })),
      };
    }
  );

  // POST /api/tests/:subjectId/submit
  app.post(
    "/tests/:subjectId/submit",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Params: { subjectId: string };
        Body: { answers: number[] };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const subjectId = Number.parseInt(request.params.subjectId, 10);
      const answers = Array.isArray(request.body?.answers) ? request.body.answers : [];

      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      const questions = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
        select: { id: true, correct: true },
      });

      const total = questions.length;
      let correctCount = 0;

      questions.forEach((q, idx) => {
        if (answers[idx] === getCorrectIndex(q.correct)) {
          correctCount += 1;
        }
      });

      const coinsEarned = Math.max(0, Math.round((correctCount / Math.max(total, 1)) * 10));

      const result = await prisma.testResult.create({
        data: {
          userId,
          subjectId,
          score: correctCount,
          totalQuestions: total,
          answers,
          coinsEarned,
        },
      });

      const totals = await prisma.testResult.aggregate({
        where: { userId },
        _sum: { coinsEarned: true },
      });

      return {
        resultId: result.id,
        subjectId,
        subjectName: subject.name,
        score: correctCount,
        totalQuestions: total,
        percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0,
        coinsEarned,
        totalCoins: totals._sum.coinsEarned ?? 0,
      };
    }
  );

  // Legacy: POST /api/results
  app.post(
    "/results",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Body: { subjectId: number; score: number; total: number; answers?: number[] };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { subjectId, score, total, answers = [] } = request.body;

      if (!subjectId || score === undefined || !total) {
        return reply.code(400).send({ error: "subjectId, score va total majburiy" });
      }

      const safeScore = Math.max(0, score);
      const safeTotal = Math.max(1, total);
      const coinsEarned = Math.max(0, Math.round((safeScore / safeTotal) * 10));
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      await prisma.testResult.create({
        data: {
          userId,
          subjectId,
          score: safeScore,
          totalQuestions: safeTotal,
          answers,
          coinsEarned,
        },
      });

      const totals = await prisma.testResult.aggregate({
        where: { userId },
        _sum: { coinsEarned: true },
      });

      return reply.send({
        message: "Natija saqlandi",
        coinsEarned,
        totalCoins: totals._sum.coinsEarned ?? 0,
      });
    }
  );

  // GET /api/results
  app.get(
    "/results",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const results = await prisma.testResult.findMany({
        where: { userId: request.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          subject: {
            select: { name: true },
          },
        },
      });

      return results.map((result) => ({
        subjectId: result.subjectId,
        subjectName: result.subject.name,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers ?? [],
        date: result.createdAt.toISOString(),
        coinsEarned: result.coinsEarned,
      }));
    }
  );

  // GET /api/results/:resultId
  app.get(
    "/results/:resultId",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { resultId: string } }>,
      reply: FastifyReply
    ) => {
      const result = await prisma.testResult.findFirst({
        where: {
          id: request.params.resultId,
          userId: request.user.id,
        },
        include: {
          subject: {
            select: { id: true, name: true },
          },
        },
      });

      if (!result) {
        return reply.code(404).send({ error: "Natija topilmadi" });
      }

      return {
        id: result.id,
        subjectId: result.subject.id,
        subjectName: result.subject.name,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage:
          result.totalQuestions > 0
            ? Math.round((result.score / result.totalQuestions) * 100)
            : 0,
        coinsEarned: result.coinsEarned,
        answers: result.answers ?? [],
        createdAt: result.createdAt.toISOString(),
      };
    }
  );

  // GET /api/stats
  app.get(
    "/stats",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const stats = await prisma.testResult.aggregate({
        where: { userId: request.user.id },
        _count: { id: true },
        _sum: {
          score: true,
          totalQuestions: true,
          coinsEarned: true,
        },
      });

      return {
        totalTests: stats._count.id ?? 0,
        correctAnswers: stats._sum.score ?? 0,
        totalQuestions: stats._sum.totalQuestions ?? 0,
        totalScore: stats._sum.score ?? 0,
        coins: stats._sum.coinsEarned ?? 0,
      };
    }
  );

  // ============================================
  // DTM COMBINED TEST ENDPOINTS (90 ta savol)
  // ============================================

  // GET /api/dtm-test/start - 90 ta savolni bitta testda olish
  app.get(
    "/dtm-test/start",
    { preHandler: [app.authenticate as any] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      await ensureDtmSeedData();

      // Fanlarni olish
      const tarixSubject = await prisma.subject.findFirst({ where: { name: "Tarix" } });
      const inglizSubject = await prisma.subject.findFirst({ where: { name: "Ingliz tili" } });
      const onaTiliSubject = await prisma.subject.findFirst({ where: { name: "Ona tili va adabiyoti" } });
      const matSubject = await prisma.subject.findFirst({ where: { name: "Matematika" } });

      if (!tarixSubject || !inglizSubject || !onaTiliSubject || !matSubject) {
        return reply.code(500).send({ error: "Fanlar topilmadi. Seed data yuklanmagan." });
      }

      // Savollarni olish
      const tarixQuestions = await prisma.testQuestion.findMany({
        where: { subjectId: tarixSubject.id },
        orderBy: { id: "asc" },
      });
      const inglizQuestions = await prisma.testQuestion.findMany({
        where: { subjectId: inglizSubject.id },
        orderBy: { id: "asc" },
      });
      const onaTiliQuestions = await prisma.testQuestion.findMany({
        where: { subjectId: onaTiliSubject.id },
        orderBy: { id: "asc" },
      });
      const matQuestions = await prisma.testQuestion.findMany({
        where: { subjectId: matSubject.id },
        orderBy: { id: "asc" },
      });

      // Tarixni bo'lish: birinchi 30 ta = fan1, oxirgi 10 ta = majburiy
      const tarixFan1 = tarixQuestions.slice(0, 30);
      const tarixMajburiy = tarixQuestions.slice(30, 40);

      // Savollarni tartiblab birlashtirish (1-90)
      const formatQ = (q: any) => ({
        id: q.id,
        question: q.question,
        options: [
          { key: "A", text: q.optionA },
          { key: "B", text: q.optionB },
          { key: "C", text: q.optionC },
          { key: "D", text: q.optionD },
        ],
      });

      const allQuestions = [
        ...tarixFan1.map(formatQ),         // 1-30: Tarix (fan1)
        ...inglizQuestions.map(formatQ),    // 31-60: Ingliz tili (fan2)
        ...onaTiliQuestions.map(formatQ),   // 61-70: Ona tili (majburiy)
        ...matQuestions.map(formatQ),       // 71-80: Matematika (majburiy)
        ...tarixMajburiy.map(formatQ),     // 81-90: Tarix (majburiy)
      ];

      return {
        test: {
          title: "DTM online test topshirish 2026",
          totalQuestions: allQuestions.length,
          durationSec: 5400, // 90 daqiqa
        },
        sections: [
          { name: "Tarix", code: "DTM_10218", type: "fan1", startIndex: 0, count: 30, pointsPerQuestion: DTM_SCORING.fan1 },
          { name: "Chet tili", code: "DTM_10218", type: "fan2", startIndex: 30, count: 30, pointsPerQuestion: DTM_SCORING.fan2 },
          { name: "Ona tili", code: "DTM_10406", type: "majburiy", startIndex: 60, count: 10, pointsPerQuestion: DTM_SCORING.majburiy },
          { name: "Matematika", code: "DTM_10406", type: "majburiy", startIndex: 70, count: 10, pointsPerQuestion: DTM_SCORING.majburiy },
          { name: "Tarix", code: "DTM_10406", type: "majburiy", startIndex: 80, count: 10, pointsPerQuestion: DTM_SCORING.majburiy },
        ],
        questions: allQuestions,
      };
    }
  );

  // POST /api/dtm-test/submit - 90 ta javobni tekshirish
  app.post(
    "/dtm-test/submit",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Body: { answers: number[]; duration?: number };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const userAnswers = Array.isArray(request.body?.answers) ? request.body.answers : [];
      const duration = request.body?.duration ?? 0;

      // javoblar.txt dan to'g'ri javoblarni o'qish
      const correctAnswers = parseJavoblar();
      if (correctAnswers.size === 0) {
        return reply.code(500).send({ error: "Javoblar fayli topilmadi yoki bo'sh" });
      }

      const indexToLetter = (idx: number): string => {
        if (idx === 0) return "A";
        if (idx === 1) return "B";
        if (idx === 2) return "C";
        return "D";
      };

      // Har bir savolni tekshirish
      const questionResults: boolean[] = [];
      for (let i = 0; i < 90; i++) {
        const questionNum = i + 1;
        const correctLetter = correctAnswers.get(questionNum);
        const userLetter = userAnswers[i] !== undefined && userAnswers[i] !== -1
          ? indexToLetter(userAnswers[i])
          : null;
        questionResults.push(userLetter === correctLetter);
      }

      // Bo'limlar bo'yicha hisoblash
      const calcSection = (start: number, count: number, pointsPerQ: number) => {
        let correct = 0;
        for (let i = start; i < start + count; i++) {
          if (questionResults[i]) correct++;
        }
        return {
          correct,
          total: count,
          ball: Math.round(correct * pointsPerQ * 10) / 10,
        };
      };

      const fan1 = calcSection(0, 30, DTM_SCORING.fan1);     // Tarix
      const fan2 = calcSection(30, 30, DTM_SCORING.fan2);    // Ingliz tili
      const majburiyOna = calcSection(60, 10, DTM_SCORING.majburiy);  // Ona tili
      const majburiyMat = calcSection(70, 10, DTM_SCORING.majburiy);  // Matematika
      const majburiyTarix = calcSection(80, 10, DTM_SCORING.majburiy); // Tarix

      const majburiy = {
        correct: majburiyOna.correct + majburiyMat.correct + majburiyTarix.correct,
        total: 30,
        ball: Math.round((majburiyOna.ball + majburiyMat.ball + majburiyTarix.ball) * 10) / 10,
      };

      const jami = {
        correct: fan1.correct + fan2.correct + majburiy.correct,
        total: 90,
        ball: Math.round((fan1.ball + fan2.ball + majburiy.ball) * 10) / 10,
      };

      const percentage = Math.round((jami.correct / 90) * 1000) / 10;

      // Natijani saqlash (Tarix subject bilan bog'lash)
      const tarixSubject = await prisma.subject.findFirst({ where: { name: "Tarix" } });
      const coinsEarned = Math.max(0, Math.round((jami.correct / 90) * 10));

      const result = await prisma.testResult.create({
        data: {
          userId,
          subjectId: tarixSubject?.id ?? 5,
          score: jami.correct,
          totalQuestions: 90,
          answers: userAnswers,
          coinsEarned,
        },
      });

      // Foydalanuvchi ma'lumotlarini olish
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const fullName = user ? `${user.lastName} ${user.firstName}`.trim() : "Foydalanuvchi";

      const now = new Date();
      const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
      const dateStr = `${now.getDate()}-${months[now.getMonth()]}, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const durationMin = Math.round(duration / 60);

      return {
        resultId: result.id,
        fan1: { name: "Tarix", ...fan1 },
        fan2: { name: "Chet tili", ...fan2 },
        majburiy: { name: "Majburiy fanlar", ...majburiy },
        jami,
        percentage,
        user: { name: fullName },
        date: dateStr,
        duration: `${durationMin} daq.`,
        questionResults,
      };
    }
  );

  // GET /api/dtm-test/result/:resultId - Natijani ko'rish
  app.get(
    "/dtm-test/result/:resultId",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { resultId: string } }>,
      reply: FastifyReply
    ) => {
      const result = await prisma.testResult.findFirst({
        where: {
          id: request.params.resultId,
          userId: request.user.id,
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      });

      if (!result) {
        return reply.code(404).send({ error: "Natija topilmadi" });
      }

      const resultFullName = result.user ? `${result.user.lastName} ${result.user.firstName}`.trim() : "Foydalanuvchi";

      // javoblar.txt dan to'g'ri javoblarni o'qish
      const correctAnswers = parseJavoblar();
      const userAnswers = (result.answers as number[]) ?? [];

      const indexToLetter = (idx: number): string => {
        if (idx === 0) return "A";
        if (idx === 1) return "B";
        if (idx === 2) return "C";
        return "D";
      };

      const questionResults: boolean[] = [];
      for (let i = 0; i < 90; i++) {
        const questionNum = i + 1;
        const correctLetter = correctAnswers.get(questionNum);
        const userLetter = userAnswers[i] !== undefined && userAnswers[i] !== -1
          ? indexToLetter(userAnswers[i])
          : null;
        questionResults.push(userLetter === correctLetter);
      }

      const calcSection = (start: number, count: number, pointsPerQ: number) => {
        let correct = 0;
        for (let i = start; i < start + count; i++) {
          if (questionResults[i]) correct++;
        }
        return {
          correct,
          total: count,
          ball: Math.round(correct * pointsPerQ * 10) / 10,
        };
      };

      const fan1 = calcSection(0, 30, DTM_SCORING.fan1);
      const fan2 = calcSection(30, 30, DTM_SCORING.fan2);
      const majburiyOna = calcSection(60, 10, DTM_SCORING.majburiy);
      const majburiyMat = calcSection(70, 10, DTM_SCORING.majburiy);
      const majburiyTarix = calcSection(80, 10, DTM_SCORING.majburiy);

      const majburiy = {
        correct: majburiyOna.correct + majburiyMat.correct + majburiyTarix.correct,
        total: 30,
        ball: Math.round((majburiyOna.ball + majburiyMat.ball + majburiyTarix.ball) * 10) / 10,
      };

      const jami = {
        correct: fan1.correct + fan2.correct + majburiy.correct,
        total: 90,
        ball: Math.round((fan1.ball + fan2.ball + majburiy.ball) * 10) / 10,
      };

      const percentage = Math.round((jami.correct / 90) * 1000) / 10;

      const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
      const d = result.createdAt;
      const dateStr = `${d.getDate()}-${months[d.getMonth()]}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

      return {
        resultId: result.id,
        fan1: { name: "Tarix", ...fan1 },
        fan2: { name: "Chet tili", ...fan2 },
        majburiy: { name: "Majburiy fanlar", ...majburiy },
        jami,
        percentage,
        user: { name: resultFullName },
        date: dateStr,
        questionResults,
      };
    }
  );
}
