import React, { useEffect, useState } from "react";
import customerAxios from "../../utils/customerAxios";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const KAKAO_CLIENT_ID  = import.meta.env.VITE_KAKAO_CLIENT_ID;
const GOOGLE_FORCE_CONSENT = String(import.meta.env.VITE_GOOGLE_FORCE_CONSENT || "").toLowerCase() === "true";

// PKCE (Google)
const b64url = (ab) =>
  btoa(String.fromCharCode(...new Uint8Array(ab)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
const rand = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256b64url = async (txt) => {
  const data = new TextEncoder().encode(txt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return b64url(digest);
};

export default function CustomerLogin() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(null); // 'google' | 'kakao' | null

  useEffect(() => {
    try {
      sessionStorage.removeItem("oauth_temp_token");
      sessionStorage.removeItem("oauth_prefill");
    } catch {}
  }, []);

  const issueStateOrThrow = async () => {
    setMsg("");
    const { data } = await customerAxios.get("/auth/customers/oauth/state", {
      __skipAuthRefresh: true,
    });
    const state = data?.result?.state;
    if (!state) throw new Error("state 발급 실패");
    sessionStorage.setItem("oauth_state", state);
    return state;
  };

  const startGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      alert("VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.");
      return;
    }
    try {
      setLoading("google");
      const state = await issueStateOrThrow();

      // PKCE
      const verifier = rand();
      sessionStorage.setItem("pkce_verifier", verifier);
      const challenge = await sha256b64url(verifier);

      const redirectUri = `${window.location.origin}/oauth/google/callback`;

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      // 오프라인 액세스 요청 — 최초 동의(또는 언링크 후 재동의) 시 refresh_token 반환
      url.searchParams.set("access_type", "offline");
      // 선택: 재동의 강제(새 refresh_token 필요 시)
      if (GOOGLE_FORCE_CONSENT) {
        url.searchParams.set("prompt", "consent");
      }

      window.location.href = url.toString();
    } catch (e) {
      console.error(e);
      setMsg(e?.message || "Google OAuth 시작 중 오류");
      setLoading(null);
    }
  };

  const startKakao = async () => {
    if (!KAKAO_CLIENT_ID) {
      alert("VITE_KAKAO_CLIENT_ID 환경변수가 설정되지 않았습니다.");
      return;
    }
    try {
      setLoading("kakao");
      const state = await issueStateOrThrow();

      const redirectUri = `${window.location.origin}/oauth/kakao/callback`;
      const url = new URL("https://kauth.kakao.com/oauth/authorize");
      url.searchParams.set("client_id", KAKAO_CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("state", state);

      window.location.href = url.toString();
    } catch (e) {
      console.error(e);
      setMsg(e?.message || "Kakao OAuth 시작 중 오류");
      setLoading(null);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>고객 로그인 / 회원가입</h2>
      <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
        구글/카카오로 간편 로그인 또는 신규 회원가입을 진행할 수 있어요.
      </p>

      <div style={{ marginTop: 16 }}>
        <button onClick={startGoogle} disabled={loading === "google"} style={{ marginRight: 8 }}>
          {loading === "google" ? "Google 이동 중..." : "Google로 계속하기"}
        </button>
        <button onClick={startKakao} disabled={loading === "kakao"}>
          {loading === "kakao" ? "Kakao 이동 중..." : "Kakao로 계속하기"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p>}
    </div>
  );
}
