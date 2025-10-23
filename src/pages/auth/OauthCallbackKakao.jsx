import React, { useEffect, useRef, useState } from "react";
import { customerTokenStorage } from "../../service/customerAuthService";
import customerAxios from "../../utils/customerAxios";
import WelcomeModal from "../../components/common/WelcomeModal";
import LoginSuccessModal from "../../components/common/LoginSuccessModal";
import { hasSeenWelcome, markWelcomeSeen } from "../../utils/welcomeSeen";

export default function OauthCallbackKakao() {
  const [msg, setMsg] = useState("처리 중...");
  const ranRef = useRef(false);

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomeNick, setWelcomeNick] = useState("");
  const [loginSuccessOpen, setLoginSuccessOpen] = useState(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const p = new URLSearchParams(window.location.search);

      const errorParam = p.get("error");
      if (errorParam) {
        setMsg(`로그인 취소/오류: ${errorParam}`);
        return;
      }

      const code = p.get("code");
      const state = p.get("state");
      if (!code) {
        setMsg("코드가 없습니다.");
        return;
      }

      const localState = sessionStorage.getItem("oauth_state");
      if (localState && state !== localState) {
        setMsg("요청이 만료되었거나 위조되었습니다. 처음부터 다시 진행해 주세요.");
        return;
      }

      try {
        const { data } = await customerAxios.post(
          "/auth/customers/oauth/kakao",
          { code, state },
          { __skipAuthRefresh: true }
        );
        const res = data?.result;

        // 상태 정리
        sessionStorage.removeItem("oauth_state");

        if (res?.status === "COMPLETE") {
          // 토큰/유저 저장
          if (res.accessToken) customerTokenStorage.setTokens(res.accessToken, res.refreshToken);
          customerTokenStorage.setUserInfo({
            memberId: res.memberId,
            role: res.role,
            email: res.email,
            name: res.name,
            nickname: res.nickname,
            phone: res.phone,
          });

          // 최초 여부 = 로컬 플래그 기준
          const memberId = res.memberId;
          const isFirst = !hasSeenWelcome(memberId);

          setWelcomeName(res.name || "");
          setWelcomeNick(res.nickname || "");

          if (isFirst) {
            markWelcomeSeen(memberId);
            setWelcomeOpen(true);
          } else {
            setLoginSuccessOpen(true);
          }
          setMsg("");
          return;
        }

        if (res?.status === "INCOMPLETE" && res?.oauthTempToken) {
          sessionStorage.setItem("oauth_temp_token", res.oauthTempToken);
          sessionStorage.setItem(
            "oauth_prefill",
            JSON.stringify({
              provider: res.provider || "KAKAO",
              email: res.email || "",
              name: res.name || "",
              nickname: "",
            })
          );
          window.location.replace("/customer/oauth/additional-info");
          return;
        }

        setMsg("알 수 없는 상태입니다.");
      } catch (e) {
        const serverMsg = e?.response?.data?.status_message;
        setMsg(serverMsg || e.message || "로그인 처리 실패");
      }
    };

    run();
  }, []);

  const goShop = () => window.location.replace("/shop");

  return (
    <div style={{ padding: 24 }}>
      {msg}

      {/* 최초 로그인(가입 직후) */}
      <WelcomeModal
        open={welcomeOpen}
        name={welcomeName}
        nickname={welcomeNick}
        primaryLabel="쇼핑 시작하기"
        onPrimary={() => {
          setWelcomeOpen(false);
          goShop();
        }}
        onClose={() => {
          setWelcomeOpen(false);
          goShop();
        }}
      />

      {/* 재로그인 */}
      <LoginSuccessModal
        open={loginSuccessOpen}
        primaryLabel="쇼핑 시작하기"
        onPrimary={() => {
          setLoginSuccessOpen(false);
          goShop();
        }}
        onClose={() => {
          setLoginSuccessOpen(false);
          goShop();
        }}
      />
    </div>
  );
}
