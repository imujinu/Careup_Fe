import React, { useEffect, useState } from "react";

const slides = [
  {
    title: "Performance Running",
    sub: "가벼운 착용감과 통기성으로 더 멀리",
    image:

      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Training Essentials",
    sub: "탄탄한 지지력으로 집중력 UP",
    image:

      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Outdoor & Trail",
    sub: "거친 길에서도 흔들림 없는 퍼포먼스",
    image:

      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  const [lightText, setLightText] = useState(true);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      4000
    );
    return () => clearInterval(id);
  }, []);

  // 현재 슬라이드 이미지의 평균 밝기를 추정해 텍스트 색을 결정
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = 12;
        const h = 12;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let avg = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          avg += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        avg = avg / (data.length / 4);
        setLightText(avg < 160);
      } catch (e) {
        setLightText(true);
      }
    };
    img.src = slides[index].image;
  }, [index]);
  const s = slides[index];
  return (
    <div
      className="hero-slide"

      style={{
        background: `url(${s.image}) center/cover no-repeat`,
      }}
    >
      <div className="hero-media" aria-hidden="true" />
      <button
        aria-label="이전"
        onClick={() => setIndex((index - 1 + slides.length) % slides.length)}
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.8)",
          border: "none",
          borderRadius: 999,
          width: 36,
          height: 36,
          cursor: "pointer",
        }}
      >
        ‹
      </button>
      <div

        className="hero-copy"
        style={{
          color: lightText ? "#ffffff" : "#111111",
          textShadow: lightText ? "0 2px 10px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <div className="hero-title">{s.title}</div>
        <div className="hero-sub">{s.sub}</div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="hero-ctrl">
        {index + 1} / {slides.length}
      </div>
      <button
        aria-label="다음"
        onClick={() => setIndex((index + 1) % slides.length)}
        style={{
          position: "absolute",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.8)",
          border: "none",
          borderRadius: 999,
          width: 36,
          height: 36,
          cursor: "pointer",
        }}
      >
        ›
      </button>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 16,
          display: "flex",
          gap: 6,
          justifyContent: "center",
        }}
      >
        {slides.map((_, i) => (
          <span
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: i === index ? "#111" : "#d1d5db",
              display: "inline-block",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}
