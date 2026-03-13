/**
 * 고속검색 속성 관련 유틸 — Intent 기반 메시지 분류 시스템
 *
 * classifyMessage(text) 하나로 사용자 메시지의 의도(SEARCH/REMOVE/RESTORE/TRACK)를
 * 판별하고, 텍스트에서 속성을 추출한다.
 */

import { IMAGE_ATTRIBUTES, ATTRIBUTE_SYNONYM_MAP } from './fast-search-image-attributes';

/* ─────────────────────────────────────────────
 *  Intent Keywords (단일 소스)
 * ───────────────────────────────────────────── */

export const INTENT_KEYWORDS = {
  SEARCH: [
    '보여줘', '보여주세요', '보여주', '보여줘요', '보여', '보여줄래', '보여봐',
    '찾아줘', '찾아주세요', '찾아', '찾아봐', '찾기', '찾자',
    '검색', '검색해줘', '검색해',
    '볼래', '보자',
    '확인해줘', '확인',
    '조회해줘', '조회',
    '포함', '포함해', '포함해줘',
    '넣어줘', '적용해줘', '필터해줘', '걸러줘',
  ],
  REMOVE: [
    '삭제', '삭제해', '삭제해줘',
    '제거', '제거해', '제거해줘',
    '지워', '지워줘',
    '빼줘', '빼주', '빼줘요',
    '없애', '없애줘',
    '숨김', '숨겨',
    '제외',
  ],
  RESTORE: [
    '복원', '복원해', '복원해줘',
    '복구',
    '되돌려', '되돌리', '되돌려줘',
    '살려', '살려줘',
    '다시',
  ],
  TRACK: ['객체 추적', '객체추적'],
} as const;

const ALL_INTENT_KEYWORDS: string[] = [
  ...INTENT_KEYWORDS.SEARCH,
  ...INTENT_KEYWORDS.REMOVE,
  ...INTENT_KEYWORDS.RESTORE,
  ...INTENT_KEYWORDS.TRACK,
];

/* ─────────────────────────────────────────────
 *  Types
 * ───────────────────────────────────────────── */

export type MessageIntent = 'SEARCH' | 'REMOVE' | 'RESTORE' | 'TRACK' | 'UNKNOWN';

export interface ClassifiedMessage {
  intent: MessageIntent;
  attributes: string[];
  rawText: string;
}

/* ─────────────────────────────────────────────
 *  Attribute Lookup Tables
 * ───────────────────────────────────────────── */

export const KNOWN_ATTRIBUTES: string[] = (() => {
  const set = new Set<string>();
  Object.values(IMAGE_ATTRIBUTES).forEach((m) => m.attributes.forEach((a) => set.add(a)));
  return Array.from(set);
})();

const SYNONYM_TO_CANONICAL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canonical, synonyms] of Object.entries(ATTRIBUTE_SYNONYM_MAP)) {
    for (const syn of synonyms) {
      map[syn] = canonical;
    }
  }
  return map;
})();

const ALL_SEARCHABLE_TERMS: string[] = (() => {
  const set = new Set<string>();
  KNOWN_ATTRIBUTES.forEach((a) => set.add(a));
  Object.keys(SYNONYM_TO_CANONICAL).forEach((s) => set.add(s));
  Object.keys(ATTRIBUTE_SYNONYM_MAP).forEach((c) => set.add(c));
  return Array.from(set).sort((a, b) => b.length - a.length);
})();

const normalizeSpaceless = (s: string): string => s.replace(/\s+/g, '');

/* ─────────────────────────────────────────────
 *  Attribute Parsing
 * ───────────────────────────────────────────── */

/**
 * 텍스트에서 속성을 찾고, 동의어를 정규값으로 해석한 뒤,
 * 같은 정규값 그룹에 속하는 KNOWN_ATTRIBUTES도 함께 반환한다.
 */
export const findAttributesInText = (text: string): string[] => {
  const tNorm = normalizeSpaceless(text);
  const foundCanonicals = new Set<string>();

  for (const term of ALL_SEARCHABLE_TERMS) {
    const termN = normalizeSpaceless(term);
    if (termN.length < 2 || !tNorm.includes(termN)) continue;

    const canonical = SYNONYM_TO_CANONICAL[term];
    if (canonical) {
      foundCanonicals.add(canonical);
    }
    if (KNOWN_ATTRIBUTES.includes(term)) {
      foundCanonicals.add(term);
    }
    if (ATTRIBUTE_SYNONYM_MAP[term]) {
      foundCanonicals.add(term);
    }
  }

  const withTransitive = new Set(foundCanonicals);
  for (const attr of foundCanonicals) {
    const parent = SYNONYM_TO_CANONICAL[attr];
    if (parent) {
      withTransitive.add(parent);
    }
  }

  const expanded = new Set(withTransitive);
  for (const attr of withTransitive) {
    const synonyms = ATTRIBUTE_SYNONYM_MAP[attr];
    if (!synonyms) continue;
    for (const syn of synonyms) {
      if (KNOWN_ATTRIBUTES.includes(syn)) {
        expanded.add(syn);
      }
    }
  }

  return Array.from(expanded);
};

/** 파싱 결과 중 ATTRIBUTE_SYNONYM_MAP 키(정규값)만 추출 — 사용자 표시용 */
export const getCanonicalDisplayNames = (parsed: string[]): string[] => {
  const canonicals = parsed.filter((a) => ATTRIBUTE_SYNONYM_MAP[a] !== undefined);
  return canonicals.length > 0 ? canonicals : parsed;
};

/* ─────────────────────────────────────────────
 *  Intent Classification
 * ───────────────────────────────────────────── */

const hasKeyword = (text: string, keywords: readonly string[]): boolean =>
  keywords.some((kw) => text.includes(kw));

/**
 * 사용자 메시지를 인텐트로 분류하고 속성을 추출한다.
 *
 * 우선순위:
 *   1. TRACK  — "객체 추적" 포함
 *   2. SEARCH — SEARCH 키워드가 있으면 항상 SEARCH 우선
 *               ("제외하고 찾아줘" = SEARCH, "제외해줘" = REMOVE)
 *   3. REMOVE — REMOVE 키워드만 있고 SEARCH 키워드 없을 때
 *   4. RESTORE — RESTORE 키워드만 있고 SEARCH 키워드 없을 때
 *   5. UNKNOWN — fallback
 */
export const classifyMessage = (text: string): ClassifiedMessage => {
  const t = text.trim();

  if (hasKeyword(t, INTENT_KEYWORDS.TRACK)) {
    return { intent: 'TRACK', attributes: [], rawText: t };
  }

  const isSearch = hasKeyword(t, INTENT_KEYWORDS.SEARCH);
  const isRemove = hasKeyword(t, INTENT_KEYWORDS.REMOVE);
  const isRestore = hasKeyword(t, INTENT_KEYWORDS.RESTORE);

  const attributes = findAttributesInText(t);

  if (isSearch) {
    return { intent: 'SEARCH', attributes, rawText: t };
  }
  if (isRemove) {
    return { intent: 'REMOVE', attributes, rawText: t };
  }
  if (isRestore) {
    return { intent: 'RESTORE', attributes, rawText: t };
  }
  if (attributes.length > 0) {
    return { intent: 'SEARCH', attributes, rawText: t };
  }

  return { intent: 'UNKNOWN', attributes: [], rawText: t };
};

/* ─────────────────────────────────────────────
 *  Similar Attribute Suggestions
 * ───────────────────────────────────────────── */

const KO_PARTICLES = [
  '을', '를', '이', '가', '은', '는', '에', '의', '로', '으로',
  '에서', '도', '좀', '해줘', '해주세요', '주세요', '해', '요',
  '것', '거', '좀', '다', '그', '저', '이런', '한', '된', '있는',
];

const FALLBACK_SUGGESTIONS = [
  '남성', '여성', '후드', '패딩', '바지', '운동화', '모자', '우산', '가방',
];

export const findSimilarAttributes = (text: string, maxSuggestions = 5): string[] => {
  const noiseWords = [...ALL_INTENT_KEYWORDS, '만', ...KO_PARTICLES];
  let cleaned = text.trim();
  for (const w of noiseWords) {
    cleaned = cleaned.split(w).join(' ');
  }
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 1);
  if (tokens.length === 0) return FALLBACK_SUGGESTIONS.slice(0, maxSuggestions);

  const inputNorm = normalizeSpaceless(cleaned);

  const scored: { term: string; canonical: string; score: number }[] = [];

  for (const [canonical, synonyms] of Object.entries(ATTRIBUTE_SYNONYM_MAP)) {
    for (const syn of synonyms) {
      const s = scoreTermForTokens(syn, tokens, inputNorm);
      if (s > 0) scored.push({ term: syn, canonical, score: s });
    }
    const cs = scoreTermForTokens(canonical, tokens, inputNorm);
    if (cs > 0) scored.push({ term: canonical, canonical, score: cs });
  }

  scored.sort((a, b) => b.score - a.score);

  const seenCanonical = new Set<string>();
  const results: string[] = [];

  for (const { term, canonical } of scored) {
    if (seenCanonical.has(canonical)) continue;
    seenCanonical.add(canonical);
    results.push(term);
    if (results.length >= maxSuggestions) break;
  }

  if (results.length === 0) {
    return FALLBACK_SUGGESTIONS.slice(0, maxSuggestions);
  }

  return results;
};

const scoreTermForTokens = (term: string, tokens: string[], inputNorm: string): number => {
  const termN = normalizeSpaceless(term);
  if (termN === inputNorm) return 0;

  let total = 0;
  let matched = 0;

  for (const tok of tokens) {
    const tokN = normalizeSpaceless(tok);
    if (tokN.length < 1) continue;

    let s = 0;
    if (termN === tokN) {
      s = 100;
    } else if (termN.includes(tokN)) {
      s = 60 + (tokN.length / termN.length) * 30;
    } else if (tokN.includes(termN) && termN.length >= 2) {
      s = 40 + (termN.length / tokN.length) * 20;
    }

    if (s > 0) {
      total += s;
      matched++;
    }
  }

  if (total === 0) return 0;
  if (matched > 1) total *= 1.5;
  if (termN.length >= 4) total *= 1.2;

  return total;
};

/* ─────────────────────────────────────────────
 *  Backward-compat wrappers (Home-v3, v4, with-link)
 * ───────────────────────────────────────────── */

/** @deprecated classifyMessage 사용 권장 */
export const parseExcludedAttributesFromMessage = (text: string): string[] => {
  const { intent, attributes } = classifyMessage(text);
  return intent === 'REMOVE' ? attributes : findAttributesInText(text);
};

/** @deprecated classifyMessage 사용 권장 */
export const parseIncludedAttributesFromMessage = (text: string): string[] => {
  const { intent, attributes } = classifyMessage(text);
  return intent === 'RESTORE' || intent === 'SEARCH' ? attributes : findAttributesInText(text);
};

/** @deprecated classifyMessage 사용 권장 */
export const parseShowOnlyAttributesFromMessage = (text: string): string[] => {
  const { intent, attributes } = classifyMessage(text);
  return intent === 'SEARCH' ? attributes : [];
};
