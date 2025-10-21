import React, { useState } from "react";
import { customerTokenStorage } from "../../service/customerAuthService";
import customerAxios from "../../utils/customerAxios";

export default function AdditionalInfo() {
  // 토큰/프리필을 초기 상태에서 즉시 로드 → 렌더 깜빡임 제거
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
      } catch {
        // 무시하고 초기화
      }
    }
    return { name: "", nickname: "", birthday: "", phone: "", gender: "M" };
  });
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!oauthTempToken) {
      setMsg("임시 토큰이 없습니다. 처음부터 다시 시도해 주세요.");
      return;
    }
    setMsg("제출 중...");

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
        { __skipAuthRefresh: true } // 루프 방지
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
    } catch (e) {
      const serverMsg = e?.response?.data?.status_message;
      setMsg(serverMsg || e.message || "추가정보 처리 실패");
    }
  };

  if (!oauthTempToken) {
    return (
      <div style={{ padding: 24 }}>
        <h2>추가 정보 입력</h2>
        <p>임시 토큰이 없습니다. 다시 로그인해 주세요.</p>
        <a href="/customer/login">고객 로그인으로 이동</a>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>추가 정보 입력</h2>
      <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 8, maxWidth: 360 }}>
        <label>
          이름
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          닉네임
          <input name="nickname" value={form.nickname} onChange={onChange} required />
        </label>
        <label>
          생년월일
          <input type="date" name="birthday" value={form.birthday} onChange={onChange} required />
        </label>
        <label>
          휴대폰
          <input name="phone" value={form.phone} onChange={onChange} placeholder="010-1234-5678" required />
        </label>
        <label>
          성별
          <select name="gender" value={form.gender} onChange={onChange}>
            <option value="M">남</option>
            <option value="W">여</option>
          </select>
        </label>
        <button type="submit" style={{ marginTop: 8 }}>제출</button>
      </form>
      {msg && <p style={{ marginTop: 12, color: "crimson" }}>{msg}</p>}
    </div>
  );
}
