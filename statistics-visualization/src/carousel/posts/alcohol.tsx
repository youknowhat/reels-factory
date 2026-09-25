import React from "react";
import data from "../../episodes/alcohol/data.json";
import { Accent, BottleStack, Card, RankRuler, RankTable, ShotGlass, Text, UnitGrid } from "../kit";
import { FONT, P } from "../tokens";

// Every number on the cards is derived here from data.json (fetched and ranked by
// scripts/undata.alcohol.mjs), so the cards can't drift from the source.
const { perCapita, heavy, analogy } = data;
const L_TO_G = 789; // g of ethanol per litre
const bottlesPerYear = (litres: number) => (litres * L_TO_G) / analogy.sojuGrams;
const KOR_BOTTLES = Math.round(bottlesPerYear(perCapita.korea.value)); // 150
const TOP = perCapita.top5[0]; // Romania
const TOP_BOTTLES = Math.round(bottlesPerYear(TOP.value)); // 300
const HEAVY_BOTTLES = analogy.heavyThresholdG / analogy.sojuGrams; // 1.35
const HEAVY_GLASSES = (HEAVY_BOTTLES * analogy.soju.mL) / 50; // 9.7 shot glasses of 50 mL
const PER_100 = Math.round(heavy.korea.value); // 45
const PER_WEEK = bottlesPerYear(perCapita.korea.value) / 52.14; // 2.9 — "일주일에 3병 가까이"

const KO: Record<string, string> = { ROU: "루마니아", LUX: "룩셈부르크", IRL: "아일랜드", KOR: "한국", COG: "콩고", GNQ: "적도 기니" };

const src = {
  perCapita: `1인당 알코올 소비(15세 이상, 순수 알코올) · UN SDG 3.5.2 · ${perCapita.date} · 자료가 있는 UN 회원국 ${perCapita.n}곳`,
  heavy: `폭음: 지난 30일 동안 한 자리에서 순수 알코올 60g 이상 마신 적이 있는 15세 이상 인구 비율 · WHO 추정 · ${heavy.date}`,
};

const Cover: React.FC = () => (
  <Card source="데이터: UN · WHO (2020)">
    <div style={{ position: "absolute", top: 150 }}>
      <Text size={150} weight={800}>{"한국인은\n술을 "}<Accent>많이</Accent>{"\n마실까요?"}</Text>
      <Text size={38} weight={600} color={P.muted} style={{ marginTop: 56 }}>
        {"마시는 양, 그리고 마시는 방식으로\n세계와 비교해 봤어요."}
      </Text>
    </div>
  </Card>
);

const Rank46: React.FC = () => (
  <Card source={src.perCapita}>
    <Text size={60} weight={800}>{`마시는 양으로 보면\n한국은 ${perCapita.n}개국 중`}</Text>
    <Text size={340} weight={900} color={P.accent} style={{ marginTop: 36 }}>{`${perCapita.korea.rank}위`}</Text>
    <Text size={48} weight={700} style={{ marginTop: 28 }}>세계 최고 술꾼은 아니에요.</Text>
    <div style={{ position: "absolute", bottom: 20 }}>
      <RankRuler n={perCapita.n} rank={perCapita.korea.rank} width={888} label={`한국 ${perCapita.korea.rank}위`} first={`1위 ${KO[TOP.iso3]}`} />
    </div>
  </Card>
);

const Bottles: React.FC = () => (
  <Card source={`맥주·와인 등 모든 술을 순수 알코올 양으로 바꿔 소주(${analogy.soju.abvPct}%, ${analogy.soju.mL}mL)로 환산 · UN SDG 3.5.2 · ${perCapita.date}`}>
    <Text size={56} weight={800}>{"15세 이상 한 명이 1년 동안\n마신 술을 소주로 바꾸면"}</Text>
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 110, alignItems: "flex-end" }}>
      <div>
        <BottleStack n={KOR_BOTTLES} cols={20} w={14} gap={5} color={P.ink} />
        <Text size={34} weight={700} style={{ marginTop: 28 }}>한국</Text>
        <Text size={88} weight={900} color={P.accent}>{`${KOR_BOTTLES}병`}</Text>
        <Text size={30} weight={600} color={P.muted} style={{ marginTop: 6 }}>{`일주일에 ${Math.ceil(PER_WEEK)}병 가까이`}</Text>
      </div>
      <div>
        <BottleStack n={TOP_BOTTLES} cols={20} w={14} gap={5} color={P.ink45} />
        <Text size={34} weight={700} style={{ marginTop: 28 }}>{`1위 ${KO[TOP.iso3]}`}</Text>
        <Text size={88} weight={900}>{`${TOP_BOTTLES}병`}</Text>
        <Text size={30} weight={600} color={P.muted} style={{ marginTop: 6 }}>한국의 딱 두 배</Text>
      </div>
    </div>
  </Card>
);

const Rank3: React.FC = () => (
  <Card source={src.heavy}>
    <Text size={60} weight={800}>{"그런데 한 번에\n몰아 마시는 걸로 보면"}</Text>
    <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 30 }}>
      <Text size={340} weight={900} color={P.accent}>{`${heavy.korea.rank}위`}</Text>
      <Text size={44} weight={700} color={P.muted}>{`/ ${heavy.n}개국`}</Text>
    </div>
    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0 }}>
      <RankTable rows={heavy.top5.map((r, i) => ({ rank: i + 1, name: KO[r.iso3], value: `${r.value.toFixed(1)}%`, korea: r.iso3 === "KOR" }))} />
    </div>
  </Card>
);

const Glasses: React.FC = () => {
  const full = Math.floor(HEAVY_GLASSES);
  return (
    <Card source={`WHO 폭음 기준 순수 알코올 ${analogy.heavyThresholdG}g ÷ 소주 1병(${analogy.soju.abvPct}%, ${analogy.soju.mL}mL)의 알코올 ${analogy.sojuGrams}g = ${HEAVY_BOTTLES.toFixed(2)}병`}>
      <Text size={60} weight={800}>{"여기서 ‘폭음’은\n한 자리에서 소주 "}<Accent>{`${HEAVY_BOTTLES.toFixed(2)}병`}</Accent></Text>
      <div style={{ position: "absolute", top: 390, left: 0, right: 0, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", rowGap: 44, justifyItems: "center" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <ShotGlass key={i} id={`g${i}`} w={132} fill={i < full ? 1 : i === full ? HEAVY_GLASSES - full : 0} />
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 30 }}>
        <Text size={46} weight={700}>{`소주잔으로 치면 ${HEAVY_GLASSES.toFixed(1)}잔.`}</Text>
        <Text size={46} weight={700} color={P.muted}>열 잔 가까이예요.</Text>
      </div>
    </Card>
  );
};

const People: React.FC = () => (
  <Card source={`15세 이상 전체 인구 기준(마시는 사람만이 아님) · WHO 추정 · ${heavy.date}`}>
    <Text size={52} weight={800}>{"지난 한 달, 이렇게 마신 날이\n하루라도 있는 사람은"}</Text>
    <Text size={120} weight={900} style={{ marginTop: 26 }}>{"100명 중 "}<Accent>{`${PER_100}명`}</Accent></Text>
    <div style={{ marginTop: 52 }}>
      <UnitGrid on={PER_100} d={40} gap={17} />
    </div>
    <div style={{ position: "absolute", bottom: 20 }}>
      <Text size={40} weight={700}>{`지난달 열 잔을 넘긴 날이 있었다면,\n당신도 이 ${PER_100}명 중 한 명이에요.`}</Text>
    </div>
  </Card>
);

const End: React.FC = () => (
  <Card source="출처와 기준은 캡션에 정리했어요.">
    <Text size={78} weight={800} style={{ marginTop: 40 }}>{"우리는\n많이 마시는 게 아니라,\n"}<Accent>몰아</Accent>{" 마시는 거예요."}</Text>
    <div style={{ position: "absolute", bottom: 40, left: 0, right: 0 }}>
      <div style={{ borderTop: `2px solid ${P.ink}`, paddingTop: 40 }}>
        <Text size={44} weight={800}>이번 달, 열 잔 넘게 마신 날은?</Text>
        <div style={{ display: "flex", gap: 48, marginTop: 26, fontSize: 40, fontWeight: 600 }}>
          <span>① 없음</span><span>② 1~2일</span><span>③ 3일 이상</span>
        </div>
        <Text size={32} weight={600} color={P.muted} style={{ marginTop: 20 }}>댓글로 번호만 남겨 주세요.</Text>
      </div>
      <div style={{ marginTop: 64, padding: "30px 34px", background: P.ink, color: P.paper, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4 }}>
        {"‘딱 한 잔만’이 입버릇인 친구에게\n보내 주세요."}
      </div>
    </div>
  </Card>
);

export const CARDS: React.FC[] = [Cover, Rank46, Bottles, Rank3, Glasses, People, End];

// Every literal on the cards, for font preloading (numbers are covered by the digits string).
export const TEXT =
  "데이터: UN · WHO (2020)한국인은술을많이마실까요?마시는 양, 그리고 마시는 방식으로세계와 비교해 봤어요." +
  "마시는 양으로 보면한국은개국 중위세계 최고 술꾼은 아니에요.한국1위루마니아" +
  "15세 이상 한 명이 1년 동안마신 술을 소주로 바꾸면병일주일에 3병 가까이한국의 딱 두 배맥주·와인 등 모든 술을 순수 알코올 양으로 바꿔 소주로 환산" +
  "그런데 한 번에몰아 마시는 걸로 보면룩셈부르크아일랜드콩고적도 기니폭음: 지난 30일 동안 한 자리에서 순수 알코올 60g 이상 마신 적이 있는 15세 이상 인구 비율 · WHO 추정" +
  "여기서 ‘폭음’은한 자리에서 소주소주잔으로 치면 잔.열 잔 가까이예요.WHO 폭음 기준 ÷ 소주 1병의 알코올" +
  "지난 한 달, 이렇게 마신 날이하루라도 있는 사람은100명 중명지난달 열 잔을 넘긴 날이 있었다면,당신도 이 명 중 한 명이에요.15세 이상 전체 인구 기준(마시는 사람만이 아님)" +
  "우리는많이 마시는 게 아니라,몰아 마시는 거예요.이번 달, 열 잔 넘게 마신 날은?① 없음② 1~2일③ 3일 이상댓글로 번호만 남겨 주세요.‘딱 한 잔만’이 입버릇인 친구에게보내 주세요.출처와 기준은 캡션에 정리했어요." +
  "0123456789.,%/·()—-~ 1인당 알코올 소비(15세 이상, 순수 알코올)UN SDG 3.5.2자료가 있는 UN 회원국곳gmL";
