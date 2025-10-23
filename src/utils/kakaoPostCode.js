// src/utils/kakaoPostCode.js
// 카카오(다음) 우편번호 스크립트 공용 로더 + 기본 팝업 오픈 유틸 (커스텀 오버레이 없음)

let loadingPromise = null;

export function loadKakaoPostcode() {
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const ID = "daum-postcode-script";
    const existing = document.getElementById(ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const s = document.createElement("script");
    s.id = ID;
    s.async = true;
    s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });

  return loadingPromise;
}

// 카카오 응답 -> 폼에 넣을 값으로 정리
const toPayload = (data) => ({
  zipcode: data.zonecode,
  roadAddress: data.roadAddress,
  jibunAddress: data.jibunAddress,
  address: data.roadAddress || data.jibunAddress || "",
  data,
});

/**
 * 카카오 기본 레이어/팝업 UI 오픈 (권장)
 * - 반드시 버튼 클릭 등 사용자 액션 안에서 호출하세요(팝업 차단 회피).
 */
export async function openKakaoPostcodePopup(opts = {}) {
  await loadKakaoPostcode();

  const pc = new window.daum.Postcode({
    oncomplete(data) { opts.onComplete?.(toPayload(data)); },
    onclose(state)   { opts.onClose?.(state); },
    animation: true,
  });

  // 기본 제공 UI (커스텀 임베드/오버레이 사용하지 않음)
  pc.open();
}
