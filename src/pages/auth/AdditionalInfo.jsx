// src/pages/auth/AdditionalInfo.jsx
import React, { useState } from "react";
import styled, { css } from "styled-components";
import { customerTokenStorage } from "../../service/customerAuthService";
import customerAxios from "../../utils/customerAxios";

// ==== 공통 규격 (CustomerLogin과 동일) ====
const CONTROL_HEIGHT = 54;   // 인풋/버튼 동일 높이
const CONTROL_RADIUS = 10;   // 동일 라운드

// ==== Styled ====
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
  gap: 16px; /* 살짝 넓힘 */
`;

const Label = styled.label`
  font-size: 13px;
  color: #374151;
  display: block;
  margin-bottom: 8px; /* 살짝 넓힘 */
`;

const baseControl = css`
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

const Input = styled.input`${baseControl}`;

/* 더 자연스러운 드롭다운: 기본 화살표 제거 + 커스텀 캐럿 + 패딩 보정 */
const Select = styled.select`
  ${baseControl};
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  padding-right: 44px; /* 캐럿 영역 확보 */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat;
  background-position: right 14px center;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Row = styled.div``;

/* 힌트 간격 "아주 약간" 넓힘 */
const Hint = styled.p`
  margin-top: 8px;   /* 기존보다 살짝 넓힘 */
  margin-bottom: 6px;
  font-size: 12px;
  color: #9ca3af;
`;

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

/* 로그인 버튼과 동일한 이펙트(hover 진해짐 + active 살짝 눌림) */
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

/* 취소 버튼도 같은 규격/이펙트 + 연한 톤 → hover 시 약간 진하게 */
const CancelBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 15px;
  color: #111827;
  background: #f3f4f6;
  cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;

  &:active { transform: translateY(1px); }
  &:hover  { background: #e5e7eb; border-color: #d1d5db; }
`;

const Msg = styled.p`
  margin-top: 12px; /* 살짝 넓힘 */
  color: #dc2626;
  font-size: 13px;
  min-height: 18px;
`;

const Center = styled.div`
  display: grid;
  place-items: center;
  gap: 10px;
  text-align: center;
`;

const SmallBtn = styled.button`
  height: 42px;
  padding: 0 16px;
  border-radius: ${CONTROL_RADIUS}px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: #111827;
  cursor: pointer;
  transition: transform .02s ease, background-color .15s ease;
  &:active { transform: translateY(1px); }
  &:hover { background: #0f1628; }
`;

export default function AdditionalInfo() {
  // 토큰/프리필 초기 로드(깜빡임 방지)
  const [oauthTempToken] = useState(() => sessionStorage.getItem("oauth_temp_token") || "");
  const [form, setForm] = useState(() => {
    const prefillRaw = sessionStorage.getItem("oauth_prefill");
    if (prefillRaw) {
      try {
        const p = JSON.parse(prefillRaw);
        return {
          name: p.name || "",
          nickname: p.nickname || "",
          birthday: "",
          phone: "",
          gender: "M",
        };
      } catch {}
    }
    return { name: "", nickname: "", birthday: "", phone: "", gender: "M" };
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onCancel = () => {
    try {
      sessionStorage.removeItem("oauth_temp_token");
      sessionStorage.removeItem("oauth_prefill");
    } catch {}
    window.location.replace("/customer/login");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!oauthTempToken) {
      setMsg("임시 토큰이 없습니다. 처음부터 다시 시도해 주세요.");
      return;
    }
    setMsg("");
    setSubmitting(true);

    try {
      const { data } = await customerAxios.post(
        `/auth/customers/oauth/update`,
        {
          oauthTempToken,
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          birthday: form.birthday,
          phone: form.phone.trim(),
          gender: form.gender,
        },
        { __skipAuthRefresh: true }
      );

      const r = data?.result;
      if (r?.status !== "COMPLETE") throw new Error("완료 상태가 아닙니다.");

      if (r.accessToken) customerTokenStorage.setTokens(r.accessToken, r.refreshToken);
      customerTokenStorage.setUserInfo({
        memberId: r.memberId,
        role: r.role,
        email: r.email,
        name: r.name,
        nickname: r.nickname,
        phone: r.phone,
      });

      sessionStorage.removeItem("oauth_temp_token");
      sessionStorage.removeItem("oauth_prefill");

      window.location.replace("/customer/home");
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setMsg(serverMsg || e2.message || "추가정보 처리 실패");
      setSubmitting(false);
    }
  };

  if (!oauthTempToken) {
    return (
      <Page>
        <Card>
          <Brand>Shark</Brand>
          <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
          <Center>
            <Title>추가 정보 입력</Title>
            <p style={{ color: "#6b7280" }}>임시 토큰이 없습니다. 다시 로그인해 주세요.</p>
            <SmallBtn onClick={() => window.location.replace("/customer/login")}>
              고객 로그인으로 이동
            </SmallBtn>
          </Center>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>

        <Title>추가 정보 입력</Title>

        <Form onSubmit={onSubmit}>
          <Row>
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" value={form.name} onChange={onChange} required />
          </Row>

          <Row>
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" name="nickname" value={form.nickname} onChange={onChange} required />
            <Hint>2~10자, 다른 사용자와 중복될 수 없습니다.</Hint>
          </Row>

          <Grid2>
            <Row>
              <Label htmlFor="birthday">생년월일</Label>
              <Input
                id="birthday"
                type="date"
                name="birthday"
                value={form.birthday}
                onChange={onChange}
                required
              />
            </Row>

            <Row>
              <Label htmlFor="gender">성별</Label>
              <Select id="gender" name="gender" value={form.gender} onChange={onChange} required>
                <option value="M">남</option>
                <option value="W">여</option>
              </Select>
            </Row>
          </Grid2>

          <Row>
            <Label htmlFor="phone">휴대폰</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="010-1234-5678"
              required
            />
            <Hint>하이픈은 있어도 되고 없어도 됩니다.</Hint>
          </Row>

          <ButtonRow>
            <CancelBtn type="button" onClick={onCancel} disabled={submitting}>
              취소
            </CancelBtn>
            <SubmitBtn type="submit" disabled={submitting}>
              {submitting ? "제출 중..." : "제출"}
            </SubmitBtn>
          </ButtonRow>
        </Form>

        <Msg>{msg}</Msg>
      </Card>
    </Page>
  );
}
  