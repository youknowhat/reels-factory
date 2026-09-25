import raw from "./data.json";

// UN System Data Commons (SDG portal / WHO), 2020, filtered to UN member states (un-members.mjs) —
// see scripts/undata.alcohol.mjs to re-fetch. Two different rankings of the same country on
// purpose: per-capita volume and heavy-episodic-drinking ("binge") rate move independently.
export const PER_CAPITA = {
  label: raw.perCapita.label,
  n: raw.perCapita.n,
  koreaRank: raw.perCapita.korea.rank,
  koreaValue: raw.perCapita.korea.value,
  top5: raw.perCapita.top5,
};

export const HEAVY = {
  label: raw.heavy.label,
  n: raw.heavy.n,
  koreaRank: raw.heavy.korea.rank,
  koreaValue: raw.heavy.korea.value,
  top5: raw.heavy.top5,
};

// 참이슬 후레쉬 15.7%, 360ml → 44.6g 순 알코올. WHO 폭음 기준 60g ≈ 1.35병.
export const ANALOGY = raw.analogy;
