import tfr2023 from "./tfr_2023.json";

// UN WPP 2024 via UNICEF (UN System Data Commons), total fertility rate, 2023, all 232 countries/areas, sorted high → low.
// Korea 0.72 is 230th; only Hong Kong (0.717) and Macau (0.662) are lower. The official 2023 figure is also 0.72.
export const TFR_2023: number[] = tfr2023;
export const KOREA_RANK_2023 = 230;
export const TOP_2023 = { name: "소말리아", value: 6.13 };

// UN WPP 2024 for Korea, 2000–2025 (2024–2025 are projections).
export const UN_KOR = [1.467, 1.342, 1.227, 1.199, 1.164, 1.115, 1.145, 1.215, 1.19, 1.178, 1.226, 1.258, 1.274, 1.206, 1.197, 1.202, 1.14, 1.035, 0.951, 0.88, 0.812, 0.783, 0.78, 0.72, 0.734, 0.749];

// 국가데이터처 (Statistics Korea) official figures.
export const GOV_KOR: [number, number][] = [[2023, 0.72], [2024, 0.75], [2025, 0.8]];

// 2026 H1 births, 국가데이터처 2026년 6월 인구동향: 145,804 (+19,430, +15.4%, largest increase on record).
export const H1_2026 = { births: 145804, delta: 19430, pct: 15.4 };

// Births by birth year, 통계청 인구동향조사 (1990–2006).
export const BIRTHS_KR: [number, number][] = [
  [1990, 649738], [1991, 709275], [1992, 730678], [1993, 715826], [1994, 721185], [1995, 715020], [1996, 691226],
  [1997, 675394], [1998, 641594], [1999, 620668], [2000, 640089], [2001, 559934], [2002, 496911], [2003, 495036],
  [2004, 476958], [2005, 438707], [2006, 451759],
];
