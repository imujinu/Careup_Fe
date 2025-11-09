const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

/**
 * Kakao Local API를 사용하여 주소의 위도, 경도를 조회합니다.
 * @param {string} address 조회할 전체 주소 문자열
 * @returns {Promise<{ latitude: string, longitude: string } | null>}
 */
export const fetchCoordinatesByAddress = async (address) => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  if (!KAKAO_REST_API_KEY) {
    console.warn('[Geocoding] VITE_KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.');
    return null;
  }

  const url = new URL('https://dapi.kakao.com/v2/local/search/address.json');
  url.searchParams.set('query', address);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Kakao API 호출 실패 (status: ${response.status})`);
    }

    const data = await response.json();
    const document = data?.documents?.[0];

    if (!document) {
      console.warn('[Geocoding] 조회 결과가 없습니다.', address);
      return null;
    }

    const latitude = document.y;
    const longitude = document.x;

    if (!latitude || !longitude) {
      console.warn('[Geocoding] 좌표 데이터가 존재하지 않습니다.', document);
      return null;
    }

    return {
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('[Geocoding] 좌표 조회 실패:', error);
    return null;
  }
};

export default {
  fetchCoordinatesByAddress,
};

