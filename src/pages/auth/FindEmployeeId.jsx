// src/pages/auth/FindEmployeeId.jsx
import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { findEmployeeId } from "../../service/employeeIdentityService";
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

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 560px){ grid-template-columns: 1fr; }
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
  margin-top: -6px;
`;

const OptionLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
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

const ResultBox = styled.div`
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  color: #374151;
  font-size: 14px;
  line-height: 1.7;
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

const Hint = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
`;

export default function FindEmployeeId() {
  const [form, setForm] = useState({ name: "", dateOfBirth: "", employeeNumber: "" });
  const [mask, setMask] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);

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
        dateOfBirth: form.dateOfBirth,          // YYYY-MM-DD
        employeeNumber: form.employeeNumber.trim(),
        mask,                                   // ✅ 마스킹 옵션
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
      <Card>
        <BrandRow>
          <Logo src={careUpLogo} alt="Care-up 로고" />
          <Brand>Care-up</Brand>
        </BrandRow>
        <Slogan>Where Management Meets Care</Slogan>
        <Title>직원 아이디 찾기</Title>

        <Form onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">성함</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="예) 홍길동"
              required
            />
          </div>

          <Row>
            <div>
              <Label htmlFor="dob">생년월일</Label>
              <Input
                id="dob"
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="empno">사원번호</Label>
              <Input
                id="empno"
                name="employeeNumber"
                value={form.employeeNumber}
                onChange={onChange}
                placeholder="예) E000123"
                required
              />
            </div>
          </Row>

          <OptionRow>
            <OptionLabel htmlFor="mask">
              <input
                id="mask"
                type="checkbox"
                checked={mask}
                onChange={(e) => setMask(e.target.checked)}
              />
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
            <Hint>
              {mask
                ? "※ 개인정보 보호를 위해 일부가 마스킹되어 표시됩니다."
                : "※ 마스킹 해제됨: 민감 정보 노출에 주의하세요."}
            </Hint>
          </ResultBox>
        )}

        <LinksRow>
          <a href="/login">로그인 하기</a>
          <span className="dot">·</span>
          <a href="/password/forgot">비밀번호 찾기</a>
        </LinksRow>
      </Card>
    </Screen>
  );
}
