// Minimal client for the UN System Data Commons MCP endpoint (no auth). Same server data.un.org's
// own site uses; see https://projects.officialstatistics.org/undata2/undatacommons-mcp/.
const URL = "https://unsd-datacommons.gcp.un-icc.cloud/mcp";

async function call(name, args) {
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  const t = await r.text();
  const line = t.split("\n").filter((l) => l.startsWith("data: ")).map((l) => l.slice(6)).join("");
  const j = JSON.parse(line);
  if (j.error) throw new Error(JSON.stringify(j.error));
  const text = j.result.content.map((c) => c.text).join("");
  try { return JSON.parse(text); } catch { throw new Error(text.slice(0, 400)); }
}

// All countries' latest (or given date) value for one variable, sorted high→low, with names.
export async function getAllCountries(variableDcid, date = "latest") {
  const j = await call("get_child_observations", { variable_dcid: variableDcid, parent_place_dcid: "Earth", child_place_type: "Country", date });
  const names = Object.fromEntries(j.entityMetadata.rows.map((r) => [r[0], r[1]]));
  const rows = j.data.rows
    .filter(([, , v]) => typeof v === "number")
    .map(([dcid, date, value]) => ({ dcid, iso3: dcid.replace("country/", ""), name: names[dcid] || dcid, date, value }))
    .sort((a, b) => b.value - a.value);
  return { rows, source: j.sourceMetadata };
}
