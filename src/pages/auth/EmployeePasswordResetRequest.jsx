import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import branchPublicAxios from "../../utils/branchPublicAxios";
import careUpLogo from "../../assets/logos/care-up_logo_primary.svg";
import WelcomeModal from "../../components/common/WelcomeModal";

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
  font-family: "GmarketSansMedium", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Noto Sans KR", Arial, sans-serif;
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

const Hint = styled.p`
  margin-top: 8px;
  margin-bottom: 0;
  font-size: 12px;
  color: #9ca3af;
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

export default function EmployeePasswordResetRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", mobile: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isFilled = form.email.trim() && form.mobile.trim();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isFilled) return;
    setSubmitting(true);
    setMsg("");
    setOk(false);

    // 하이픈 유무 무관하도록 숫자만 전송
    const mobileDigits = form.mobile.replace(/\D/g, "");

    try {
      // 직원용 퍼블릭 엔드포인트(8081)
      await branchPublicAxios.post("/auth/password/forgot", {
        email: form.email.trim(),
        mobile: mobileDigits,
      });
      setOk(true);
      setMsg("비밀번호 재설정 링크를 이메일로 전송했어요. 메일함을 확인해 주세요.\n(15분 유효)");
      setModalOpen(true);
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "요청 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <BrandRow>
          <Logo src={careUpLogo} alt="Care-up 로고" />
          <Brand>Care-up</Brand>
        </BrandRow>
        <Slogan>Where Management Meets Care</Slogan>

        <Title>직원 비밀번호 초기화 요청</Title>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">사내 이메일</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="예) user@company.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="mobile">휴대폰 번호</Label>
            <Input
              id="mobile"
              name="mobile"
              value={form.mobile}
              onChange={onChange}
              placeholder="예) 010-1234-5678 (하이픈 유무 무관)"
              required
            />
            <Hint>가입 시 입력한 이메일/휴대폰이 일치해야 메일을 발송합니다.</Hint>
          </div>

          <SubmitBtn type="submit" disabled={submitting || !isFilled}>
            {submitting ? "요청 중..." : "재설정 링크 보내기"}
          </SubmitBtn>
        </Form>

        <Msg $ok={ok}>{msg}</Msg>

        <Back>
          <a href="/login">← 로그인으로 돌아가기</a>
        </Back>
      </Card>

      <WelcomeModal
        open={modalOpen}
        title="메일을 보냈어요"
        subtitle="비밀번호 재설정 링크를 이메일로 전송했습니다. 15분 내에 진행해 주세요."
        hideName
        primaryLabel="로그인으로 가기"
        onPrimary={() => navigate("/login", { replace: true })}
        secondaryLabel="홈으로 가기"
        onSecondary={() => navigate("/", { replace: true })}
        onClose={() => setModalOpen(false)}
        variant="employee"
      />
    </Screen>
  );
}
