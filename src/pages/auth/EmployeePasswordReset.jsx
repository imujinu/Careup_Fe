// src/pages/auth/EmployeePasswordReset.jsx
import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import branchPublicAxios from "../../utils/branchPublicAxios";
import PasswordChangeModal from "../../components/common/PasswordChangeModal";
import careUpLogo from "../../assets/logos/care-up_logo_primary.svg";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const BRAND = "#8B7FE6";
const CONTROL_HEIGHT = 54;
const CONTROL_RADIUS = 12;

const Screen = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${BRAND} 0%, #b8aff5 100%);
  display: grid;
  place-items: center;
  padding: clamp(20px, 3vw, 40px);
`;

const Card = styled.section`
  width: min(560px, 94vw);
  background: #fff;
  border-radius: 18px;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.04),
    0 18px 48px rgba(24, 24, 38, 0.16);
  padding: clamp(24px, 3.6vw, 36px);
  animation: ${fadeIn} 0.22s ease-out both;
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(10px, 1.8vw, 14px);
  margin-bottom: 10px;
`;

const Logo = styled.img`
  display: block;
  height: clamp(44px, 6vw, 64px);
  width: auto;
`;

const Brand = styled.h1`
  margin: 0;
  letter-spacing: 0.2px;
  font-size: clamp(28px, 4.6vw, 40px);
  font-family: "GmarketSansMedium", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", Arial, sans-serif;
  font-weight: 800;
  color: ${BRAND};
`;

const Slogan = styled.p`
  text-align: center;
  color: #6b7280;
  margin: 6px 0 18px;
  font-size: 13px;
  letter-spacing: 0.8px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 12px 0 16px;
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
  border: 1px solid #e6e7ee;
  border-radius: ${CONTROL_RADIUS}px;
  padding: 0 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
  transition: box-shadow .15s ease, border-color .15s ease, background-color .15s ease;
  &::placeholder { color:#9ca3af; }
  &:hover { border-color: #d7d9e2; }
  &:focus {
    border-color: ${BRAND};
    box-shadow: 0 0 0 4px rgba(139, 127, 230, 0.18);
    background-color: #fff;
  }
`;

const PwdInput = styled(Input)`padding-right: 48px;`;
const PwdWrap = styled.div`position: relative;`;

const IconBtn = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:hover  { background: #f3f4f6; border-color: #e5e7eb; }
  &:active { transform: translateY(calc(-50% + 1px)); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(107,114,128,0.18); }
`;

const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: none;
  font-weight: 800;
  font-size: 15px;
  color: #fff;
  background: ${p => (p.disabled ? "#d1d5db" : BRAND)};
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  transition: transform .04s ease, background-color .15s ease, filter .12s ease;
  &:hover  { filter: ${p => (p.disabled ? "none" : "brightness(.98)")}; }
  &:active { transform: translateY(1px); }
`;

const Msg = styled.p`
  margin-top: 12px;
  font-size: 13px;
  min-height: 18px;
  color: ${p => (p.$ok ? "#059669" : "#dc2626")};
  white-space: pre-line;
`;

const Back = styled.div`
  margin-top: 12px;
  text-align: center;
  font-size: 13px;
  a {
    color: #6b7280;
    text-decoration: none;
    transition: color .15s ease;
  }
  a:hover {
    color: #4b5563;
    text-decoration: underline;
  }
`;

const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.86 21.86 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0  0 1 12 5c7 0 11 7 11 7a21.86 21.86 0  0 1-4.87 5.82" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
  </svg>
);

export default function EmployeePasswordReset() {
  const navigate = useNavigate();
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
  const [modalOpen, setModalOpen] = useState(false);

  const valid = email.trim() && token && pw1.length >= 8 && pw1 === pw2;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setMsg("");
    setOk(false);

    try {
      await branchPublicAxios.post("/auth/password/reset", {
        email: email.trim(),
        token: token.trim(),
        newPassword: pw1,
        confirmPassword: pw2,
      });

      setOk(true);
      setBusy(false);
      setMsg("비밀번호가 변경되었습니다.");
      setModalOpen(true);
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "재설정에 실패했어요.");
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <Screen>
        <Card>
          <BrandRow>
            <Logo src={careUpLogo} alt="Care-up 로고" />
            <Brand>Care-up</Brand>
          </BrandRow>
          <Slogan>Where Management Meets Care</Slogan>
          <Title>직원 비밀번호 재설정</Title>
          <p style={{ color: "#6b7280" }}>유효한 토큰이 없습니다. 메일의 링크로 다시 접속해 주세요.</p>
          <Back>
            <a href="/login">← 로그인으로 돌아가기</a>
          </Back>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <BrandRow>
          <Logo src={careUpLogo} alt="Care-up 로고" />
          <Brand>Care-up</Brand>
        </BrandRow>
        <Slogan>Where Management Meets Care</Slogan>
        <Title>직원 비밀번호 재설정</Title>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">사내 이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy || ok}
              placeholder="예) user@company.com"
            />
          </div>

          <div>
            <Label htmlFor="pw1">새 비밀번호 (8자 이상)</Label>
            <PwdWrap>
              <PwdInput
                id="pw1"
                type={showPw1 ? "text" : "password"}
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                autoComplete="new-password"
                required
                disabled={busy || ok}
                placeholder="영문, 숫자 조합 권장"
              />
              <IconBtn
                type="button"
                aria-label={showPw1 ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPw1}
                onClick={() => setShowPw1((v) => !v)}
                title={showPw1 ? "비밀번호 숨기기" : "비밀번호 보기"}
                disabled={busy || ok}
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
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
                required
                disabled={busy || ok}
                placeholder="다시 한 번 입력"
              />
              <IconBtn
                type="button"
                aria-label={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPw2}
                onClick={() => setShowPw2((v) => !v)}
                title={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                disabled={busy || ok}
              >
                {showPw2 ? <EyeOffIcon /> : <EyeIcon />}
              </IconBtn>
            </PwdWrap>
          </div>

          <SubmitBtn type="submit" disabled={busy || ok || !valid}>
            {ok ? "변경 완료" : busy ? "변경 중..." : "비밀번호 변경"}
          </SubmitBtn>
        </Form>

        <Msg $ok={ok}>{msg}</Msg>

        <Back>
          <a href="/login">← 로그인으로 돌아가기</a>
        </Back>
      </Card>

      <PasswordChangeModal
        open={modalOpen}
        onPrimary={() => navigate("/login", { replace: true })}
        onSecondary={() => navigate("/login", { replace: true })}
        onClose={() => setModalOpen(false)}
        variant="employee"
      />
    </Screen>
  );
}
