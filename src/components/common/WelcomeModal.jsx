import React, { useEffect } from "react";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`from{opacity:0} to{opacity:1}`;
const scaleIn = keyframes`
  from { transform: translate(-50%,-50%) scale(.96); opacity: 0 }
  to   { transform: translate(-50%,-50%) scale(1);    opacity: 1 }
`;

const ACCENT = "#2563eb";

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(17,24,39,.45);
  display: grid; place-items: center; z-index: 1000; animation: ${fadeIn} .16s ease-out;
`;

const Dialog = styled.div`
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%,-50%); width: min(520px, 92vw);
  background: #fff; border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,.25);
  padding: 28px 24px 22px;
  animation: ${scaleIn} .18s ease-out;
`;

const Title = styled.h3`
  margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #111827;
`;

const Divider = styled.div`
  height: 1px; background: #e5e7eb; margin: 6px 0 14px;
`;

const Sub = styled.p`
  margin: 0; color: #6b7280; line-height: 1.5;
`;

const Name = styled.div`
  margin: 6px 0 12px; font-size: 18px; font-weight: 700; color: #111827;
`;

const Accent = styled.span`
  color: ${ACCENT};
  font-weight: 800;
`;

const Actions = styled.div`
  display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end;
`;

const Btn = styled.button`
  height: 44px; border-radius: 10px; padding: 0 16px; font-weight: 700;
  border: 1px solid ${p => (p.$primary ? "transparent" : "#e5e7eb")};
  background: ${p => (p.$primary ? "#111827" : "#fff")};
  color: ${p => (p.$primary ? "#fff" : "#111827")};
  cursor: pointer;
  &:hover { filter: brightness(0.98); }
`;

const Close = styled.button`
  position: absolute; right: 10px; top: 10px;
  width: 36px; height: 36px; border-radius: 10px;
  border: none; background: transparent; color: #6b7280; cursor: pointer;
  display: grid; place-items: center; line-height: 0;
  transition: background-color .15s ease, transform .06s ease;
  &:hover  { background: rgba(15,23,42,.06); }
  &:active { transform: scale(.97); }
`;

export default function WelcomeModal({
  open,
  name,
  nickname,
  title = "환영합니다.",
  subtitle = "회원가입이 완료되었습니다.",
  hideName = false,
  onPrimary,
  onSecondary,
  primaryLabel = "홈으로 가기",
  secondaryLabel,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasNick = nickname && String(nickname).trim().length > 0;
  const hasName = (name && String(name).trim().length > 0) || hasNick;

  return (
    <Overlay role="dialog" aria-modal="true" onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Close aria-label="닫기" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Close>

        <Title>{title}</Title>
        <Divider />

        {!hideName && hasName && (
          <Name>
            <Accent>{name}{hasNick ? ` (${nickname})` : ""}</Accent>&nbsp;님
          </Name>
        )}

        {subtitle && <Sub>{subtitle}</Sub>}

        <Actions>
          {secondaryLabel && onSecondary && (
            <Btn onClick={onSecondary}>{secondaryLabel}</Btn>
          )}
          <Btn $primary onClick={onPrimary}>{primaryLabel}</Btn>
        </Actions>
      </Dialog>
    </Overlay>
  );
}
