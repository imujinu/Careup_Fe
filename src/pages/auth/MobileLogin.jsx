// src/pages/auth/MobileLogin.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { loginUser, clearError } from '../../stores/slices/authSlice';
import { useToast } from '../../components/common/Toast';
import careUpLogo from '../../assets/logos/care-up_logo.svg';
import Icon from '@mdi/react';
import { mdiArrowRight } from '@mdi/js';

const Screen = styled.div`
  min-height: 100dvh;
  background: #eef2f7;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const TopBar = styled.header`
  padding: max(14px, env(safe-area-inset-top)) 16px 36px;
  background: linear-gradient(135deg, #29a6ff 0%, #8b5cf6 100%);
  color: #fff;
  display: grid;
  place-items: center;
`;

const BrandRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  user-select: none;
`;

const Logo = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px;
`;

const Brand = styled.span`
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

const Wrap = styled.div`
  padding: 18px 16px max(18px, env(safe-area-inset-bottom));
  display: grid;
  align-content: start;
`;

const Card = styled.form`
  width: 100%;
  max-width: 420px;
  margin: 12px auto 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(17, 24, 39, 0.12);
  padding: 20px 18px 18px;
  display: grid;
  gap: 14px;

  @media (min-width: 480px) {
    margin-top: 16px;
  }
`;

const Title = styled.h1`
  margin: 4px 0 8px;
  text-align: center;
  font-size: 20px;
  font-weight: 900;
  color: #111827;
`;

const Field = styled.div``;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  height: 46px;
  padding: 0 12px;
  border: 1px solid ${(p) => (p.$invalid ? '#fca5a5' : '#e5e7eb')};
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  background: ${(p) => (p.$invalid ? '#fff7f7' : '#fff')};

  &::placeholder {
    color: #9ca3af;
  }
  &:focus {
    border-color: ${(p) => (p.$invalid ? '#ef4444' : '#8b5cf6')};
    box-shadow: 0 0 0 3px ${(p) => (p.$invalid ? 'rgba(239,68,68,.18)' : 'rgba(139,92,246,.18)')};
  }
`;

const PwdWrap = styled.div`
  position: relative;
`;

const PwdToggle = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`;

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;

  & input {
    width: 16px;
    height: 16px;
    accent-color: #7c3aed;
  }
`;

const Submit = styled.button`
  height: 46px;
  border: none;
  border-radius: 10px;
  width: 100%;
  background: #8b5cf6;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.03s ease, filter 0.12s ease, background-color 0.15s ease;

  &:hover {
    filter: brightness(0.98);
  }
  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HelpRow = styled.div`
  margin-top: 4px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;

  a {
    color: inherit;
    text-decoration: none;
  }
`;

const Divider = styled.span`
  display: inline-block;
  width: 1px;
  height: 10px;
  background: #d1d5db;
  margin: 0 10px;
  vertical-align: middle;
`;

const FootNote = styled.p`
  margin: 18px auto 0;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  max-width: 420px;
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
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-4.87 5.82" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
  </svg>
);

export default function MobileLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { loading } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberId, setRememberId] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });

  useEffect(() => {
    const saved = localStorage.getItem('remembered_id');
    if (saved) {
      setEmail(saved);
      setRememberId(true);
    }
  }, []);

  // ✅ 모바일 로그인(/m/login)에서는 기본 이동 경로를 /m 로
  const isMobileLogin = location.pathname.startsWith('/m');
  const nextUrl = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const q = sp.get('next');
    if (q) return q;
    return isMobileLogin ? '/m' : '/dashboard';
  }, [location.search, isMobileLogin]);

  const validate = useCallback(() => {
    const invalid = { email: !email.trim(), password: !password.trim() };
    setErrors(invalid);
    return !invalid.email && !invalid.password;
  }, [email, password]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      dispatch(clearError());
      if (!validate()) return;

      try {
        await dispatch(loginUser({ email, password, rememberMe })).unwrap();
        if (rememberId) localStorage.setItem('remembered_id', email);
        else localStorage.removeItem('remembered_id');

        addToast('로그인 되었습니다.', { color: 'success' });
        navigate(nextUrl, { replace: true });
      } catch (err) {
        const msg = err?.message || '로그인에 실패했습니다.';
        addToast(msg, { color: 'error' });
      }
    },
    [dispatch, email, password, rememberMe, rememberId, nextUrl, addToast, validate, navigate]
  );

  return (
    <Screen>
      <TopBar>
        <BrandRow aria-label="Care-up">
          <Logo src={careUpLogo} alt="Care-up 로고" />
          <Brand>Care-up</Brand>
        </BrandRow>
      </TopBar>

      <Wrap>
        <Card onSubmit={onSubmit} noValidate>
          <Title>로그인</Title>

          <Field>
            <Label htmlFor="m-email">아이디</Label>
            <Input
              id="m-email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              placeholder="이메일 또는 휴대폰 번호를 입력하세요."
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: false }));
              }}
              $invalid={errors.email}
            />
          </Field>

          <Field>
            <Label htmlFor="m-pwd">비밀번호</Label>
            <PwdWrap>
              <Input
                id="m-pwd"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: false }));
                }}
                $invalid={errors.password}
                style={{ paddingRight: 44 }}
              />
              <PwdToggle
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? '비밀번호 숨기기' : '비밀번호 표시'}
                title={showPwd ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </PwdToggle>
            </PwdWrap>
          </Field>

          <Row>
            <Check>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              자동 로그인
            </Check>
            <Check>
              <input type="checkbox" checked={rememberId} onChange={(e) => setRememberId(e.target.checked)} />
              아이디 기억
            </Check>
          </Row>

          <Submit type="submit" disabled={loading}>
            <Icon path={mdiArrowRight} size={0.85} aria-hidden />
            {loading ? '로그인 중…' : '로그인'}
          </Submit>

          <HelpRow>
            <a href="/employee/find-id">아이디 찾기</a>
            <Divider />
            <a href="/password/forgot">비밀번호 찾기</a>
          </HelpRow>
        </Card>

        <FootNote>출퇴근 기능을 이용하려면 위치 권한이 필요합니다.</FootNote>
      </Wrap>
    </Screen>
  );
}
