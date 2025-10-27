// src/pages/auth/CustomerSignup.jsx
import React, { useState } from "react";
import styled, { css } from "styled-components";
import { openKakaoPostcodePopup } from "../../utils/kakaoPostCode";
import customerAxios from "../../utils/customerAxios";
import { customerTokenStorage, customerAuthService } from "../../service/customerAuthService";
import WelcomeModal from "../../components/common/WelcomeModal";
import { markWelcomeSeen } from "../../utils/welcomeSeen";

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
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.06),
    0 16px 40px rgba(0,0,0,0.12);
  padding: 40px 36px 32px;
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
  gap: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 640px){
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-size: 13px;
  color: #374151;
  display: block;
  margin-bottom: 8px;
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
const PwdInput = styled(Input)`padding-right: 48px;`;
const Select = styled.select`
  ${baseControl};
  appearance: none;
  padding-right: 44px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke="%236b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: no-repeat;
  background-position: right 14px center;
`;

const PwdWrap = styled.div`position: relative;`;

const IconBtn = styled.button`
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid transparent;
  background: transparent; color: #6b7280; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .02s ease, background-color .15s ease, border-color .15s ease;
  &:hover  { background: #f3f4f6; border-color: #e5e7eb; }
  &:active { transform: translateY(1px); }
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

const Hint = styled.p`
  margin-top: 8px; margin-bottom: 6px; font-size: 12px; color: #9ca3af;
`;

const Msg = styled.p`
  margin-top: 12px; color: #dc2626; font-size: 13px; min-height: 18px;
`;

const EyeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.86 21.86 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0  0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-4.87 5.82" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
  </svg>
);

export default function CustomerSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    birthday: "",
    gender: "M",
    nickname: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomeNick, setWelcomeNick] = useState("");
  const [welcomeScenario, setWelcomeScenario] = useState("logged-in");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

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

  const onCancel = () => {
    window.location.replace("/customer/login");
  };

  const isFilled =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.password.length >= 8 &&
    form.password === form.passwordConfirm &&
    form.zipcode.trim() &&
    form.address.trim() &&
    form.addressDetail.trim() &&
    form.birthday &&
    form.gender &&
    form.nickname.trim().length >= 2 &&
    form.nickname.trim().length <= 10;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isFilled) {
      setMsg("필수 항목을 모두 정확히 입력해 주세요. (비밀번호 8자 이상, 닉네임 2~10자)");
      return;
    }
    setMsg("");
    setSubmitting(true);

    try {
      const { data } = await customerAxios.post(
        "/auth/customers/signup",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          zipcode: form.zipcode.trim(),
          address: form.address.trim(),
          addressDetail: form.addressDetail.trim(),
          birthday: form.birthday,
          gender: form.gender,
          nickname: form.nickname.trim(),
        },
        { __skipAuthRefresh: true }
      );

      const r = data?.result;

      if (r?.accessToken) {
        customerTokenStorage.setTokens(r.accessToken, r.refreshToken);
        customerTokenStorage.setUserInfo({
          memberId: r.memberId,
          role: r.role,
          email: r.email,
          name: r.name,
          nickname: r.nickname,
          phone: r.phone,
        });

        try { if (r.memberId) markWelcomeSeen(r.memberId); } catch {}

        setWelcomeName(r.name || form.name);
        setWelcomeNick(r.nickname || form.nickname);
        setWelcomeScenario("logged-in");
        setWelcomeOpen(true);
        setSubmitting(false);
        return;
      }

      try {
        const loginId = (form.email && form.email.trim()) || (form.phone && form.phone.trim());
        await customerAuthService.login({ id: loginId, password: form.password, rememberMe: true });

        const ui = customerTokenStorage.getUserInfo() || {};
        setWelcomeName(ui.name || form.name);
        setWelcomeNick(ui.nickname || form.nickname);
        setWelcomeScenario("logged-in");
        setWelcomeOpen(true);

        try { if (ui.memberId) markWelcomeSeen(ui.memberId); } catch {}

        setSubmitting(false);
      } catch {
        setWelcomeName(form.name);
        setWelcomeNick(form.nickname);
        setWelcomeScenario("need-login");
        setWelcomeOpen(true);
        setSubmitting(false);
      }
    } catch (e2) {
      const serverMsg = e2?.response?.data?.status_message;
      setMsg(serverMsg || e2.message || "회원가입 실패");
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Card>
        <Brand>Shark</Brand>
        <Slogan>KICKS RULE EVERYTHING AROUND ME</Slogan>
        <Title>회원가입</Title>

        <Form onSubmit={onSubmit}>
          <Row>
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
                placeholder="고객님께서 사용하실 닉네임을 입력해주세요."
                required
              />
              <Hint>닉네임은 2~10자이며, 다른 사용자와 중복될 수 없습니다.</Hint>
            </div>
          </Row>

          <Row>
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="이메일을 입력해주세요."
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">휴대폰</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="휴대전화 번호를 입력해주세요."
                required
              />
            </div>
          </Row>

          <Row>
            <div>
              <Label htmlFor="password">비밀번호</Label>
              <PwdWrap>
                <PwdInput
                  id="password"
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="비밀번호는 최소 8자리여야합니다."
                  required
                />
                <IconBtn
                  type="button"
                  aria-label={showPwd ? "비밀번호 숨기기" : "비밀번호 보기"}
                  onClick={() => setShowPwd(v => !v)}
                  title={showPwd ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPwd ? <EyeOffIcon/> : <EyeIcon/>}
                </IconBtn>
              </PwdWrap>
              <Hint>비밀번호는 최소 8자 이상을 권장합니다.</Hint>
            </div>

            <div>
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <PwdWrap>
                <PwdInput
                  id="passwordConfirm"
                  type={showPwd2 ? "text" : "password"}
                  name="passwordConfirm"
                  value={form.passwordConfirm}
                  onChange={onChange}
                  placeholder="비밀번호를 한번 더 입력해주세요."
                  required
                />
                <IconBtn
                  type="button"
                  aria-label={showPwd2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                  onClick={() => setShowPwd2(v => !v)}
                  title={showPwd2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPwd2 ? <EyeOffIcon/> : <EyeIcon/>}
                </IconBtn>
              </PwdWrap>
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
                placeholder="고객님의 생년월일을 입력해주세요."
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">성별</Label>
              <Select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={onChange}
                required
              >
                <option value="M">남</option>
                <option value="W">여</option>
              </Select>
            </div>
          </Row>

          <div>
            <Label htmlFor="zipcode">우편번호</Label>
            <ZipRow>
              <Input
                id="zipcode"
                name="zipcode"
                value={form.zipcode}
                onChange={onChange}
                placeholder="우편번호로 주소찾기"
                required
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
                required
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
                required
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
        primaryLabel={welcomeScenario === "need-login" ? "로그인 하기" : "쇼핑 시작하기"}
        onPrimary={() => {
          setWelcomeOpen(false);
          if (welcomeScenario === "need-login") window.location.replace("/customer/login");
          else window.location.replace("/shop");
        }}
        secondaryLabel={welcomeScenario === "need-login" ? "홈으로 가기" : undefined}
        onSecondary={welcomeScenario === "need-login" ? () => {
          setWelcomeOpen(false);
          window.location.replace("/shop");
        } : undefined}
        onClose={() => setWelcomeOpen(false)}
        brand="shark"
      />
    </Page>
  );
}
