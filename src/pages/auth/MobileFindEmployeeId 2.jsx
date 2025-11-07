// src/pages/auth/MobileFindEmployeeId.jsx
import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { findEmployeeId } from "../../service/employeeIdentityService";
import careUpLogo from "../../assets/logos/care-up_logo.svg";
import Icon from "@mdi/react";
import { mdiArrowLeft } from "@mdi/js";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const BRAND = "#8B7FE6";
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

const Card = styled.section`
  width: 100%;
  max-width: 480px;
  margin: 12px auto 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(17, 24, 39, 0.12);
  padding: 20px 18px 18px;
  animation: ${fadeIn} 0.22s ease-out both;
  display: grid;
  gap: 14px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 18px;
  font-weight: 900;
  color: #111827;
  margin: 2px 0 6px;
`;

const Slogan = styled.p`
  text-align: center;
  color: #6b7280;
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.6px;
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

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px){ grid-template-columns: 1fr; }
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

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: -4px;
`;

const OptionLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #374151;
  user-select: none;
  input[type="checkbox"] {
    width: 18px; height: 18px; margin: 0;
    accent-color: ${BRAND}; cursor: pointer;
  }
`;

const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: none;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  background: ${p => (p.disabled ? "#d1d5db" : BRAND)};
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  transition: transform .04s ease, background-color .15s ease, filter .12s ease;
  &:hover  { filter: ${p => (p.disabled ? "none" : "brightness(.98)")}; }
  &:active { transform: translateY(1px); }
`;

const Msg = styled.p`
  margin-top: 4px;
  font-size: 12px;
  min-height: 18px;
  color: ${p => (p.$ok ? "#059669" : "#dc2626")};
  white-space: pre-line;
`;

const ResultBox = styled.div`
  margin-top: 2px;
  padding: 12px 14px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
`;

const LinksRow = styled.div`
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  a { color:#6b7280; text-decoration:none; }
  a:hover { color:#4b5563; text-decoration:underline; text-decoration-color:#cbd5e1; }
  .dot { margin: 0 10px; opacity:.5; }
`;

const Hint = styled.p`
  margin: 6px 0 0;
  font-size: 11px;
  color: #9ca3af;
`;

export default function MobileFindEmployeeId() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", dateOfBirth: "", employeeNumber: "" });
  const [mask, setMask] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);

  // 🔙 하드웨어/브라우저 뒤로가기 시 /m/login으로
  useEffect(() => {
    // popstate가 확실히 발생하도록 더미 state 추가
    window.history.pushState({ mobileGuard: true }, "", window.location.href);
    const onPop = () => navigate("/m/login", { replace: true });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [navigate]);

  const isFilled = form.name.trim() && form.dateOfBirth && form.employeeNumber.trim();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isFilled) return;
    setSubmitting(true);
    setOk(false);
    setMsg("");
    setResult(null);

    try {
      const r = await findEmployeeId({
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth,
        employeeNumber: form.employeeNumber.trim(),
        mask,
      });
      setResult({ email: r?.email, mobile: r?.mobile });
      setOk(true);
      setMsg("확인된 직원 아이디입니다.");
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setOk(false);
      setMsg(serverMsg || e2.message || "일치하는 직원 정보를 찾지 못했습니다.");
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
          <Title>직원 아이디 찾기</Title>
          <Slogan>Where Management Meets Care</Slogan>

          <Form onSubmit={onSubmit}>
            <div>
              <Label htmlFor="name">성함</Label>
              <Input id="name" name="name" value={form.name} onChange={onChange} placeholder="예) 홍길동" required />
            </div>

            <Row>
              <div>
                <Label htmlFor="dob">생년월일</Label>
                <Input id="dob" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} required />
              </div>
              <div>
                <Label htmlFor="empno">사원번호</Label>
                <Input id="empno" name="employeeNumber" value={form.employeeNumber} onChange={onChange} placeholder="예) E000123" required />
              </div>
            </Row>

            <OptionRow>
              <OptionLabel htmlFor="mask">
                <input id="mask" type="checkbox" checked={mask} onChange={(e) => setMask(e.target.checked)} />
                개인정보 마스킹 (권장)
              </OptionLabel>
            </OptionRow>

            <SubmitBtn type="submit" disabled={submitting || !isFilled}>
              {submitting ? "조회 중..." : "아이디 찾기"}
            </SubmitBtn>
          </Form>

          <Msg $ok={ok}>{msg}</Msg>

          {result && (
            <ResultBox>
              <div><strong>이메일:</strong> {result.email || "-"}</div>
              <div><strong>휴대폰:</strong> {result.mobile || "-"}</div>
              <Hint>{mask ? "※ 일부가 마스킹되어 표시됩니다." : "※ 마스킹 해제됨: 민감 정보 노출에 주의하세요."}</Hint>
            </ResultBox>
          )}

          <LinksRow>
            <a href="/m/login">모바일 로그인</a>
            <span className="dot">·</span>
            <a href="/m/password/forgot">비밀번호 찾기</a>
          </LinksRow>
        </Card>
      </Wrap>
    </Screen>
  );
}
