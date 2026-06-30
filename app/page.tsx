"use client";

import { useState, useRef, useCallback } from "react";
import type { SearchResultItem, SearchResponse, IngestResponse } from "@/types";

const SAMPLE = [
  {
    title: "Bangladesh: Technical Assistance Report-Disaster Risk Financing",
    subtitle: "Technical Assistance Report-Disaster Risk Financing",
    abstract:
      "Disasters have posed significant economic costs to Bangladesh, and financing needs associated with disaster response are estimated to be substantial. Bangladesh has put in place fiscal mechanisms, social protection programs, and financial instruments to respond to natural disasters. While the country has adequate resources for recurrent disasters, financing gap for moderate and severe disasters remains large. The government could strengthen fiscal policy mechanisms to help close the financing gap and make social programs more shock-responsive and scalable in times of disaster.",
    description: "",
    pageTitle: "",
  },
  {
    title: "Actualización de Perspectivas Económicas Mundiales, enero de 2026",
    subtitle: "Technical Assistance Report-Disaster Risk Financing",
    abstract: "",
    description:
      "Crecimiento resiliente gracias a que la tecnología y la adaptabilidad contrarrestan los obstáculos de la política comercial",
    pageTitle: "",
  },
  {
    title: "مستجدات : الاقتصاد العالمي: استقرار وسط قوى متباينة",
    subtitle:
      "نمو صامد بفضل التكنولوجيا والقدرة على التكيف أمام السياسات التجارية المعاكسة",
    abstract:
      "يُتَوَقَّع بلوغ النمو العالمي 3,3% في 2026 و3,2% في 2027، وهو ارتفاع طفيف عن آفاق الاقتصاد العالمي الصادر في أكتوبر 2025. فتحولات السياسات التجارية تُوازنها استثمارات التكنولوجيا، والدعم المالي والنقدي، والأوضاع المالية التيسيرية، وقدرة القطاع الخاص على التكيف.",
    description:
      "يُتَوَقَّع بلوغ النمو العالمي 3,3% في 2026 و3,2% في 2027، وهو ارتفاع طفيف عن آفاق الاقتصاد العالمي الصادر في أكتوبر 2025.",
    pageTitle: "",
  },
  {
    title: "Мировая экономика устойчива на фоне разнонаправленных факторов",
    subtitle: "Technical Assistance Report-Disaster Risk Financing",
    abstract:
      "По прогнозу, темпы роста мировой экономики составят 3,3 процента в 2026 году и 3,2 процента 2027 году, что немного выше прогнозов в докладе Перспективы развития мировой экономики за октябрь 2025 года.",
    description:
      "По прогнозу, темпы роста мировой экономики составят 3,3 процента в 2026 году и 3,2 процента 2027 году; эти показатели существенно не изменились по сравнению с прогнозами.",
    pageTitle:
      "Бюллетень Перспективы развития мировой экономики, январь 2026 года: Мировая экономика устойчива на фоне разнонаправленных факторов",
  },
];

const LANG_LABEL: Record<string, string> = {
  latin: "EN/ES",
  ar: "العربية",
  ru: "RU",
  zh: "中文",
};

function Skeleton() {
  return (
    <div
      style={{
        border: "1px solid var(--bd)",
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {[70, 50, 88, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: 11,
            width: `${w}%`,
            background: "var(--sh)",
            borderRadius: 4,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function Card({ r, rank }: { r: SearchResultItem; rank: number }) {
  const [open, setOpen] = useState(false);
  const isRtl = r.locale === "ar";
  const hasSub =
    r.subtitle &&
    r.subtitle.toLowerCase() !== r.title.toLowerCase() &&
    !(r.locale !== "latin" && /^[\x00-\x7F\s\-:,.]+$/.test(r.subtitle));
  const body = r.abstract || r.description;

  return (
    <article
      style={{
        border: "1px solid var(--bd)",
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        gap: 14,
        background: "var(--card)",
        transition: "border-color .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ac)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bd)")}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--acm)",
          color: "var(--ac)",
          fontSize: 12,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }} dir={isRtl ? "rtl" : "ltr"}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--tp)",
              lineHeight: 1.4,
              margin: 0,
              flex: 1,
            }}
          >
            {r.title}
          </h3>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 99,
              background: "var(--acm)",
              color: "var(--ac)",
              fontWeight: 500,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {LANG_LABEL[r.locale] ?? r.locale}
          </span>
        </div>
        {hasSub && (
          <p
            style={{
              fontSize: 13,
              color: "var(--tm)",
              margin: "0 0 8px",
              fontStyle: "italic",
            }}
          >
            {r.subtitle}
          </p>
        )}
        {body && (
          <p
            style={{
              fontSize: 13,
              color: "var(--ts)",
              lineHeight: 1.7,
              margin: 0,
              display: open ? "block" : "-webkit-box",
              WebkitLineClamp: open ? undefined : 3,
              WebkitBoxOrient: "vertical",
              overflow: open ? "visible" : "hidden",
            }}
          >
            {body}
          </p>
        )}
        {body && body.length > 200 && (
          <button
            onClick={() => setOpen((x) => !x)}
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "var(--ac)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {open ? "Show less" : "Read more"}
          </button>
        )}
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: "var(--tm)",
            fontFamily: "monospace",
          }}
          dir="ltr"
        >
          score {r.score.toFixed(4)} · id: {r.id}
          {r.articleId ? ` · articleId: ${r.articleId}` : ""}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [json, setJson] = useState("");
  const [ingestState, setIngestState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [ingestRes, setIngestRes] = useState<IngestResponse | null>(null);
  const [ingestErr, setIngestErr] = useState("");

  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [srchErr, setSrchErr] = useState("");
  const [dur, setDur] = useState<number | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function runIngest(j: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(j);
    } catch {
      setIngestErr("Invalid JSON — check the format");
      setIngestState("error");
      return;
    }

    setIngestState("running");
    setIngestErr("");
    setIngestRes(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ingest failed");
      setIngestRes(data);
      setIngestState("done");
    } catch (e: any) {
      setIngestErr(e.message);
      setIngestState("error");
    }
  }

  const doSearch = useCallback(async (q: string, l: string) => {
    if (!q.trim()) {
      setResults([]);
      setDur(null);
      return;
    }
    abort.current?.abort();
    abort.current = new AbortController();
    setLoading(true);
    setSrchErr("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, top: 10, language: l || undefined }),
        signal: abort.current.signal,
      });
      const data: SearchResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? "Search failed");
      setResults(data.results);
      setDur(data.durationMs);
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setSrchErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQ(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(q, lang), 400);
  }

  function handleLang(l: string) {
    setLang(l);
    if (query) doSearch(query, l);
  }

  return (
    <>
      <style>{`
        :root { --bg:#f5f6f8; --card:#fff; --bd:#e2e4e9; --ac:#4f6ef7; --acm:#eef1fe; --tp:#111827; --ts:#374151; --tm:#6b7280; --sh:#ebebeb; }
        @media (prefers-color-scheme: dark) { :root { --bg:#0d0f16; --card:#161922; --bd:#252836; --ac:#6b8ef7; --acm:#1a2040; --tp:#eef0f6; --ts:#c0c4d4; --tm:#6e7490; --sh:#1e2130; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--tp); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; min-height: 100vh; }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
        @keyframes spin  { to { transform: rotate(360deg) } }
        textarea:focus, input:focus, select:focus { outline: 2px solid var(--ac); outline-offset: 2px; }
        button:focus-visible { outline: 2px solid var(--ac); outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--bd)",
          padding: "0 28px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          IMF Article Search
        </span>
        <span
          style={{
            fontSize: 11,
            padding: "2px 9px",
            borderRadius: 99,
            background: "var(--acm)",
            color: "var(--ac)",
            fontWeight: 500,
          }}
        >
          Multilingual · EN ES AR RU
        </span>
        <div style={{ flex: 1 }} />
        {ingestState === "done" && ingestRes && (
          <span style={{ fontSize: 12, color: "var(--tm)" }}>
            {ingestRes.indexed} article{ingestRes.indexed !== 1 ? "s" : ""}{" "}
            indexed
          </span>
        )}
      </header>

      <main
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Step 1 */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--bd)",
            borderRadius: 12,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--tm)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Step 1 — Paste JSON
            </p>
            <button
              onClick={() => setJson(JSON.stringify(SAMPLE, null, 2))}
              style={{
                fontSize: 12,
                color: "var(--ac)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Load sample data (EN + ES + AR + RU)
            </button>
          </div>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder={
              '[\n  {\n    "title": "...",\n    "subtitle": "...",\n    "abstract": "...",\n    "description": "...",\n    "pageTitle": "..."\n  }\n]'
            }
            spellCheck={false}
            style={{
              width: "100%",
              height: 200,
              padding: "12px 14px",
              border: "1px solid var(--bd)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
              background: "var(--bg)",
              color: "var(--tp)",
              resize: "vertical",
              lineHeight: 1.6,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => runIngest(json)}
              disabled={!json.trim() || ingestState === "running"}
              style={{
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 500,
                background: "var(--ac)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                opacity: !json.trim() || ingestState === "running" ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {ingestState === "running" && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                    display: "inline-block",
                  }}
                />
              )}
              {ingestState === "running" ? "Indexing…" : "Index articles"}
            </button>
            {ingestState === "done" && ingestRes && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#16a34a" }}>
                  ✓ {ingestRes.indexed} indexed
                  {ingestRes.skipped > 0
                    ? `, ${ingestRes.skipped} duplicate(s) skipped`
                    : ""}
                  {ingestRes.failed > 0 ? `, ${ingestRes.failed} failed` : ""}
                </span>
                {ingestRes.warnings?.map((w, i) => (
                  <span key={i} style={{ fontSize: 12, color: "#b45309" }}>
                    ⚠ {w}
                  </span>
                ))}
              </div>
            )}
            {ingestState === "error" && (
              <span style={{ fontSize: 13, color: "#dc2626" }}>
                {ingestErr}
              </span>
            )}
          </div>
        </section>

        {/* Step 2 */}
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--tm)",
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            Step 2 — Search
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--tm)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQ(e.target.value)}
                placeholder="e.g. 'global growth forecast 2026' — matches AR/RU/ES too"
                style={{
                  width: "100%",
                  padding: "13px 42px",
                  border: "1px solid var(--bd)",
                  borderRadius: 10,
                  fontSize: 14,
                  background: "var(--card)",
                  color: "var(--tp)",
                  transition: "border-color .15s",
                }}
              />
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    border: "2px solid var(--ac)",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin .7s linear infinite",
                  }}
                />
              )}
              {query && !loading && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setDur(null);
                  }}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--tm)",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={lang}
              onChange={(e) => handleLang(e.target.value)}
              style={{
                padding: "0 14px",
                fontSize: 13,
                border: "1px solid var(--bd)",
                borderRadius: 10,
                background: "var(--card)",
                color: "var(--ts)",
                cursor: "pointer",
              }}
            >
              <option value="">All languages</option>
              <option value="latin">Latin (EN/ES/FR…)</option>
              <option value="ar">العربية</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {results.length > 0 && dur != null && (
            <p style={{ fontSize: 12, color: "var(--tm)" }}>
              {results.length} results · {dur}ms · hybrid cross-lingual
            </p>
          )}

          {srchErr && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: "#991b1b",
              }}
            >
              {srchErr}
            </div>
          )}

          {loading && !results.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map((r, i) => (
                <Card key={r.id} r={r} rank={i + 1} />
              ))}
            </div>
          )}

          {!query && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "var(--tm)",
              }}
            >
              <p style={{ fontSize: 14, marginBottom: 14 }}>
                Try a cross-lingual query
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {[
                  "global growth forecast 2026",
                  "disaster risk financing",
                  "trade policy technology",
                  "IMF quota review",
                  "النمو العالمي",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      doSearch(s, lang);
                    }}
                    style={{
                      padding: "7px 14px",
                      fontSize: 12,
                      border: "1px solid var(--bd)",
                      borderRadius: 99,
                      background: "var(--card)",
                      color: "var(--ts)",
                      cursor: "pointer",
                      transition: "border-color .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--ac)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--bd)")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !srchErr && query && results.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "var(--tm)",
              }}
            >
              <p style={{ fontWeight: 500 }}>No results</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Try a different query or remove the language filter
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
