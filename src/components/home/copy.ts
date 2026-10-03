import type { Lang } from "@/lib/i18n";
import type { PhotoKey } from "./photos";

/*
 * Public-site copy in English and Bangla (landing page, site header, footer, page metadata).
 * Every statistic carries its source next to it; when a figure changes, update both languages.
 *
 * Sources
 *  - UNEP Food Waste Index Report 2024: Bangladesh households waste ~14.1 million t a year, 82 kg per person
 *    (US 73, China 76, India 55). Daily/monthly figures are that annual estimate divided evenly.
 *  - World Bank study presented in Dhaka, 29 Sep 2025: 34% of available food lost or wasted, ~4% of GDP,
 *    13% of greenhouse emissions (29 Mt CO2e), 27% of cultivated land, 66% can't afford a healthy diet,
 *    commodity loss rates.
 *  - FAO SOFI 2026: 26.2% (≈45.4 million) moderately or severely food insecure, 2023–2025.
 *  - IPC Bangladesh, July 2026: 18.1 million projected in IPC Phase 3+ for Sep–Dec 2026, 787,000 in Phase 4.
 *  - Bangladesh Demographic and Health Survey 2022: 24% of children under five stunted.
 */

/** Household food waste per second, from the UNEP annual estimate (14.1 Mt ÷ seconds in a year). */
export const WASTE_KG_PER_SECOND = 14_100_000_000 / (365 * 24 * 60 * 60);

type Story = { photo: PhotoKey; title: string; text: string };

const en = {
  meta: {
    title: "Food Donation in Bangladesh: Donate Surplus Food & Fight Hunger | FoodBridge",
    description:
      "Bangladeshi households waste 14.1 million tonnes of food a year while 45 million people face food insecurity. FoodBridge connects surplus food from restaurants, weddings and homes in Dhaka with verified NGOs and volunteers.",
  },
  nav: {
    problem: "Food waste",
    hunger: "Hunger",
    how: "How it works",
    impact: "Impact",
    join: "Get involved",
    login: "Log in",
    donate: "Donate food",
    dashboard: "My dashboard",
    openMenu: "Open menu",
    language: "Language",
  },
  photo: { credit: "Photo", via: "Wikimedia Commons" },
  hero: {
    kicker: "Surplus food donation in Bangladesh",
    title1: "Tonight, good food will be thrown away in Dhaka.",
    title2: "A few streets away, someone will sleep hungry.",
    lede: "FoodBridge is the bridge between the two. Restaurants, wedding halls, shops and homes post the food they have left. A verified NGO nearby accepts it, and a volunteer carries it across the city while it’s still fresh.",
    ctaDonate: "Donate surplus food",
    ctaHow: "See how it works",
    trust: ["Free for donors", "Verified NGOs", "Food-safety checks on every post"],
    bgAlt: "A rickshaw puller on a Dhaka street at night.",
    photoAlt: "Many open hands reaching towards a handful of rice.",
    photoCaption: "The food exists. It just doesn’t reach the hands waiting for it.",
    strip: [
      { value: "14.1M t", label: "of food wasted by households every year", source: "UNEP 2024" },
      { value: "45.4M", label: "people can’t count on enough food", source: "FAO 2026" },
      { value: "34%", label: "of the country’s food is lost or wasted", source: "World Bank 2025" },
    ],
  },
  waste: {
    eyebrow: "Food waste in Bangladesh",
    title: "How much food is wasted in Bangladesh? 38,600 tonnes, every single day",
    lede: "Bangladeshi households alone throw away an estimated 14.1 million tonnes of food a year. That’s 82 kg for every person: more than households in the United States or China.",
    counterLabel: "Food wasted by households in Bangladesh since you opened this page",
    counterUnit: "kg",
    counterRate: "about 447 kg every second",
    clock: [
      { value: "38,600", unit: "tonnes", label: "every day" },
      { value: "1.18 million", unit: "tonnes", label: "every month" },
      { value: "14.1 million", unit: "tonnes", label: "every year" },
      { value: "82 kg", unit: "", label: "per person a year, about 225 g a day" },
    ],
    clockSource: "UNEP Food Waste Index Report 2024 (household food waste). Daily and monthly figures divide the annual estimate evenly.",
    compareTitle: "Household food waste per person (kg a year)",
    compare: [
      { label: "Bangladesh", value: 82 },
      { label: "China", value: 76 },
      { label: "United States", value: 73 },
      { label: "India", value: 55 },
    ],
    compareSource: "UNEP Food Waste Index Report 2024",
    chainTitle: "Across the whole food chain, from farm to plate",
    chain: [
      { value: "34%", label: "of available food is lost or wasted" },
      { value: "4%", label: "of GDP is lost with it" },
      { value: "13%", label: "of national greenhouse emissions (29 Mt CO₂e)" },
      { value: "27%", label: "of farmland grows food that nobody eats" },
    ],
    lossTitle: "Share lost or wasted, by food",
    loss: [
      { label: "Tomato", value: 27.9 },
      { label: "Lentils", value: 27 },
      { label: "Carrot", value: 26.8 },
      { label: "Rice", value: 23 },
      { label: "Potato", value: 21.8 },
      { label: "Banana", value: 19.9 },
    ],
    chainSource: "World Bank study presented in Dhaka, 29 September 2025",
    marketAlt: "Crowds and heaped trays of food at the Chawkbazar iftar market in Old Dhaka.",
    marketCaption: "Chawkbazar, Old Dhaka: plenty on display every Ramadan evening. What isn’t sold by night often isn’t eaten.",
    storiesTitle: "Where Bangladesh’s food waste happens",
    stories: [
      {
        photo: "wasteHoludFeast",
        title: "Cooked for hundreds",
        text: "Holud nights and weddings are planned for big crowds. When the guests leave, trays of untouched food often have nowhere to go.",
      },
      {
        photo: "wasteLeftoverPlates",
        title: "After the feast",
        text: "Plates stacked after a large event. Cooked rice and curry spoil within hours unless someone moves them fast.",
      },
      {
        photo: "wasteKarwanBazar",
        title: "Karwan Bazar, Dhaka",
        text: "Produce from across the country passes through Dhaka’s biggest wholesale market. More than a fifth of potatoes and tomatoes are lost or wasted along the way.",
      },
      {
        photo: "wasteDumpRiver",
        title: "Where it ends up",
        text: "Mixed waste piled on open ground by the water. Food rotting in dumps like this gives off methane.",
      },
    ] as Story[],
  },
  hunger: {
    eyebrow: "Hunger & food insecurity",
    title: "Food insecurity in Bangladesh: 1 in 4 people can’t count on enough food",
    lede: "The food exists. Yet tens of millions of people skip meals, eat less than they need, or can’t afford a healthy diet.",
    peopleValue: "45.4 million",
    peopleLabel: "people (26.2%) were moderately or severely food insecure in 2023–2025",
    peopleSource: "FAO, The State of Food Security and Nutrition in the World 2026",
    stats: [
      {
        value: "18.1 million",
        label: "people projected to face crisis-level hunger (IPC Phase 3+), September–December 2026",
        source: "IPC Bangladesh, July 2026",
      },
      { value: "787,000", label: "people projected in Emergency (IPC Phase 4)", source: "IPC Bangladesh, July 2026" },
      { value: "66%", label: "of people cannot afford a healthy diet", source: "World Bank, 2025" },
      { value: "1 in 4", label: "children under five is stunted (24%)", source: "Bangladesh DHS 2022" },
    ],
    storiesTitle: "Hunger in Bangladesh, in pictures",
    stories: [
      {
        photo: "hungerChildMeal",
        title: "A meal shapes a childhood",
        text: "What a child eats today decides how they grow. One in four children under five in Bangladesh is stunted.",
      },
      {
        photo: "hungerReliefCrowd",
        title: "When food arrives",
        text: "Relief distributions draw crowds within minutes, a sign of how many families live one missed meal away from hunger.",
      },
      {
        photo: "hungerWaitingLine",
        title: "Waiting their turn",
        text: "Families wait at a Ramadan food distribution. When food arrives organised, nobody has to fight for it.",
      },
    ] as Story[],
  },
  bridge: {
    eyebrow: "The missing link",
    title: "Why surplus food doesn’t reach hungry people",
    text: "A caterer with 80 plates left over has no idea which shelter three streets away needs them, or who could carry them there before they spoil. The gap isn’t food. It’s a connection, and FoodBridge is that connection.",
    nodes: ["Surplus food", "FoodBridge", "People in need"],
    nodeNotes: ["Restaurants, halls, homes", "Match · pickup · delivery", "Shelters, orphanages, kitchens"],
    stories: [
      {
        photo: "hopeChildrenMeal",
        title: "The other side of the bridge",
        text: "Children sharing a hot meal. This is what surplus food becomes when it reaches the right hands in time.",
      },
      {
        photo: "hopeServingPot",
        title: "Served while it’s warm",
        text: "Rice served straight from the pot. Cooked food is safest eaten within hours, so speed matters.",
      },
      {
        photo: "hopeFoodPacks",
        title: "Ready for families",
        text: "Food packs laid out at a Ramadan distribution for Rohingya refugees. NGOs know who needs food; FoodBridge helps the food find them.",
      },
    ] as Story[],
  },
  how: {
    eyebrow: "How FoodBridge works",
    title: "How food donation works: from surplus to served in five steps",
    lede: "Three kinds of people, one tracked journey from the kitchen to the plate.",
    steps: [
      { who: "Donor", title: "Post", text: "A restaurant, wedding hall or household posts what’s left, how much, and the time it must be eaten by." },
      { who: "NGO", title: "Match", text: "FoodBridge suggests it to the nearest verified NGO that needs it. They accept in one tap." },
      { who: "Volunteer", title: "Pick up", text: "The closest available volunteer is offered the pickup and collects it from the door." },
      { who: "Volunteer", title: "Deliver", text: "The food reaches the NGO while it’s still fresh. Donor and NGO can follow every step." },
      { who: "NGO", title: "Serve", text: "The NGO serves it and records how many people ate. That number becomes everyone’s impact." },
    ],
    safetyTitle: "Safe, or not at all",
    safety: "Every post carries a best-before time. Once it passes, the food is never matched or picked up.",
  },
  roles: {
    eyebrow: "Get involved",
    title: "Donate food, receive food or volunteer in Dhaka",
    donor: {
      photo: "roleFeastTable" as PhotoKey,
      tag: "For food donors",
      title: "You have food left over",
      who: "Restaurants, hotels, caterers, wedding halls, shops and households.",
      points: ["Post in about a minute", "Free pickup from your door", "See the meals you saved"],
      cta: "Start donating",
    },
    ngo: {
      photo: "hopeServingPot" as PhotoKey,
      tag: "For NGOs & shelters",
      title: "You feed people",
      who: "Shelters, orphanages, madrasas and community kitchens.",
      points: ["Alerts for food near you", "Accept only what you can serve", "Post your own food needs"],
      cta: "Register your NGO",
    },
    volunteer: {
      photo: "roleRickshaws" as PhotoKey,
      tag: "For volunteers",
      title: "You can carry it",
      who: "Students, riders and neighbours with an hour to spare.",
      points: ["Pickups offered near you", "On foot, by bike or by rickshaw", "Count the meals you delivered"],
      cta: "Become a volunteer",
    },
    verified: "Every NGO and volunteer is checked by our team before they can receive food or pickup tasks.",
  },
  impact: {
    eyebrow: "So far, together",
    title: "Our food rescue impact in Bangladesh",
    lede: "Every number here is a plate that was filled, counted from completed deliveries on FoodBridge, not estimated.",
    stats: ["Meals served", "Donations completed", "Registered donors", "Verified NGOs & volunteers"],
    methane: "Food left in a landfill rots into methane. Food on a plate doesn’t.",
    sdgTitle: "Working towards the UN Sustainable Development Goals",
    sdgs: ["SDG 2 · Zero hunger", "SDG 12 · Responsible consumption", "SDG 13 · Climate action", "SDG 17 · Partnerships"],
  },
  cta: {
    title: "Donate leftover food in Dhaka tonight",
    text: "Post it now. It could be on someone’s plate before it goes cold.",
    donate: "Donate food",
    ngo: "Register your NGO",
    badge: "Donate · Rescue · Share · Feed ·",
  },
  footer: {
    about: "We connect surplus food from restaurants, hotels, shops and homes with NGOs and volunteers, so good food feeds people instead of landfills.",
    platform: "Platform",
    involved: "Get involved",
    how: "How it works",
    donate: "Donate food",
    login: "Log in",
    forNgos: "For NGOs",
    volunteer: "Volunteer",
    impact: "Our impact",
    wordmark: "FoodBridge",
    initiative: "FoodWasteZero initiative",
    tagline: "Made with care to feed people, not landfills.",
  },
};

export type SiteCopy = typeof en;

const bn: SiteCopy = {
  meta: {
    title: "বাংলাদেশে খাবার দান: উদ্বৃত্ত খাবার দিন, ক্ষুধা কমান | ফুডব্রিজ",
    description:
      "বাংলাদেশের বাসাবাড়িতে বছরে ১ কোটি ৪১ লাখ টন খাবার নষ্ট হয়, অথচ সাড়ে ৪ কোটির বেশি মানুষ খাদ্য নিরাপত্তাহীনতায়। ফুডব্রিজ ঢাকার রেস্তোরাঁ, বিয়ের আয়োজন ও বাসাবাড়ির উদ্বৃত্ত খাবারকে যাচাই করা এনজিও ও স্বেচ্ছাসেবকদের সঙ্গে যুক্ত করে।",
  },
  nav: {
    problem: "খাদ্য অপচয়",
    hunger: "ক্ষুধা",
    how: "কীভাবে কাজ করে",
    impact: "প্রভাব",
    join: "যুক্ত হোন",
    login: "লগ ইন",
    donate: "খাবার দান করুন",
    dashboard: "আমার ড্যাশবোর্ড",
    openMenu: "মেনু খুলুন",
    language: "ভাষা",
  },
  photo: { credit: "ছবি", via: "উইকিমিডিয়া কমন্স" },
  hero: {
    kicker: "বাংলাদেশে উদ্বৃত্ত খাবার দান",
    title1: "আজ রাতেও ঢাকায় ভালো খাবার ফেলে দেওয়া হবে।",
    title2: "আর কয়েকটা গলি পরেই কেউ না খেয়ে ঘুমাবে।",
    lede: "ফুডব্রিজ এই দুইয়ের মাঝের সেতু। রেস্তোরাঁ, বিয়ের হল, দোকান আর বাসাবাড়ি জানায় তাদের কী খাবার বেঁচে গেছে। কাছের একটি যাচাই করা এনজিও তা গ্রহণ করে, আর একজন স্বেচ্ছাসেবক টাটকা থাকতেই শহর পেরিয়ে পৌঁছে দেন।",
    ctaDonate: "উদ্বৃত্ত খাবার দান করুন",
    ctaHow: "কীভাবে কাজ করে দেখুন",
    trust: ["দাতাদের জন্য বিনামূল্যে", "যাচাই করা এনজিও", "প্রতিটি পোস্টে খাদ্য-নিরাপত্তা যাচাই"],
    bgAlt: "রাতে ঢাকার রাস্তায় একজন রিকশাচালক।",
    photoAlt: "এক মুঠো চালের দিকে বাড়িয়ে দেওয়া অনেকগুলো হাত।",
    photoCaption: "খাবার আছে। শুধু অপেক্ষায় থাকা হাতগুলো পর্যন্ত পৌঁছায় না।",
    strip: [
      { value: "১.৪১ কোটি টন", label: "খাবার প্রতি বছর বাসাবাড়িতে নষ্ট হয়", source: "ইউএনইপি ২০২৪" },
      { value: "৪.৫৪ কোটি", label: "মানুষ নিয়মিত পর্যাপ্ত খাবার পান না", source: "এফএও ২০২৬" },
      { value: "৩৪%", label: "খাবার দেশে নষ্ট বা অপচয় হয়", source: "বিশ্বব্যাংক ২০২৫" },
    ],
  },
  waste: {
    eyebrow: "বাংলাদেশে খাদ্য অপচয়",
    title: "বাংলাদেশে কত খাবার নষ্ট হয়? প্রতিদিন ৩৮,৬০০ টন",
    lede: "শুধু বাংলাদেশের বাসাবাড়িতেই বছরে আনুমানিক ১ কোটি ৪১ লাখ টন খাবার ফেলে দেওয়া হয়। মাথাপিছু ৮২ কেজি, যা যুক্তরাষ্ট্র বা চীনের বাসাবাড়ির চেয়েও বেশি।",
    counterLabel: "আপনি এই পাতা খোলার পর থেকে বাংলাদেশের বাসাবাড়িতে নষ্ট হওয়া খাবার",
    counterUnit: "কেজি",
    counterRate: "প্রতি সেকেন্ডে প্রায় ৪৪৭ কেজি",
    clock: [
      { value: "৩৮,৬০০", unit: "টন", label: "প্রতিদিন" },
      { value: "প্রায় ১১.৮ লাখ", unit: "টন", label: "প্রতি মাসে" },
      { value: "১ কোটি ৪১ লাখ", unit: "টন", label: "প্রতি বছর" },
      { value: "৮২ কেজি", unit: "", label: "মাথাপিছু প্রতি বছর, দিনে প্রায় ২২৫ গ্রাম" },
    ],
    clockSource: "ইউএনইপি ফুড ওয়েস্ট ইনডেক্স রিপোর্ট ২০২৪ (বাসাবাড়ির খাদ্য অপচয়)। দৈনিক ও মাসিক হিসাব বার্ষিক অনুমানকে সমানভাগে ভাগ করে।",
    compareTitle: "মাথাপিছু বাসাবাড়ির খাদ্য অপচয় (কেজি/বছর)",
    compare: [
      { label: "বাংলাদেশ", value: 82 },
      { label: "চীন", value: 76 },
      { label: "যুক্তরাষ্ট্র", value: 73 },
      { label: "ভারত", value: 55 },
    ],
    compareSource: "ইউএনইপি ফুড ওয়েস্ট ইনডেক্স রিপোর্ট ২০২৪",
    chainTitle: "মাঠ থেকে প্লেট পর্যন্ত পুরো খাদ্য ব্যবস্থায়",
    chain: [
      { value: "৩৪%", label: "সহজলভ্য খাবার নষ্ট বা অপচয় হয়" },
      { value: "৪%", label: "জিডিপির সমান ক্ষতি হয়" },
      { value: "১৩%", label: "দেশের গ্রিনহাউস গ্যাস নিঃসরণ (২.৯ কোটি টন CO₂e)" },
      { value: "২৭%", label: "কৃষিজমিতে এমন খাবার ফলে যা কেউ খায় না" },
    ],
    lossTitle: "খাবারভেদে নষ্ট বা অপচয়ের হার",
    loss: [
      { label: "টমেটো", value: 27.9 },
      { label: "ডাল", value: 27 },
      { label: "গাজর", value: 26.8 },
      { label: "চাল", value: 23 },
      { label: "আলু", value: 21.8 },
      { label: "কলা", value: 19.9 },
    ],
    chainSource: "বিশ্বব্যাংকের গবেষণা, ঢাকায় উপস্থাপিত ২৯ সেপ্টেম্বর ২০২৫",
    marketAlt: "পুরান ঢাকার চকবাজারের ইফতার বাজারে ভিড় আর থরে থরে সাজানো খাবার।",
    marketCaption: "চকবাজার, পুরান ঢাকা: রমজানের প্রতি সন্ধ্যায় খাবারের প্রাচুর্য। রাতের মধ্যে যা বিক্রি হয় না, তা প্রায়ই আর খাওয়া হয় না।",
    storiesTitle: "বাংলাদেশে খাদ্য অপচয় কোথায় হয়",
    stories: [
      {
        photo: "wasteHoludFeast",
        title: "শত মানুষের জন্য রান্না",
        text: "হলুদ সন্ধ্যা আর বিয়ের আয়োজনে রান্না হয় বিপুল পরিমাণে। অতিথিরা চলে গেলে না-ছোঁয়া খাবারের ট্রে প্রায়ই কোথাও যাওয়ার জায়গা পায় না।",
      },
      {
        photo: "wasteLeftoverPlates",
        title: "ভোজের পরে",
        text: "বড় আয়োজনের পর স্তূপ করা প্লেট। রান্না করা ভাত-তরকারি দ্রুত কেউ সরিয়ে না নিলে কয়েক ঘণ্টাতেই নষ্ট হয়ে যায়।",
      },
      {
        photo: "wasteKarwanBazar",
        title: "কারওয়ান বাজার, ঢাকা",
        text: "সারা দেশের সবজি আসে ঢাকার সবচেয়ে বড় এই পাইকারি বাজারে। পথেই নষ্ট বা অপচয় হয় আলু ও টমেটোর পাঁচ ভাগের এক ভাগেরও বেশি।",
      },
      {
        photo: "wasteDumpRiver",
        title: "শেষ ঠিকানা",
        text: "পানির ধারে খোলা জায়গায় জমে থাকা বর্জ্য। এমন ভাগাড়ে পচতে থাকা খাবার থেকে মিথেন গ্যাস ছড়ায়।",
      },
    ],
  },
  hunger: {
    eyebrow: "ক্ষুধা ও খাদ্য নিরাপত্তাহীনতা",
    title: "বাংলাদেশে খাদ্য নিরাপত্তাহীনতা: প্রতি ৪ জনে ১ জন নিয়মিত পর্যাপ্ত খাবার পান না",
    lede: "খাবার আছে। তবু কোটি কোটি মানুষ বেলা বাদ দেন, প্রয়োজনের চেয়ে কম খান, কিংবা স্বাস্থ্যকর খাবার কেনার সামর্থ্য রাখেন না।",
    peopleValue: "৪ কোটি ৫৪ লাখ",
    peopleLabel: "মানুষ (২৬.২%) ২০২৩–২০২৫ সালে মাঝারি বা তীব্র খাদ্য নিরাপত্তাহীনতায় ছিলেন",
    peopleSource: "এফএও, দ্য স্টেট অব ফুড সিকিউরিটি অ্যান্ড নিউট্রিশন ইন দ্য ওয়ার্ল্ড ২০২৬",
    stats: [
      {
        value: "১ কোটি ৮১ লাখ",
        label: "মানুষ সেপ্টেম্বর–ডিসেম্বর ২০২৬-এ সংকটপূর্ণ ক্ষুধার মুখে পড়তে পারেন (আইপিসি ধাপ ৩+)",
        source: "আইপিসি বাংলাদেশ, জুলাই ২০২৬",
      },
      { value: "৭ লাখ ৮৭ হাজার", label: "মানুষ জরুরি অবস্থায় পড়তে পারেন (আইপিসি ধাপ ৪)", source: "আইপিসি বাংলাদেশ, জুলাই ২০২৬" },
      { value: "৬৬%", label: "মানুষের স্বাস্থ্যকর খাবার কেনার সামর্থ্য নেই", source: "বিশ্বব্যাংক, ২০২৫" },
      { value: "প্রতি ৪ জনে ১ জন", label: "পাঁচ বছরের কম বয়সী শিশু খর্বকায় (২৪%)", source: "বাংলাদেশ জনমিতি ও স্বাস্থ্য জরিপ ২০২২" },
    ],
    storiesTitle: "ছবিতে বাংলাদেশের ক্ষুধা",
    stories: [
      {
        photo: "hungerChildMeal",
        title: "একবেলার খাবারেই গড়ে ওঠে শৈশব",
        text: "আজ একটি শিশু কী খায়, তা-ই ঠিক করে সে কীভাবে বেড়ে উঠবে। বাংলাদেশে পাঁচ বছরের কম বয়সী প্রতি চারজন শিশুর একজন খর্বকায়।",
      },
      {
        photo: "hungerReliefCrowd",
        title: "যখন খাবার আসে",
        text: "ত্রাণ বিতরণে মুহূর্তেই ভিড় জমে যায়, যা দেখায় কত পরিবার মাত্র এক বেলার দূরত্বে ক্ষুধার মুখে দাঁড়িয়ে।",
      },
      {
        photo: "hungerWaitingLine",
        title: "নিজের পালার অপেক্ষায়",
        text: "রমজানের খাদ্য বিতরণে অপেক্ষারত পরিবারগুলো। খাবার সুশৃঙ্খলভাবে এলে কাউকে তার জন্য লড়তে হয় না।",
      },
    ],
  },
  bridge: {
    eyebrow: "হারিয়ে যাওয়া যোগসূত্র",
    title: "উদ্বৃত্ত খাবার কেন ক্ষুধার্ত মানুষের কাছে পৌঁছায় না",
    text: "৮০ প্লেট খাবার বেঁচে যাওয়া একজন ক্যাটারার জানেন না, তিন গলি দূরের কোন আশ্রয়কেন্দ্রে তা দরকার, কিংবা নষ্ট হওয়ার আগে কে তা পৌঁছে দিতে পারবেন। ফাঁকটা খাবারের নয়, যোগাযোগের। আর ফুডব্রিজই সেই যোগাযোগ।",
    nodes: ["উদ্বৃত্ত খাবার", "ফুডব্রিজ", "প্রয়োজনে থাকা মানুষ"],
    nodeNotes: ["রেস্তোরাঁ, হল, বাসাবাড়ি", "মিল · সংগ্রহ · পৌঁছানো", "আশ্রয়কেন্দ্র, এতিমখানা, কিচেন"],
    stories: [
      {
        photo: "hopeChildrenMeal",
        title: "সেতুর ওপারে",
        text: "শিশুরা একসঙ্গে গরম খাবার খাচ্ছে। সময়মতো সঠিক হাতে পৌঁছালে উদ্বৃত্ত খাবার এমনই রূপ নেয়।",
      },
      {
        photo: "hopeServingPot",
        title: "গরম থাকতেই পরিবেশন",
        text: "হাঁড়ি থেকে সরাসরি ভাত পরিবেশন। রান্না করা খাবার কয়েক ঘণ্টার মধ্যে খাওয়াই সবচেয়ে নিরাপদ, তাই গতিই আসল।",
      },
      {
        photo: "hopeFoodPacks",
        title: "পরিবারগুলোর জন্য প্রস্তুত",
        text: "রোহিঙ্গা শরণার্থীদের জন্য রমজানের খাদ্য বিতরণে সাজানো খাবারের প্যাকেট। কাদের খাবার দরকার তা এনজিও জানে; ফুডব্রিজ খাবারকে তাদের কাছে পৌঁছাতে সাহায্য করে।",
      },
    ],
  },
  how: {
    eyebrow: "ফুডব্রিজ যেভাবে কাজ করে",
    title: "খাবার দান যেভাবে কাজ করে: পাঁচ ধাপে উদ্বৃত্ত থেকে পরিবেশন",
    lede: "তিন ধরনের মানুষ, রান্নাঘর থেকে প্লেট পর্যন্ত একটিই নজরে রাখা যাত্রা।",
    steps: [
      { who: "দাতা", title: "পোস্ট", text: "রেস্তোরাঁ, বিয়ের হল বা বাসাবাড়ি জানায় কী খাবার বেঁচেছে, কতটুকু, আর কখনের মধ্যে খেতে হবে।" },
      { who: "এনজিও", title: "মিল", text: "ফুডব্রিজ খাবারটি কাছের এমন একটি যাচাই করা এনজিওকে দেখায়, যাদের তা দরকার। তারা এক ট্যাপে গ্রহণ করে।" },
      { who: "স্বেচ্ছাসেবক", title: "সংগ্রহ", text: "সবচেয়ে কাছের ফাঁকা স্বেচ্ছাসেবককে কাজটি দেওয়া হয়, তিনি দরজা থেকে খাবার নিয়ে আসেন।" },
      { who: "স্বেচ্ছাসেবক", title: "পৌঁছানো", text: "টাটকা থাকতেই খাবার এনজিওর কাছে পৌঁছায়। দাতা ও এনজিও প্রতিটি ধাপ দেখতে পান।" },
      { who: "এনজিও", title: "পরিবেশন", text: "এনজিও খাবার পরিবেশন করে এবং কতজন খেলেন তা লিখে রাখে। সেই সংখ্যাই হয়ে ওঠে সবার অবদান।" },
    ],
    safetyTitle: "নিরাপদ, নইলে নয়",
    safety: "প্রতিটি পোস্টে খাওয়ার শেষ সময় দেওয়া থাকে। সেই সময় পেরিয়ে গেলে খাবারটি আর কারও সঙ্গে মেলানো বা সংগ্রহ করা হয় না।",
  },
  roles: {
    eyebrow: "যুক্ত হোন",
    title: "ঢাকায় খাবার দান করুন, খাবার গ্রহণ করুন বা স্বেচ্ছাসেবক হোন",
    donor: {
      photo: "roleFeastTable",
      tag: "খাদ্য দাতাদের জন্য",
      title: "আপনার খাবার বেঁচে গেছে",
      who: "রেস্তোরাঁ, হোটেল, ক্যাটারার, বিয়ের হল, দোকান ও বাসাবাড়ি।",
      points: ["এক মিনিটেই পোস্ট করুন", "দরজা থেকে বিনামূল্যে সংগ্রহ", "দেখুন কত বেলার খাবার বাঁচালেন"],
      cta: "দান শুরু করুন",
    },
    ngo: {
      photo: "hopeServingPot",
      tag: "এনজিও ও আশ্রয়কেন্দ্রের জন্য",
      title: "আপনি মানুষকে খাওয়ান",
      who: "আশ্রয়কেন্দ্র, এতিমখানা, মাদ্রাসা ও কমিউনিটি কিচেন।",
      points: ["কাছের খাবারের খবর পান", "যতটুকু পরিবেশন করতে পারবেন, ততটুকুই নিন", "নিজেদের খাবারের প্রয়োজন জানান"],
      cta: "এনজিও নিবন্ধন করুন",
    },
    volunteer: {
      photo: "roleRickshaws",
      tag: "স্বেচ্ছাসেবকদের জন্য",
      title: "আপনি পৌঁছে দিতে পারেন",
      who: "হাতে এক ঘণ্টা সময় থাকা শিক্ষার্থী, রাইডার ও প্রতিবেশী।",
      points: ["কাছাকাছি সংগ্রহের কাজ", "হেঁটে, সাইকেলে বা রিকশায়", "দেখুন কত বেলার খাবার পৌঁছালেন"],
      cta: "স্বেচ্ছাসেবক হোন",
    },
    verified: "খাবার বা সংগ্রহের কাজ পাওয়ার আগে আমাদের দল প্রতিটি এনজিও ও স্বেচ্ছাসেবককে যাচাই করে।",
  },
  impact: {
    eyebrow: "এখন পর্যন্ত, একসঙ্গে",
    title: "বাংলাদেশে আমাদের খাদ্য উদ্ধারের প্রভাব",
    lede: "এখানের প্রতিটি সংখ্যা একটি ভরা প্লেট। অনুমান নয়, ফুডব্রিজে সম্পন্ন হওয়া ডেলিভারি থেকে গোনা।",
    stats: ["বেলার খাবার পরিবেশিত", "সম্পন্ন দান", "নিবন্ধিত দাতা", "যাচাই করা এনজিও ও স্বেচ্ছাসেবক"],
    methane: "ভাগাড়ে পড়ে থাকা খাবার পচে মিথেন ছড়ায়। প্লেটের খাবার তা করে না।",
    sdgTitle: "জাতিসংঘের টেকসই উন্নয়ন লক্ষ্য অর্জনের পথে",
    sdgs: ["এসডিজি ২ · ক্ষুধামুক্তি", "এসডিজি ১২ · পরিমিত ভোগ ও উৎপাদন", "এসডিজি ১৩ · জলবায়ু কার্যক্রম", "এসডিজি ১৭ · অংশীদারিত্ব"],
  },
  cta: {
    title: "আজ রাতেই ঢাকায় বেঁচে যাওয়া খাবার দান করুন",
    text: "এখনই পোস্ট করুন। ঠান্ডা হওয়ার আগেই তা কারও প্লেটে পৌঁছাতে পারে।",
    donate: "খাবার দান করুন",
    ngo: "এনজিও নিবন্ধন করুন",
    badge: "দান · উদ্ধার · ভাগাভাগি · আহার ·",
  },
  footer: {
    about: "রেস্তোরাঁ, হোটেল, দোকান ও বাসাবাড়ির উদ্বৃত্ত খাবারকে আমরা এনজিও ও স্বেচ্ছাসেবকদের সঙ্গে যুক্ত করি, যাতে ভালো খাবার ভাগাড়ে নয়, মানুষের পাতে যায়।",
    platform: "প্ল্যাটফর্ম",
    involved: "যুক্ত হোন",
    how: "কীভাবে কাজ করে",
    donate: "খাবার দান করুন",
    login: "লগ ইন",
    forNgos: "এনজিওর জন্য",
    volunteer: "স্বেচ্ছাসেবক হোন",
    impact: "আমাদের প্রভাব",
    wordmark: "ফুডব্রিজ",
    initiative: "ফুডওয়েস্টজিরো উদ্যোগ",
    tagline: "ভাগাড় নয়, মানুষের পাতে খাবার তুলে দিতে যত্নে তৈরি।",
  },
};

export const SITE_COPY: Record<Lang, SiteCopy> = { en, bn };
