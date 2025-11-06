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
        "안녕하세요!\n케어업 챗봇 케이에요!\n\n이용 관련 궁금한 점이 생기면,\n언제든지 케이에게 물어보세요.",
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
  const [inventoryReasons, setInventoryReasons] = useState({});
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [turnoverData, setTurnoverData] = useState(null);
  const [showTurnoverOrderConfirm, setShowTurnoverOrderConfirm] =
    useState(false);
  const [showOrderRecommendConfirm, setShowOrderRecommendConfirm] =
    useState(false);
  const [showManualOrderConfirm, setShowManualOrderConfirm] = useState(false);

  const calculateManualOrderTotalPrice = (items) => {
    if (!items) return 0;
    return items.reduce((sum, i) => {
      const qty = Number(orderQuantities[i.id] || 0);
      const unit = Number(i.unitPrice || i.price || 0);
      return sum + qty * unit;
    }, 0);
  };
  // 근태 수정용 캐시 및 상태
  const [attendanceEmployees, setAttendanceEmployees] = useState(null);
  const [attendanceMeta, setAttendanceMeta] = useState(null); // { leaveTypes, templates, workTypes }
  const [isAttendanceEditMode, setIsAttendanceEditMode] = useState(false);
  const [attendanceEditSelection, setAttendanceEditSelection] = useState({
    employeeId: "",
    scheduleId: "",
    date: "",
    templateId: "",
    workTypeId: "",
    leaveTypeId: "",
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 발주 수량 조절 함수들
  const updateOrderQuantity = (itemId, quantity) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
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

  // 사유 선택 업데이트
  const updateInventoryReason = (itemId, reason) => {
    setInventoryReasons((prev) => ({
      ...prev,
      [itemId]: reason,
    }));
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
    // 수량이 입력된 항목들에 대해 사유 검증
    const itemsWithQuantity = inventoryData.filter(
      (item) => (orderQuantities[item.id] || 0) !== 0
    );
    const itemsWithoutReason = itemsWithQuantity.filter(
      (item) => !inventoryReasons[item.id]
    );

    if (itemsWithoutReason.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content:
            "사유 선택은 필수입니다. 모든 수정 항목에 대해 사유를 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setShowOrderConfirm(true);
  };

  const confirmOrderRequest = async () => {
    const orderItems = inventoryData
      .filter((item) => (orderQuantities[item.id] || 0) !== 0)
      .map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: orderQuantities[item.id],
        reason: inventoryReasons[item.id] || "",
      }));

    if (orderItems.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "수정할 상품을 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      setShowOrderConfirm(false);
      return;
    }

    const inventoryUpdateMessage = `재고 수정: ${JSON.stringify(orderItems)}`;

    const result = await sendChatbotRequest(
      inventoryUpdateMessage,
      "재고 수정을 처리하고 있습니다..."
    );

    const botMessage = {
      id: Date.now(),
      type: "bot",
      content: result?.data?.result?.body
        ? `재고 수정이 완료되었습니다!\n\n${JSON.stringify(result.data.result.body, null, 2)}`
        : "재고 수정이 완료되었습니다!",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setShowOrderConfirm(false);
    setIsInventoryEditMode(false);
    setOrderQuantities({});
    setInventoryReasons({});
    // 재고 최신화 표시
    const invResult = await sendChatbotRequest(
      "재고 전체 조회",
      "재고 정보를 새로고침하고 있습니다..."
    );
    if (
      invResult?.result?.body ||
      invResult?.data?.result?.body ||
      invResult?.body
    ) {
      let stocks = [];
      const body =
        invResult?.data?.result?.body ||
        invResult?.result?.body ||
        invResult?.body;
      if (Array.isArray(body)) stocks = body;
      else if (body.stocks && Array.isArray(body.stocks)) stocks = body.stocks;
      else if (body.branchProductId) stocks = [body];
      if (stocks.length > 0) {
        const processedData = stocks.map((item) => ({
          id: item.branchProductId,
          productName: item.productName,
          stockQuantity: item.stockQuantity,
          safetyStock: item.safetyStock,
          price: item.price,
        }));
        setInventoryData(processedData);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: { type: "inventory_table", data: processedData },
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  // 발주추천(회전율 기반) 합계 계산
  const calculateOrderRecommendTotalPrice = (data) => {
    if (!data || !data.products) return 0;
    return data.products.reduce((sum, p) => {
      const qty = Number(p.recommendedOrderQuantity) || 0;
      const unit = Number(p.supplyPrice) || 0;
      return sum + qty * unit;
    }, 0);
  };

  const calculateOrderRecommendTotalQty = (data) => {
    if (!data || !data.products) return 0;
    return data.products.reduce(
      (sum, p) => sum + (Number(p.recommendedOrderQuantity) || 0),
      0
    );
  };

  // 회전율 기반 발주 요청 처리
  const handleTurnoverOrderRequest = () => {
    if (!turnoverData || !turnoverData.products) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "회전율 데이터가 없습니다.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // recommendedOrderQuantity가 0보다 큰 상품들만 필터링
    const orderItems = turnoverData.products
      .filter((product) => product.recommendedOrderQuantity > 0)
      .map((product) => ({
        productId: product.productId,
        quantity: product.recommendedOrderQuantity,
      }));

    if (orderItems.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "발주가 필요한 상품이 없습니다.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setShowTurnoverOrderConfirm(true);
  };

  const confirmTurnoverOrderRequest = async () => {
    if (!turnoverData || !turnoverData.products) return;

    const orderItems = turnoverData.products
      .filter((product) => product.recommendedOrderQuantity > 0)
      .map((product) => ({
        productId: product.productId,
        quantity: product.recommendedOrderQuantity,
      }));

    if (orderItems.length === 0) {
      setShowTurnoverOrderConfirm(false);
      return;
    }

    // 발주 요청 메시지 생성
    const orderRequestMessage = `발주 요청: ${JSON.stringify(orderItems)}`;

    const result = await sendChatbotRequest(
      orderRequestMessage,
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
    setShowTurnoverOrderConfirm(false);
    // 발주 현황 재조회
    const ordRes = await sendChatbotRequest(
      "발주 전체 조회",
      "발주 정보를 새로고침하고 있습니다..."
    );
    let orderData = null;
    if (ordRes?.data?.result?.body) orderData = ordRes.data.result.body;
    else if (ordRes?.result?.body) orderData = ordRes.result.body;
    else if (ordRes?.body) orderData = ordRes.body;
    if (orderData) {
      const parsed = parseOrderData(orderData);
      if (parsed) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: formatOrderTable(parsed),
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  // 수동 발주 확인 처리
  const confirmManualOrderRequest = async () => {
    if (!inventoryData || inventoryData.length === 0) {
      setShowManualOrderConfirm(false);
      return;
    }

    const orderItems = inventoryData
      .filter((i) => (orderQuantities[i.id] || 0) > 0)
      .map((i) => ({
        productId: i.id,
        quantity: Number(orderQuantities[i.id] || 0),
      }));

    if (orderItems.length === 0) {
      setShowManualOrderConfirm(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "발주 수량을 입력해주세요.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const orderRequestMessage = `발주 요청: ${JSON.stringify(orderItems)}`;
    const result = await sendChatbotRequest(
      orderRequestMessage,
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
    setShowManualOrderConfirm(false);
    // 발주 현황 재조회
    const ordRes2 = await sendChatbotRequest(
      "발주 전체 조회",
      "발주 정보를 새로고침하고 있습니다..."
    );
    let orderData2 = null;
    if (ordRes2?.data?.result?.body) orderData2 = ordRes2.data.result.body;
    else if (ordRes2?.result?.body) orderData2 = ordRes2.result.body;
    else if (ordRes2?.body) orderData2 = ordRes2.body;
    if (orderData2) {
      const parsed2 = parseOrderData(orderData2);
      if (parsed2) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: formatOrderTable(parsed2),
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  // 근태 수정 입력 변경
  const handleAttendanceEditChange = (field, value) => {
    setAttendanceEditSelection((prev) => {
      const next = { ...prev, [field]: value };
      // 상호 배타 제어: leaveType 선택 시 template/workType 초기화
      if (field === "leaveTypeId" && value) {
        next.templateId = "";
        next.workTypeId = "";
      }
      // template 또는 workType 선택 시 leaveType 초기화
      if ((field === "templateId" || field === "workTypeId") && value) {
        next.leaveTypeId = "";
      }
      return next;
    });
  };

  const getSelectedEmployee = () => {
    if (!attendanceEmployees || !attendanceEditSelection.employeeId)
      return null;
    return attendanceEmployees.find(
      (e) => String(e.employeeId) === String(attendanceEditSelection.employeeId)
    );
  };

  const getScheduleOptions = () => {
    const emp = getSelectedEmployee();
    if (!emp) return [];
    // employees[*].details 배열(날짜 기반 일정) 우선 사용, 없으면 기존 필드 사용
    const details = Array.isArray(emp.details) ? emp.details : [];
    if (details.length > 0) {
      return details.map((d, idx) => ({
        scheduleId: d.scheduleId ?? `detail-${idx}`,
        date: d.date,
        templateName: d.templateName,
        workTypeName: d.workType,
      }));
    }
    const schedules = emp.schedules || emp.nextSchedules || [];
    return Array.isArray(schedules) ? schedules : [];
  };

  const submitAttendanceEdit = async () => {
    const {
      employeeId,
      scheduleId,
      date,
      templateId,
      workTypeId,
      leaveTypeId,
    } = attendanceEditSelection;

    // 필수값 검증
    if (!employeeId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "직원을 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (!date) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "등록 날짜를 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (!scheduleId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "스케줄을 선택해주세요.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // 상호배타 검증
    const choseLeave = !!leaveTypeId;
    const choseTemplateOrWork = !!templateId || !!workTypeId;
    if (choseLeave && choseTemplateOrWork) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content:
            "휴가 타입을 선택한 경우 템플릿/워크타입을 선택할 수 없습니다.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (!choseLeave && !choseTemplateOrWork) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "템플릿 또는 워크타입, 혹은 휴가 타입 중 하나는 필수입니다.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const payload = {
      employeeId: Number(employeeId),
      scheduleId: isNaN(Number(scheduleId)) ? null : Number(scheduleId),
      date,
      templateId: templateId ? Number(templateId) : null,
      workTypeId: workTypeId ? Number(workTypeId) : null,
      leaveTypeId: leaveTypeId ? Number(leaveTypeId) : null,
    };

    const result = await sendChatbotRequest(
      `근태 수정 요청: ${JSON.stringify(payload)}`,
      "근태 수정 요청을 처리하고 있습니다..."
    );

    const ok = result && (result.result?.body || result.data?.result?.body);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "bot",
        content: ok
          ? "근태 수정이 완료되었습니다."
          : "근태 수정 처리에 실패했습니다.",
        timestamp: new Date(),
      },
    ]);

    if (ok) {
      setIsAttendanceEditMode(false);
      setAttendanceEditSelection({
        employeeId: "",
        scheduleId: "",
        date: "",
        templateId: "",
        workTypeId: "",
        leaveTypeId: "",
      });
      // 근태 요약 재표시
      const res2 = await sendChatbotRequest(
        "전체 직원 근태 조회",
        "근태 정보를 새로고침하고 있습니다..."
      );
      let employees = null;
      if (res2?.data?.result?.body)
        employees = (res2.data.result.body.attendance || res2.data.result.body)
          ?.employees;
      else if (res2?.result?.body)
        employees = (res2.result.body.attendance || res2.result.body)
          ?.employees;
      else if (res2?.body)
        employees = (res2.body.attendance || res2.body)?.employees;
      if (Array.isArray(employees)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
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
          },
        ]);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 금일 근무 현황 데이터 파싱 함수
  const parseTodayAttendanceData = (data) => {
    console.log("parseTodayAttendanceData - 입력 데이터:", data);

    if (!data || !data.employees || !Array.isArray(data.employees)) {
      console.log(
        "parseTodayAttendanceData - 데이터가 없거나 employees 배열이 아님:",
        {
          hasData: !!data,
          hasEmployees: !!(data && data.employees),
          isArray: !!(data && data.employees && Array.isArray(data.employees)),
        }
      );
      return null;
    }

    console.log(
      "parseTodayAttendanceData - employees 배열 길이:",
      data.employees.length
    );

    const parsedData = data.employees.map((employee) => {
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

    console.log("parseTodayAttendanceData - 파싱된 결과:", parsedData);
    return parsedData;
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

  // 회전율 데이터 파싱 함수
  const parseTurnoverData = (data) => {
    console.log("parseTurnoverData - 입력 데이터:", data);

    if (!data || !data.products || !Array.isArray(data.products)) {
      console.log("parseTurnoverData - 데이터가 없거나 products 배열이 아님");
      return null;
    }

    console.log(
      "parseTurnoverData - products 배열 길이:",
      data.products.length
    );

    const parsedData = data.products.map((product) => {
      const {
        productId,
        productName,
        currentStock,
        avgWeeklySales,
        turnoverRate,
        recommendedOrderQuantity,
        status,
        message,
        unitPrice,
        price,
        supplyPrice,
        orderStatus,
        turnoverStatus,
      } = product;

      const orderUnitPrice =
        typeof supplyPrice === "number"
          ? supplyPrice
          : typeof unitPrice === "number"
            ? unitPrice
            : typeof price === "number"
              ? price
              : 0;

      return {
        productId,
        productName,
        currentStock,
        avgWeeklySales,
        turnoverRate:
          typeof turnoverRate === "number"
            ? turnoverRate.toFixed(1)
            : turnoverRate,
        recommendedOrderQuantity,
        status,
        message,
        unitPrice: orderUnitPrice,
        supplyPrice:
          typeof supplyPrice === "number" ? supplyPrice : orderUnitPrice,
        orderStatus,
        turnoverStatus: turnoverStatus || status || null,
      };
    });

    console.log("parseTurnoverData - 파싱된 결과:", parsedData);
    return {
      branchId: data.branchId,
      products: parsedData,
      summary: data.summary || null,
    };
  };

  // 회전율 정보를 표 형태로 표시하는 함수
  const formatTurnoverTable = (turnoverData) => {
    if (
      !turnoverData ||
      !turnoverData.products ||
      turnoverData.products.length === 0
    ) {
      return "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "turnover_table",
      data: turnoverData,
    };
  };

  // 발주 데이터 파싱 함수
  const parseOrderData = (data) => {
    console.log("parseOrderData - 입력 데이터:", data);

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("parseOrderData - 데이터가 없거나 배열이 아님");
      return null;
    }

    console.log("parseOrderData - 발주 배열 길이:", data.length);

    const parsedData = data.map((order) => {
      const {
        branchId,
        branchName,
        createdAt,
        orderStatus,
        productCount,
        purchaseOrderId,
        totalPrice,
        updatedAt,
      } = order;

      // 상태별 표시 로직
      let statusText = "";
      switch (orderStatus) {
        case "PENDING":
          statusText = "대기중";
          break;
        case "APPROVED":
          statusText = "승인됨";
          break;
        case "REJECTED":
          statusText = "거부됨";
          break;
        case "SHIPPED":
          statusText = "배송중";
          break;
        case "DELIVERED":
          statusText = "배송완료";
          break;
        default:
          statusText = orderStatus;
      }

      // 날짜 포맷팅
      const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      return {
        purchaseOrderId,
        branchName,
        productCount,
        totalPrice: totalPrice.toLocaleString(),
        status: statusText,
        createdAt: formatDate(createdAt),
        updatedAt: formatDate(updatedAt),
      };
    });

    console.log("parseOrderData - 파싱된 결과:", parsedData);
    return parsedData;
  };

  // 발주 정보를 표 형태로 표시하는 함수
  const formatOrderTable = (orders) => {
    if (!orders || orders.length === 0) {
      return "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "order_table",
      data: orders,
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



      // 여러 가능한 데이터 경로 확인
      let employees = null;
      let leaveTypes = null;
      let templates = null;
      let workTypes = null;

      console.log("전체직원조회 - API 응답:", result);

      if (
        result &&
        result.data &&
        result.data.result &&
        result.data.result.body
      ) {
        const body =
          result.data.result.body.attendance || result.data.result.body;
        employees = body.employees;
        leaveTypes = result.data.result.body.leaveTypes;
        templates = result.data.result.body.templates;
        workTypes = result.data.result.body.workTypes;
        console.log("전체직원조회 - 경로1에서 찾음:", employees);
      } else if (result && result.result && result.result.body) {
        const body = result.result.body.attendance || result.result.body;
        employees = body.employees;
        leaveTypes = result.result.body.leaveTypes;
        templates = result.result.body.templates;
        workTypes = result.result.body.workTypes;
        console.log("전체직원조회 - 경로2에서 찾음:", employees);
      } else if (result && result.body) {
        const body = result.body.attendance || result.body;
        employees = body.employees;
        leaveTypes = result.body.leaveTypes;
        templates = result.body.templates;
        workTypes = result.body.workTypes;
        console.log("전체직원조회 - 경로3에서 찾음:", employees);
      } else if (result && result.employees) {
        employees = result.employees;
        console.log("전체직원조회 - 경로4에서 찾음:", employees);
      }

      if (employees && Array.isArray(employees)) {
        // 캐시 저장
        setAttendanceEmployees(employees);
        if (leaveTypes || templates || workTypes) {
          setAttendanceMeta({
            leaveTypes: leaveTypes || [],
            templates: templates || [],
            workTypes: workTypes || [],
          });
        }
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

    // 근태 수정 진입
    if (tabType === "근태수정") {
      // 캐시가 없으면 먼저 전체 직원 조회를 호출하여 메타/직원 캐시 확보
      let employees = attendanceEmployees;
      let leaveTypes = attendanceMeta?.leaveTypes;
      let templates = attendanceMeta?.templates;
      let workTypes = attendanceMeta?.workTypes;

      if (!employees || !leaveTypes || !templates || !workTypes) {
        const result = await sendChatbotRequest(
          "전체 직원 근태 조회",
          "근태 정보를 조회하고 있습니다..."
        );

        if (result?.data?.result?.body) {
          const body = result.data.result.body;
          const att = body.attendance || body;
          employees = att.employees;
          leaveTypes = body.leaveTypes;
          templates = body.templates;
          workTypes = body.workTypes;
        } else if (result?.result?.body) {
          const body = result.result.body;
          const att = body.attendance || body;
          employees = att.employees;
          leaveTypes = body.leaveTypes;
          templates = body.templates;
          workTypes = body.workTypes;
        } else if (result?.body) {
          const body = result.body;
          const att = body.attendance || body;
          employees = att.employees;
          leaveTypes = body.leaveTypes;
          templates = body.templates;
          workTypes = body.workTypes;
        }

        if (employees && leaveTypes && templates && workTypes) {
          setAttendanceEmployees(employees);
          setAttendanceMeta({ leaveTypes, templates, workTypes });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content: "근태 수정에 필요한 데이터 로드에 실패했습니다.",
              timestamp: new Date(),
            },
          ]);
          return;
        }
      }

      setIsAttendanceEditMode(true);
      setAttendanceEditSelection({
        employeeId: "",
        scheduleId: "",
        date: "",
        templateId: "",
        workTypeId: "",
        leaveTypeId: "",
      });

      // 상태 비동기 반영 전이라도 즉시 표시하도록 로컬 데이터 사용
      const botMessage = {
        id: Date.now(),
        type: "bot",
        content: {
          type: "attendance_edit",
          data: {
            employees: employees || [],
            meta: {
              leaveTypes: leaveTypes || [],
              templates: templates || [],
              workTypes: workTypes || [],
            },
          },
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
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

    // 인건비 계산 처리
    if (tabType === "인건비계산") {
      const result = await sendChatbotRequest(
        "인건비 계산",
        "인건비를 계산하고 있습니다..."
      );

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: result?.error 
          ? `오류가 발생했습니다: ${result.error}`
          : result?.data?.result?.body || result?.result?.body || result?.body
            ? "인건비 계산이 완료되었습니다."
            : "인건비 계산 결과를 불러오지 못했습니다.",
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
        // 여러 가능한 데이터 경로 확인
        let todayData = null;

        if (result.data && result.data.result && result.data.result.body) {
          todayData = parseTodayAttendanceData(result.data.result.body);
        } else if (result.result && result.result.body) {
          todayData = parseTodayAttendanceData(result.result.body);
        } else if (result.body) {
          todayData = parseTodayAttendanceData(result.body);
        }

        if (todayData) {
          botContent = formatTodayAttendanceTable(todayData);
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

    if (tabType === "전체조회" || tabType === "발주조회") {
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
      setInventoryReasons({});

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

      console.log("회전율 조회 - API 응답:", result);

      // 여러 가능한 데이터 경로 확인
      let turnoverData = null;

      if (result?.data?.result?.body) {
        turnoverData = parseTurnoverData(result.data.result.body);
        console.log("회전율 조회 - 경로1에서 찾음:", turnoverData);
      } else if (result?.result?.body) {
        turnoverData = parseTurnoverData(result.result.body);
        console.log("회전율 조회 - 경로2에서 찾음:", turnoverData);
      } else if (result?.body) {
        turnoverData = parseTurnoverData(result.body);
        console.log("회전율 조회 - 경로3에서 찾음:", turnoverData);
      }

      if (turnoverData) {
        setTurnoverData(turnoverData);
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: formatTurnoverTable(turnoverData),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: "회전율 데이터를 불러오지 못했습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
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
    if (tabType === "발주추천") {
      // 캐시 사용, 없으면 회전율과 동일 요청
      let dataToUse = turnoverData;
      if (!dataToUse) {
        const result = await sendChatbotRequest(
          "재고 회전율 조회",
          "발주 추천 데이터를 조회하고 있습니다..."
        );
        if (result?.data?.result?.body)
          dataToUse = parseTurnoverData(result.data.result.body);
        else if (result?.result?.body)
          dataToUse = parseTurnoverData(result.result.body);
        else if (result?.body) dataToUse = parseTurnoverData(result.body);
        if (dataToUse) setTurnoverData(dataToUse);
      }

      if (!dataToUse) {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: "발주 추천 데이터를 불러오지 못했습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        return;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: { type: "order_recommendation_table", data: dataToUse },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }
    if (tabType === "전체조회") {
      const result = await sendChatbotRequest(
        "발주 전체 조회",
        "발주 정보를 조회하고 있습니다..."
      );

      console.log("발주전체조회 - API 응답:", result);

      // 여러 가능한 데이터 경로 확인
      let orderData = null;

      if (
        result &&
        result.data &&
        result.data.result &&
        result.data.result.body
      ) {
        orderData = result.data.result.body;
        console.log("발주전체조회 - 경로1에서 찾음:", orderData);
      } else if (result && result.result && result.result.body) {
        orderData = result.result.body;
        console.log("발주전체조회 - 경로2에서 찾음:", orderData);
      } else if (result && result.body) {
        orderData = result.body;
        console.log("발주전체조회 - 경로3에서 찾음:", orderData);
      } else if (result && Array.isArray(result)) {
        orderData = result;
        console.log("발주전체조회 - 경로4에서 찾음:", orderData);
      }

      if (orderData) {
        const parsedOrders = parseOrderData(orderData);
        if (parsedOrders) {
          const botMessage = {
            id: Date.now() + 1,
            type: "bot",
            content: formatOrderTable(parsedOrders),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          const botMessage = {
            id: Date.now() + 1,
            type: "bot",
            content: "발주 데이터를 파싱할 수 없습니다.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } else {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: "발주 데이터를 불러오지 못했습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
      return;
    }

    // 발주 요청 화면 (상품명/현재재고/안전재고/수량/발주단가 + 총액)
    if (tabType === "발주요청") {
      // 재고 데이터 필요
      if (!inventoryData || inventoryData.length === 0) {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: "먼저 재고 전체 조회를 진행해주세요.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        return;
      }

      const formatted = inventoryData.map((i) => ({
        id: i.id,
        productName: i.productName,
        stockQuantity: i.stockQuantity,
        safetyStock: i.safetyStock,
        unitPrice: i.price,
      }));

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: { type: "order_request_table", data: formatted },
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

      // 다양한 경로에서 statistics 추출
      let stats = null;
      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;
      if (body?.statistics && Array.isArray(body.statistics))
        stats = body.statistics;

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          stats && stats.length
            ? { type: "sales_daily_table", data: stats }
            : "매출 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    if (tabType === "인건비율") {
      const result = await sendChatbotRequest(
        "인건비율 조회",
        "인건비율 정보를 조회하고 있습니다..."
      );

      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;
      const summary = body?.summary;

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: summary
          ? { type: "labor_cost_table", data: summary }
          : "인건비율 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    if (tabType === "인건비 분석") {
      const result = await sendChatbotRequest(
        "인건비 분석 조회",
        "인건비 분석 정보를 조회하고 있습니다..."
      );

      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;
      const summary = body?.summary;
      const hourlyDetails = body?.hourlyDetails;

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: summary
          ? {
              type: "labor_cost_analysis_table",
              data: { summary, hourlyDetails: hourlyDetails || [] },
            }
          : "인건비 분석 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    if (tabType === "상품별매출") {
      const result = await sendChatbotRequest(
        "상품별 매출 조회",
        "상품별 매출 정보를 조회하고 있습니다..."
      );

      // 다양한 경로에서 products 추출
      let products = null;
      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;
      if (body?.products && Array.isArray(body.products))
        products = body.products;

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          products && products.length
            ? { type: "sales_product_table", data: products }
            : "매출 데이터를 불러오지 못했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      return;
    }

    if (tabType === "매출분석") {
      const result = await sendChatbotRequest(
        "매출 분석 조회",
        "매출 분석 정보를 조회하고 있습니다..."
      );

      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;
      const summary = body?.summary;

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: summary
          ? { type: "sales_analysis_table", data: summary }
          : "매출 분석 데이터를 불러오지 못했습니다.",
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
          "안녕하세요!\nCare Up 챗봇 케이에요!\n\n카드 이용 관련 궁금한 점이 생기면,\n언제든지 케이에게 물어보세요.",
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

    // 근태 상세 직원 조회 입력 처리
    if (isComparing) {
      const result = await sendChatbotRequest(
        `근태 상세 조회 ${messageContent}`,
        "직원 근태 상세를 조회하고 있습니다..."
      );

      // 가능한 경로에서 데이터 추출
      let summary = null;
      let details = null;
      let body = null;
      if (result?.data?.result?.body) body = result.data.result.body;
      else if (result?.result?.body) body = result.result.body;
      else if (result?.body) body = result.body;

      if (body) {
        const att = body.attendance || body;
        // 요약과 상세 형태 유연 파싱
        if (att.summary) summary = att.summary;
        if (att.details && Array.isArray(att.details)) details = att.details;
        // 일부 응답은 employees[0]에 담길 수 있음
        if (!summary && Array.isArray(att.employees) && att.employees.length) {
          const emp0 = att.employees[0];
          summary = {
            employeeName: emp0.employeeName,
            workDays: emp0.summary?.workDays ?? 0,
            absentDays: emp0.summary?.absentDays ?? 0,
            leaveDays: emp0.summary?.leaveDays ?? 0,
            averageWorkMinutes: emp0.summary?.averageWorkMinutes ?? 0,
          };
          details = Array.isArray(emp0.details) ? emp0.details : [];
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          summary || (details && details.length)
            ? {
                type: "detail_table",
                summary: summary || {},
                details: details || [],
              }
            : "관련 정보가 존재하지 않습니다. 다른 이름으로 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsComparing(false);
      return;
    }

    // 일반 메시지 처리 - 사용자가 입력한 메시지를 그대로 전송
    if (messageContent.trim()) {
      const result = await sendChatbotRequest(
        messageContent,
        "정보를 조회하고 있습니다..."
      );

      let botContent = "";

      if (result.error) {
        botContent = `오류가 발생했습니다: ${result.error}`;
      } else {
        // API 응답을 그대로 표시
        botContent =
          result?.data?.result?.body ||
          result?.result?.body ||
          JSON.stringify(result, null, 2);
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
              <div className="chatbot-name">케이</div>
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
                  (message.content.type === "order_request_table" ||
                    message.content.type === "attendance_table" ||
                    message.content.type === "today_attendance_table" ||
                    message.content.type === "detail_table" ||
                    message.content.type === "attendance_edit" ||
                    message.content.type === "inventory_table" ||
                    message.content.type === "inventory_edit" ||
                    message.content.type === "order_table" ||
                    message.content.type === "turnover_table" ||
                    message.content.type === "order_recommendation_table" ||
                    message.content.type === "sales_daily_table" ||
                    message.content.type === "sales_product_table" ||
                    message.content.type === "labor_cost_table" ||
                    message.content.type === "labor_cost_analysis_table" ||
                    message.content.type === "sales_analysis_table") ? (
                    <div className="attendance-table-container">
                      <div className="attendance-title">
                        {message.content.type === "today_attendance_table"
                          ? "📅 금일 근무 현황"
                          : message.content.type === "order_table"
                            ? "📋 발주 현황"
                            : message.content.type === "turnover_table"
                              ? "📊 재고 회전율"
                              : message.content.type ===
                                  "order_recommendation_table"
                                ? "🛒 발주 추천"
                                : message.content.type === "sales_daily_table"
                                  ? "💰 일일 매출"
                                  : message.content.type ===
                                      "sales_product_table"
                                    ? "🛍️ 상품별 매출"
                                    : message.content.type ===
                                        "labor_cost_table"
                                      ? "👥 인건비율"
                                      : message.content.type ===
                                          "labor_cost_analysis_table"
                                        ? "📈 인건비 분석"
                                        : message.content.type ===
                                            "sales_analysis_table"
                                          ? "📋 매출 분석"
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
                                  수량
                                </div>
                                <div className="inventory-edit-cell header">
                                  사유
                                </div>
                              </div>
                              {message.content.data.map((item, index) => (
                                <div key={index} className="inventory-edit-row">
                                  <div className="inventory-edit-cell product-name">
                                    {item.productName}
                                  </div>
                                  <div className="inventory-edit-cell quantity-control">
                                    <div className="quantity-control-wrapper">
                                      <input
                                        type="number"
                                        value={orderQuantities[item.id] || 0}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (value === "" || value === "-") {
                                            updateOrderQuantity(item.id, 0);
                                          } else {
                                            const numValue = parseInt(value);
                                            updateOrderQuantity(
                                              item.id,
                                              isNaN(numValue) ? 0 : numValue
                                            );
                                          }
                                        }}
                                        className="quantity-input"
                                        min="-999"
                                        max="999"
                                      />
                                      <div className="quantity-arrows">
                                        <button
                                          className="quantity-arrow-btn increase-btn"
                                          onClick={() =>
                                            incrementQuantity(item.id)
                                          }
                                          type="button"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          className="quantity-arrow-btn decrease-btn"
                                          onClick={() =>
                                            decrementQuantity(item.id)
                                          }
                                          type="button"
                                        >
                                          ▼
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="inventory-edit-cell reason-select">
                                    <select
                                      value={inventoryReasons[item.id] || ""}
                                      onChange={(e) =>
                                        updateInventoryReason(
                                          item.id,
                                          e.target.value
                                        )
                                      }
                                      className="reason-select-box"
                                    >
                                      <option value="">사유</option>
                                      <option value="입고">입고</option>
                                      <option value="판매">판매</option>
                                      <option value="주문취소">주문취소</option>
                                      <option value="환불">환불</option>
                                      <option value="폐기">폐기</option>
                                      <option value="상품불량">상품불량</option>
                                    </select>
                                  </div>
                                </div>
                              ))}
                              <div className="order-summary">
                                <button
                                  className="order-request-btn"
                                  onClick={handleOrderRequest}
                                >
                                  재고 수정
                                </button>
                              </div>
                            </div>
                          </>
                        ) : message.content.type === "order_table" ? (
                          // ✅ 발주 현황 테이블 (발주번호 / 발주단가 / 발주 상태)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                발주번호
                              </div>
                              <div className="attendance-cell header">
                                지점명
                              </div>
                              <div className="attendance-cell header">
                                상품수
                              </div>
                              <div className="attendance-cell header">
                                총금액
                              </div>
                              <div className="attendance-cell header">상태</div>
                            </div>
                            {message.content.data.map((order, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">
                                  #{order.purchaseOrderId}
                                </div>
                                <div className="attendance-cell">
                                  {order.branchName}
                                </div>
                                <div className="attendance-cell">
                                  {order.productCount}개
                                </div>
                                <div className="attendance-cell">
                                  {order.totalPrice}원
                                </div>
                                <div className="attendance-cell">
                                  <span
                                    className={`status-badge status-${order.status.toLowerCase()}`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "attendance_edit" ? (
                          // ✅ 근태 수정 UI
                          <>
                            <div className="attendance-title">✏️ 근태 수정</div>
                            <div className="attendance-edit-form">
                              <div className="form-row">
                                <label>직원</label>
                                <select
                                  value={attendanceEditSelection.employeeId}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "employeeId",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">선택하세요</option>
                                  {(message.content.data.employees || []).map(
                                    (e) => (
                                      <option
                                        key={e.employeeId}
                                        value={e.employeeId}
                                      >
                                        {e.employeeName}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                              <div className="form-row">
                                <label>스케줄</label>
                                <select
                                  value={attendanceEditSelection.id}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "scheduleId",
                                      e.target.value
                                    )
                                  }
                                  disabled={!attendanceEditSelection.employeeId}
                                >
                                  <option value="">선택하세요</option>
                                  {getScheduleOptions().map((s) => (
                                    <option
                                      key={s.scheduleId}
                                      value={s.scheduleId}
                                    >
                                      {s.date}{" "}
                                      {s.templateName || s.workTypeName || ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-row">
                                <label>등록 날짜</label>
                                <input
                                  type="date"
                                  value={attendanceEditSelection.date}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "date",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="form-row">
                                <label>스케줄 템플릿</label>
                                <select
                                  value={attendanceEditSelection.templateId}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "templateId",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    !!attendanceEditSelection.leaveTypeId
                                  }
                                >
                                  <option value="">선택 안함</option>
                                  {(
                                    message.content.data.meta.templates || []
                                  ).map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {attendanceEditSelection.templateId && (
                                <div className="form-row">
                                  <label>기본 출퇴근시간</label>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 6,
                                    }}
                                  >
                                    {(() => {
                                      const tmpl = (
                                        message.content.data.meta.templates ||
                                        []
                                      ).find(
                                        (t) =>
                                          String(t.id) ===
                                          String(
                                            attendanceEditSelection.templateId
                                          )
                                      );
                                      const clockIn =
                                        tmpl?.defaultClockIn || "-";
                                      const clockOut =
                                        tmpl?.defaultClockOut || "-";
                                      return (
                                        <>
                                          <input
                                            type="text"
                                            value={`출근 ${clockIn}`}
                                            readOnly
                                          />
                                          <input
                                            type="text"
                                            value={`퇴근 ${clockOut}`}
                                            readOnly
                                          />
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                              <div className="form-row">
                                <label>워크 타입</label>
                                <select
                                  value={attendanceEditSelection.workTypeId}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "workTypeId",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    !!attendanceEditSelection.leaveTypeId
                                  }
                                >
                                  <option value="">선택 안함</option>
                                  {(
                                    message.content.data.meta.workTypes || []
                                  ).map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-row">
                                <label>휴가 타입</label>
                                <select
                                  value={attendanceEditSelection.leaveTypeId}
                                  onChange={(e) =>
                                    handleAttendanceEditChange(
                                      "leaveTypeId",
                                      e.target.value
                                    )
                                  }
                                  disabled={
                                    !!attendanceEditSelection.templateId ||
                                    !!attendanceEditSelection.workTypeId
                                  }
                                >
                                  <option value="">선택 안함</option>
                                  {(
                                    message.content.data.meta.leaveTypes || []
                                  ).map((l) => (
                                    <option key={l.id} value={l.id}>
                                      {l.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-row">
                                <button
                                  className="order-request-btn"
                                  onClick={submitAttendanceEdit}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </>
                        ) : message.content.type === "turnover_table" ? (
                          // ✅ 회전율 테이블 (avgWeeklySales 표시, 권장발주/버튼 제거)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                상품명
                              </div>
                              <div className="attendance-cell header">
                                현재재고
                              </div>
                              <div className="attendance-cell header">
                                평균주간판매량
                              </div>
                              <div className="attendance-cell header">
                                회전율
                              </div>
                              <div className="attendance-cell header">상태</div>
                            </div>
                            {message.content.data.products.map(
                              (product, index) => (
                                <div key={index} className="attendance-row">
                                  <div className="attendance-cell">
                                    {product.productName}
                                  </div>
                                  <div className="attendance-cell">
                                    {product.currentStock}
                                  </div>
                                  <div className="attendance-cell">
                                    {product.avgWeeklySales ?? "-"}
                                  </div>
                                  <div className="attendance-cell">
                                    {product.turnoverRate}%
                                  </div>
                                  <div className="attendance-cell">
                                    <span
                                      className={`status-badge status-${String(product.status || "").toLowerCase()}`}
                                    >
                                      {product.turnoverStatus || "-"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                            {message.content?.data?.summary
                              ?.turnoverMessage && (
                              <div className="summary-note">
                                {message.content.data.summary.turnoverMessage}
                              </div>
                            )}
                          </>
                        ) : message.content.type === "order_request_table" ? (
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                상품명
                              </div>
                              <div className="attendance-cell header">
                                현재재고
                              </div>
                              <div className="attendance-cell header">
                                안전재고
                              </div>
                              <div className="attendance-cell header">수량</div>
                              <div className="attendance-cell header">
                                발주단가
                              </div>
                            </div>
                            {message.content.data.map((item, index) => (
                              <div key={index} className="attendance-row">
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
                                  <div className="quantity-control">
                                    <div className="quantity-control-wrapper">
                                      <input
                                        type="number"
                                        value={orderQuantities[item.id] || 0}
                                        onChange={(e) => {
                                          const v = parseInt(e.target.value);
                                          updateOrderQuantity(
                                            item.id,
                                            isNaN(v) ? 0 : v
                                          );
                                        }}
                                        className="quantity-input"
                                        min="0"
                                        max="9999"
                                      />
                                      <div className="quantity-arrows">
                                        <button
                                          className="quantity-arrow-btn increase-btn"
                                          onClick={() =>
                                            incrementQuantity(item.id)
                                          }
                                          type="button"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          className="quantity-arrow-btn decrease-btn"
                                          onClick={() =>
                                            decrementQuantity(item.id)
                                          }
                                          type="button"
                                        >
                                          ▼
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="attendance-cell">
                                  {Number(item.unitPrice || 0).toLocaleString()}
                                  원
                                </div>
                              </div>
                            ))}
                            {(() => {
                              const total = calculateManualOrderTotalPrice(
                                message.content.data
                              );
                              const anyPositiveUnit = (
                                message.content.data || []
                              ).some((i) => Number(i.unitPrice || 0) > 0);
                              return (
                                <div className="order-summary">
                                  <div className="total-price">
                                    총 발주단가:{" "}
                                    <span className="price-amount">
                                      {total.toLocaleString()}원
                                    </span>
                                  </div>
                                  <button
                                    className="order-request-btn"
                                    disabled={!anyPositiveUnit || total <= 0}
                                    onClick={() =>
                                      setShowManualOrderConfirm(true)
                                    }
                                  >
                                    발주 요청하기
                                  </button>
                                </div>
                              );
                            })()}
                          </>
                        ) : message.content.type ===
                          "order_recommendation_table" ? (
                          // ✅ 발주 추천 테이블 (권장발주 기반, 총 발주단가 및 확인)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                상품명
                              </div>
                              <div className="attendance-cell header">
                                현재재고
                              </div>
                              <div className="attendance-cell header">
                                권장발주량
                              </div>
                              <div className="attendance-cell header">
                                발주단가
                              </div>
                              <div className="attendance-cell header">상태</div>
                            </div>
                            {message.content.data.products.map(
                              (product, index) => (
                                <div key={index} className="attendance-row">
                                  <div className="attendance-cell">
                                    {product.productName}
                                  </div>
                                  <div className="attendance-cell">
                                    {product.currentStock}
                                  </div>
                                  <div className="attendance-cell">
                                    {product.recommendedOrderQuantity || 0}
                                  </div>
                                  <div className="attendance-cell">
                                    {(
                                      Number(product.supplyPrice) || 0
                                    ).toLocaleString()}
                                    원
                                  </div>
                                  <div className="attendance-cell">
                                    <span
                                      className={`status-badge order-status-${String(product.orderStatus || "").toLowerCase()}`}
                                    >
                                      {product.orderStatus || "-"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                            {message.content?.data?.summary?.orderMessage && (
                              <div className="summary-note">
                                {message.content.data.summary.orderMessage}
                              </div>
                            )}
                            {calculateOrderRecommendTotalPrice(
                              message.content.data
                            ) > 0 && (
                              <div className="order-summary">
                                <div className="total-price">
                                  총 발주단가:{" "}
                                  <span className="price-amount">
                                    {calculateOrderRecommendTotalPrice(
                                      message.content.data
                                    ).toLocaleString()}
                                    원
                                  </span>
                                </div>
                                <button
                                  className="order-request-btn"
                                  onClick={() =>
                                    setShowOrderRecommendConfirm(true)
                                  }
                                >
                                  발주하시겠습니까?
                                </button>
                              </div>
                            )}
                          </>
                        ) : message.content.type === "sales_daily_table" ? (
                          // ✅ 일일 매출 테이블 (시간/평균 주문금액/총 주문수/총 주문금액)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">시간</div>
                              <div className="attendance-cell header">
                                평균 주문금액
                              </div>
                              <div className="attendance-cell header">
                                총 주문수
                              </div>
                              <div className="attendance-cell header">
                                총 주문금액
                              </div>
                            </div>
                            {(message.content.data || []).map((row, idx) => (
                              <div key={idx} className="attendance-row">
                                <div className="attendance-cell">
                                  {row.hour ?? "-"}
                                </div>
                                <div className="attendance-cell">
                                  {Number(
                                    row.averageOrderAmount || 0
                                  ).toLocaleString()}
                                  원
                                </div>
                                <div className="attendance-cell">
                                  {row.totalOrders ?? 0}건
                                </div>
                                <div className="attendance-cell">
                                  {Number(row.totalSales || 0).toLocaleString()}
                                  원
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "sales_product_table" ? (
                          // ✅ 상품별 매출 테이블 (상품명/판매수량/판매금액/공급가/마진율)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                상품명
                              </div>
                              <div className="attendance-cell header">
                                판매수량
                              </div>
                              <div className="attendance-cell header">
                                판매금액
                              </div>
                              <div className="attendance-cell header">
                                공급가
                              </div>
                              <div className="attendance-cell header">
                                마진율
                              </div>
                            </div>
                            {(message.content.data || []).map((p, idx) => (
                              <div key={idx} className="attendance-row">
                                <div className="attendance-cell">
                                  {p.productName}
                                </div>
                                <div className="attendance-cell">
                                  {Number(
                                    p.totalQuantity || 0
                                  ).toLocaleString()}
                                </div>
                                <div className="attendance-cell">
                                  {Number(p.totalSales || 0).toLocaleString()}원
                                </div>
                                <div className="attendance-cell">
                                  {Number(p.supplyPrice || 0).toLocaleString()}
                                  원
                                </div>
                                <div className="attendance-cell">
                                  {typeof p.marginRate === "number"
                                    ? `${p.marginRate.toFixed(1)}%`
                                    : `${Number(p.marginRate || 0).toFixed(1)}%`}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : message.content.type === "labor_cost_table" ? (
                          // ✅ 인건비율 (시간 : 인건비율 / 평균 인건비율 / 메시지)
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">시간</div>
                              <div className="attendance-cell header">
                                인건비율
                              </div>
                            </div>
                            <div className="attendance-row">
                              <div className="attendance-cell">
                                최고{" "}
                                {message.content.data.summary.highestCostHour ?? "-"}시
                              </div>
                              <div className="attendance-cell">
                                {Number(
                                  message.content.data.summary.highestCostRatio || 0
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                            <div className="attendance-row">
                              <div className="attendance-cell">
                                최저{" "}
                                {message.content.data.summary.lowestCostHour ?? "-"}시
                              </div>
                              <div className="attendance-cell">
                                {Number(
                                  message.content.data.summary.lowestCostRatio || 0
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                            <div
                              className="summary-note"
                              style={{ marginTop: 10 }}
                            >
                              평균 인건비율:{" "}
                              {Number(
                                message.content.data.summary.avgCostRatioChange || 0
                              ).toFixed(1)}
                              %
                            </div>
                            {message.content.data.summary.message && (
                              <div
                                className="summary-note"
                                style={{ marginTop: 6 }}
                              >
                                {message.content.data.summary.message}
                              </div>
                            )}
                          </>
                        ) : message.content.type ===
                          "labor_cost_analysis_table" ? (
                          // ✅ 인건비 분석 (시간대별 테이블 + 요약 + 메시지)
                          <>
                            {/* 시간대별 인건비 테이블 */}
                            {message.content.data.hourlyDetails &&
                            message.content.data.hourlyDetails.length > 0 ? (
                              <>
                                <div className="attendance-header">
                                  <div className="attendance-cell header">
                                    시간대
                                  </div>
                                  <div className="attendance-cell header">
                                    평균 매출
                                  </div>
                                  <div className="attendance-cell header">
                                    평균 인건비
                                  </div>
                                  <div className="attendance-cell header">
                                    평균 인건비율
                                  </div>
                                </div>
                                {message.content.data.hourlyDetails.map(
                                  (detail, idx) => {
                                    const periodLabel =
                                      detail.period === "morning"
                                        ? "오전"
                                        : detail.period === "lunch"
                                          ? "점심"
                                          : detail.period === "evening"
                                            ? "저녁"
                                            : (detail.period ?? "-");
                                    return (
                                      <div key={idx} className="attendance-row">
                                        <div className="attendance-cell">
                                          {periodLabel}
                                        </div>
                                        <div className="attendance-cell">
                                          {Number(
                                            detail.avgSales || 0
                                          ).toLocaleString()}
                                          원
                                        </div>
                                        <div className="attendance-cell">
                                          {Number(
                                            detail.avgLaborCost || 0
                                          ).toLocaleString()}
                                          원
                                        </div>
                                        <div className="attendance-cell">
                                          {Number(detail.avgRatio || 0).toFixed(
                                            1
                                          )}
                                          %
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </>
                            ) : null}
                            {/* 요약 정보 */}
                            <div
                              className="summary-note"
                              style={{ marginTop: 10 }}
                            >
                              <div>
                                가장 높은 인건비율 시간대:{" "}
                                {message.content.data.summary.highestCostHour ??
                                  "-"}
                                시 (
                                {Number(
                                  message.content.data.summary
                                    .highestCostRatio || 0
                                ).toFixed(1)}
                                %)
                              </div>
                              <div style={{ marginTop: 6 }}>
                                가장 낮은 인건비율 시간대:{" "}
                                {message.content.data.summary.lowestCostHour ??
                                  "-"}
                                시 (
                                {Number(
                                  message.content.data.summary
                                    .lowestCostRatio || 0
                                ).toFixed(1)}
                                %)
                              </div>
                            </div>
                            {/* 메시지 */}
                            {message.content.data.summary.message && (
                              <div
                                className="summary-note"
                                style={{ marginTop: 6 }}
                              >
                                {message.content.data.summary.message}
                              </div>
                            )}
                          </>
                        ) : message.content.type === "sales_analysis_table" ? (
                          // ✅ 매출 분석 (요약 정보 표시)
                          <>
                            <div
                              className="summary-note"
                              style={{ marginTop: 0 }}
                            >
                              <div style={{ marginBottom: 8 }}>
                                <strong>주요 시간대:</strong>{" "}
                                {Array.isArray(message.content.data.topHours)
                                  ? message.content.data.topHours.join(", ")
                                  : (message.content.data.topHours ?? "-")}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>주간 변화:</strong>{" "}
                                {message.content.data.weekChange ?? "-"}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>월간 변화:</strong>{" "}
                                {message.content.data.monthChange ?? "-"}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>최고 마진 상품:</strong>{" "}
                                {message.content.data.topMarginProduct ?? "-"}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>최저 마진 상품:</strong>{" "}
                                {message.content.data.lowMarginProduct ?? "-"}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>평균 인건비율:</strong>{" "}
                                {message.content.data.avgLaborRatio ?? "-"}
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <strong>다음 주 예측:</strong>{" "}
                                {message.content.data.nextWeekForecast ===
                                "increase"
                                  ? "증가 예상"
                                  : message.content.data.nextWeekForecast ===
                                      "decrease"
                                    ? "감소 예상"
                                    : (message.content.data.nextWeekForecast ??
                                      "-")}
                              </div>
                              {message.content.data.message && (
                                <div
                                  style={{
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTop: "1px solid #e0e0e0",
                                  }}
                                >
                                  {message.content.data.message}
                                </div>
                              )}
                            </div>
                          </>
                        ) : message.content.type === "order_table" ? (
                          // ✅ 발주 현황 테이블
                          <>
                            <div className="attendance-header">
                              <div className="attendance-cell header">
                                발주번호
                              </div>
                              <div className="attendance-cell header">
                                지점명
                              </div>
                              <div className="attendance-cell header">
                                상품수
                              </div>
                              <div className="attendance-cell header">
                                총금액
                              </div>
                              <div className="attendance-cell header">상태</div>
                              <div className="attendance-cell header">
                                생성일
                              </div>
                              <div className="attendance-cell header">
                                수정일
                              </div>
                            </div>
                            {message.content.data.map((order, index) => (
                              <div key={index} className="attendance-row">
                                <div className="attendance-cell">
                                  #{order.purchaseOrderId}
                                </div>
                                <div className="attendance-cell">
                                  {order.branchName}
                                </div>
                                <div className="attendance-cell">
                                  {order.productCount}개
                                </div>
                                <div className="attendance-cell">
                                  {order.totalPrice}원
                                </div>
                                <div className="attendance-cell">
                                  <span
                                    className={`status-badge status-${order.status.toLowerCase()}`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                                <div className="attendance-cell">
                                  {order.createdAt}
                                </div>
                                <div className="attendance-cell">
                                  {order.updatedAt}
                                </div>
                              </div>
                            ))}
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
              <div className="reset-modal-title">재고 수정</div>
              <div className="reset-modal-message">
                재고를 수정하시겠습니까?
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

        {/* 발주 추천 확인 모달 */}
        {showOrderRecommendConfirm && (
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-title">발주 요청</div>
              <div className="reset-modal-message">발주하시겠습니까?</div>
              <div className="reset-modal-buttons">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setShowOrderRecommendConfirm(false)}
                >
                  아니오
                </button>
                <button
                  className="reset-confirm-btn"
                  onClick={confirmTurnoverOrderRequest}
                >
                  예
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 수동 발주 확인 모달 */}
        {showManualOrderConfirm && (
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-title">발주 요청</div>
              <div className="reset-modal-message">발주하시겠습니까?</div>
              <div className="reset-modal-buttons">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setShowManualOrderConfirm(false)}
                >
                  아니오
                </button>
                <button
                  className="reset-confirm-btn"
                  onClick={confirmManualOrderRequest}
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
