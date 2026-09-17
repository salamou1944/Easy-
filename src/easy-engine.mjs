const MAX_TEXT = 8000;
const MAX_NAME = 200;
const MAX_POINTS = 8;

function clean(value, max = MAX_TEXT) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function unique(items) {
  return [...new Set(items.map((x) => clean(x)).filter(Boolean))].slice(0, MAX_POINTS);
}

function extractFacts(details) {
  const text = clean(details);
  const facts = [];
  for (const sentence of text.split(/[.!?\n]+/)) {
    const s = sentence.trim();
    if (!s || s.length > 300 || /^https?:\/\//i.test(s)) continue;
    if (/^(ignore|disregard|forget)\s+(all|any|the|previous|prior)|^(system|developer|assistant|user)\s*:/i.test(s)) continue;
    facts.push(s);
  }
  return unique(facts);
}

export function buildProductDna(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("product must be an object");
  const name = clean(input.product_name, MAX_NAME);
  const details = clean(input.product_details);
  if (!name && !details && !clean(input.image_url, 2000)) throw new Error("Provide product_name, product_details, or image_url");
  const suppliedFacts = extractFacts(details);
  return {
    version: 1,
    title: name || "Unnamed product",
    suppliedFacts,
    authoritativeFacts: suppliedFacts,
    unknowns: name && suppliedFacts.length ? [] : ["Some product facts are missing; verify before publishing."],
    source: "seller-supplied",
    integrity: {
      preservePrintedText: true,
      preserveLogo: true,
      preserveColor: true,
      preserveShape: true,
      preserveEssentialCharacteristics: true
    }
  };
}

export function checkProductIntegrity(dna, candidate) {
  if (!dna || typeof dna !== "object") throw new TypeError("dna is required");
  const text = clean(candidate);
  const missingFacts = dna.authoritativeFacts.filter((fact) => !text.toLowerCase().includes(fact.toLowerCase()));
  return {
    passed: missingFacts.length === 0,
    missingFacts,
    blockedClaims: [],
    policy: "No new factual product claims may be introduced without seller evidence."
  };
}

export function generateCreative(input) {
  const dna = input?.dna ?? buildProductDna(input);
  const facts = dna.authoritativeFacts;
  const title = dna.title;
  const benefit = facts[0] || "تفاصيل المنتج موضحة بوضوح قبل الشراء";
  const audience = input?.audience ? clean(input.audience, 200) : "المتسوقون الذين يبحثون عن هذا المنتج";
  const creative = {
    headline: title,
    primaryText: `${title} — ${benefit}.`,
    sellingPoints: facts,
    cta: "اكتشف المنتج",
    audience,
    cautions: dna.unknowns
  };
  const integrity = checkProductIntegrity(dna, [creative.headline, creative.primaryText, ...creative.sellingPoints].join(" "));
  return { version: 1, creative, dna, integrity, provider: "deterministic-safe-fixture" };
}
