// /src/pages/auth/AdditionalInfo.jsx
import React, { useEffect, useState } from "react";
import { customerTokenStorage } from "../../service/customerAuthService";

const AUTH_BASE = import.meta.env.VITE_CUSTOMER_AUTH_URL || "http://localhost:8080";

export default function AdditionalInfo() {
  const [oauthTempToken, setOauthTempToken] = useState("");
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    birthday: "",
    phone: "",
    gender: "M", // M | W
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = sessionStorage.getItem("oauth_temp_token");
    const prefill = sessionStorage.getItem("oauth_prefill");
    if (t) setOauthTempToken(t);
    if (prefill) {
      try {
        const p = JSON.parse(prefill);
        setForm((f) => ({
          ...f,
          name: p.name || f.name,
          nickname: p.nickname || f.nickname || "",
        }));
      } catch {}
    }
  }, []);

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
      const res = await fetch(`${AUTH_BASE}/auth/customers/oauth/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oauthTempToken,
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          birthday: form.birthday,
          phone: form.phone.trim(),
          gender: form.gender,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.status_message || "서버 오류");
      const r = j?.result;
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

      window.location.replace("/customer/success");
    } catch (e) {
      setMsg(e.message || "추가정보 처리 실패");
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
