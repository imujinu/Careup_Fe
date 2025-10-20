import React, { useEffect, useRef, useState } from "react";
import { customerTokenStorage } from "../../service/customerAuthService";

const AUTH_BASE = import.meta.env.VITE_CUSTOMER_AUTH_URL || "http://localhost:8080";

export default function OAuthCallbackKakao() {
  const [msg, setMsg] = useState("처리 중...");
  const ranRef = useRef(false); // StrictMode 중복 실행 가드

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const p = new URLSearchParams(window.location.search);
      const code = p.get("code");
      const state = p.get("state");

      if (!code) {
        setMsg("코드가 없습니다.");
        return;
      }

      try {
        const r = await fetch(`${AUTH_BASE}/auth/customers/oauth/kakao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const j = await r.json();
        if (!r.ok) throw new Error(j?.status_message || "서버 오류");
        const res = j?.result;

        if (res?.status === "COMPLETE") {
          if (res.accessToken) customerTokenStorage.setTokens(res.accessToken, res.refreshToken);
          customerTokenStorage.setUserInfo({
            memberId: res.memberId,
            role: res.role,
            email: res.email,
            name: res.name,
            nickname: res.nickname,
            phone: res.phone,
          });
          window.location.replace("/customer/success");
          return;
        }

        if (res?.status === "INCOMPLETE" && res?.oauthTempToken) {
          sessionStorage.setItem("oauth_temp_token", res.oauthTempToken);
          sessionStorage.setItem(
            "oauth_prefill",
            JSON.stringify({ email: res.email || "", name: res.name || "", nickname: "" })
          );
          window.location.replace("/customer/oauth/additional-info");
          return;
        }

        setMsg("알 수 없는 상태입니다.");
      } catch (e) {
        console.error(e);
        setMsg(e.message || "로그인 처리 실패");
      }
    };

    run();
  }, []);

  return <div style={{ padding: 24 }}>{msg}</div>;
}
