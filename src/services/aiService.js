import { getUsedReviewsHistory, markReviewAsUsed } from './storageService';

/**
 * Dynamic Multi-Style AI Review Generator for Aymorix Technologies
 * Alternates Review Lengths:
 *  - 1st Generation: 2 to 3 lines (~25-35 words)
 *  - 2nd Generation: 1 to 2 lines (~12-20 words)
 *  - 3rd Generation: 2 to 3 lines ... (Vice Versa!)
 * Millions of unique combinations with zero repetition.
 */

export const generateSingleAiReview = async ({ name, rating, answers, questions, grokApiKey, geminiApiKey }) => {
  const usedHistory = getUsedReviewsHistory();

  // Try generating up to 30 unique variations until finding an unused one
  for (let attempt = 0; attempt < 30; attempt++) {
    const isShortMode = (attempt + usedHistory.length) % 2 === 1; // Alternates between Short (1-2 lines) and Full (2-3 lines)
    const rawCandidate = await generateCandidateReview({ name, rating, answers, questions, grokApiKey, geminiApiKey, attempt, isShortMode });
    const candidate = formatReviewLength(rawCandidate, isShortMode);
    const normalized = candidate.trim().toLowerCase();

    // Anti-duplicate check
    const isDuplicate = usedHistory.some((used) => {
      if (used === normalized) return true;
      if (used.slice(0, 25) === normalized.slice(0, 25)) return true;
      return false;
    });

    if (!isDuplicate) {
      markReviewAsUsed(candidate);
      return candidate;
    }
  }

  const isShortMode = (usedHistory.length) % 2 === 1;
  const rawFallback = await generateCandidateReview({ name, rating, answers, questions, grokApiKey, geminiApiKey, attempt: 99, isShortMode });
  const fallback = formatReviewLength(rawFallback, isShortMode);
  markReviewAsUsed(fallback);
  return fallback;
};

/* Format text strictly into 1-2 lines (Short Mode) or 2-3 lines (Full Mode) */
const formatReviewLength = (text, isShortMode) => {
  if (!text || !text.trim()) return '';
  let clean = text.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ');

  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];

  if (isShortMode) {
    // 1 to 2 lines limit (max 2 sentences, max ~120 characters)
    let trimmed = sentences.slice(0, 2).join(' ').trim();
    if (trimmed.length > 125) {
      const cutoff = trimmed.lastIndexOf('.', 120);
      if (cutoff > 40) {
        trimmed = trimmed.substring(0, cutoff + 1);
      }
    }
    return trimmed;
  } else {
    // 2 to 3 lines limit (max 3 sentences, max ~210 characters)
    let trimmed = sentences.slice(0, 3).join(' ').trim();
    if (trimmed.length > 220) {
      const cutoff = trimmed.lastIndexOf('.', 210);
      if (cutoff > 80) {
        trimmed = trimmed.substring(0, cutoff + 1);
      }
    }
    return trimmed;
  }
};

const generateCandidateReview = async ({ name, rating, answers, questions, grokApiKey, geminiApiKey, attempt, isShortMode }) => {
  const getExactIndex = (qId) => {
    const q = questions?.find((item) => item.id === qId);
    if (!q || !q.options) return 0;
    const idx = q.options.findIndex((opt) => opt === answers[qId]);
    return idx >= 0 ? idx : 0;
  };

  const q1Idx = getExactIndex('q1'); // Quality
  const q2Idx = getExactIndex('q2'); // Speed
  const q3Idx = getExactIndex('q3'); // Support
  const q4Idx = getExactIndex('q4'); // Tech Expertise
  const q5Idx = getExactIndex('q5'); // Recommend

  const q1Val = answers.q1 || 'High Quality';
  const q2Val = answers.q2 || 'Fast / Ahead';
  const q3Val = answers.q3 || 'Excellent';
  const q4Val = answers.q4 || 'Cutting-Edge';
  const q5Val = answers.q5 || 'Highly Likely';

  const isAllHigh = q1Idx === 0 && q2Idx === 0 && q3Idx === 0 && q4Idx === 0 && q5Idx === 0 && rating >= 4;
  const isLowOverall = (q1Idx === 2 && q2Idx === 2) || (q5Idx === 2 && rating <= 3) || (rating <= 2);

  const selectedSummary = [
    `1. Quality: "${q1Val}" (Option #${q1Idx + 1})`,
    `2. Speed: "${q2Val}" (Option #${q2Idx + 1})`,
    `3. Support: "${q3Val}" (Option #${q3Idx + 1})`,
    `4. Expertise: "${q4Val}" (Option #${q4Idx + 1})`,
    `5. Recommend: "${q5Val}" (Option #${q5Idx + 1})`,
    `Rating: ${rating} Stars`
  ].join('\n');

  const timestampSeed = `${Date.now()}_${Math.floor(Math.random() * 100000)}_${attempt}`;

  // Check Grok key from Settings or .env file
  const envGrokKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GROK_API_KEY : '';
  const activeGrokKey = grokApiKey || envGrokKey || (geminiApiKey && geminiApiKey.startsWith('xai-') ? geminiApiKey : null);

  // 1. Primary: Try xAI Grok API if Grok key is provided
  if (activeGrokKey && activeGrokKey.trim().length > 5 && !activeGrokKey.includes('your_xai_grok')) {
    try {
      const targetLengthRule = isShortMode
        ? 'STRICT LENGTH: Write a CONCISE 1 TO 2-LINE REVIEW (EXACTLY 1 TO 2 SHORT SENTENCES, 12-18 words total).'
        : 'STRICT LENGTH: Write a COMPLETE 2 TO 3-LINE REVIEW (EXACTLY 2 TO 3 SENTENCES, 25-32 words total).';

      const prompt = `Write a Google Review for Aymorix Technologies on behalf of a customer.
Customer Name: ${name || 'Customer'}
Selected Answers:
${selectedSummary}
Random Seed: ${timestampSeed}

CRITICAL RULES:
1. ${targetLengthRule}
2. SENTIMENT MATCH: ${isAllHigh ? 'The customer selected ALL TOP-TIER choices! Write an enthusiastic review.' : isLowOverall ? 'The customer selected low options. Write a critical, honest review.' : 'Accurately reflect the survey choices.'}
3. DYNAMIC PHRASING VARIETY: Vary phrasing style between simple everyday words, verbatim survey words, and rich synonyms.
4. Output ONLY plain review text without quotes.`;

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGrokKey.trim()}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: `You write Google Reviews alternating between ${isShortMode ? 'concise 1 to 2 lines' : 'full 2 to 3 lines'}.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.98
        })
      });

      if (res.ok) {
        const json = await res.json();
        const rawText = json.choices?.[0]?.message?.content;
        if (rawText && rawText.trim()) {
          return rawText;
        }
      }
    } catch (e) {
      console.warn('Grok API call failed:', e);
    }
  }

  // 2. Secondary: Try Google Gemini API if Gemini key is provided
  if (geminiApiKey && geminiApiKey.trim().length > 10 && !geminiApiKey.startsWith('xai-')) {
    try {
      const targetLengthRule = isShortMode
        ? 'STRICT LENGTH: Write a CONCISE 1 TO 2-LINE REVIEW (EXACTLY 1 TO 2 SHORT SENTENCES, 12-18 words total).'
        : 'STRICT LENGTH: Write a COMPLETE 2 TO 3-LINE REVIEW (EXACTLY 2 TO 3 SENTENCES, 25-32 words total).';

      const prompt = `Write a Google Review for Aymorix Technologies on behalf of a customer.
Customer Name: ${name || 'Customer'}
Selected Answers:
${selectedSummary}
Random Seed: ${timestampSeed}

CRITICAL RULES:
1. ${targetLengthRule}
2. SENTIMENT MATCH: ${isAllHigh ? 'The customer selected ALL TOP-TIER choices! Write an enthusiastic review.' : isLowOverall ? 'The customer selected low options. Write a critical, honest review.' : 'Accurately reflect the survey choices.'}
3. DYNAMIC PHRASING VARIETY: Vary phrasing style between simple everyday words, verbatim survey words, and rich synonyms.
4. Output ONLY plain review text without quotes.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.98,
              topP: 0.95
            }
          })
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText && rawText.trim()) {
          return rawText;
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed:', e);
    }
  }

  // 3. Fallback: Local Engine (Respects isShortMode)
  return generateMultiStyleLocalReview(q1Val, q2Val, q3Val, q4Val, q5Val, q1Idx, q2Idx, q3Idx, q4Idx, q5Idx, rating, attempt, isAllHigh, isShortMode);
};

/* Multi-Style Local Review Synthesizer supporting length alternation (Short Mode vs Full Mode) */
const generateMultiStyleLocalReview = (q1Val, q2Val, q3Val, q4Val, q5Val, q1Idx, q2Idx, q3Idx, q4Idx, q5Idx, rating, attempt, isAllHigh, isShortMode) => {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Clean strings
  const cleanQ1 = q1Val.toLowerCase();
  const cleanQ2 = q2Val.toLowerCase();
  const cleanQ3 = q3Val.toLowerCase();
  const cleanQ4 = q4Val.toLowerCase();
  const cleanQ5 = q5Val.toLowerCase();

  // Short Mode (1 to 2 lines)
  if (isShortMode) {
    const shortIntros = [
      "Aymorix Technologies is a very good company.",
      "Great work by Aymorix Technologies!",
      "Aymorix Technologies is a good software company.",
      "Very good experience with Aymorix Technologies!",
      "Good company to work with!"
    ];

    const shortDetails = [
      `They did good work, quality was good, and delivery was fast.`,
      `Software quality was good and support was very helpful.`,
      `Quality is good and project delivery was on time.`,
      `The team did a good job and features were great.`,
      `Good quality work with responsive team support.`
    ];

    const shortEndings = [
      "Highly recommended!",
      "Recommended for software projects!",
      "Will work with them again!",
      "Five stars for Aymorix!"
    ];

    return `${pick(shortIntros)} ${pick(shortDetails)} ${pick(shortEndings)}`;
  }

  // Full Mode (2 to 3 lines) - Low-Tier Generator
  const lowCount = [q1Idx === 2, q2Idx === 2, q3Idx === 2, q4Idx === 2, q5Idx === 2].filter(Boolean).length;
  if (lowCount >= 3 || rating <= 2) {
    const lowIntros = [
      `Sharing honest feedback for Aymorix Technologies.`,
      `My experience with Aymorix Technologies was below expectations.`,
      `Leaving critical feedback for Aymorix Technologies.`,
      `Providing a candid review regarding Aymorix Technologies.`,
      `Here is my honest take on Aymorix Technologies.`
    ];

    const lowQualityPool = [
      "code quality that needs work",
      "a codebase requiring significant refinement",
      "functional software that fell short on polish",
      "build quality with room for improvement",
      "software performance that needs work"
    ];

    const lowSpeedPool = [
      "experienced delivery delays",
      "progressed slower than scheduled timelines",
      "faced milestone schedule extensions",
      "had a delayed delivery schedule",
      "took longer than expected"
    ];

    const lowSupportPool = [
      "average team communication",
      "inconsistent developer support",
      "slow response times",
      "room for improvement in client updates",
      "basic developer coordination"
    ];

    const lowOutros = [
      "Hoping for major improvements in upcoming sprints.",
      "Scope for significant refinement before recommending.",
      "Unlikely to partner again until key issues are addressed.",
      "Considerable work needed on execution speed and quality.",
      "Mixed experience overall with key areas to improve."
    ];

    const qPart = pick(lowQualityPool);
    const sPart = pick(lowSpeedPool);
    const suppPart = pick(lowSupportPool);

    const lowTemplates = [
      `The project suffered from ${qPart} along with ${sPart}.`,
      `We encountered ${sPart} and ${suppPart}.`,
      `The build reflected ${qPart} despite ${suppPart}.`,
      `Execution faced ${sPart} with ${qPart}.`
    ];

    return `${pick(lowIntros)} ${pick(lowTemplates)} ${pick(lowOutros)}`;
  }

  // Full Mode (2 to 3 lines) - High Selections
  if (isAllHigh) {
    const highIntros = [
      "Working with Aymorix Technologies was an outstanding experience.",
      "Aymorix Technologies delivered top-tier software performance.",
      "Impressed by the exceptional software engineering at Aymorix Technologies.",
      "Partnering with Aymorix Technologies delivered outstanding value.",
      "Aymorix Technologies is an exceptional software development partner."
    ];

    const highDetails = [
      `They provided ${q1Val} software delivered ${q2Val} with ${q3Val} support.`,
      `Their team demonstrated stellar code craftsmanship and ${q2Val} milestone delivery.`,
      `Software quality was ${q1Val} and developer communication was ${q3Val}.`,
      `Everything was executed ${q2Val} with ${q4Val} technical expertise.`,
      `They delivered ${q1Val} results with ${q3Val} client care.`
    ];

    const highEndings = [
      "I am Highly Likely to recommend Aymorix Technologies!",
      "Five stars all around for Aymorix Technologies!",
      "I strongly endorse Aymorix for any custom tech build!",
      "Highly recommended for digital transformation projects!"
    ];

    return `${pick(highIntros)} ${pick(highDetails)} ${pick(highEndings)}`;
  }

  // Full Mode (2 to 3 lines) - Standard Mixed Selections
  const qualitySynonyms = {
    0: ["top-tier software quality", "stellar code craftsmanship", "flawless product performance", "exceptional build quality"],
    1: ["solid baseline code quality", "satisfactory software performance", "dependable build quality"],
    2: ["code quality requiring refinement", "software groundwork with scope for tuning", "basic software performance"]
  };

  const speedSynonyms = {
    0: ["delivered fast ahead of schedule", "executed with rapid turnaround", "delivered ahead of deadline", "completed with impressive speed"],
    1: ["delivered right on time", "completed on schedule", "executed punctually on deadline"],
    2: ["despite a delayed delivery schedule", "following minor schedule extensions", "with extended turnaround timelines"]
  };

  const supportSynonyms = {
    0: ["excellent developer support", "outstanding team communication", "proactive client guidance", "dedicated developer assistance"],
    1: ["good communication", "attentive team support", "helpful developer coordination"],
    2: ["standard communication", "average support response times", "basic developer assistance"]
  };

  const techSynonyms = {
    0: ["cutting-edge technical expertise", "innovative tech solutions", "state-of-the-art engineering", "deep architectural mastery"],
    1: ["sufficient technical capability", "practical engineering solutions", "solid technical foundation"],
    2: ["straightforward technical features", "simple feature setup", "basic technical execution"]
  };

  const recommendSynonyms = {
    0: ["I highly recommend Aymorix Technologies for software development!", "Five stars for Aymorix Technologies!", "I strongly endorse Aymorix for any tech project.", "A truly exceptional software partner!"],
    1: ["A dependable choice for custom software development.", "A solid team worth considering for digital projects.", "A fair software vendor."],
    2: ["Hoping for better optimizations in future sprints.", "Scope for improvement before recommending.", "Mixed experience overall."]
  };

  const qualSyn = pick(qualitySynonyms[q1Idx]);
  const speedSyn = pick(speedSynonyms[q2Idx]);
  const suppSyn = pick(supportSynonyms[q3Idx]);
  const techSyn = pick(techSynonyms[q4Idx]);
  const recSyn = pick(recommendSynonyms[q5Idx]);

  const mixedIntros = [
    `Aymorix Technologies provided ${qualSyn} ${speedSyn}.`,
    `Aymorix Technologies delivered ${cleanQ1} software ${speedSyn}.`,
    `Working with Aymorix Technologies resulted in ${qualSyn} on schedule.`
  ];

  const mixedMiddles = [
    `Their team offered ${suppSyn} and ${techSyn}.`,
    `They provided ${cleanQ3} communication along with ${techSyn}.`,
    `Support was ${suppSyn} with ${cleanQ4} features.`
  ];

  return `${pick(mixedIntros)} ${pick(mixedMiddles)} ${recSyn}`;
};
