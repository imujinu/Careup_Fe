import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationService } from "../../service/notificationService";

// 이벤트 타입을 카테고리로 매핑
const eventTypeToCategory = {
  ATTENDANCE: "근태",
  PURCHASE: "발주",
  ORDER: "주문",
  STOCK: "재고",
  BRANCH: "지점",
  BRANCH_UPDATE: "지점",
};

// API 알림 데이터를 내부 형식으로 변환
function transformNotificationFromAPI(apiData) {
  const eventName = apiData?.eventName || apiData?.type || 'UNKNOWN';
  const category = eventTypeToCategory[eventName] || "기타";
  
  const actionToStatus = {
    REQUESTED: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    COMPLETED: "completed",
    CANCELED: "canceled",
    CANCELLED: "canceled",
    SHIPPED: "completed",
    PENDING: "pending",
  };
  
  const actionValue = apiData?.action || apiData?.status;
  const status = actionValue ? (actionToStatus[actionValue] || String(actionValue).toLowerCase()) : "info";
  const statusLabel = getActionLabel(actionValue || status);
  
  // 시간 포맷팅 (API에서 받은 시간이 있으면 사용, 없으면 현재 시간)
  let timeStr = '';
  if (apiData?.createdAt || apiData?.created_at || apiData?.time) {
    const date = new Date(apiData.createdAt || apiData.created_at || apiData.time);
    timeStr = `${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else {
    const now = new Date();
    timeStr = `${now.getMonth() + 1}.${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  
  return {
    id: apiData?.id || apiData?.notificationId || Date.now() + Math.random(),
    cat: category,
    title: apiData?.title || getDefaultTitle(eventName) || "알림",
    sub: apiData?.body || apiData?.description || apiData?.message || null,
    status: status,
    statusLabel: statusLabel || "정보",
    time: timeStr,
    eventType: eventName,
    rawData: apiData,
  };
}

// 알림 목록 조회 (초기 진입 시)
export const fetchNotificationList = createAsyncThunk(
  'alerts/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getNotificationList();
      return data;
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
      return rejectWithValue(error.message);
    }
  }
);

const alertsSlice = createSlice({
  name: "alerts",
  initialState: {
    isOpen: false,
    notifications: [], // 알림 목록
  },
  reducers: {
    toggleAlerts: (state) => {
      state.isOpen = !state.isOpen;
    },
    openAlerts: (state) => {
      state.isOpen = true;
    },
    closeAlerts: (state) => {
      state.isOpen = false;
    },
    // SSE로 받은 알림 추가
    addNotification: (state, action) => {
      try {
        const { eventType, data } = action.payload || {};
        
        if (!data) {
          console.warn('addNotification: 데이터가 없습니다.', action.payload);
          return;
        }
        
        // 받은 데이터 구조: { eventName, type, title, body, action, ... }
        // eventName 또는 type으로 카테고리 결정 (eventName 우선)
        const eventName = data?.eventName || eventType || data?.type || 'UNKNOWN';
        const category = eventTypeToCategory[eventName] || "기타";
        
        // action을 status로 변환 (REQUESTED -> pending, APPROVED -> approved 등)
        const actionToStatus = {
          REQUESTED: "pending",
          APPROVED: "approved",
          REJECTED: "rejected",
          COMPLETED: "completed",
          CANCELED: "canceled",
          CANCELLED: "canceled",
          SHIPPED: "completed",
          PENDING: "pending",
        };
        
        const actionValue = data?.action || data?.status;
        const status = actionValue ? (actionToStatus[actionValue] || String(actionValue).toLowerCase()) : "info";
        const statusLabel = getActionLabel(actionValue || status);
        
        // 현재 시간 포맷팅
        const now = new Date();
        const timeStr = `${now.getMonth() + 1}.${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const newNotification = {
          id: Date.now() + Math.random(), // 고유 ID
          cat: category,
          title: data?.title || getDefaultTitle(eventName) || "알림",
          sub: data?.body || data?.description || data?.message || null,
          status: status,
          statusLabel: statusLabel || "정보",
          time: timeStr,
          eventType: eventName,
          rawData: data, // 원본 데이터 저장
        };
        
        // 최신 알림을 맨 앞에 추가
        state.notifications.unshift(newNotification);
        
        // 알림이 너무 많으면 오래된 것 제거 (최대 100개 유지)
        if (state.notifications.length > 100) {
          state.notifications = state.notifications.slice(0, 100);
        }
      } catch (error) {
        console.error('addNotification 에러:', error, action.payload);
      }
    },
    // 알림 제거
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    // 모든 알림 제거
    clearNotifications: (state) => {
      state.notifications = [];
    },
    // 초기 알림 목록 설정
    setNotifications: (state, action) => {
      state.notifications = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationList.fulfilled, (state, action) => {
        try {
          const apiData = action.payload || [];
          // API 응답이 배열인지 확인
          const notifications = Array.isArray(apiData) 
            ? apiData.map(transformNotificationFromAPI)
            : [];
          state.notifications = notifications;
        } catch (error) {
          console.error('알림 목록 변환 실패:', error);
          state.notifications = [];
        }
      })
      .addCase(fetchNotificationList.rejected, (state) => {
        console.error('알림 목록 조회 실패');
        state.notifications = [];
      });
  },
});

// 이벤트 타입에 따른 기본 제목
function getDefaultTitle(eventType) {
  const titles = {
    ATTENDANCE: "근태 알림",
    PURCHASE: "발주 알림",
    ORDER: "주문 알림",
    STOCK: "재고 알림",
    BRANCH: "지점 알림",
    BRANCH_UPDATE: "지점 수정 요청",
  };
  return titles[eventType] || "알림";
}

// action 또는 status에 따른 라벨
function getActionLabel(action) {
  const labels = {
    // Action 값들
    REQUESTED: "요청",
    APPROVED: "승인",
    REJECTED: "거절",
    COMPLETED: "완료",
    CANCELED: "취소",
    CANCELLED: "취소",
    SHIPPED: "배송완료",
    PENDING: "대기중",
    // Status 값들
    pending: "대기",
    approved: "승인",
    rejected: "거절",
    completed: "완료",
    canceled: "취소",
    warning: "경고",
    info: "정보",
    error: "오류",
  };
  
  if (!action) return "정보";
  
  // 대문자 action 처리
  const upperAction = String(action).toUpperCase();
  if (labels[upperAction]) {
    return labels[upperAction];
  }
  
  // 소문자 status 처리
  const lowerAction = String(action).toLowerCase();
  return labels[lowerAction] || "정보";
}

// 상태에 따른 기본 라벨 (하위 호환성 유지)
function getDefaultStatusLabel(status) {
  return getActionLabel(status);
}

export const {
  toggleAlerts,
  openAlerts,
  closeAlerts,
  addNotification,
  removeNotification,
  clearNotifications,
  setNotifications,
} = alertsSlice.actions;
export default alertsSlice.reducer;
