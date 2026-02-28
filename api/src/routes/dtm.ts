import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";

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
      question: "2x + 5 = 13 tenglamada x qiymatini toping",
      A: "2",
      B: "3",
      C: "4",
      D: "5",
      correct: "C",
    },
    {
      question: "9 ning kvadrat ildizi nechiga teng?",
      A: "2",
      B: "3",
      C: "4",
      D: "5",
      correct: "B",
    },
  ],
  Fizika: [
    {
      question: "SI tizimida kuch birligi qaysi?",
      A: "Joul",
      B: "Nyuton",
      C: "Vatt",
      D: "Paskal",
      correct: "B",
    },
    {
      question: "Tok kuchi qanday belgilanadi?",
      A: "I",
      B: "U",
      C: "R",
      D: "P",
      correct: "A",
    },
  ],
  Kimyo: [
    {
      question: "Suvning kimyoviy formulasi qaysi?",
      A: "CO2",
      B: "O2",
      C: "H2O",
      D: "NaCl",
      correct: "C",
    },
    {
      question: "Periodik jadvalni kim yaratgan?",
      A: "Mendeleev",
      B: "Faradey",
      C: "Nyuton",
      D: "Eynshteyn",
      correct: "A",
    },
  ],
  Biologiya: [
    {
      question: "Fotosintez asosan qaysi organellada sodir bo'ladi?",
      A: "Yadro",
      B: "Mitoxondriya",
      C: "Xloroplast",
      D: "Ribosoma",
      correct: "C",
    },
    {
      question: "Inson organizmida kislorod tashuvchi oqsil qaysi?",
      A: "Insulin",
      B: "Gemoglobin",
      C: "Kollagen",
      D: "Keratin",
      correct: "B",
    },
  ],
  Tarix: [
    // 1-30: Asosiy tarix savollari
    {
      question: "Ismoil G'aspirali yashagan yillarni aniqlang?",
      A: "1851-1914-yillar",
      B: "1869-1932-yillar",
      C: "1878-1931-yillar",
      D: "1874-1919-yillar",
      correct: "A",
    },
    {
      question: "Fors shohligi tomonidan Bobil zabt etilgan asrda yuz bergan voqeani aniqlang.",
      A: "Qadimgi Baqtriya davlati tashkil topdi",
      B: "Apennin yarimorolida Etrusk shahar-davlatlari tashkil topgan",
      C: "Frada boshchiligidagi qo'zg'olon yuz bergan",
      D: "Afina o'z kuch-qudratining cho'qqisiga ko'tarilgan",
      correct: "C",
    },
    {
      question: "Afinada demokratiyaga o'tilganidan qancha vaqt o'tib, Rimda respublika tuzumi o'rnatildi?",
      A: "112 yil",
      B: "102 yil",
      C: "75 yil",
      D: "85 yil",
      correct: "A",
    },
    {
      question: "Italiyaning Florensiya shahrida italiyalik olim Perondinoning \"Skifiyalik Tamerlanning ulug'vorligi\" asari (a) va Seveliyada mashhur Ispaniya elchisi Klavixoning \"Esdaliklari\" kitobi (b) nashrdan chiqqan yillarni belgilang.",
      A: "a) 1556-yili, b) 1587-yili",
      B: "a) 1558-yili, b) 1589-yili",
      C: "a) 1553-yili, b) 1582-yili",
      D: "a) 1551-yili, b) 1583-yili",
      correct: "D",
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
      correct: "C",
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
  Huquq: [
    {
      question: "O'zbekiston Respublikasi Konstitutsiyasi qachon qabul qilingan?",
      A: "1991-yil 1-sentyabr",
      B: "1992-yil 8-dekabr",
      C: "1993-yil 1-yanvar",
      D: "1990-yil 20-iyun",
      correct: "B",
    },
    {
      question: "Qonun chiqaruvchi hokimiyatni kim amalga oshiradi?",
      A: "Vazirlar Mahkamasi",
      B: "Prezident",
      C: "Oliy Majlis",
      D: "Konstitutsiyaviy sud",
      correct: "C",
    },
  ],
  Geografiya: [
    {
      question: "O'zbekistonning poytaxti qaysi shahar?",
      A: "Samarqand",
      B: "Buxoro",
      C: "Toshkent",
      D: "Namangan",
      correct: "C",
    },
    {
      question: "Dunyodagi eng baland tog' cho'qqisi qaysi?",
      A: "Elbrus",
      B: "Everest",
      C: "Kilimanjaro",
      D: "Monblan",
      correct: "B",
    },
  ],
  "Ona tili va adabiyoti": [
    {
      question: "Alisher Navoiy qaysi asrda yashagan?",
      A: "XIII asr",
      B: "XIV asr",
      C: "XV asr",
      D: "XVI asr",
      correct: "C",
    },
    {
      question: "'Hamsa' asarining muallifi kim?",
      A: "Bobur",
      B: "Navoiy",
      C: "Mashrab",
      D: "Lutfiy",
      correct: "B",
    },
  ],
  "Ingliz tili": [
    {
      question: "Choose the correct form: She ___ to school every day.",
      A: "go",
      B: "goes",
      C: "going",
      D: "gone",
      correct: "B",
    },
    {
      question: "What is the past tense of 'buy'?",
      A: "buyed",
      B: "buyd",
      C: "bought",
      D: "boughted",
      correct: "C",
    },
  ],
  "Nemis tili": [
    {
      question: "Wie sagt man 'salom' auf Deutsch?",
      A: "Danke",
      B: "Bitte",
      C: "Hallo",
      D: "Tschüss",
      correct: "C",
    },
    {
      question: "'Ich bin Student' jumlasi qanday tarjima qilinadi?",
      A: "Men o'qituvchiman",
      B: "Men talabaman",
      C: "Men shifokorman",
      D: "Men muhandisman",
      correct: "B",
    },
  ],
  "Fransuz tili": [
    {
      question: "Comment dit-on 'rahmat' en français?",
      A: "Bonjour",
      B: "Merci",
      C: "Salut",
      D: "Pardon",
      correct: "B",
    },
    {
      question: "'Je suis étudiant' jumlasi qanday tarjima qilinadi?",
      A: "Men o'qituvchiman",
      B: "Men shifokorman",
      C: "Men talabaman",
      D: "Men muhandisman",
      correct: "C",
    },
  ],
  "Rus tili": [
    {
      question: "'Здравствуйте' so'zining tarjimasi qanday?",
      A: "Xayr",
      B: "Rahmat",
      C: "Assalomu alaykum",
      D: "Kechirasiz",
      correct: "C",
    },
    {
      question: "Rus tilida nechta harf bor?",
      A: "26",
      B: "29",
      C: "33",
      D: "36",
      correct: "C",
    },
  ],
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
}
