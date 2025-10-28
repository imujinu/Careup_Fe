import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";
import axios from "axios";
import AttendanceTab from "./tabs/AttendanceTab";
import InventoryTab from "./tabs/InventoryTab";
import OrderTab from "./tabs/OrderTab";
import SalesTab from "./tabs/SalesTab";

const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "안녕하세요!\n케어업 챗봇 환이에요!\n\n이용 관련 궁금한 점이 생기면,\n언제든지 환이에게 물어보세요.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "근태 정보를 조회하고 있습니다..."
  );
  const [isComparing, setIsComparing] = useState(false);
  const [isOrderRegistering, setIsOrderRegistering] = useState(false);
  const [inventoryData, setInventoryData] = useState(null);
  const [isInventoryEditMode, setIsInventoryEditMode] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 발주 수량 조절 함수들
  const updateOrderQuantity = (itemId, quantity) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, quantity),
    }));
  };

  const incrementQuantity = (itemId) => {
    const currentQuantity = orderQuantities[itemId] || 0;
    updateOrderQuantity(itemId, currentQuantity + 1);
  };

  const decrementQuantity = (itemId) => {
    const currentQuantity = orderQuantities[itemId] || 0;
    updateOrderQuantity(itemId, currentQuantity - 1);
  };

  // 최종 가격 계산
  const calculateTotalPrice = () => {
    if (!inventoryData) return 0;

    return inventoryData.reduce((total, item) => {
      const quantity = orderQuantities[item.id] || 0;
      return total + item.price * quantity;
    }, 0);
  };

  // 발주 요청 처리
  const handleOrderRequest = () => {
    setShowOrderConfirm(true);
  };

  const confirmOrderRequest = async () => {
    const orderItems = inventoryData
      .filter((item) => (orderQuantities[item.id] || 0) > 0)
      .map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: orderQuantities[item.id],
        price: item.price,
        totalPrice: item.price * orderQuantities[item.id],
      }));

    if (orderItems.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "발주할 상품을 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      setShowOrderConfirm(false);
      return;
    }

    const result = await sendChatbotRequest(
      `발주 요청: ${JSON.stringify(orderItems)}`,
      "발주 요청을 처리하고 있습니다..."
    );

    const botMessage = {
      id: Date.now(),
      type: "bot",
      content: result?.data?.result?.body
        ? `발주 요청이 완료되었습니다!\n\n${JSON.stringify(result.data.result.body, null, 2)}`
        : "발주 요청이 완료되었습니다!",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setShowOrderConfirm(false);
    setIsInventoryEditMode(false);
    setOrderQuantities({});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 금일 근무 현황 데이터 파싱 함수
  const parseTodayAttendanceData = (data) => {
    if (!data || !data.employees || !Array.isArray(data.employees)) return null;

    return data.employees.map((employee) => {
      const {
        employeeId,
        employeeName,
        workType,
        status,
        clockInfo,
        workMinutes,
        breakMinutes,
      } = employee;

      // 상태별 표시 로직
      let statusText = "";
      let clockInTime = "";
      let clockOutTime = "";

      switch (status) {
        case "WORKING":
          statusText = "근무중";
          clockInTime = clockInfo.actualClockIn
            ? new Date(clockInfo.actualClockIn).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          clockOutTime = "";
          break;
        case "CLOCKED_OUT":
          statusText = "퇴근완료";
          clockInTime = clockInfo.actualClockIn
            ? new Date(clockInfo.actualClockIn).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          clockOutTime = clockInfo.actualClockOut
            ? new Date(clockInfo.actualClockOut).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          break;
        case "PLANNED":
          statusText = "예정";
          clockInTime = clockInfo.plannedClockIn
            ? new Date(clockInfo.plannedClockIn).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          clockOutTime = clockInfo.plannedClockOut
            ? new Date(clockInfo.plannedClockOut).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          break;
        case "ABSENT":
          statusText = "결근";
          clockInTime = "";
          clockOutTime = "";
          break;
        case "LEAVE":
          statusText = "휴가";
          clockInTime = "";
          clockOutTime = "";
          break;
        default:
          statusText = status;
      }

      return {
        employeeName,
        workType,
        status: statusText,
        clockInTime,
        clockOutTime,
        workMinutes,
        breakMinutes,
      };
    });
  };

  // 근태 데이터 파싱 함수 (기존)
  const parseAttendanceData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const employeeStats = {};

    data.forEach((record) => {
      const { employeeId, employeeName, summary } = record;
      if (!summary) return; // 요약 정보 없는 직원 제외

      employeeStats[employeeId] = {
        employeeName,
        workDays: summary.workDays || 0,
        absentDays: summary.absentDays || 0,
        leaveDays: summary.leaveDays || 0,
        avgWorkHours: summary.averageWorkMinutes
          ? (summary.averageWorkMinutes / 60).toFixed(1)
          : 0,
        avgBreakMinutes: summary.totalDays
          ? ((summary.totalWorkMinutes / summary.totalDays) * 0.125).toFixed(0) // 예시 계산
          : 0,
      };
    });

    return employeeStats;
  };

  // 금일 근무 현황을 표 형태로 표시하는 함수
  const formatTodayAttendanceTable = (employees) => {
    if (!employees || employees.length === 0) {
      return "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "today_attendance_table",
      data: employees,
    };
  };

  // 근태 정보를 표 형태로 표시하는 함수
  const formatAttendanceTable = (employeeStats) => {
    if (!employeeStats || Object.keys(employeeStats).length === 0) {
      return "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "attendance_table",
      data: Object.values(employeeStats),
    };
  };

  // API 요청 함수
  const sendChatbotRequest = async (
    message,
    loadingText = "정보를 조회하고 있습니다..."
  ) => {
    try {
      setLoadingMessage(loadingText);
      setIsLoading(true);
      console.log("message=============", message);
      const response = await axios.post(
        "http://localhost:8080/branch-service/chatbot/ask",
        {
          message: message,
        }
      );
      console.log(response);
      const result = response.data;
      console.log(result);
      console.log(response.data.result.body);
      return result;
    } catch (error) {
      console.error("API 요청에 실패했습니다.", error);
      return { error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const quickButtons = [
    { id: "attendance", label: "근태", icon: "👤" },
    { id: "inventory", label: "재고", icon: "📦" },
    { id: "order", label: "발주", icon: "📋" },
    { id: "sales", label: "매출", icon: "💰" },
    { id: "reset", label: "채팅 초기화", icon: "🔄" },
  ];

  const handleQuickButton = async (buttonId) => {
    if (buttonId === "reset") {
      setShowResetConfirm(true);
      return;
    }

    // 재고 버튼 클릭 시 전체 재고 조회 API 호출하여 상태에 저장
    if (buttonId === "inventory" && !inventoryData) {
      const result = await sendChatbotRequest(
        "재고 전체 조회",
        "재고 정보를 조회하고 있습니다..."
      );

      if (result?.result?.body) {
        let stocks = [];
        const body = result.result.body;

        if (Array.isArray(body)) {
          stocks = body;
        } else if (body.stocks && Array.isArray(body.stocks)) {
          stocks = body.stocks;
        } else if (body.branchProductId) {
          stocks = [body];
        }

        if (stocks.length > 0) {
          const processedData = stocks.map((item) => ({
            id: item.branchProductId,
            productName: item.productName,
            stockQuantity: item.stockQuantity,
            safetyStock: item.safetyStock,
            price: item.price,
          }));
          console.log("재고 버튼 클릭 - 데이터 저장:", processedData);
          setInventoryData(processedData);
        }
      }
    }

    // 모든 탭을 닫고 새로운 탭을 열기
    setActiveTab(buttonId);
  };

  // 근태 탭 클릭 핸들러
  const handleAttendanceTab = async (tabType) => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `근태 ${tabType}`,
      timestamp: new Date(),
    };

    // 채팅 내용 유지 - 초기화하지 않음
    setActiveTab(null);
    if (tabType === "전체직원조회") {
      const result = await sendChatbotRequest(
        "전체 직원 근태 조회",
        "근태 정보를 조회하고 있습니다..."
      );

      if (
        result &&
        result.data &&
        result.data.result &&
        result.data.result.body
      ) {
        const employees = result.data.result.body.employees;

        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: {
            type: "attendance_table",
            data: employees.map((emp) => ({
              employeeName: emp.employeeName,
              totalDays: emp.summary.totalDays ?? 0,
              workDays: emp.summary.workDays ?? 0,
              absentDays: emp.summary.absentDays ?? 0,
              leaveDays: emp.summary.leaveDays ?? 0,
              totalWorkMinutes: emp.summary.totalWorkMinutes ?? 0,
              averageWorkMinutes: emp.summary.averageWorkMinutes ?? 0,
            })),
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else if (result.employees && Array.isArray(result.employees)) {
        const employees = result.employees;

        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: {
            type: "attendance_table",
            data: employees.map((emp) => ({
              employeeName: emp.employeeName,
              totalDays: emp.summary?.totalDays ?? 0,
              workDays: emp.summary?.workDays ?? 0,
              absentDays: emp.summary?.absentDays ?? 0,
              leaveDays: emp.summary?.leaveDays ?? 0,
              totalWorkMinutes: emp.summary?.totalWorkMinutes ?? 0,
              averageWorkMinutes: emp.summary?.averageWorkMinutes ?? 0,
            })),
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        return; // ✅ 여기서 끝내야 아래의 '데이터 없음' 분기로 안 감
      } else {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: "근태 데이터를 불러오지 못했습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }

      return;
    }

    // 각 탭별 특별 처리
    if (tabType === "상세직원조회") {
      setIsComparing(true);
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "조회를 원하시는 직원 이름을 입력해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    if (tabType === "근태수정제안") {
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "근태 수정이 필요한 직원 이름을 입력해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    // API 요청 메시지 설정
    let message = "";
    switch (tabType) {
      case "금일근무현황":
        message = "금일 근태 현황";
        break;
      case "전체직원조회":
        message = "전체 직원 근태 조회";
        break;
      default:
        message = "근태 조회";
    }

    const result = await sendChatbotRequest(
      message,
      "근태 정보를 조회하고 있습니다..."
    );

    let botContent = "";

    if (result.error) {
      botContent = `오류가 발생했습니다: ${result.error}`;
    } else {
      // 금일 근무 현황인 경우 특별 처리
      if (tabType === "금일근무현황") {
        if (result.data && result.data.result && result.data.result.body) {
          const todayData = parseTodayAttendanceData(result.data.result.body);
          if (todayData) {
            botContent = formatTodayAttendanceTable(todayData);
          } else {
            botContent =
              "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
          }
        } else {
          botContent =
            "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
        }
      } else {
        // 기존 근태 데이터 처리
        let attendanceData = null;

        // result가 배열인 경우 (직접 근태 데이터)
        if (Array.isArray(result)) {
          attendanceData = result;
        }
        // result가 객체이고 data 속성이 있는 경우
        else if (result.data && Array.isArray(result.data)) {
          attendanceData = result.data;
        }
        // result가 객체이고 attendanceData 속성이 있는 경우
        else if (
          result.attendanceData &&
          Array.isArray(result.attendanceData)
        ) {
          attendanceData = result.attendanceData;
        }

        if (attendanceData && attendanceData.length > 0) {
          // 근태 데이터 파싱 및 표시
          const employeeStats = parseAttendanceData(attendanceData);
          const tableContent = formatAttendanceTable(employeeStats);
          botContent = tableContent;
        } else {
          botContent =
            "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
        }
      }
    }

    const botMessage = {
      id: Date.now() + 1,
      type: "bot",
      content: botContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  // 재고 탭 클릭 핸들러
  const handleInventoryTab = async (tabType) => {
    // 채팅 내용 유지 - 초기화하지 않음
    setActiveTab(null);

    if (tabType === "전체조회") {
      // 저장된 재고 데이터가 있으면 그대로 표시 (API 호출 없음)
      console.log("전체조회 클릭 - inventoryData:", inventoryData);
      if (inventoryData && inventoryData.length > 0) {
        console.log("저장된 데이터 사용 - API 호출 없음");
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: {
            type: "inventory_table",
            data: inventoryData,
          },
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        return; // API 호출 없이 종료
      }

      // 저장된 데이터가 없을 때만 API 호출
      const result = await sendChatbotRequest(
        "재고 전체 조회",
        "재고 정보를 조회하고 있습니다..."
      );

      if (result?.result?.body) {
        let stocks = [];
        const body = result.result.body;

        if (Array.isArray(body)) {
          stocks = body;
        } else if (body.stocks && Array.isArray(body.stocks)) {
          stocks = body.stocks;
        } else if (body.branchProductId) {
          stocks = [body];
        }

        if (stocks.length > 0) {
          const processedData = stocks.map((item) => ({
            id: item.branchProductId,
            productName: item.productName,
            stockQuantity: item.stockQuantity,
            safetyStock: item.safetyStock,
            price: item.price,
          }));

          setInventoryData(processedData);

          const botMessage = {
            id: Date.now(),
            type: "bot",
            content: {
              type: "inventory_table",
              data: processedData,
            },
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, botMessage]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content: "재고 데이터를 불러오지 못했습니다.",
              timestamp: new Date(),
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: "재고 데이터를 불러오지 못했습니다.",
            timestamp: new Date(),
          },
        ]);
      }
    }

    if (tabType === "재고수정") {
      if (!inventoryData || inventoryData.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: "먼저 전체 재고 조회를 해주세요.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      setIsInventoryEditMode(true);
      setOrderQuantities({});

      const botMessage = {
        id: Date.now(),
        type: "bot",
        content: {
          type: "inventory_edit",
          data: inventoryData,
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }

    if (tabType === "회전율") {
      const result = await sendChatbotRequest(
        "재고 회전율 조회",
        "회전율 정보를 조회하고 있습니다..."
      );
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: result?.data?.result?.body
            ? JSON.stringify(result.data.result.body, null, 2)
            : "회전율 데이터를 불러오지 못했습니다.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // 발주 탭 클릭 핸들러
  const handleOrderTab = async (tabType) => {
    // 채팅 내용 유지 - 초기화하지 않음
    setActiveTab(null);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `발주 ${tabType}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 발주 관련 API 요청
    if (tabType === "전체조회") {
      const result = await sendChatbotRequest(
        "발주 전체 조회",
        "발주 정보를 조회하고 있습니다..."
      );

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: result?.data?.result?.body
          ? JSON.stringify(result.data.result.body, null, 2)
          : "발주 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    // 발주 등록 처리
    if (tabType === "발주등록") {
      setIsOrderRegistering(true);
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "발주 등록을 위해 필요한 정보를 입력해주세요.\n\n예시: 상품명, 수량, 공급업체명 등을 입력하세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    // 봇 응답 시뮬레이션
    setTimeout(() => {
      const botResponses = {
        전체조회:
          "발주 현황을 조회해드리겠습니다.\n\n📋 현재 발주 현황:\n- 대기중: 3건\n- 처리완료: 12건\n- 배송중: 5건",
        발주등록:
          "새로운 발주를 등록해드리겠습니다.\n발주할 상품을 선택해주세요.",
        발주수정: "발주 수정이 필요한 주문번호를 입력해주세요.",
        배송현황:
          "배송 현황을 확인해드리겠습니다.\n\n🚚 현재 배송중인 주문: 5건\n📦 배송완료: 12건",
      };

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botResponses[tabType] || "발주 관련 정보를 처리하고 있습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  // 매출 탭 클릭 핸들러
  const handleSalesTab = async (tabType) => {
    // 채팅 내용 유지 - 초기화하지 않음
    setActiveTab(null);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `매출 ${tabType}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 매출 관련 API 요청
    if (tabType === "일일매출") {
      const result = await sendChatbotRequest(
        "일일 매출 조회",
        "매출 정보를 조회하고 있습니다..."
      );

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: result?.data?.result?.body
          ? JSON.stringify(result.data.result.body, null, 2)
          : "매출 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    // 봇 응답 시뮬레이션
    setTimeout(() => {
      const botResponses = {
        일일매출:
          "오늘의 매출 현황입니다.\n\n💰 총 매출: ₩2,450,000\n- 주문 건수: 28건\n- 평균 주문액: ₩87,500\n\n📈 전일 대비 +15.3% 증가했습니다!",
        월별매출:
          "이번 달 매출 현황입니다.\n\n📊 월별 매출: ₩45,200,000\n- 총 주문 건수: 520건\n- 평균 일일 매출: ₩1,460,000",
        상품별매출:
          "상품별 매출 현황입니다.\n\n🛍️ 인기 상품 TOP 3:\n1. 러닝화: ₩12,500,000\n2. 트레이닝복: ₩8,200,000\n3. 액세서리: ₩6,800,000",
        매출분석:
          "매출 분석 결과입니다.\n\n📈 성장률: +15.3%\n📊 고객 재방문율: 68%\n💰 평균 주문액: ₩87,500",
      };

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botResponses[tabType] || "매출 관련 정보를 처리하고 있습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content:
          "안녕하세요!\n신한카드 챗봇 레이에요!\n\n카드 이용 관련 궁금한 점이 생기면,\n언제든지 레이에게 물어보세요.",
        timestamp: new Date(),
      },
    ]);
    setShowResetConfirm(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = inputValue;
    setInputValue("");

    // 발주 등록 입력 처리
    if (isOrderRegistering) {
      const result = await sendChatbotRequest(
        `발주 등록 ${messageContent}`,
        "발주 등록을 처리하고 있습니다..."
      );

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: result?.data?.result?.body
          ? `발주 등록이 완료되었습니다!\n\n${JSON.stringify(result.data.result.body, null, 2)}`
          : "발주 등록 처리 중 오류가 발생했습니다.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsOrderRegistering(false);
      return;
    }

    // 직원 이름으로 근태 조회하는 경우
    if (messageContent.trim()) {
      const requestMessage = isComparing
        ? `${messageContent} 직원 상세 근태 조회`
        : `${messageContent} 근태 조회`;

      const result = await sendChatbotRequest(
        requestMessage,
        "근태 정보를 조회하고 있습니다..."
      );

      let botContent = "";

      if (result.error) {
        botContent = `오류가 발생했습니다: ${result.error}`;
      } else if (isComparing) {
        // ✅ 상세 직원 조회 처리
        const employeeData =
          result.result?.body?.employee || result.result?.body?.employees?.[0];

        if (employeeData) {
          botContent = {
            type: "detail_table",
            summary: employeeData.summary,
            details: employeeData.details || [],
          };
        } else {
          botContent = "해당 직원의 근태 정보를 찾을 수 없습니다.";
        }
      } else {
        let attendanceData = null;
        if (Array.isArray(result)) {
          attendanceData = result;
        } else if (result.employees && Array.isArray(result.employees)) {
          attendanceData = result.employees;
        } else if (result.data && Array.isArray(result.data)) {
          attendanceData = result.data;
        } else if (
          result.attendanceData &&
          Array.isArray(result.attendanceData)
        ) {
          attendanceData = result.attendanceData;
        } else if (
          result.result?.body?.employees &&
          Array.isArray(result.result.body.employees)
        ) {
          attendanceData = result.result.body.employees;
        }

        if (attendanceData && attendanceData.length > 0) {
          const employeeStats = parseAttendanceData(attendanceData);
          const tableContent = formatAttendanceTable(employeeStats);
          botContent = tableContent;
        } else {
          botContent =
            "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsComparing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <div className="avatar-icon">🤖</div>
            </div>
            <div className="chatbot-title">
              <div className="chatbot-name">레이</div>
              <div className="chatbot-subtitle">궁금한 사항을 물어보세요!</div>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.type === "user" ? "user-message" : "bot-message"
              }`}
            >
              {message.type === "bot" && (
                <div className="message-avatar">
                  <div className="avatar-icon">🤖</div>
                </div>
              )}
              <div className="message-content">
                <div className="message-bubble">
                  {message.content &&
                  typeof message.content === "object" &&
                  (message.content.type === "attendance_table" ||
                    message.content.type === "today_attendance_table" ||
                    message.content.type === "detail_table" ||
                    message.content.type === "inventory_table" ||
                    message.content.type === "inventory_edit") ? (
                    <div className="attendance-table-container">
                      <div className="attendance-title">
                        {message.content.type === "today_attendance_table"
                          ? "📅 금일 근무 현황"
                          : "📊 근태 현황"}
                      </div>
                      <div className="attendance-table">
                        {message.content.type === "today_attendance_table" ? (
                          // ✅ 금일 근무 현황
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">이름</div>
                              <div className="attendance-cell header">
                                근무유형
                              </div>
                              <div className="attendance-cell header">상태</div>
                              <div className="attendance-cell header">
                                출근시간
                              </div>
                              <div className="attendance-cell header">
                                퇴근시간
                              </div>
                            </div>
                            {message.content.data.map((employee, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">
                                  {employee.employeeName}
                                </div>
                                <div className="attendance-cell">
                                  {employee.workType}
                                </div>
                                <div className="attendance-cell">
                                  {employee.status}
                                </div>
                                <div className="attendance-cell">
                                  {employee.clockInTime}
                                </div>
                                <div className="attendance-cell">
                                  {employee.clockOutTime}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "attendance_table" ? (
                          // ✅ 전체 직원 요약
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">이름</div>
                              <div className="attendance-cell header">
                                총근무일수
                              </div>
                              <div className="attendance-cell header">
                                결근일수
                              </div>
                              <div className="attendance-cell header">
                                휴가일수
                              </div>
                              <div className="attendance-cell header">
                                평균근무시간
                              </div>
                            </div>
                            {message.content.data.map((stats, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">
                                  {stats.employeeName}
                                </div>
                                <div className="attendance-cell">
                                  {stats.workDays}일
                                </div>
                                <div className="attendance-cell">
                                  {stats.absentDays}일
                                </div>
                                <div className="attendance-cell">
                                  {stats.leaveDays}일
                                </div>
                                <div className="attendance-cell">
                                  {(
                                    (message.content?.summary
                                      ?.averageWorkMinutes ?? 0) / 60
                                  ).toFixed(1)}
                                  시간
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "detail_table" ? (
                          // ✅ 상세 직원 조회 (요약 + 일별 상세)
                          <>
                            {/* 상단 요약 */}
                            <div className="attendance-title">
                              👤 직원 근태 요약
                            </div>
                            <div className="attendance-header">
                              <div className="attendance-cell header">이름</div>
                              <div className="attendance-cell header">
                                총근무일수
                              </div>
                              <div className="attendance-cell header">
                                결근일수
                              </div>
                              <div className="attendance-cell header">
                                휴가일수
                              </div>
                              <div className="attendance-cell header">
                                평균근무시간
                              </div>
                            </div>
                            <div className="attendance-row">
                              <div className="attendance-cell">
                                {message.content.summary.employeeName}
                              </div>
                              <div className="attendance-cell">
                                {message.content.summary.workDays}일
                              </div>
                              <div className="attendance-cell">
                                {message.content.summary.absentDays}일
                              </div>
                              <div className="attendance-cell">
                                {message.content.summary.leaveDays}일
                              </div>
                              <div className="attendance-cell">
                                {(
                                  (message.content?.summary
                                    ?.averageWorkMinutes ?? 0) / 60
                                ).toFixed(1)}
                                시간
                              </div>
                            </div>

                            {/* 구분선 */}
                            <div
                              style={{
                                margin: "10px 0",
                                borderTop: "1px solid #e2e8f0",
                              }}
                            ></div>

                            {/* 하단 상세 내역 */}
                            <div className="attendance-title">
                              📅 일별 근무 내역
                            </div>
                            <div className="attendance-header">
                              <div className="attendance-cell header">날짜</div>
                              <div className="attendance-cell header">
                                근무유형
                              </div>
                              <div className="attendance-cell header">상태</div>
                              <div className="attendance-cell header">
                                근무시간
                              </div>
                              <div className="attendance-cell header">
                                휴게시간
                              </div>
                            </div>
                            {message.content.details.map((detail, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">
                                  {detail.date}
                                </div>
                                <div className="attendance-cell">
                                  {detail.workType || "-"}
                                </div>
                                <div className="attendance-cell">
                                  {detail.status}
                                </div>
                                <div className="attendance-cell">
                                  {detail.workMinutes}분
                                </div>
                                <div className="attendance-cell">
                                  {detail.breakMinutes}분
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "inventory_table" ? (
                          // ✅ 재고 조회 테이블 (새로 추가)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">ID</div>
                              <div className="attendance-cell header">
                                상품명
                              </div>
                              <div className="attendance-cell header">수량</div>
                              <div className="attendance-cell header">
                                안전재고
                              </div>
                              <div className="attendance-cell header">가격</div>
                            </div>
                            {message.content.data.map((item, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">{item.id}</div>
                                <div className="attendance-cell">
                                  {item.productName}
                                </div>
                                <div className="attendance-cell">
                                  {item.stockQuantity}
                                </div>
                                <div className="attendance-cell">
                                  {item.safetyStock}
                                </div>
                                <div className="attendance-cell">
                                  {item.price.toLocaleString()}원
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "inventory_edit" ? (
                          // ✅ 재고 수정 UI
                          <>
                            <div className="attendance-title">
                              📦 재고 발주 관리
                            </div>
                            <div className="inventory-edit-container">
                              <div className="inventory-edit-header">
                                <div className="inventory-edit-cell header">
                                  상품명
                                </div>
                                <div className="inventory-edit-cell header">
                                  발주수량
                                </div>
                                <div className="inventory-edit-cell header">
                                  단가
                                </div>
                              </div>
                              {message.content.data.map((item, index) => (
                                <div key={index} className="inventory-edit-row">
                                  <div className="inventory-edit-cell product-name">
                                    {item.productName}
                                  </div>
                                  <div className="inventory-edit-cell quantity-control">
                                    <button
                                      className="quantity-btn minus"
                                      onClick={() => decrementQuantity(item.id)}
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={orderQuantities[item.id] || 0}
                                      onChange={(e) =>
                                        updateOrderQuantity(
                                          item.id,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="quantity-input"
                                      min="0"
                                    />
                                    <button
                                      className="quantity-btn plus"
                                      onClick={() => incrementQuantity(item.id)}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="inventory-edit-cell price">
                                    {item.price.toLocaleString()}원
                                  </div>
                                </div>
                              ))}
                              <div className="order-summary">
                                <div className="total-price">
                                  최종 가격:{" "}
                                  <span className="price-amount">
                                    {calculateTotalPrice().toLocaleString()}원
                                  </span>
                                </div>
                                <button
                                  className="order-request-btn"
                                  onClick={handleOrderRequest}
                                >
                                  발주 요청
                                </button>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : typeof message.content === "string" ? (
                    message.content
                      .split("\n")
                      .map((line, index) => <div key={index}>{line}</div>)
                  ) : (
                    <div>{String(message.content)}</div>
                  )}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />

          {/* 탭 표시 */}
          {activeTab === "attendance" && (
            <AttendanceTab onTabClick={handleAttendanceTab} />
          )}
          {activeTab === "inventory" && (
            <InventoryTab onTabClick={handleInventoryTab} />
          )}
          {activeTab === "order" && <OrderTab onTabClick={handleOrderTab} />}
          {activeTab === "sales" && <SalesTab onTabClick={handleSalesTab} />}
          {/* 로딩 표시 */}
          {isLoading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <span>{loadingMessage}</span>
            </div>
          )}

          {/* 작은 탭 버튼들 */}
          <div className="mini-tabs">
            {quickButtons.map((button) => (
              <button
                key={button.id}
                className={`mini-tab ${
                  button.id === "reset" ? "reset-tab" : ""
                }`}
                onClick={() => handleQuickButton(button.id)}
              >
                <span className="mini-tab-icon">{button.icon}</span>
                <span className="mini-tab-label">{button.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chatbot-input">
          <div className="input-container">
            <input
              type="text"
              placeholder="레이에게 물어보세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="message-input"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              ➤
            </button>
          </div>
        </div>

        <div className="chatbot-footer">
          <span>오전 10:46</span>
        </div>

        {/* 초기화 확인 모달 */}
        {showResetConfirm && (
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-title">채팅 초기화</div>
              <div className="reset-modal-message">
                모든 채팅 내역을 초기화하시겠습니까?
              </div>
              <div className="reset-modal-buttons">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setShowResetConfirm(false)}
                >
                  취소
                </button>
                <button className="reset-confirm-btn" onClick={handleResetChat}>
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 발주 요청 확인 모달 */}
        {showOrderConfirm && (
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-title">발주 요청</div>
              <div className="reset-modal-message">
                발주를 요청하시겠습니까?
              </div>
              <div className="reset-modal-buttons">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setShowOrderConfirm(false)}
                >
                  아니오
                </button>
                <button
                  className="reset-confirm-btn"
                  onClick={confirmOrderRequest}
                >
                  예
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
