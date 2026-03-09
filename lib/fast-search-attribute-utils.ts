/**
 * 고속검색 속성 관련 유틸.
 * - 에이전트 메시지에서 속성을 파싱 (정규값 + 동의어 지원)
 * - "검은바지 삭제" → 정규값 "검정바지"로 해석 → 같은 그룹 전부 제외
 */

import { IMAGE_ATTRIBUTES, ATTRIBUTE_SYNONYM_MAP } from './fast-search-image-attributes';

const DELETE_KEYWORDS = [
  '숨김', '숨겨', '삭제', '빼줘', '빼주', '제거', '없애', '지워',
  '삭제해', '제거해', '제외', '빼줘요', '삭제해줘', '제거해줘', '지워줘', '없애줘',
];

const ADD_KEYWORDS = [
  '추가', '복원', '보여줘', '보여주', '다시', '되돌려', '되돌리',
  '복구', '추가해', '추가해줘', '보여줘요', '복원해', '복원해줘',
  '되돌려줘', '살려', '살려줘', '포함', '포함해', '포함해줘',
];

/** 이미지에 정의된 모든 정규값 속성 (중복 제거) */
export const KNOWN_ATTRIBUTES: string[] = (() => {
  const set = new Set<string>();
  Object.values(IMAGE_ATTRIBUTES).forEach((m) => m.attributes.forEach((a) => set.add(a)));
  return Array.from(set);
})();

/** 동의어 → 정규값 역방향 맵 (빠른 조회용) */
const SYNONYM_TO_CANONICAL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canonical, synonyms] of Object.entries(ATTRIBUTE_SYNONYM_MAP)) {
    for (const syn of synonyms) {
      map[syn] = canonical;
    }
  }
  return map;
})();

/** 검색 가능한 모든 용어 (이미지 속성 + 동의어 + 정규값 키) — 긴 것부터 매칭 */
const ALL_SEARCHABLE_TERMS: string[] = (() => {
  const set = new Set<string>();
  KNOWN_ATTRIBUTES.forEach((a) => set.add(a));
  Object.keys(SYNONYM_TO_CANONICAL).forEach((s) => set.add(s));
  Object.keys(ATTRIBUTE_SYNONYM_MAP).forEach((c) => set.add(c));
  return Array.from(set).sort((a, b) => b.length - a.length);
})();

const normalizeSpaceless = (s: string): string => s.replace(/\s+/g, '');

/**
 * 텍스트에서 속성을 찾고, 동의어를 정규값으로 해석한 뒤,
 * 같은 정규값 그룹에 속하는 KNOWN_ATTRIBUTES도 함께 반환한다.
 *
 * 예: "뒷모습 삭제" →
 *   1. "뒷모습" 매칭 → 동의어 → 정규값 "후면"
 *   2. "뒷모습"도 다른 이미지에서 KNOWN_ATTRIBUTE이면 포함
 *   → 반환: ["후면", "뒷모습"]
 */
const findAttributesInText = (text: string): string[] => {
  const tNorm = normalizeSpaceless(text);
  const foundCanonicals = new Set<string>();

  for (const term of ALL_SEARCHABLE_TERMS) {
    if (!tNorm.includes(normalizeSpaceless(term))) continue;

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

  // 전이적 해석: 찾은 정규값이 다른 정규값의 동의어이기도 하면 상위도 추가
  // 예: "전면 삭제" → 전면(KNOWN_ATTR) + 전면은 정면의 동의어 → 정면도 추가
  const withTransitive = new Set(foundCanonicals);
  for (const attr of foundCanonicals) {
    const parent = SYNONYM_TO_CANONICAL[attr];
    if (parent) {
      withTransitive.add(parent);
    }
  }

  // 그룹 확장: 정규값의 동의어 중 KNOWN_ATTRIBUTE인 것도 포함
  // 예: "후드티" → 동의어에 "회색후드티"(KNOWN_ATTR) → 추가
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

/**
 * "야간 삭제", "차량 제거" 등 delete류 문장에서 제외할 속성 추출.
 * 동의어를 정규값으로 해석하고, 같은 그룹의 KNOWN_ATTRIBUTE도 포함.
 */
export const parseExcludedAttributesFromMessage = (text: string): string[] => {
  const t = text.trim();
  if (!DELETE_KEYWORDS.some((kw) => t.includes(kw))) return [];
  return findAttributesInText(t);
};

/**
 * "우산 추가", "청바지 복원" 등 add류 문장에서 복원할 속성 추출.
 * 동의어를 정규값으로 해석하고, 같은 그룹의 KNOWN_ATTRIBUTE도 포함.
 */
export const parseIncludedAttributesFromMessage = (text: string): string[] => {
  const t = text.trim();
  if (!ADD_KEYWORDS.some((kw) => t.includes(kw))) return [];
  return findAttributesInText(t);
};

export const isAddLikeText = (text: string): boolean => {
  const t = text.trim();
  return ADD_KEYWORDS.some((kw) => t.includes(kw));
};

/** "{{속성}}만 보여줘" 패턴 감지 (공백 무시) */
export const isShowOnlyText = (text: string): boolean => {
  const t = text.replace(/\s+/g, '');
  return /만(보여줘|보여주세요|보여주|보여줘요|보여|표시해줘|표시해|표시|남겨줘|남겨)/.test(t);
};

/** "만 보여줘" 패턴에서 대상 속성 추출 (동의어 해석 + 그룹 확장 포함) */
export const parseShowOnlyAttributesFromMessage = (text: string): string[] => {
  const t = text.trim();
  if (!isShowOnlyText(t)) return [];
  return findAttributesInText(t);
};

/** 파싱 결과 중 ATTRIBUTE_SYNONYM_MAP 키(정규값)만 추출 — 사용자 표시용 */
export const getCanonicalDisplayNames = (parsed: string[]): string[] => {
  const canonicals = parsed.filter((a) => ATTRIBUTE_SYNONYM_MAP[a] !== undefined);
  return canonicals.length > 0 ? canonicals : parsed;
};
