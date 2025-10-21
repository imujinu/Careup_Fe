// src/pages/customer/CustomerHome.jsx
import React, { useEffect, useState } from "react";
import customerAxios from "../../utils/customerAxios";
import { customerAuthService, customerTokenStorage } from "../../service/customerAuthService";

export default function CustomerHome() {
  const [user, setUser] = useState(null);
  const [pwd, setPwd] = useState(""); // 일반계정만 필요, 소셜계정은 비워도 OK
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) {
      window.location.replace("/customer/login");
      return;
    }
    setUser(customerTokenStorage.getUserInfo());
  }, []);

  const onLogout = async () => {
    try {
      await customerAuthService.logout();
    } finally {
      window.location.replace("/customer/login");
    }
  };

  const onWithdraw = async () => {
    if (!confirm("정말 탈퇴하시겠습니까?")) return;
    setBusy(true);
    setMsg("탈퇴 처리 중...");

    try {
      const body = { agree: true };
      if (pwd && pwd.trim()) body.currentPassword = pwd.trim();

      const { data } = await customerAxios.post("/customers/me/withdraw", body);
      const ok = data?.result?.deactivated;
      if (!ok) throw new Error("탈퇴 상태 플래그가 확인되지 않았습니다.");

      alert("탈퇴(비활성화) 완료되었습니다.");
      await customerAuthService.logout();
      window.location.replace("/customer/login");
    } catch (e) {
      const serverMsg = e?.response?.data?.status_message;
      setMsg(serverMsg || e.message || "탈퇴 처리 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return <div style={{ padding: 24 }}>로딩 중...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 420, margin: "0 auto", textAlign: "left" }}>
      <h2>임시 고객 메인</h2>
      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
        <div><b>회원 ID</b>: {user.memberId}</div>
        <div><b>역할</b>: {user.role}</div>
        <div><b>이메일</b>: {user.email || "-"}</div>
        <div><b>닉네임</b>: {user.nickname || "-"}</div>
        <div><b>이름</b>: {user.name || "-"}</div>
        <div><b>휴대폰</b>: {user.phone || "-"}</div>
      </div>

      <hr />

      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            현재 비밀번호 (일반계정만 필요, 소셜계정은 비워두세요)
          </div>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="일반계정일 때만 입력"
            style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
          />
        </label>

        <button
          onClick={onWithdraw}
          disabled={busy}
          style={{
            height: 40,
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          {busy ? "탈퇴 처리 중..." : "회원 탈퇴(비활성화)"}
        </button>

        <button
          onClick={onLogout}
          style={{
            height: 40,
            background: "#374151",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          로그아웃
        </button>

        {msg && <div style={{ color: "crimson" }}>{msg}</div>}
      </div>
    </div>
  );
}
