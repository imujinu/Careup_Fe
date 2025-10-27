// src/pages/auth/FindCustomerId.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { findCustomerId } from "../../service/customerIdentityService";

/* CustomerLogin / CustomerSignup 규격 유지 */
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
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.06),
    0 16px 40px rgba(0,0,0,0.12);
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
  text-align: left;
`;

const Form = styled.form`
  display: grid;
  gap: 14px;
`;

const Label = styled.label`
  font-size: 13px;
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
  &:focus {
    border-color: #6b7280;
    box-shadow: 0 0 0 4px rgba(107,114,128,0.12);
  }
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 2px;
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
    accent-color: #111827; cursor: pointer;
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

/* 직원용과 동일 UX: 성공 시 초록, 실패 시 빨강, 줄바꿈 유지 */
const Msg = styled.p`
  margin-top: 12px;
  font-size: 13px;
  min-height: 18px;
  color: ${p => (p.$ok ? "#059669" : "#dc2626")};
  white-space: pre-line;
`;

/* 직원용과 동일 UX: 대시 보더 + 연한 배경 */
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

const Hint = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
`;

const HelpRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 18px;
  font-size: 13px;
  color: #6b7280;
  margin: 16px 0 6px;
  a { color: #6b7280; text-decoration: none; }
  .sep { color: #d1d5db; }
`;

const StyledLink = styled(Link)`color: #6b7280; text-decoration: none;`;

export default function FindCustomerId() {
  const [form, setForm] = useState({ name: "", birthday: "", nickname: "" });
  const [mask, setMask] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setResult(null);
    setOk(false);

    if (!form.name.trim() || !form.birthday || !form.nickname.trim()) {
      setMsg("이름 / 생년월일 / 닉네임을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const r = await findCustomerId(
        {
          name: form.name.trim(),
          birthday: form.birthday, // YYYY-MM-DD
          nickname: form.nickname.trim(),
        },
        { mask }
      );
      setResult(r); // { email, phone }
      setOk(true);
      setMsg("확인된 고객 아이디입니다.");
    } catch (err) {
      const errMsg =
        err?.response?.data?.status_message ||
        err?.message ||
        "아이디 조회에 실패했습니다.";
      setMsg(errMsg);
      setOk(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
        <Title>아이디 찾기</Title>

        <Form onSubmit={onSubmit}>
          <Row2>
            <div>
              <Label htmlFor="name">성함</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="고객님의 성함을 입력해주세요."
                required
              />
            </div>

            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                value={form.nickname}
                onChange={onChange}
                placeholder="가입 시 사용한 닉네임"
                required
              />
            </div>
          </Row2>

          <div>
            <Label htmlFor="birthday">생년월일</Label>
            <Input
              id="birthday"
              type="date"
              name="birthday"
              value={form.birthday}
              onChange={onChange}
              required
            />
          </div>

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

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? "조회 중..." : "아이디 조회"}
          </SubmitBtn>
        </Form>

        {/* ✅ 직원용과 동일한 피드백 UX */}
        <Msg aria-live="polite" role="status" $ok={ok}>{msg}</Msg>

        {result && (
          <ResultBox>
            <div><strong>이메일:</strong> {result.email || "-"}</div>
            <div><strong>휴대폰:</strong> {result.phone || "-"}</div>
            <Hint>
              {mask
                ? "※ 개인정보 보호를 위해 일부가 마스킹되어 표시됩니다."
                : "※ 마스킹 해제됨: 민감 정보 노출에 주의하세요."}
            </Hint>
          </ResultBox>
        )}

        <HelpRow>
          <StyledLink to="/customer/login">로그인</StyledLink>
          <span className="sep">|</span>
          <StyledLink to="/customer/signup">회원가입</StyledLink>
          <span className="sep">|</span>
          <StyledLink to="/customer/password/forgot">비밀번호 찾기</StyledLink>
        </HelpRow>
      </Card>
    </Page>
  );
}
