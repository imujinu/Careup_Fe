import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import customerAxios from "../../utils/customerAxios";
import { customerAuthService } from "../../service/customerAuthService";
import { markJustLoggedIn } from "../../utils/loginSignals"; // ✅ 추가

import GoogleIcon from "../../assets/icons/google_icon.svg";
import KakaoIcon from "../../assets/icons/kakao_icon.svg";

/* ENV */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
const GOOGLE_FORCE_CONSENT =
  String(import.meta.env.VITE_GOOGLE_FORCE_CONSENT || "").toLowerCase() === "true";

/* PKCE utils (Google) */
const b64url = (ab) =>
  btoa(String.fromCharCode(...new Uint8Array(ab)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
const randomVerifier = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256b64url = async (text) => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return b64url(digest);
};

/* UI */
const CONTROL_HEIGHT = 54;
const CONTROL_RADIUS = 10;

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f6f7;
  padding: 24px;
`;
const Card = styled.div`
  width: 520px;
  max-width: 92vw;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.12);
  padding: 40px 36px 32px;
  text-align: left;
`;
const Brand = styled.h1`
  font-size: 44px; font-weight: 800; letter-spacing: 2px; margin: 0; text-align: center;
  font-family: "Arial Black","Helvetica Neue",Helvetica,Arial,sans-serif;
`;
const Slogan = styled.p`
  text-align: center; color: #9ca3af; margin-top: 6px; margin-bottom: 28px; font-size: 14px; letter-spacing: 1.4px;
`;
const Form = styled.form`display: grid; gap: 14px;`;
const Label = styled.label`font-size: 13px; color: #374151; display: block; margin-bottom: 6px;`;
const Input = styled.input`
  width: 100%; height: ${CONTROL_HEIGHT}px; border: 1px solid #e5e7eb; border-radius: ${CONTROL_RADIUS}px;
  padding: 0 14px; outline: none; font-size: 14px; background: #fff; transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6b7280; box-shadow: 0 0 0 4px rgba(107,114,128,0.12); }
`;
const PwdInput = styled(Input)`padding-right: 48px;`;
const PwdWrap = styled.div`position: relative;`;
const IconBtn = styled.button`
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px;
  border-radius: 8px; border: 1px solid transparent; background: transparent; color: #6b7280; display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:hover  { background: #f3f4f6; border-color: #e5e7eb; }
  &:active { transform: translateY(calc(-50% + 1px)); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(107,114,128,0.18); }
`;
const RememberRow = styled.div`display: flex; align-items: center; margin: 2px 0 0;`;
const RememberLabel = styled.label`
  display: inline-flex; align-items: center; gap: 10px; font-size: 13px; color: #374151; user-select: none;
  input[type="checkbox"] { width: 18px; height: 18px; margin: 0; accent-color: #111827; cursor: pointer; }
`;
const LoginBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: none; font-weight: 700; font-size: 15px; color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"}; cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;
const HelpRow = styled.div`
  display: flex; justify-content: center; gap: 18px; font-size: 13px; color: #6b7280; margin: 16px 0 6px;
  a { color: #6b7280; } .sep { color: #d1d5db; }
`;
const StyledLink = styled(Link)`color: #6b7280; text-decoration: none;`;
const SocialCol = styled.div`margin-top: 14px; display: grid; gap: 12px;`;
const SocialBtn = styled.button`
  position: relative; width: 100%; height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: none; font-weight: 700; font-size: 16px;
  padding: 0 16px; cursor: pointer; transition: transform .02s ease, filter .1s ease, background-color .15s ease;
  color: ${p => p.$variant === "kakao" ? "#111" : "#fff"};
  background: ${p => p.$variant === "google" ? "#EA4335" : "#FEE500"};
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.$variant === "google" ? "#d93d31" : "#f0d600"}; }
  &:disabled { filter: grayscale(.35); cursor: not-allowed; }
`;
const SocialIcon = styled.img`position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px;`;
const SocialText = styled.div`text-align: center; width: 100%; pointer-events: none;`;
const Msg = styled.p`margin-top: 10px; color: #dc2626; font-size: 13px; min-height: 18px;`;
const Hint = styled.p`margin-top: 6px; margin-bottom: 0; font-size: 12px; color: #9ca3af;`;

/* Icons */
const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.86 21.86 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0  0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-4.87 5.82" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
  </svg>
);

export default function CustomerLogin() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(null); // 'google' | 'kakao' | 'form' | null
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (customerAuthService.isAuthenticated()) {
      window.location.replace("/shop");
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.removeItem("oauth_temp_token");
      sessionStorage.removeItem("oauth_prefill");
    } catch {}
  }, []);

  const issueStateOrThrow = async () => {
    setMsg("");
    const { data } = await customerAxios.get("/auth/customers/oauth/state", { __skipAuthRefresh: true });
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
      const verifier = randomVerifier();
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
      url.searchParams.set("access_type", "offline");
      if (GOOGLE_FORCE_CONSENT) url.searchParams.set("prompt", "consent");

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
      url.searchParams.set("scope", "account_email talk_message");

      window.location.href = url.toString();
    } catch (e) {
      console.error(e);
      setMsg(e?.message || "Kakao OAuth 시작 중 오류");
      setLoading(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const id = loginId.trim();
    const pw = password.trim();
    if (!id || !pw) return;

    setLoading("form");
    setMsg("");

    try {
      await customerAuthService.login({ id, password: pw, rememberMe });
      markJustLoggedIn();
      window.location.replace("/shop");
    } catch (err) {
      const serverMsg = err?.response?.data?.status_message;
      setMsg(serverMsg || err.message || "로그인 실패");
    } finally {
      setLoading(null);
    }
  };

  const submitDisabled = !loginId.trim() || !password.trim() || loading === "form";

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="loginId">아이디</Label>
            <Input
              id="loginId"
              type="text"
              inputMode="text"
              placeholder="이메일 또는 휴대폰 번호"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              required
            />
            <Hint>전화번호는 하이픈 없이도 입력 가능합니다.</Hint>
          </div>

          <div>
            <Label htmlFor="password">비밀번호</Label>
            <PwdWrap>
              <PwdInput
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <IconBtn
                type="button"
                aria-label={showPwd ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPwd}
                onClick={() => setShowPwd((v) => !v)}
                title={showPwd ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </IconBtn>
            </PwdWrap>
          </div>

          <RememberRow>
            <RememberLabel htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              자동 로그인
            </RememberLabel>
          </RememberRow>

          <LoginBtn type="submit" disabled={submitDisabled}>
            {loading === "form" ? "로그인 중..." : "로그인"}
          </LoginBtn>
        </Form>

        <HelpRow>
          <StyledLink to="/customer/signup">회원가입</StyledLink>
          <span className="sep">|</span>
          <a href="#">아이디 찾기</a>
          <span className="sep">|</span>
          <StyledLink to="/customer/password/forgot">비밀번호 찾기</StyledLink>
        </HelpRow>

        <SocialCol>
          <SocialBtn type="button" $variant="google" onClick={startGoogle} disabled={loading === "google"}>
            <SocialIcon src={GoogleIcon} alt="Google" />
            <SocialText>{loading === "google" ? "구글로 이동 중..." : "구글 로그인"}</SocialText>
          </SocialBtn>

          <SocialBtn type="button" $variant="kakao" onClick={startKakao} disabled={loading === "kakao"}>
            <SocialIcon src={KakaoIcon} alt="Kakao" />
            <SocialText>{loading === "kakao" ? "카카오로 이동 중..." : "카카오 로그인"}</SocialText>
          </SocialBtn>
        </SocialCol>

        <Msg>{msg}</Msg>
      </Card>
    </Page>
  );
}
