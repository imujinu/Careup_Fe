import React from "react";

// 진한 네이비와 블랙 사이 컬러
const SHARK_NAVY = "#0b1626";

// 정면에서 본 오픈 마우스 상어 로고
export default function SharkLogo({ size = 28, color = SHARK_NAVY }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Shark logo"
    >
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#132238" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      {/* 머리 외곽 */}
      <path
        d="M50 4 C 70 8, 90 26, 96 46 C 98 54, 92 72, 82 82 C 72 92, 28 92, 18 82 C 8 72, 2 54, 4 46 C 10 26, 30 8, 50 4 Z"
        fill="url(#g)"
      />
      {/* 눈 */}
      <circle cx="35" cy="38" r="3" fill="#ffffff" />
      <circle cx="65" cy="38" r="3" fill="#ffffff" />
      {/* 입 내부 */}
      <path
        d="M20 60 C 35 48, 65 48, 80 60 C 75 78, 25 78, 20 60 Z"
        fill="#0a0a0a"
      />
      <path
        d="M26 62 C 40 54, 60 54, 74 62 C 71 72, 29 72, 26 62 Z"
        fill="#131313"
      />
      {/* 위 이빨 */}
      <g fill="#ffffff">
        <path d="M28 57 l3 -7 l3 7 Z" />
        <path d="M36 54 l3 -7 l3 7 Z" />
        <path d="M44 52 l3 -7 l3 7 Z" />
        <path d="M52 52 l3 -7 l3 7 Z" />
        <path d="M60 54 l3 -7 l3 7 Z" />
        <path d="M68 57 l3 -7 l3 7 Z" />
      </g>
      {/* 아래 이빨 */}
      <g fill="#ffffff">
        <path d="M30 69 l3 7 l3 -7 Z" />
        <path d="M38 71 l3 7 l3 -7 Z" />
        <path d="M46 72 l3 7 l3 -7 Z" />
        <path d="M54 72 l3 7 l3 -7 Z" />
        <path d="M62 71 l3 7 l3 -7 Z" />
        <path d="M70 69 l3 7 l3 -7 Z" />
      </g>
    </svg>
  );
}
