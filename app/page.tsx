"use client";

import { useState, useEffect } from "react";
import { regions } from "./lib/regions";

type FormState = "idle" | "loading" | "success" | "duplicate" | "error";

export default function Home() {
  const [name, setName] = useState("");
  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [mustEat, setMustEat] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fingerprint, setFingerprint] = useState("");

  const sidoList = Object.keys(regions);
  const gugunList = sido ? regions[sido] : [];

  useEffect(() => {
    (async () => {
      try {
        const FP = (await import("@fingerprintjs/fingerprintjs")).default;
        const fp = await FP.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch {
        // fingerprint 없이도 진행 가능
      }
    })();
  }, []);

  const handleSidoChange = (value: string) => {
    setSido(value);
    setGugun("");
  };

  const isValid =
    name.trim().length > 0 &&
    sido.length > 0 &&
    gugun.length > 0 &&
    mustEat.trim().length > 0 &&
    mustEat.trim().length <= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setFormState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          region_sido: sido,
          region_gugun: gugun,
          must_eat: mustEat.trim(),
          fingerprint,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setFormState("duplicate");
      } else if (!res.ok) {
        setFormState("error");
        setErrorMsg(data.error || "오류가 발생했습니다.");
      } else {
        setFormState("success");
      }
    } catch {
      setFormState("error");
      setErrorMsg("네트워크 오류가 발생했습니다.");
    }
  };

  const handleReset = () => {
    setName("");
    setSido("");
    setGugun("");
    setMustEat("");
    setFormState("idle");
    setErrorMsg("");
  };

  const inputBase: React.CSSProperties = {
    fontFamily: "Pretendard, sans-serif",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #333",
    borderRadius: 0,
    padding: "12px 0",
    fontSize: "16px",
    color: "#111",
    width: "100%",
    outline: "none",
  };

  const selectBase: React.CSSProperties = {
    ...inputBase,
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  };

  const Header = () => (
    <header style={{ marginBottom: "48px", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: "10px" }}>
        <span style={{ fontSize: "28px", fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>무광도</span>
        <span style={{ fontSize: "18px", fontWeight: 400, color: "#555", letterSpacing: "0.05em" }}>無廣圖</span>
      </div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: "5px", letterSpacing: "0.03em" }}>광고 없는 진짜 맛집</div>
      <div style={{ borderBottom: "1px solid #E0E0E0", marginTop: "14px" }} />
    </header>
  );

  if (formState === "success") {
    return (
      <div style={{ backgroundColor: "#FAF9F6", minHeight: "100vh", fontFamily: "Pretendard, sans-serif" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "60px 32px", textAlign: "center" }}>
          <Header />
          <div style={{ paddingTop: "40px" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#111", lineHeight: 1.5, marginBottom: "32px" }}>
              기록했어,<br />고마워!
            </div>
            <p style={{ fontSize: "15px", color: "#888", lineHeight: 1.8, marginBottom: "48px" }}>
              당신의 기억이 무광도를 만듭니다.
            </p>
            <button
              onClick={handleReset}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                color: "#333",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                cursor: "pointer",
                fontFamily: "Pretendard, sans-serif",
                padding: 0,
              }}
            >
              다른 맛집도 남기기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FAF9F6", minHeight: "100vh", fontFamily: "Pretendard, sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "60px 32px" }}>

        <Header />

        {/* 메인 카피 — 가운데 정렬 */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#111", lineHeight: 1.6, margin: 0 }}>
            진짜 좋았던 곳만<br />남겨주세요.
          </h1>
        </div>

        {/* 폼 — 왼쪽 정렬 유지 */}
        <form onSubmit={handleSubmit}>

          {/* 1. 지역 */}
          <div style={{ marginBottom: "36px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#666", letterSpacing: "0.1em", marginBottom: "4px" }}>
              지역
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              <select
                value={sido}
                onChange={(e) => handleSidoChange(e.target.value)}
                style={{ ...selectBase, flex: 1, color: sido ? "#111" : "#BBB" }}
                onFocus={(e) => { e.currentTarget.style.borderBottom = "2px solid #000"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottom = "1px solid #333"; }}
              >
                <option value="" disabled>시 / 도</option>
                {sidoList.map((s) => (
                  <option key={s} value={s} style={{ color: "#111" }}>{s}</option>
                ))}
              </select>
              <select
                value={gugun}
                onChange={(e) => setGugun(e.target.value)}
                disabled={!sido}
                style={{ ...selectBase, flex: 1, color: gugun ? "#111" : "#BBB", opacity: sido ? 1 : 0.4 }}
                onFocus={(e) => { e.currentTarget.style.borderBottom = "2px solid #000"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottom = "1px solid #333"; }}
              >
                <option value="" disabled>구 / 군</option>
                {gugunList.map((g) => (
                  <option key={g} value={g} style={{ color: "#111" }}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. 상호명 */}
          <div style={{ marginBottom: "36px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#666", letterSpacing: "0.1em", marginBottom: "4px" }}>
              상호명
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="가게 이름을 적어주세요"
              maxLength={50}
              style={inputBase}
              onFocus={(e) => { e.currentTarget.style.borderBottom = "2px solid #000"; }}
              onBlur={(e) => { e.currentTarget.style.borderBottom = "1px solid #333"; }}
            />
          </div>

          {/* 3. 뭐먹어? */}
          <div style={{ marginBottom: "36px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#666", letterSpacing: "0.1em", marginBottom: "4px" }}>
              뭐먹어?
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={mustEat}
                onChange={(e) => setMustEat(e.target.value)}
                placeholder="꼭 먹어야 할 메뉴는? (20자 이내)"
                maxLength={20}
                style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderBottom = "2px solid #000"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottom = "1px solid #333"; }}
              />
              <span style={{
                position: "absolute",
                right: 0,
                bottom: "12px",
                fontSize: "11px",
                color: mustEat.length >= 20 ? "#c00" : "#BBB",
              }}>
                {mustEat.length}/20
              </span>
            </div>
          </div>

          {formState === "duplicate" && (
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "16px", fontStyle: "italic" }}>
              이미 제보하신 맛집입니다 😊
            </p>
          )}
          {formState === "error" && errorMsg && (
            <p style={{ fontSize: "13px", color: "#c00", marginBottom: "16px" }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || formState === "loading"}
            style={{
              marginTop: "32px",
              width: "100%",
              padding: "16px",
              backgroundColor: !isValid || formState === "loading" ? "#ccc" : "#000",
              color: "#FAF9F6",
              border: "none",
              fontSize: "16px",
              fontFamily: "Pretendard, sans-serif",
              fontWeight: 400,
              cursor: !isValid || formState === "loading" ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (isValid && formState !== "loading") e.currentTarget.style.backgroundColor = "#2B2B2B";
            }}
            onMouseLeave={(e) => {
              if (isValid && formState !== "loading") e.currentTarget.style.backgroundColor = "#000";
            }}
          >
            {formState === "loading" ? "기록 중..." : "기록 남기기"}
          </button>
        </form>

      </div>
    </div>
  );
}
