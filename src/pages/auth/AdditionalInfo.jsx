import React, { useState } from "react";
import styled from "styled-components";
import customerAxios from "../../utils/customerAxios";
import { openKakaoPostcodePopup } from "../../utils/kakaoPostCode";
import { customerTokenStorage } from "../../service/customerAuthService";
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
  width: 720px;
  max-width: 94vw;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.12);
  padding: 40px 36px 32px;
  text-align: left;
`;
const Brand = styled.h1`
  font-size: 44px; font-weight: 800; letter-spacing: 2px; margin: 0; text-align: center;
  font-family: "Arial Black","Helvetica Neue",Helvetica,Arial,sans-serif;
`;
const Slogan = styled.p`
  text-align: center; color: #9ca3af; margin-top: 6px; margin-bottom: 28px; font-size: 14px; letter-spacing: 1.4px;
`;
const Title = styled.h2`
  font-size: 20px; font-weight: 800; color: #111827; margin: 2px 0 16px; text-align: left;
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
  &:focus { border-color: #6b7280; box-shadow: 0 0 0 4px rgba(107,114,128,0.12); }
`;
const Select = styled.select`
  width: 100%;
  height: ${CONTROL_HEIGHT}px;
  border: 1px solid #e5e7eb;
  border-radius: ${CONTROL_RADIUS}px;
  padding: 0 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6b7280; box-shadow: 0 0 0 4px rgba(107,114,128,0.12); }
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 640px){ grid-template-columns: 1fr; }
`;
const ZipRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
`;
const ZipBtn = styled.button`
  height: ${CONTROL_HEIGHT}px;
  border-radius: ${CONTROL_RADIUS}px;
  border: 1px solid #e5e7eb;
  font-weight: 700; font-size: 14px; color: #111827;
  background: #f3f4f6; cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: #e5e7eb; border-color: #d1d5db; }
`;
const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 640px){ grid-template-columns: 1fr; }
`;
const SubmitBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: none;
  font-weight: 700; font-size: 15px; color: #fff;
  background: ${p => p.disabled ? "#e5e7eb" : "#111827"};
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: transform .02s ease, background-color .15s ease, filter .1s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: ${p => p.disabled ? "#e5e7eb" : "#0f1628"}; }
`;
const CancelBtn = styled.button`
  height: ${CONTROL_HEIGHT}px; border-radius: ${CONTROL_RADIUS}px; border: 1px solid #e5e7eb;
  font-weight: 700; font-size: 15px; color: #111827; background: #f3f4f6; cursor: pointer;
  transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:active { transform: translateY(1px); }
  &:hover  { background: #e5e7eb; border-color: #d1d5db; }
`;
const Msg = styled.p`
  margin-top: 12px; color: #dc2626; font-size: 13px; min-height: 18px;
`;

export default function AdditionalInfo() {
  const [oauthTempToken] = useState(() => sessionStorage.getItem("oauth_temp_token") || "");

  const prefill = (() => {
    try {
      const raw = sessionStorage.getItem("oauth_prefill");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
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

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomeNick, setWelcomeNick] = useState("");

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

      try {
        sessionStorage.removeItem("oauth_temp_token");
        sessionStorage.removeItem("oauth_prefill");
      } catch {}

      setWelcomeName(r.name || form.name);
      setWelcomeNick(r.nickname || form.nickname);
      setWelcomeOpen(true);
      setSubmitting(false);
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
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "2px 0 16px" }}>추가 정보 입력</h2>
            <p style={{ color: "#6b7280" }}>임시 토큰이 없습니다. 다시 로그인해 주세요.</p>
            <button
              style={{
                marginTop: 12, height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid #e5e7eb",
                background: "#f3f4f6", fontWeight: 700, cursor: "pointer"
              }}
              onClick={() => window.location.replace("/shop")}
            >
              홈으로 이동
            </button>
          </div>
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
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="예) user@example.com"
              required={emailRequired}
              disabled={emailDisabled}
              readOnly={emailDisabled}
            />
          </div>

          <Row>
            <div>
              <Label htmlFor="name">성함</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="성함을 입력해주세요."
              />
            </div>
            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                value={form.nickname}
                onChange={onChange}
                placeholder="닉네임을 입력해주세요."
              />
            </div>
          </Row>

          <Row>
            <div>
              <Label htmlFor="birthday">생년월일</Label>
              <Input
                id="birthday"
                type="date"
                name="birthday"
                value={form.birthday}
                onChange={onChange}
                placeholder="생년월일"
              />
            </div>
            <div>
              <Label htmlFor="phone">휴대폰</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="휴대전화 번호"
              />
            </div>
          </Row>

          <div>
            <Label htmlFor="gender">성별</Label>
            <Select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={onChange}
            >
              <option value="M">남</option>
              <option value="W">여</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="zipcode">우편번호</Label>
            <ZipRow>
              <Input
                id="zipcode"
                name="zipcode"
                value={form.zipcode}
                onChange={onChange}
                placeholder="우편번호로 주소찾기"
              />
              <ZipBtn type="button" onClick={openZipSearch}>주소찾기</ZipBtn>
            </ZipRow>
          </div>

          <Row>
            <div>
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="주소를 입력해주세요."
              />
            </div>
            <div>
              <Label htmlFor="addressDetail">상세주소</Label>
              <Input
                id="addressDetail"
                name="addressDetail"
                value={form.addressDetail}
                onChange={onChange}
                placeholder="상세주소를 입력해주세요."
              />
            </div>
          </Row>

          <Msg>{msg}</Msg>

          <ButtonRow>
            <CancelBtn type="button" onClick={onCancel} disabled={submitting}>취소</CancelBtn>
            <SubmitBtn type="submit" disabled={submitting || !isFilled}>
              {submitting ? "등록 중..." : "등록"}
            </SubmitBtn>
          </ButtonRow>
        </Form>
      </Card>

      <WelcomeModal
        open={welcomeOpen}
        name={welcomeName}
        nickname={welcomeNick}
        primaryLabel="쇼핑 시작하기"
        onPrimary={() => {
          setWelcomeOpen(false);
          window.location.replace("/shop");
        }}
        onClose={() => setWelcomeOpen(false)}
      />
    </Page>
  );
}
