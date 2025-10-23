import React from "react";
import WelcomeModal from "./WelcomeModal";

export default function LogoutModal({
  open,
  onPrimary,
  onClose,
  primaryLabel = "홈으로 가기",
}) {
  const handleClose = () => {
    if (onClose) onClose();
    else onPrimary?.();
  };

  return (
    <WelcomeModal
      open={open}
      title="로그아웃"
      subtitle="로그아웃 되었습니다."
      hideName
      primaryLabel={primaryLabel}
      onPrimary={onPrimary}
      onClose={handleClose}
    />
  );
}
