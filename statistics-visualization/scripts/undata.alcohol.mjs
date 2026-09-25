// Fetches, filters (UN member states only) and ranks the alcohol indicators for episode 2, and
// writes src/episodes/alcohol/data.json. Read-only against the UN Data Commons MCP endpoint.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllCountries } from "./lib/undata-client.mjs";
import { filterUnMembers } from "./lib/un-members.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/episodes/alcohol/data.json");

async function ranked(label, variable, date) {
  const { rows, source } = await getAllCountries(variable, date);
  const members = filterUnMembers(rows);
  const korRank = members.findIndex((r) => r.iso3 === "KOR") + 1;
  const kor = members.find((r) => r.iso3 === "KOR");
  console.log(`\n### ${label}  [${variable}]  date=${date}`);
  console.log(`  fetched N=${rows.length} (incl. non-member territories) → UN member states N=${members.length}`);
  console.log(`  source: ${source?.provenanceUrl || "?"}`);
  console.log(`  top 5: ${members.slice(0, 5).map((r) => `${r.name} ${r.value.toFixed(2)}`).join(" · ")}`);
  console.log(`  Korea: #${korRank}/${members.length}  ${kor?.value.toFixed(2)} (${kor?.date})`);
  return {
    label, variable, date, source: source?.provenanceUrl || null,
    n: members.length,
    korea: { rank: korRank, value: kor?.value ?? null, date: kor?.date ?? null },
    top5: members.slice(0, 5).map((r) => ({ iso3: r.iso3, name: r.name, value: r.value, date: r.date })),
  };
}

const perCapita = await ranked("1인당 알코올 소비 (15세+, L/년)", "undata/sdg/SH_ALC_CONSPT.AGE--Y_GE15", "2020");
const heavy = await ranked("폭음 비율, 전체 성인 (지난 30일, %)", "undata/who/ALCO_HEAVY_E.AGE--Y_GE15__REF_PER_CD--LAST30DAYS", "2020");

// WHO's definition: 60g pure alcohol on one occasion ≈ 6 standard drinks. A 참이슬 후레쉬 소주
// bottle (15.7%, 360mL) holds 360×0.157×0.789(ethanol density) ≈ 44.6g pure alcohol, so 60g ≈ 1.34
// bottles. Kept here (not hand-typed in the episode) so the script that produces the number is the
// same file that states the assumption.
const soju = { abvPct: 15.7, mL: 360, densityGPerMl: 0.789 };
const sojuGrams = soju.mL * (soju.abvPct / 100) * soju.densityGPerMl;
const heavyThresholdG = 60;
const bottlesPerHeavySession = heavyThresholdG / sojuGrams;
console.log(`\n### 비유 계산: 소주 1병(${soju.abvPct}%, ${soju.mL}mL) ≈ ${sojuGrams.toFixed(1)}g 순수 알코올`);
console.log(`  WHO 폭음 기준 60g ≈ 소주 ${bottlesPerHeavySession.toFixed(2)}병`);

fs.writeFileSync(OUT, JSON.stringify({
  fetchedAt: new Date().toISOString().slice(0, 10),
  memberStateNote: "UN 회원국 193개국 기준으로 걸러 순위를 다시 매겼습니다 (홍콩·마카오·푸에르토리코 등 속령·SAR 제외).",
  perCapita, heavy,
  analogy: { soju, sojuGrams: Number(sojuGrams.toFixed(1)), heavyThresholdG, bottlesPerHeavySession: Number(bottlesPerHeavySession.toFixed(2)) },
}, null, 1));
console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
