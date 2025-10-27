// src/pages/auth/PasswordResetRequest.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import publicAxios from "../../utils/publicAxios";
import WelcomeModal from "../../components/common/WelcomeModal";

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

  &:focus {
    border-color: #6b7280;
    box-shadow: 0 0 0 4px rgba(107,114,128,0.12);
  }
`;

const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: none;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"};
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;

const Msg = styled.p`
  margin-top: 12px;
  font-size: 13px;
  min-height: 18px;
  color: ${p => p.$ok ? "#059669" : "#dc2626"};
  white-space: pre-line; /* <- 줄바꿈 표시 */
`;

const Hint = styled.p`
  margin-top: 8px;
  margin-bottom: 0;
  font-size: 12px;
  color: #9ca3af;
`;

export default function PasswordResetRequest() {
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

    try {
      await publicAxios.post("/auth/customers/password/forgot", {
        email: form.email.trim(),
        mobile: form.mobile.trim(),
      });
      setOk(true);
      setMsg("비밀번호 재설정 링크를 이메일로 전송했어요. 메일함을 확인해 주세요.\n(15분 유효)");
      setModalOpen(true);
      // 성공/실패 모두 이 화면에 머무름
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "요청 처리에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
        <Title>비밀번호 초기화 요청</Title>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="email">회원가입 이메일</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="예) user@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="mobile">회원가입 휴대폰 번호</Label>
            <Input
              id="mobile"
              name="mobile"
              value={form.mobile}
              onChange={onChange}
              placeholder="예) 010-1234-5678 (하이픈 유무 무관)"
              required
            />
            <Hint>가입 때 입력한 이메일/휴대폰이 일치해야 메일을 발송합니다.</Hint>
          </div>

          <SubmitBtn type="submit" disabled={submitting || !isFilled}>
            {submitting ? "요청 중..." : "재설정 링크 보내기"}
          </SubmitBtn>
        </Form>

        <Msg $ok={ok}>{msg}</Msg>
      </Card>

      <WelcomeModal
        open={modalOpen}
        title="메일을 보냈어요"
        subtitle="비밀번호 재설정 링크를 이메일로 전송했습니다. 15분 내에 진행해 주세요."
        hideName
        primaryLabel="로그인으로 가기"
        onPrimary={() => navigate("/customer/login", { replace: true })}
        secondaryLabel="홈으로 가기"
        onSecondary={() => navigate("/shop", { replace: true })}
        onClose={() => setModalOpen(false)}
      />
    </Page>
  );
}
