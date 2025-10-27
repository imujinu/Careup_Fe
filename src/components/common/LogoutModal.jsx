// components/common/LogoutModal.jsx
import React from "react";
import WelcomeModal from "./WelcomeModal";

export default function LogoutModal({
  open,
  onPrimary,
  onClose,
  primaryLabel,
  title,
  subtitle,
  variant = "customer",
}) {
  const isEmployee = variant === "employee";
  const finalTitle = title ?? "로그아웃";
  const finalSubtitle =
    subtitle ?? (isEmployee ? "정상적으로 로그아웃되었습니다." : "로그아웃 되었습니다.");
  const finalPrimaryLabel = primaryLabel ?? (isEmployee ? "닫기" : "홈으로 가기");

  const handleClose = () => {
    if (onClose) onClose();
    else onPrimary?.();
  };

  return (
    <WelcomeModal
      open={open}
      title={finalTitle}
      subtitle={finalSubtitle}
      hideName
      primaryLabel={finalPrimaryLabel}
      onPrimary={onPrimary}
      onClose={handleClose}
      variant={variant}
    />
  );
}
