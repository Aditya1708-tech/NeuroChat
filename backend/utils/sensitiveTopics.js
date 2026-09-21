// AI-005: Heuristic detection for sensitive topics (medical, legal, financial, safety)
// Supports English, Hindi, and Hinglish keywords

const SENSITIVE_PATTERNS = [
  // Medical & Health
  /\b(dose|dosage|medicine|medication|drug|pill|prescription|symptom|diagnos|disease|infection|treatment|doctor|hospital|cure|fever|painkiller|paracetamol|ibuprofen|antibiotic)\b/i,
  /(दवा|खुराक|इलाज|लक्षण|बीमारी|डॉक्टर|अस्पताल|दर्द|रोग)/i,

  // Legal
  /\b(lawsuit|lawyer|attorney|sue|court|judge|prosecut|contract|legal advice|divorce|custody|crime|bail)\b/i,
  /(मुकदमा|वकील|अदालत|कानूनी|जज|धारा)/i,

  // Financial
  /\b(invest|stocks?|crypto|bitcoin|trading|loan|mortgage|interest rate|tax return|audit|bank account|wire transfer|bankruptcy)\b/i,
  /(निवेश|शेयर|स्टॉक|कर्ज|ऋण|ब्याज|टैक्स|कर)/i,

  // Safety & Emergency
  /\b(suicide|self-harm|poison|overdose|bomb|weapon|emergency|kill|danger)\b/i,
  /(ज़हर|आत्महत्या|खतरा|आपातकाल)/i,
];

export function isSensitiveTopic(text) {
  if (!text || typeof text !== 'string') return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}
