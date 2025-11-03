// src/service/notificationService.js

import axios from '../utils/axiosConfig';

const BRANCH_API_BASE = import.meta.env.VITE_BRANCH_URL;

/**
 * 알림 서비스
 */
export const notificationService = {
  /**
   * 알림 목록 조회
   */
  getNotificationList: async () => {
    try {
      const response = await axios.get(`${BRANCH_API_BASE}/noti/list`);
      console.log('알림 목록 조회 응답:', response.data);
      // 응답 구조에 따라 처리
      return response.data?.result || response.data || [];
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
      return [];
    }
  },

  /**
   * 특정 알림 읽음 처리
   */
  markAsRead: async (notificationId) => {
    try {
      await axios.patch(`${BRANCH_API_BASE}/noti/read/${notificationId}`);
      console.log('알림 읽음 처리 완료:', notificationId);
      return true;
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      return false;
    }
  },

  /**
   * 전체 알림 읽음 처리
   */
  markAllAsRead: async (notificationIds) => {
    try {
      await axios.patch(`${BRANCH_API_BASE}/noti/read/all`, notificationIds);
      console.log('전체 알림 읽음 처리 완료:', notificationIds);
      return true;
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error);
      return false;
    }
  },
};

