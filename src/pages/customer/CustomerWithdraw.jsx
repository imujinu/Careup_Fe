import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import customerAxios from "../../utils/customerAxios";
import { customerAuthService } from "../../service/customerAuthService";

export default function CustomerWithdraw() {
  const navigate = useNavigate();
  const ranRef = useRef(false);
  const [currentPassword, setCurrentPassword] = useState(""); // 소셜 계정은 비워도 OK
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    if (!customerAuthService.isAuthenticated()) {
      navigate("/customer/login", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!agree) {
      setMsg("탈퇴 진행에 동의해 주세요.");
      return;
    }

    try {
      await customerAxios.post("/customers/me/withdraw", {
        currentPassword: currentPassword.trim(), // 소셜 연동 계정이면 서버에서 비워도 통과
        agree: true,
      });

      // 토큰/정보 정리 후 로그인 페이지로
      await customerAuthService.logout();
      alert("회원 탈퇴(비활성화) 완료");
      navigate("/customer/login", { replace: true });
    } catch (e) {
      const serverMsg = e?.response?.data?.status_message;
      setMsg(serverMsg || e.message || "탈퇴 처리 실패");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>회원 탈퇴 테스트</h2>
      <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 400, marginInline: "auto" }}>
        <label>
          현재 비밀번호 (소셜 연동 계정은 비워도 됩니다)
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="일반 계정만 필수"
            style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          탈퇴에 동의합니다.
        </label>

        <button type="submit" style={{ padding: "10px 12px", border: "none", borderRadius: 6, background: "#ef4444", color: "#fff" }}>
          탈퇴하기
        </button>
      </form>

      {msg && <p style={{ marginTop: 12, color: "crimson", textAlign: "center" }}>{msg}</p>}

      <div style={{ marginTop: 16 }}>
        <Link to="/customer">
          <span style={{ textDecoration: "underline" }}>← 돌아가기</span>
        </Link>
      </div>
    </div>
  );
}
