/**
 * 고속검색 속성 관련 유틸.
 * - 에이전트 "무슨 속성 삭제" / "제거" / "숨김" 등 메시지에서 제외할 속성 파싱
 */

import { IMAGE_ATTRIBUTES } from './fast-search-image-attributes';

const DELETE_KEYWORDS = [
  '숨김', '숨겨', '삭제', '빼줘', '빼주', '제거', '없애', '지워',
  '삭제해', '제거해', '제외', '빼줘요', '삭제해줘', '제거해줘', '지워줘', '없애줘',
];

/** 이미지에 정의된 모든 속성 (중복 제거) */
export const KNOWN_ATTRIBUTES: string[] = (() => {
  const set = new Set<string>();
  Object.values(IMAGE_ATTRIBUTES).forEach((m) => m.attributes.forEach((a) => set.add(a)));
  return Array.from(set);
})();

/** 띄어쓰기 제거 후 비교용 (흰색 패딩 ↔ 흰색패딩 동일 처리) */
const normalizeSpaceless = (s: string): string => s.replace(/\s+/g, '');

/**
 * "야간 삭제", "차량 제거" 등 delete류 문장에서 제외할 속성 추출.
 * - 메시지에 삭제 키워드가 있고, 알려진 속성명이 포함되어 있으면 해당 속성 반환
 * - 띄어쓰기 구분 없이 매칭 (예: "흰색패딩 삭제" → "흰색 패딩")
 * - 여러 개 가능: "야간, 차량 제거" → ['야간','차량']
 */
export const parseExcludedAttributesFromMessage = (text: string): string[] => {
  const t = text.trim();
  const hasDelete = DELETE_KEYWORDS.some((kw) => t.includes(kw));
  if (!hasDelete) return [];

  const tNorm = normalizeSpaceless(t);
  const found: string[] = [];
  for (const attr of KNOWN_ATTRIBUTES) {
    if (tNorm.includes(normalizeSpaceless(attr))) found.push(attr);
  }
  return found;
};
