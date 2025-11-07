// src/pages/auth/MobilePasswordResetRequest.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import publicAxios from "../../utils/publicAxios";
import WelcomeModal from "../../components/common/WelcomeModal";
import careUpLogo from "../../assets/logos/care-up_logo.svg";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";

const CONTROL_HEIGHT = 52;
const CONTROL_RADIUS = 12;

const Screen = styled.div`
  min-height: 100dvh;
  background: #eef2f7;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const TopBar = styled.header`
  position: relative; /* ← Back 버튼 배치를 위해 */
  min-height: 84px;
  padding: max(14px, env(safe-area-inset-top)) 16px 14px;
  background: linear-gradient(135deg, #29a6ff 0%, #8b5cf6 100%);
  color: #fff;
  display: grid;
  place-items: center;
`;

const BackBtn = styled.button`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const BrandRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  user-select: none;
`;

const Logo = styled.img`
  width: 32px;
  height: 32px;
`;

const Brand = styled.span`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

const Wrap = styled.div`
  padding: 18px 16px max(18px, env(safe-area-inset-bottom));
  display: grid;
  align-content: start;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  margin: 12px auto 0;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  padding: 20px 18px 18px;
`;

const Title = styled.h2`
  margin: 2px 0 16px;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  color: #111827;
`;

const Form = styled.form`
  display: grid;
  gap: 14px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #374151;
  display: block;
  margin-bottom: 6px;
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
  &::placeholder { color: #9ca3af; }
  &:focus {
    border-color: #6b7280;
    box-shadow: 0 0 0 4px rgba(107,114,128,0.12);
  }
`;

const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: none;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"};
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;

const Msg = styled.p`
  margin-top: 8px;
  font-size: 12px;
  min-height: 18px;
  color: ${p => p.$ok ? "#059669" : "#dc2626"};
  white-space: pre-line;
`;

const Hint = styled.p`
  margin-top: 4px;
  margin-bottom: 0;
  font-size: 11px;
  color: #9ca3af;
`;

const LinksRow = styled.div`
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  a { color:#6b7280; text-decoration:none; }
  a:hover { color:#4b5563; text-decoration:underline; text-decoration-color:#cbd5e1; }
  .dot { margin: 0 10px; opacity:.5; }
`;

export default function MobilePasswordResetRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", mobile: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔙 하드웨어/브라우저 뒤로가기 시 /m/login으로
  useEffect(() => {
    window.history.pushState({ mobileGuard: true }, "", window.location.href);
    const onPop = () => navigate("/m/login", { replace: true });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);

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
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "요청 처리에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <TopBar>
        <BackBtn
          type="button"
          aria-label="모바일 로그인으로"
          title="뒤로가기"
          onClick={() => navigate("/m/login", { replace: true })}
        >
          <Icon path={mdiArrowLeft} size={0.9} />
        </BackBtn>

        <BrandRow>
          <Logo src={careUpLogo} alt="Care-up 로고" />
          <Brand>Care-up</Brand>
        </BrandRow>
      </TopBar>

      <Wrap>
        <Card>
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
                placeholder="예) 010-1234-5678"
                required
              />
              <Hint>가입 시 입력한 이메일/휴대폰이 일치해야 메일을 발송합니다.</Hint>
            </div>

            <SubmitBtn type="submit" disabled={submitting || !isFilled}>
              {submitting ? "요청 중..." : "재설정 링크 보내기"}
            </SubmitBtn>
          </Form>

          <Msg $ok={ok}>{msg}</Msg>

          <LinksRow>
            <a href="/m/login">모바일 로그인</a>
            <span className="dot">·</span>
            <a href="/m/find-id">아이디 찾기</a>
          </LinksRow>
        </Card>
      </Wrap>

      <WelcomeModal
        open={modalOpen}
        title="메일을 보냈어요"
        subtitle="비밀번호 재설정 링크를 이메일로 전송했습니다. 15분 내에 진행해 주세요."
        hideName
        primaryLabel="모바일 로그인으로"
        onPrimary={() => navigate("/m/login", { replace: true })}
        secondaryLabel="모바일 홈으로"
        onSecondary={() => navigate("/m", { replace: true })}
        onClose={() => setModalOpen(false)}
      />
    </Screen>
  );
}
