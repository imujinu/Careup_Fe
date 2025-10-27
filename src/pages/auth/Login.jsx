// src/pages/auth/Login.jsx  (직원 로그인 화면)
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { loginUser, clearError } from "../../stores/slices/authSlice";
import careUpLogo from "../../assets/logos/care-up_logo.svg";
import Icon from "@mdi/react";
import { mdiLogout } from "@mdi/js";
import LoginSuccessModal from "../../components/common/LoginSuccessModal";
import LogoutModal from "../../components/common/LogoutModal";

const fadeIn = keyframes`from{opacity:.0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)}`;

const Screen = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #29a6ff 0%, #8b5cf6 100%);
  display: grid;
  place-items: center;
  padding: clamp(20px, 3vw, 40px);
`;

const Grid = styled.div`
  width: min(1200px, 96vw);
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: clamp(24px, 4vw, 48px);
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const Hero = styled.section`
  color: #fff;
  user-select: none;
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vw, 20px);
  margin-bottom: 12px;
`;

const Logo = styled.img`
  display: block;
  height: clamp(60px, 8vw, 96px);
  width: auto;
`;

const Brand = styled.h1`
  margin: 0;
  letter-spacing: 0.2px;
  font-size: clamp(36px, 6vw, 60px);
  font-family: "GmarketSansMedium", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Noto Sans KR", Arial, sans-serif;
  font-weight: 700;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;

const TaglineEn = styled.p`
  margin: 16px 0 26px;
  font-size: clamp(16px, 2.4vw, 22px);
  opacity: 0.95;
  font-family: "GmarketSansMedium", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Noto Sans KR", Arial, sans-serif;
  font-weight: 500;
  letter-spacing: 0.2px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;

const TaglineKo = styled.p`
  margin: 0;
  font-size: clamp(16px, 2.6vw, 22px);
  line-height: 1.9;
  opacity: 0.98;
  font-family: "GmarketSansMedium", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Noto Sans KR", Arial, sans-serif;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;

const Card = styled.section`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.18);
  padding: clamp(22px, 3.4vw, 32px);
  animation: ${fadeIn} 0.22s ease-out both;
`;

const CardTitle = styled.h2`
  margin: 0 0 18px;
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Form = styled.form``;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: #374151;
  margin: 10px 0 6px;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: 1px solid ${(p) => (p.$invalid ? "#fca5a5" : "#e5e7eb")};
  padding: 0 14px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;

  &::placeholder { color: #9ca3af; }

  &:focus {
    border-color: ${(p) => (p.$invalid ? "#ef4444" : "#8b5cf6")};
    box-shadow: 0 0 0 3px
      ${(p) => (p.$invalid ? "rgba(239, 68, 68, 0.18)" : "rgba(139, 92, 246, 0.18)")};
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

const FieldNote = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${(p) => (p.$error ? "#dc2626" : "#9ca3af")};
  min-height: 18px;
`;

const OptionsRow = styled.div`
  display: flex;
  gap: 18px;
  margin: 12px 0 6px;
  flex-wrap: wrap;
`;

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  input { width: 18px; height: 18px; margin: 0; accent-color: #7c3aed; cursor: pointer; }
`;

const Submit = styled.button`
  width: 100%;
  height: 48px;
  margin-top: 14px;
  border: none;
  border-radius: 10px;
  background: #7c3aed;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform .04s ease, filter .12s ease, background-color .15s ease;
  &:hover { filter: brightness(.98); }
  &:active { transform: translateY(1px); }
  &:disabled { background: #d1d5db; cursor: not-allowed; }
`;

const LinksRow = styled.div`
  margin-top: 14px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  a { color:#6b7280; text-decoration:none; transition: color .15s ease, text-decoration-color .15s ease; }
  a:hover { color:#4b5563; text-decoration:underline; text-decoration-color:#cbd5e1; }
  .dot { margin: 0 10px; opacity:.5; }
`;

const Msg = styled.p`margin-top:10px;color:#dc2626;font-size:13px;min-height:18px;`;

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

export default function Login({ onLoginSuccess }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberId, setRememberId] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef(null);
  const pwRef = useRef(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successNick, setSuccessNick] = useState("");
  const [skipAutoNav, setSkipAutoNav] = useState(false);

  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("remembered_id");
    if (savedId) {
      setEmail(savedId);
      setRememberId(true);
    }
  }, []);

  useEffect(() => {
    if (location.state && location.state.justLoggedOut) {
      setLogoutOpen(true);
      navigate("/login", { replace: true, state: {} });
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("loggedout") === "1") {
      setLogoutOpen(true);
      params.delete("loggedout");
      const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", next);
    }
    const flag = sessionStorage.getItem("staff_just_logged_out");
    if (flag) {
      setLogoutOpen(true);
      sessionStorage.removeItem("staff_just_logged_out");
    }
  }, [location, navigate]);

  useEffect(() => {
    if (isAuthenticated && !successOpen && !skipAutoNav) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, successOpen, skipAutoNav]);

  const validateFields = () => {
    const next = { email: "", password: "" };
    if (!email.trim()) next.email = "아이디를 입력해 주세요.";
    if (!password.trim()) next.password = "비밀번호를 입력해 주세요.";
    setFieldErrors(next);
    const firstInvalid = next.email ? "email" : next.password ? "password" : null;
    if (firstInvalid === "email") emailRef.current?.focus();
    else if (firstInvalid === "password") pwRef.current?.focus();
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setLocalError("");
    setFieldErrors({ email: "", password: "" });
    dispatch(clearError());

    if (!validateFields()) return;

    // 레이스 방지: 인증 상태가 true로 바뀌기 전에 자동 네비게이션을 막는다.
    setSkipAutoNav(true);

    try {
      const result = await dispatch(
        loginUser({ email, password, rememberMe })
      ).unwrap();

      if (rememberId) localStorage.setItem("remembered_id", email);
      else localStorage.removeItem("remembered_id");

      const ui = result?.userInfo || {};
      setSuccessName(ui.name || "");
      setSuccessNick(ui.nickname || "");
      setSuccessOpen(true);

      if (onLoginSuccess) onLoginSuccess(result.userInfo);
    } catch (err) {
      const status = err?.status;
      const code = err?.code;
      const message = err?.message || "로그인에 실패했습니다.";

      let globalMsg = "";

      if (status === 400) {
        if (code === "ID_FORMAT_INVALID") {
          setFieldErrors((p) => ({ ...p, email: message || "아이디 형식이 올바르지 않습니다." }));
          emailRef.current?.focus();
        } else if (code === "PWD_FORMAT_INVALID") {
          setFieldErrors((p) => ({ ...p, password: message || "비밀번호 형식이 올바르지 않습니다." }));
          pwRef.current?.focus();
        } else {
          globalMsg = message;
        }
      } else if (status === 401) {
        globalMsg = message || "아이디 또는 비밀번호가 올바르지 않습니다.";
      } else if (status === 403) {
        globalMsg = message || "접근 권한이 없습니다.";
      } else {
        globalMsg = message;
      }

      setLocalError(globalMsg);
      // 실패했으니 자동 네비게이션 가드를 해제
      setSkipAutoNav(false);
    }
  };

  const onBlurValidate = (name) => {
    if (!submitted) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (name === "email") next.email = email.trim() ? "" : "아이디를 입력해 주세요.";
      if (name === "password") next.password = password.trim() ? "" : "비밀번호를 입력해 주세요.";
      return next;
    });
  };

  return (
    <Screen>
      <Grid>
        <Hero aria-hidden="true">
          <BrandRow>
            <Logo src={careUpLogo} alt="Care-up 로고" />
            <Brand>Care-up</Brand>
          </BrandRow>

          <TaglineEn>Where Management Meets Care</TaglineEn>
          <TaglineKo>
            세심한 통합관리로 당신의 프랜차이즈를<br />
            관리하고, 가치를 높이십시오.
          </TaglineKo>
        </Hero>

        <Card role="dialog" aria-labelledby="login-title" aria-modal="true">
          <CardTitle id="login-title">로그인</CardTitle>

          <Form noValidate onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="emp-id">아이디</Label>
              <Input
                id="emp-id"
                ref={emailRef}
                type="text"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="이메일 또는 휴대폰 번호를 입력하세요."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitted && fieldErrors.email) {
                    setFieldErrors((p) => ({ ...p, email: "" }));
                  }
                }}
                onBlur={() => onBlurValidate("email")}
                $invalid={!!fieldErrors.email}
                aria-invalid={!!fieldErrors.email}
                aria-describedby="emp-id-note"
              />
              <FieldNote id="emp-id-note" aria-live="polite" $error={!!fieldErrors.email}>
                {fieldErrors.email || "전화번호는 하이픈 없이도 입력 가능합니다."}
              </FieldNote>
            </div>

            <div>
              <Label htmlFor="emp-pw">비밀번호</Label>
              <PwdWrap>
                <PwdInput
                  id="emp-pw"
                  ref={pwRef}
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitted && fieldErrors.password) {
                      setFieldErrors((p) => ({ ...p, password: "" }));
                    }
                  }}
                  onBlur={() => onBlurValidate("password")}
                  $invalid={!!fieldErrors.password}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "emp-pw-err" : undefined}
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
              {fieldErrors.password && (
                <FieldNote id="emp-pw-err" aria-live="polite" $error>
                  {fieldErrors.password}
                </FieldNote>
              )}
            </div>

            <OptionsRow>
              <Check>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                자동 로그인
              </Check>
              <Check>
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                />
                아이디 기억
              </Check>
            </OptionsRow>

            <Submit type="submit" disabled={loading}>
              <Icon path={mdiLogout} size={0.9} style={{ marginRight: 8 }} aria-hidden />
              {loading ? "로그인 중..." : "로그인"}
            </Submit>

            <LinksRow>
              <a href="#" onClick={(e) => e.preventDefault()}>아이디 찾기</a>
              <span className="dot">·</span>
              <a href="/password/forgot">비밀번호 찾기</a>
            </LinksRow>

            <Msg aria-live="polite" role="status">{localError}</Msg>
          </Form>
        </Card>
      </Grid>

      <LoginSuccessModal
        open={successOpen}
        name={successName}
        nickname={successNick}
        onPrimary={() => navigate("/dashboard", { replace: true })}
        onClose={() => {
          setSuccessOpen(false);
          navigate("/dashboard", { replace: true });
        }}
        variant="employee"
        primaryLabel="대시보드로 이동"
      />

      <LogoutModal
        open={logoutOpen}
        onPrimary={() => setLogoutOpen(false)}
        onClose={() => setLogoutOpen(false)}
        variant="employee"
        primaryLabel="닫기"
      />
    </Screen>
  );
}
