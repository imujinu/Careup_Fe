// /src/pages/auth/CustomerLogin.jsx
import React from "react";

const AUTH_BASE = import.meta.env.VITE_CUSTOMER_AUTH_URL || "http://localhost:8080";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;

export default function CustomerLogin() {
  const handleOAuth = async (provider) => {
    try {
      // 1) 서버에서 state 발급
      const r = await fetch(`${AUTH_BASE}/auth/customers/oauth/state`);
      const j = await r.json();
      const state = j?.result?.state;
      if (!state) {
        alert("state 발급 실패");
        return;
      }

      // 2) 공급자 인가 URL로 리다이렉트
      const redirectUri =
        provider === "google"
          ? `${window.location.origin}/oauth/google/callback`
          : `${window.location.origin}/oauth/kakao/callback`;

      if (provider === "google") {
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "openid email profile");
        url.searchParams.set("state", state);
        window.location.href = url.toString();
      } else if (provider === "kakao") {
        const url = new URL("https://kauth.kakao.com/oauth/authorize");
        url.searchParams.set("client_id", KAKAO_CLIENT_ID);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("state", state);
        window.location.href = url.toString();
      }
    } catch (e) {
      console.error(e);
      alert("OAuth 시작 중 오류");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>고객 로그인 (OAuth 테스트)</h2>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => handleOAuth("google")} style={{ marginRight: 8 }}>
          Google 로그인
        </button>
        <button onClick={() => handleOAuth("kakao")}>Kakao 로그인</button>
      </div>
    </div>
  );
}
