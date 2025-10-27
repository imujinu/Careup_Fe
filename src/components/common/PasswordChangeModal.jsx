import React from "react";
import WelcomeModal from "./WelcomeModal";

export default function PasswordChangeModal({
  open,
  onPrimary,
  onSecondary,
  onClose,
  primaryLabel = "홈으로 가기",
  secondaryLabel = "로그인하기",
  title = "비밀번호 변경 완료",
  subtitle = "비밀번호가 안전하게 변경되었습니다.",
  hideName = true,
  variant = "customer"
}) {
  const handleClose = () => {
    if (onClose) onClose();
    else onPrimary?.();
  };

  return (
    <WelcomeModal
      open={open}
      title={title}
      subtitle={subtitle}
      hideName={hideName}
      primaryLabel={primaryLabel}
      secondaryLabel={secondaryLabel}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      onClose={handleClose}
      variant={variant}
    />
  );
}
