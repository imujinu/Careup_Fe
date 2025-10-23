import React, { useState } from "react";
import "./LoginPage.css";

const LoginPage = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    onLogin({ id: email, password, rememberMe: false });
  };

  return (
    <div className="login-page">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 홈으로
        </button>

        <div className="login-container">
          <div className="login-header">
            <h1 className="brand-logo">Shark</h1>
            <p className="brand-tagline">KICKS RULE EVERYTHING AROUND ME</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">이메일 주소</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="예) kream@kream.co.kr"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              로그인
            </button>
          </form>

          <div className="login-links">
            <a href="#" className="login-link">
              이메일 가입
            </a>
            <span className="divider">|</span>
            <a href="#" className="login-link">
              이메일 찾기
            </a>
            <span className="divider">|</span>
            <a href="#" className="login-link">
              비밀번호 찾기
            </a>
          </div>

          <div className="social-login">
            <button className="social-btn naver">
              <div className="social-icon naver-icon">N</div>
              네이버로 로그인
            </button>
            <button className="social-btn apple">
              <div className="social-icon apple-icon">🍎</div>
              Apple로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
