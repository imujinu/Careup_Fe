// src/service/sseService.js

import axios from '../utils/axiosConfig';
import { store } from '../stores';
import { addNotification } from '../stores/slices/alertsSlice';

const BRANCH_API_BASE = import.meta.env.VITE_BRANCH_URL;

let eventSource = null;

/**
 * SSE 연결/해제 서비스
 */
export const sseService = {
  /**
   * SSE 연결 (EventSource 사용)
   * 로그인 시 호출
   */
  connect: () => {
    // 이미 연결되어 있으면 재연결 시도 전에 기존 연결 해제
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('SSE 연결: 토큰이 없습니다.');
        return;
      }

      // EventSource는 헤더를 직접 설정할 수 없으므로 URL에 토큰 포함
      // 또는 서버에서 쿠키 기반 인증을 사용하는 경우 URL만 사용
      const url = `${BRANCH_API_BASE}/sse/connect?token=${encodeURIComponent(token)}`;
      
      eventSource = new EventSource(url);

      // 연결 성공 이벤트
      eventSource.onopen = () => {
        console.log('SSE 연결 성공');
      };

      // 연결 오류 이벤트
      eventSource.onerror = (error) => {
        console.error('SSE 연결 오류:', error);
        console.log('EventSource 상태:', eventSource.readyState);
        // 연결이 끊어진 경우 자동으로 재연결 시도됨 (EventSource 기본 동작)
      };

      // 일반 메시지 이벤트 (fallback - 서버가 event 필드 없이 보낼 때)
      eventSource.onmessage = (event) => {
        console.log('SSE 일반 메시지 수신:', event.data);
        try {
          const data = JSON.parse(event.data);
          // 데이터에 eventName이나 type이 있으면 사용
          const eventType = data?.eventName || data?.type || 'UNKNOWN';
          console.log('일반 메시지에서 이벤트 타입 감지:', eventType, data);
          store.dispatch(addNotification({ eventType, data }));
        } catch (error) {
          console.error('일반 메시지 파싱 오류:', error);
        }
      };

      // ATTENDANCE 이벤트 처리
      eventSource.addEventListener('ATTENDANCE', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('ATTENDANCE 알림 수신:', data);
          store.dispatch(addNotification({ eventType: 'ATTENDANCE', data }));
        } catch (error) {
          console.error('ATTENDANCE 이벤트 파싱 오류:', error);
        }
      });

      // PURCHASE 이벤트 처리
      eventSource.addEventListener('PURCHASE', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('PURCHASE 알림 수신:', data);
          store.dispatch(addNotification({ eventType: 'PURCHASE', data }));
        } catch (error) {
          console.error('PURCHASE 이벤트 파싱 오류:', error);
        }
      });

      // ORDER 이벤트 처리
      eventSource.addEventListener('ORDER', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('ORDER 알림 수신:', data);
          store.dispatch(addNotification({ eventType: 'ORDER', data }));
        } catch (error) {
          console.error('ORDER 이벤트 파싱 오류:', error);
        }
      });

      // STOCK 이벤트 처리
      eventSource.addEventListener('STOCK', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('STOCK 알림 수신:', data);
          store.dispatch(addNotification({ eventType: 'STOCK', data }));
        } catch (error) {
          console.error('STOCK 이벤트 파싱 오류:', error);
        }
      });

    } catch (error) {
      console.error('SSE 연결 생성 실패:', error);
    }
  },

  /**
   * SSE 연결 해제
   * 로그아웃 또는 페이지를 나갈 때 호출
   */
  disconnect: async () => {
    try {
      // EventSource 연결 종료
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('SSE EventSource 연결 종료');
      }

      // 서버에 disconnect 요청 (선택적)
      await axios.get(`${BRANCH_API_BASE}/sse/disconnect`);
      console.log('SSE 연결 해제 요청 완료');
    } catch (error) {
      console.error('SSE 연결 해제 요청 실패:', error);
      // EventSource는 이미 닫았으므로 계속 진행
    }
  },

  /**
   * SSE 연결 해제 요청 (페이지를 나갈 때 사용)
   * beforeunload 이벤트에서는 비동기 요청이 완료되지 않을 수 있으므로
   * 동기 XMLHttpRequest를 사용
   */
  disconnectSync: () => {
    try {
      // EventSource 연결 종료
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        console.log('SSE EventSource 연결 종료 (동기)');
      }

      const url = `${BRANCH_API_BASE}/sse/disconnect`;
      const token = localStorage.getItem('accessToken');
      
      // beforeunload에서는 동기 XMLHttpRequest 사용
      // 주의: 동기 요청은 브라우저를 블로킹할 수 있지만,
      // beforeunload에서는 페이지를 닫기 전에 요청이 완료되어야 하므로 필요
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false); // 동기 GET 요청
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      try {
        xhr.send();
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('SSE 연결 해제 요청 (동기) 완료');
        }
      } catch (e) {
        console.error('SSE 연결 해제 요청 (동기 XHR) 실패:', e);
      }
    } catch (error) {
      console.error('SSE 연결 해제 요청 (sync) 실패:', error);
    }
  },
};

