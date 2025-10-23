// src/pages/auth/PasswordReset.jsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import publicAxios from "../../utils/publicAxios";

const CONTROL_HEIGHT = 54;
const CONTROL_RADIUS = 10;

/* ========================
 * Styled Components
 * ======================== */
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
`;

const Brand = styled.h1`
  font-size: 44px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0;
  text-align: center;
  font-family: "Arial Black","Helvetica Neue",Helvetica,Arial,sans-serif;
`;

const Slogan = styled.p`
  text-align: center;
  color: #9ca3af;
  margin-top: 6px;
  margin-bottom: 28px;
  font-size: 14px;
  letter-spacing: 1.4px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 2px 0 16px;
  text-align: left;
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #374151;
  display: block;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  height: ${CONTROL_HEIGHT}px;
  border: 1px solid #e5e7eb;
  border-radius: ${CONTROL_RADIUS}px;
  padding: 0 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6b7280; box-shadow: 0 0 0 4px rgba(107,114,128,0.12); }
`;

/* 비밀번호 토글용 */
const PwdInput = styled(Input)`padding-right: 48px;`;
const PwdWrap = styled.div`position: relative;`;
const IconBtn = styled.button`
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 36px; height: 36px;
  border-radius: 8px; border: 1px solid transparent;
  background: transparent; color: #6b7280;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:hover  { background: #f3f4f6; border-color: #e5e7eb; }
  &:active { transform: translateY(calc(-50% + 1px)); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(107,114,128,0.18); }
`;

/* 안내/오류 메시지 */
const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: none;
  font-weight: 700; font-size: 15px; color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"};
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;

const Msg = styled.p`
  margin-top: 12px; font-size: 13px; min-height: 18px;
  color: ${p => p.$ok ? "#059669" : "#dc2626"};
  white-space: pre-line; /* 줄바꿈 표시 */
`;

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

/* ========================
 * Component
 * ======================== */
export default function PasswordReset() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEmail = params.get("email") || "";
  const token = params.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const valid = email.trim() && token && pw1.length >= 8 && pw1 === pw2;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setMsg("");
    setOk(false);

    try {
      await publicAxios.post("/auth/customers/password/reset", {
        email: email.trim(),
        token: token.trim(),
        newPassword: pw1,
        confirmPassword: pw2,
      });
      setOk(true);
      setMsg("비밀번호가 변경되었어요. 새 비밀번호로 로그인해 주세요.");
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "재설정에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <Page>
        <Card>
          <Brand>Shark</Brand>
          <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
          <Title>비밀번호 재설정</Title>
          <p style={{color:"#6b7280"}}>유효한 토큰이 없습니다. 메일의 링크로 다시 접속해 주세요.</p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
        <Title>비밀번호 재설정</Title>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <Label htmlFor="pw1">새 비밀번호 (8자 이상)</Label>
            <PwdWrap>
              <PwdInput
                id="pw1"
                type={showPw1 ? "text" : "password"}
                value={pw1}
                onChange={(e)=>setPw1(e.target.value)}
                autoComplete="new-password"
                required
              />
              <IconBtn
                type="button"
                aria-label={showPw1 ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPw1}
                onClick={() => setShowPw1(v => !v)}
                title={showPw1 ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPw1 ? <EyeOffIcon /> : <EyeIcon />}
              </IconBtn>
            </PwdWrap>
          </div>

          <div>
            <Label htmlFor="pw2">새 비밀번호 확인</Label>
            <PwdWrap>
              <PwdInput
                id="pw2"
                type={showPw2 ? "text" : "password"}
                value={pw2}
                onChange={(e)=>setPw2(e.target.value)}
                autoComplete="new-password"
                required
              />
              <IconBtn
                type="button"
                aria-label={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPw2}
                onClick={() => setShowPw2(v => !v)}
                title={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPw2 ? <EyeOffIcon /> : <EyeIcon />}
              </IconBtn>
            </PwdWrap>
          </div>

          <SubmitBtn type="submit" disabled={busy || !valid}>
            {busy ? "변경 중..." : "비밀번호 변경"}
          </SubmitBtn>
        </Form>

        <Msg $ok={ok}>{msg}</Msg>
      </Card>
    </Page>
  );
}
