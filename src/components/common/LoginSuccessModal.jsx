import React from "react";
import WelcomeModal from "./WelcomeModal";

export default function LoginSuccessModal({
  open,
  onPrimary,
  onSecondary,
  onClose,
  primaryLabel = "쇼핑 시작하기",
  secondaryLabel,
  title = "다시 오신 것을 환영합니다.",
  subtitle = "로그인이 완료되었습니다.",
  hideName = true,
  name,
  nickname,
}) {
  const handleClose = () => {
    if (onClose) onClose();
    else onPrimary?.();
  };

  return (
    <WelcomeModal
      open={open}
      name={name}
      nickname={nickname}
      title={title}
      subtitle={subtitle}
      hideName={hideName}
      primaryLabel={primaryLabel}
      secondaryLabel={secondaryLabel}
      onPrimary={onPrimary}
      onSecondary={onSecondary}
      onClose={handleClose}
    />
  );
}
