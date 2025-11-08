/**
 * 날짜/시간 유틸리티 함수
 * AWS RDS(UTC)와 한국 시간(KST, UTC+9) 간 변환 처리
 */

/**
 * UTC 날짜 문자열을 한국 시간(KST)으로 변환하여 표시
 * @param {string|Date} dateString - UTC 날짜 문자열 또는 Date 객체
 * @param {object} options - toLocaleString 옵션
 * @returns {string} 한국 시간으로 포맷된 날짜 문자열
 */
export const formatDateKST = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return '-';
    
    // 기본 옵션: 한국 시간대, 날짜+시간 표시
    const defaultOptions = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return date.toLocaleString('ko-KR', defaultOptions);
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '-';
  }
};

/**
 * UTC 날짜 문자열을 한국 시간으로 변환하여 Date 객체 반환
 * @param {string|Date} dateString - UTC 날짜 문자열 또는 Date 객체
 * @returns {Date|null} 한국 시간으로 변환된 Date 객체
 */
export const toKSTDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return null;
    
    // UTC 시간을 한국 시간으로 변환 (UTC+9)
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstDate = new Date(date.getTime() + kstOffset);
    
    return kstDate;
  } catch (error) {
    console.error('KST 변환 오류:', error);
    return null;
  }
};

/**
 * 현재 시간을 UTC ISO 문자열로 반환 (백엔드 전송용)
 * @returns {string} UTC ISO 문자열 (예: "2024-01-01T12:00:00.000Z")
 */
export const getCurrentUTCISO = () => {
  return new Date().toISOString();
};

/**
 * 현재 시간을 한국 시간 기준 ISO 문자열로 반환 (Z 없이)
 * @returns {string} 한국 시간 ISO 문자열 (예: "2024-01-01T21:00:00")
 */
export const getCurrentKSTISO = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간
  const kstTime = new Date(now.getTime() + kstOffset);
  return kstTime.toISOString().slice(0, 19); // 'Z' 제거
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 반환
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @returns {string} YYYY-MM-DD 형식 문자열
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return '-';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '-';
  }
};

/**
 * 날짜를 YYYY-MM-DD HH:mm 형식으로 반환 (KST)
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @returns {string} YYYY-MM-DD HH:mm 형식 문자열
 */
export const formatDateTimeKST = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    if (isNaN(date.getTime())) return '-';
    
    // 한국 시간으로 변환
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(date.getTime() + kstOffset);
    
    const year = kstDate.getUTCFullYear();
    const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getUTCDate()).padStart(2, '0');
    const hours = String(kstDate.getUTCHours()).padStart(2, '0');
    const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '-';
  }
};


