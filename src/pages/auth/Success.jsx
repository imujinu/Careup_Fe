/// Success.jsx
/// src/pages/auth/Success.jsx
/// 고객용 oauth 임시 성공 페이지
import React from "react";

export default function Success() {
  return (
    <div style={{ padding: 24 }}>
      <h2>oauth 로그인 성공</h2>
      <p>localStorage에 고객 토큰/유저 정보가 저장되었습니다.</p>
    </div>
  );
}
