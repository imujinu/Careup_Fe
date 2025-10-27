// components/common/LoginSuccessModal.jsx

import React from "react";
import WelcomeModal from "./WelcomeModal";

export default function LoginSuccessModal({
  open,
  onPrimary,
  onSecondary,
  onClose,
  primaryLabel,
  secondaryLabel,
  title,
  subtitle,
  hideName = true,
  name,
  nickname,
  variant = "customer",
}) {
  const isEmployee = variant === "employee";
  const finalTitle = title ?? (isEmployee ? "직원 로그인" : "다시 오신 것을 환영합니다.");
  const finalSubtitle = subtitle ?? (isEmployee ? "로그인이 완료되었습니다." : "로그인이 완료되었습니다.");
  const finalPrimaryLabel = primaryLabel ?? (isEmployee ? "대시보드로 이동" : "쇼핑 시작하기");

  const handleClose = () => {
    if (onClose) onClose();
    else onPrimary?.();
  };

  return (
    <WelcomeModal
      open={open}
      name={name}
      nickname={nickname}
      title={finalTitle}
      subtitle={finalSubtitle}
      hideName={hideName}
      primaryLabel={finalPrimaryLabel}
      secondaryLabel={secondaryLabel}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      onClose={handleClose}
      variant={variant}
    />
  );
}
