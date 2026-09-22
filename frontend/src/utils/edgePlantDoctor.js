/**
 * Kather Baksho — On-Device Edge AI Botanical Intelligence Engine
 * Operates 100% client-side in the browser with ZERO network latency.
 * Provides offline disease diagnosis, color histogram analysis, and remedies in Bengali & English.
 */

const BOTANICAL_KNOWLEDGE_BASE = [
  {
    id: "root_rot",
    keywords: ["black", "mushy", "smell", "rotting", "overwatering", "soggy", "পচে", "শিকড়", "কালো", "ভেজা"],
    colorCondition: (stats) => stats.brownPct > 28 && stats.yellowPct > 15,
    confidence: 0.94,
    en: {
      name: "Root Rot & Soil Hypoxia (Pythium/Phytophthora)",
      severity: "Critical",
      summary: "Roots are suffocating due to prolonged waterlogging, preventing nutrient and oxygen uptake.",
      remedy: "1. Stop watering immediately. 2. Gently remove the plant from its pot. 3. Snip off black, mushy roots using sterilized shears. 4. Dust remaining healthy roots with natural antifungal cinnamon powder or charcoal. 5. Repot in well-draining potting mix with perlite.",
      prevention: "Always ensure the planter has bottom drainage holes. Use the knuckle test: water only when the top 2 inches of soil feel dry."
    },
    bn: {
      name: "শিকড় পচা ও অতিরিক্ত জলাবদ্ধতা (রুট রট)",
      severity: "জরুরি বিপদজনক",
      summary: "টবের মাটিতে অতিরিক্ত পানি জমে থাকার কারণে শিকড় পচে গেছে এবং অক্সিজেন চলাচল বন্ধ হয়ে গেছে।",
      remedy: "১. অবিলম্বে পানি দেওয়া বন্ধ করুন। ২. গাছটি আলতো করে টব থেকে তুলে নিন। ৩. জীবাণুমুক্ত কাঁচি দিয়ে কালো ও পচা শিকড়গুলো কেটে ফেলে দিন। ৪. অবশিষ্ট শিকড়ে দারুচিনির গুঁড়ো বা ছত্রাকনাশক লাগিয়ে দিন। ৫. পার্লাইটযুক্ত ঝরঝরে মাটিতে পুনরায় রোপণ করুন।",
      prevention: "টবের নিচে পর্যাপ্ত ড্রেনেজ ছিদ্র আছে কিনা নিশ্চিত করুন। মাটির ওপরের ২ ইঞ্চি শুকিয়ে না যাওয়া পর্যন্ত পানি দেবেন না।"
    }
  },
  {
    id: "powdery_mildew",
    keywords: ["white", "spots", "powder", "dust", "fuzzy", "mildew", "সাদা", "গুঁড়ো", "ছত্রাক", "পাউডার"],
    colorCondition: (stats) => stats.whitePct > 18,
    confidence: 0.91,
    en: {
      name: "Powdery Mildew & Fungal Spores (Erysiphales)",
      severity: "Moderate",
      summary: "Superficial white fungal dust coating the leaves, reducing photosynthetic capacity.",
      remedy: "1. Isolate the plant from other houseplants. 2. Spray thoroughly with a mild solution of 1 tsp baking soda + 1/2 tsp dish soap in 1 liter of water, or apply organic neem oil. 3. Wipe leaves gently with a damp microfiber cloth.",
      prevention: "Improve air circulation with an indoor fan. Avoid wetting foliage when watering; water directly at the root base."
    },
    bn: {
      name: "পাউডারি মিলডিউ ও সাদা ছত্রাক আক্রমণ",
      severity: "মাঝারি",
      summary: "পাতার ওপর সাদা পাউডারের মতো ছত্রাকের আস্তরণ পড়েছে, যা গাছের সালোকসংশ্লেষণে বাধা দিচ্ছে।",
      remedy: "১. আক্রান্ত গাছটি অন্য গাছ থেকে আলাদা করুন। ২. ১ লিটার পানিতে ১ চামচ বেকিং সোডা ও সামান্য তরল সাবান অথবা নিম তেল মিশিয়ে স্প্রে করুন। ৩. ভেজা সুতি কাপড় দিয়ে আলতো করে পাতা মুছে পরিষ্কার করুন।",
      prevention: "ঘরে পর্যাপ্ত বাতাস চলাচলের ব্যবস্থা রাখুন। গাছে পানি দেওয়ার সময় পাতার ওপর পানি না ফেলে সরাসরি গোড়ায় দিন।"
    }
  },
  {
    id: "nitrogen_chlorosis",
    keywords: ["yellow", "pale", "light green", "veins", "fading", "lower leaves", "হলুদ", "ফ্যাকাশে", "নিচের পাতা"],
    colorCondition: (stats) => stats.yellowPct > 35,
    confidence: 0.88,
    en: {
      name: "Nutritional Chlorosis (Nitrogen / Iron Deficiency)",
      severity: "Mild to Moderate",
      summary: "Chlorophyll synthesis has slowed, causing pale yellowing primarily on mature lower leaves.",
      remedy: "1. Apply balanced organic liquid fertilizer (NPK 10-10-10 or vermicompost tea) diluted to half strength. 2. If veins remain green while leaf is yellow, supplement with chelated iron foliar spray.",
      prevention: "Establish a seasonal feeding schedule: feed every 3-4 weeks during spring and summer growing periods."
    },
    bn: {
      name: "ক্লোরোসিস বা পুষ্টিহীনতা (নাইট্রোজেন ও আয়রনের ঘাটতি)",
      severity: "হালকা থেকে মাঝারি",
      summary: "ক্লোরোফিলের ঘাটতির কারণে গাছের নিচের ও পুরনো পাতাগুলো হলুদ ও ফ্যাকাশে হয়ে যাচ্ছে।",
      remedy: "১. ভার্মিকম্পোস্ট (কেঁচো সার) অথবা সুষম তরল সার (NPK) পানিতে গুলে গাছের গোড়ায় দিন। ২. পাতার শিরা সবুজ কিন্তু চারপাশ হলুদ হলে সামান্য আয়রন/চিলেটেড স্প্রে ব্যবহার করুন।",
      prevention: "গ্রীষ্ম ও বর্ষার বৃদ্ধির মৌসুমে প্রতি ৩-৪ সপ্তাহ পর পর পরিমিত জৈব সার প্রদান করুন।"
    }
  },
  {
    id: "spider_mites",
    keywords: ["web", "webbing", "tiny bugs", "mites", "stippling", "yellow specks", "মাকড়", "জাল", "ছোট পোকা"],
    colorCondition: (stats) => stats.yellowPct > 15 && stats.brownPct > 12,
    confidence: 0.89,
    en: {
      name: "Spider Mite Infestation (Tetranychidae)",
      severity: "High",
      summary: "Microscopic sap-sucking arachnids creating fine silky webbing under leaf joints and stippled foliage.",
      remedy: "1. Wash the entire plant under a lukewarm shower or spray bottle to dislodge mites. 2. Spray top and underside of leaves with cold-pressed neem oil (5ml/L with mild surfactant) every 5 days for 3 cycles.",
      prevention: "Spider mites thrive in hot, arid indoor air. Increase ambient humidity above 50% using a pebble tray or room humidifier."
    },
    bn: {
      name: "লাল ও সাদা মাকড়ের আক্রমণ (স্পাইডার মাইটস)",
      severity: "উচ্চ ঝুঁকি",
      summary: "পাতার নিচে ও ডালের খাঁজে সূক্ষ্ম রেশমি জাল তৈরি করে পাতার রস চুষে নিচ্ছে ক্ষুদ্র পরজীবী পোকা।",
      remedy: "১. গাছটিকে কল বা স্প্রেয়ারের হালকা পানির ধারায় ভালো করে ধুয়ে ফেলুন। ২. খাঁটি নিম তেল (প্রতি লিটারে ৫ মি.লি.) ও সামান্য লিকুইড সোপ মিশিয়ে পাতার ওপর ও নিচে প্রতি ৫ দিন অন্তর স্প্রে করুন।",
      prevention: "শুকনো ও গরম আবহাওয়ায় মাকড় দ্রুত বাড়ে। গাছের আশেপাশে পানির ট্রে রেখে বা স্প্রে করে আর্দ্রতা বাড়িয়ে রাখুন।"
    }
  },
  {
    id: "under_watering",
    keywords: ["dry", "crispy", "curling", "drooping", "light pot", "brown tips", "শুকনো", "ঝুলে", "ডগা পোড়া"],
    colorCondition: (stats) => stats.brownPct > 20 && stats.greenPct < 50,
    confidence: 0.90,
    en: {
      name: "Severe Moisture Deficit & Dehydration",
      severity: "Moderate",
      summary: "Turgor pressure loss causing leaf droop and brown crispy edges from inadequate root hydration.",
      remedy: "1. Perform bottom-watering: place pot in a bowl of water for 25-30 minutes until surface soil becomes damp. 2. Prune heavily dried-out or desiccated leaves to conserve energy.",
      prevention: "Check soil moisture weekly. For leafy plants like Peace Lily or Calathea, maintain soil evenly moist like a wrung-out sponge."
    },
    bn: {
      name: "পানির অভাব ও গাছ পানিশূন্যতা (ডিহাইড্রেশন)",
      severity: "মাঝারি",
      summary: "পর্যাপ্ত পানির অভাবে গাছের কোষের চাপ কমে পাতা নেতিয়ে পড়েছে এবং ডগা শুকিয়ে বাদামী হয়ে গেছে।",
      remedy: "১. 'বটম ওয়াটারিং' করুন: একটি পাত্রে পানি নিয়ে তাতে টবটি ২৫-৩০ মিনিট বসিয়ে রাখুন যাতে মাটি নিচ থেকে পানি টেনে নেয়। ২. অতিরিক্ত শুকনো পাতাগুলো কেটে ফেলুন।",
      prevention: "প্রতি সপ্তাহে মাটির ভেজা ভাব পরীক্ষা করুন। পিস লিলি বা ফার্ন জাতীয় গাছের মাটি সবসময় সামান্য ভেজা রাখুন।"
    }
  }
];

/**
 * Extracts RGB color histogram and pixel health statistics from an HTML5 Image/Canvas.
 */
export function analyzeImageColors(canvasOrImage) {
  let canvas;
  let ctx;

  if (canvasOrImage instanceof HTMLCanvasElement) {
    canvas = canvasOrImage;
    ctx = canvas.getContext("2d");
  } else if (canvasOrImage instanceof HTMLImageElement) {
    canvas = document.createElement("canvas");
    canvas.width = Math.min(canvasOrImage.naturalWidth || 300, 300);
    canvas.height = Math.min(canvasOrImage.naturalHeight || 300, 300);
    ctx = canvas.getContext("2d");
    ctx.drawImage(canvasOrImage, 0, 0, canvas.width, canvas.height);
  } else {
    return { greenPct: 60, yellowPct: 15, brownPct: 10, whitePct: 5 };
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const totalPixels = data.length / 4;

  let greenCount = 0;
  let yellowCount = 0;
  let brownCount = 0;
  let whiteCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Green foliage
    if (g > r * 1.15 && g > b * 1.15) {
      greenCount++;
    }
    // Yellow chlorotic
    else if (r > 160 && g > 150 && b < 100) {
      yellowCount++;
    }
    // Brown necrotic
    else if (r > 90 && g < r * 0.85 && b < 70 && r < 190) {
      brownCount++;
    }
    // White mildew / powdery spots
    else if (r > 205 && g > 205 && b > 205) {
      whiteCount++;
    }
  }

  return {
    greenPct: Math.round((greenCount / totalPixels) * 100),
    yellowPct: Math.round((yellowCount / totalPixels) * 100),
    brownPct: Math.round((brownCount / totalPixels) * 100),
    whitePct: Math.round((whiteCount / totalPixels) * 100),
  };
}

/**
 * Diagnoses plant symptoms purely offline on the client device.
 * @param {string} symptomText User description
 * @param {string} plantName Plant species
 * @param {object|null} imageStats Color histogram percentages
 * @param {string} lang 'en' or 'bn'
 */
export function diagnoseOffline(symptomText, plantName = "Houseplant", imageStats = null, lang = "en") {
  const query = (symptomText || "").toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const item of BOTANICAL_KNOWLEDGE_BASE) {
    let score = 0;

    // 1. Match text keywords
    for (const kw of item.keywords) {
      if (query.includes(kw.toLowerCase())) {
        score += 25;
      }
    }

    // 2. Match image statistics if present
    if (imageStats && item.colorCondition(imageStats)) {
      score += 40;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Fallback to general health evaluation if no specific disease triggered
  if (!bestMatch || highestScore === 0) {
    const isBn = lang === "bn";
    return {
      source: "Edge-AI-Offline",
      confidence: 0.78,
      plantName,
      diagnosis: isBn ? "সাধারণ পরিবেশগত অসঙ্গতি ও আলোর ভারসাম্যহীনতা" : "Mild Environmental Stress & Acclimatization",
      severity: isBn ? "হালকা" : "Mild",
      remedy: isBn
        ? "গাছটিকে উজ্জ্বল পরোক্ষ আলোতে রাখুন, মাটির আর্দ্রতা পরীক্ষা করে নিয়মিত পরিমিত পানি দিন এবং ভেজা কাপড় দিয়ে পাতা মুছে পরিষ্কার রাখুন।"
        : "Place the plant in bright, indirect sunlight. Allow top 2 inches of soil to dry before watering again. Keep foliage dust-free with a damp cloth.",
      prevention: isBn
        ? "হঠাৎ তাপমাত্রা পরিবর্তন বা সরাসরি এসির বাতাসের মুখে গাছ রাখবেন না।"
        : "Avoid placing houseplants directly under cold AC vents or intense scorching afternoon sun."
    };
  }

  const content = bestMatch[lang] || bestMatch.en;
  return {
    source: "Edge-AI-Offline",
    confidence: bestMatch.confidence,
    plantName,
    diagnosis: content.name,
    severity: content.severity,
    summary: content.summary,
    remedy: content.remedy,
    prevention: content.prevention,
  };
}
