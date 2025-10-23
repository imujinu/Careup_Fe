// src/pages/auth/AdditionalInfo.jsx
import React, { useState } from "react";
import styled, { css } from "styled-components";
import { customerTokenStorage } from "../../service/customerAuthService";
import customerAxios from "../../utils/customerAxios";
import { openKakaoPostcodePopup } from "../../utils/kakaoPostCode";

const CONTROL_HEIGHT = 54;
const CONTROL_RADIUS = 10;

/* ===== Styled ===== */
const Page = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f6f7;
  padding: 24px;
`;
const Card = styled.div`
  width: 520px; max-width: 92vw; background: #fff; border-radius: 22px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.12);
  padding: 40px 36px 32px; text-align: left;
`;
const Brand = styled.h1`
  font-size: 44px; font-weight: 800; letter-spacing: 2px; margin: 0; text-align: center;
  font-family: "Arial Black","Helvetica Neue",Helvetica,Arial,sans-serif;
`;
const Slogan = styled.p`
  text-align: center; color: #9ca3af; margin-top: 6px; margin-bottom: 28px; font-size: 14px; letter-spacing: 1.4px;
`;
const Title = styled.h2`font-size: 20px; font-weight: 800; color: #111827; margin: 2px 0 16px; text-align: left;`;
const Form = styled.form`display: grid; gap: 16px;`;
const Label = styled.label`font-size: 13px; color: #374151; display: block; margin-bottom: 8px;`;

const baseControl = css`
  width: 100%; height: ${CONTROL_HEIGHT}px; border: 1px solid #e5e7eb; border-radius: ${CONTROL_RADIUS}px;
  padding: 0 14px; outline: none; font-size: 14px; background: #fff; transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6b7280; box-shadow: 0 0 0 4px rgba(107,114,128,0.12); }
`;
const Input = styled.input`
  ${baseControl};
  &:disabled { background: #f9fafb; color: #6b7280; cursor: not-allowed; }
`;
const Select = styled.select`
  ${baseControl};
  appearance: none; cursor: pointer; padding-right: 44px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat; background-position: right 14px center;
`;
const Grid2 = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 520px) { grid-template-columns: 1fr; }
`;
const Row = styled.div``;
const Hint = styled.p`margin-top: 8px; margin-bottom: 6px; font-size: 12px; color: #9ca3af;`;
const ButtonRow = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;
const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: none; font-weight: 700; font-size: 15px; color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"}; cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;
const CancelBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: 1px solid #e5e7eb; font-weight: 700; font-size: 15px; color: #111827;
  background: #f3f4f6; cursor: pointer; transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: #e5e7eb; border-color: #d1d5db; }
`;
const Msg = styled.p`margin-top: 12px; color: #dc2626; font-size: 13px; min-height: 18px;`;
const ZipRow = styled.div`display: grid; grid-template-columns: 1fr 120px; gap: 10px;`;
const ZipBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: 1px solid #e5e7eb; font-weight: 700; font-size: 14px; color: #111827;
  background: #f3f4f6; cursor: pointer; transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: #e5e7eb; border-color: #d1d5db; }
`;

/* 누락 보완 */
const Center = styled.div`text-align: center;`;
const SmallBtn = styled.button`
  margin-top: 12px; height: 42px; padding: 0 16px; border-radius: 10px; border: 1px solid #e5e7eb;
  background: #f3f4f6; font-weight: 700; cursor: pointer;
  &:hover { background:#e5e7eb; border-color:#d1d5db; }
`;

export default function AdditionalInfo() {
  const [oauthTempToken] = useState(() => sessionStorage.getItem("oauth_temp_token") || "");

  const prefill = (() => {
    try {
      const raw = sessionStorage.getItem("oauth_prefill");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const provider = prefill.provider || "";
  const social = provider === "GOOGLE" || provider === "KAKAO";
  const providerEmailProvided = !!(prefill.email && String(prefill.email).trim());
  const emailDisabled = social && providerEmailProvided;
  const emailRequired = social && !providerEmailProvided;

  const [form, setForm] = useState({
    email: prefill.email || "",
    name: prefill.name || "",
    nickname: prefill.nickname || "",
    birthday: "",
    phone: "",
    gender: "M",
    zipcode: "",
    address: "",
    addressDetail: "",
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
    window.location.replace("/shop");
  };

  const isFilled =
    (!emailRequired || (form.email && form.email.trim())) &&
    form.name.trim() &&
    form.nickname.trim() &&
    form.birthday &&
    form.phone.trim() &&
    form.gender &&
    form.zipcode.trim() &&
    form.address.trim() &&
    form.addressDetail.trim();

  const openZipSearch = async () => {
    try {
      await openKakaoPostcodePopup({
        onComplete: ({ zipcode, address }) => {
          setForm((f) => ({ ...f, zipcode, address }));
        },
      });
    } catch {
      alert("우편번호 검색 로딩 실패");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!oauthTempToken) {
      setMsg("임시 토큰이 없습니다. 처음부터 다시 시도해 주세요.");
      return;
    }
    if (!isFilled) {
      setMsg(emailRequired ? "이메일을 포함해 필수 항목을 모두 입력해 주세요." : "필수 항목을 모두 입력해 주세요.");
      return;
    }
    setMsg("");
    setSubmitting(true);

    try {
      const { data } = await customerAxios.post(
        `/auth/customers/oauth/update`,
        {
          oauthTempToken,
          email: form.email?.trim() || null,
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          birthday: form.birthday,
          phone: form.phone.trim(),
          gender: form.gender,
          zipcode: form.zipcode.trim(),
          address: form.address.trim(),
          addressDetail: form.addressDetail.trim(),
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
      window.location.replace("/shop");
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
            <SmallBtn onClick={() => window.location.replace("/shop")}>홈으로 이동</SmallBtn>
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
            <Label htmlFor="email">이메일{emailRequired ? " (필수)" : ""}</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder={emailRequired ? "예) user@example.com" : "이메일"}
              required={emailRequired}
              disabled={emailDisabled}
            />
            {emailDisabled && <Hint>{provider}에서 제공한 이메일은 수정할 수 없습니다.</Hint>}
          </Row>

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
              <Input id="birthday" type="date" name="birthday" value={form.birthday} onChange={onChange} required />
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
            <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="010-1234-5678" required />
            <Hint>하이픈은 있어도 되고 없어도 됩니다.</Hint>
          </Row>

          <Row>
            <Label htmlFor="zipcode">우편번호</Label>
            <ZipRow>
              <Input id="zipcode" name="zipcode" value={form.zipcode} onChange={onChange} placeholder="예) 06236" maxLength={10} required />
              <ZipBtn type="button" onClick={openZipSearch}>주소찾기</ZipBtn>
            </ZipRow>
          </Row>

          <Row>
            <Label htmlFor="address">주소</Label>
            <Input id="address" name="address" value={form.address} onChange={onChange} placeholder="예) 서울특별시 강남구 테헤란로 000" maxLength={200} required />
          </Row>

          <Row>
            <Label htmlFor="addressDetail">상세주소</Label>
            <Input id="addressDetail" name="addressDetail" value={form.addressDetail} onChange={onChange} placeholder="예) 00동 000호" maxLength={200} required />
            <Hint>주소는 배송/정산 등에 사용될 수 있으니 정확히 입력해 주세요.</Hint>
          </Row>

          <ButtonRow>
            <CancelBtn type="button" onClick={onCancel} disabled={submitting}>취소</CancelBtn>
            <SubmitBtn type="submit" disabled={submitting || !isFilled}>{submitting ? "제출 중..." : "제출"}</SubmitBtn>
          </ButtonRow>
        </Form>

        <Msg>{msg}</Msg>
      </Card>
    </Page>
  );
}
