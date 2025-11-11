import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";
import "./TurnoverTable.css";
import axios from "axios";
import AttendanceTab from "./tabs/AttendanceTab";
import InventoryTab from "./tabs/InventoryTab";
import OrderTab from "./tabs/OrderTab";
import SalesTab from "./tabs/SalesTab";
import DocumentTab from "./tabs/DocumentTab";
import DocumentList from "./tabs/DocumentList";
import DocumentUploadModal from "../branchManagement/DocumentUploadModal";
import { tokenStorage, authService } from "../../service/authService";
import { documentService, DOCUMENT_TYPES } from "../../service/documentService";
import { purchaseOrderService } from "../../service/purchaseOrderService";

const ChatBot = ({ onClose }) => {
  // localStorage에서 챗봇 메시지 불러오기
  const getInitialMessages = () => {
    try {
      const savedMessages = localStorage.getItem('chatbot_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // timestamp를 Date 객체로 변환
        return parsed.map(msg => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }
    } catch (error) {
      console.error('챗봇 메시지 불러오기 실패:', error);
    }
    // 기본 메시지
    return [
      {
        id: 1,
        type: "bot",
        content:
          "안녕하세요!\n케어업 챗봇 케이에요!\n\n이용 관련 궁금한 점이 생기면,\n언제든지 케이에게 물어보세요.",
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState(getInitialMessages);
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
  const [showAttendanceEditConfirm, setShowAttendanceEditConfirm] = useState(false);
  const [previousTab, setPreviousTab] = useState(null);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocumentQueryModal, setShowDocumentQueryModal] = useState(false);
  const [selectedDocumentForQuery, setSelectedDocumentForQuery] = useState(null);
  const [documentQueryText, setDocumentQueryText] = useState("");

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

  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      // timestamp를 문자열로 변환하여 저장
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      localStorage.setItem('chatbot_messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('챗봇 메시지 저장 실패:', error);
    }
  }, [messages]);

  // branchId 가져오기
  const getBranchId = () => {
    const userInfo = tokenStorage.getUserInfo();
    return userInfo?.branchId || null;
  };

  // 문서 목록 가져오기
  const fetchDocuments = async () => {
    const branchId = getBranchId();
    if (!branchId) {
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "지점 정보를 찾을 수 없습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage("문서 목록을 불러오고 있습니다...");
      const response = await documentService.getDocumentsList(branchId, 0, 100);
      
      if (response && response.data) {
        // 근태 제목 필터링 (상태에도 필터링된 문서만 저장)
        const filteredDocs = response.data.filter((doc) => {
          if (!doc.title) return true;
          const title = doc.title.trim().toLowerCase();
          // "근태"가 포함된 모든 경우 필터링
          const hasAttendance = /근태/.test(title);
          return !hasAttendance;
        });
        
        setDocuments(filteredDocs);
        
        // 문서 목록을 메시지로 표시
        
        const documentListContent = {
          type: "document_list",
          data: filteredDocs.map(doc => ({
            id: doc.id,
            employeeId: doc.employeeId,
            title: doc.title || "제목 없음",
            documentType: DOCUMENT_TYPES[doc.documentType] || doc.documentType,
            description: doc.description,
            uploadedAt: doc.uploadedAt || doc.createdAt,
            expiryDate: doc.expiryDate || doc.expirationDate
          }))
        };
        
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: documentListContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        setDocuments([]);
        const botMessage = {
          id: Date.now(),
          type: "bot",
          content: "등록된 문서가 없습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("문서 목록 조회 실패:", error);
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "문서 목록을 불러오는데 실패했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 질의 전송
  const handleDocumentQuery = async () => {
    if (!selectedDocumentForQuery) {
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "문서를 선택해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    if (!documentQueryText.trim()) {
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "질의 내용을 입력해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: documentQueryText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsLoading(true);
      setLoadingMessage("문서 질의를 처리하고 있습니다...");
      
      const queryMessage = `문서 : ${selectedDocumentForQuery.id} 번, 질의내용 : ${documentQueryText}`;
      console.log("문서 질의 - selectedDocumentForQuery:", selectedDocumentForQuery);
      console.log("문서 질의 - documentId:", selectedDocumentForQuery.id);
      const result = await sendChatbotRequest(
        queryMessage, 
        "문서 질의를 처리하고 있습니다...",
        selectedDocumentForQuery.id // documentId 전달
      );

      const body =
        result?.data?.result?.body || result?.result?.body || result?.body;

      // 문서 질의 응답을 특별한 타입으로 표시
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: {
          type: "document_query_response",
          data: {
            documentTitle: selectedDocumentForQuery.title,
            documentType: DOCUMENT_TYPES[selectedDocumentForQuery.documentType] || selectedDocumentForQuery.documentType,
            query: documentQueryText,
            response: body || "질의에 대한 답변을 받지 못했습니다."
          }
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("문서 질의 실패:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "문서 질의 처리에 실패했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShowDocumentQueryModal(false);
      setSelectedDocumentForQuery(null);
      setDocumentQueryText("");
    }
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
    // 재고 수정 요청: branchProductId 사용
    const orderItems = inventoryData
      .filter((item) => (orderQuantities[item.id] || 0) !== 0)
      .map((item) => ({
        branchProductId: item.branchProductId || item.id, // 재고 수정은 branchProductId 사용
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
      const body =
        invResult?.data?.result?.body ||
        invResult?.result?.body ||
        invResult?.body;
      
      let stocks = [];
      
      // products 배열 확인 (STOCK intent)
      if (body?.products && Array.isArray(body.products)) {
        stocks = body.products;
      } else if (Array.isArray(body)) {
        stocks = body;
      } else if (body?.stocks && Array.isArray(body.stocks)) {
        stocks = body.stocks;
      } else if (body?.branchProductId) {
        stocks = [body];
      }
      
      if (stocks.length > 0) {
        const processedData = stocks.map((item) => {
          console.log("재고 조회 (confirmOrderRequest) - 원본 item:", item, "productId:", item.productId);
          return {
            id: item.branchProductId || item.id, // 재고 수정용 (branchProductId)
            branchProductId: item.branchProductId || item.id, // 명시적으로 저장
            productId: item.productId, // 발주 요청용
            productName: item.productName || item.name,
            stockQuantity: item.stockQuantity || item.stock || 0,
            safetyStock: item.safetyStock || 0,
            price: item.price || 0,
          };
        });
        console.log("재고 조회 (confirmOrderRequest) - productId 확인:", processedData.map(d => ({ id: d.id, productId: d.productId })));
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

    try {
      setIsLoading(true);
      setLoadingMessage("발주 요청을 처리하고 있습니다...");

      const orderItems = turnoverData.products
        .filter((product) => product.recommendedOrderQuantity > 0)
        .map((product) => ({
          productId: product.productId,
          quantity: product.recommendedOrderQuantity,
          supplyPrice: product.supplyPrice || product.price || 0,
          attributeValueId: null,
        }));

      if (orderItems.length === 0) {
        setShowTurnoverOrderConfirm(false);
        return;
      }

      // branchId 가져오기
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || getBranchId();

      // 발주 요청 데이터 구성
      const purchaseOrderData = {
        branchId: branchId,
        orderDetails: orderItems.map(item => ({
          productId: parseInt(item.productId) || 0,
          quantity: parseInt(item.quantity) || 0,
          supplyPrice: parseInt(item.supplyPrice) || 0,
          attributeValueId: item.attributeValueId || null,
        })),
      };

      console.log("회전율 발주 요청 - purchaseOrderData:", purchaseOrderData);
      console.log("회전율 발주 요청 - productId 확인:", purchaseOrderData.orderDetails.map(d => ({ productId: d.productId, quantity: d.quantity })));

      // 발주 API 직접 호출
      const response = await purchaseOrderService.createPurchaseOrder(purchaseOrderData);
      console.log("회전율 발주 요청 - 응답:", response);

      // 성공 메시지
      const botMessage = {
        id: Date.now(),
        type: "bot",
        content: "발주 요청이 완료되었습니다",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setShowTurnoverOrderConfirm(false);
      setActiveTab(null); // 발주 요청 탭 닫기

      // 발주 현황 재조회
      const ordRes = await sendChatbotRequest(
        "발주 전체 조회",
        "발주 정보를 새로고침하고 있습니다..."
      );
      console.log("발주 재조회 - 응답:", ordRes);
      
      let orderListData = null;
      if (ordRes?.data?.result?.body) orderListData = ordRes.data.result.body;
      else if (ordRes?.result?.body) orderListData = ordRes.result.body;
      else if (ordRes?.body) orderListData = ordRes.body;
      
      // purchaseList가 있는 경우 추출
      if (orderListData?.purchaseList && Array.isArray(orderListData.purchaseList)) {
        orderListData = orderListData.purchaseList;
      }
      
      console.log("발주 재조회 - 처리된 데이터:", orderListData);
      
      if (orderListData && Array.isArray(orderListData) && orderListData.length > 0) {
        const parsed = parseOrderData(orderListData);
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
    } catch (error) {
      console.error("회전율 발주 요청 실패:", error);
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "발주 요청에 실패하였습니다 본사에 문의하여 주십시오",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 수동 발주 확인 처리
  const confirmManualOrderRequest = async () => {
    if (!inventoryData || inventoryData.length === 0) {
      setShowManualOrderConfirm(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage("발주 요청을 처리하고 있습니다...");

      // 발주 요청: productId 사용
      console.log("발주 요청 - inventoryData:", inventoryData);
      const orderItems = inventoryData
        .filter((i) => (orderQuantities[i.id] || 0) > 0)
        .map((i) => {
          console.log("발주 요청 - item:", i, "productId:", i.productId);
          return {
            productId: i.productId, // 발주는 productId 사용
            quantity: Number(orderQuantities[i.id] || 0),
            supplyPrice: i.price || 0, // 발주 단가
            attributeValueId: null, // 속성 값 ID (필요시 추가)
          };
        });

      console.log("발주 요청 - orderItems:", orderItems);

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

      // branchId 가져오기
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || getBranchId();

      // 발주 요청 데이터 구성
      const purchaseOrderData = {
        branchId: branchId,
        orderDetails: orderItems.map(item => ({
          productId: parseInt(item.productId) || 0,
          quantity: parseInt(item.quantity) || 0,
          supplyPrice: parseInt(item.supplyPrice) || 0,
          attributeValueId: item.attributeValueId || null,
        })),
      };

      console.log("발주 요청 - purchaseOrderData:", purchaseOrderData);
      console.log("발주 요청 - productId 확인:", purchaseOrderData.orderDetails.map(d => ({ productId: d.productId, quantity: d.quantity })));

      // 발주 API 직접 호출
      const response = await purchaseOrderService.createPurchaseOrder(purchaseOrderData);
      console.log("발주 요청 - 응답:", response);

      // 성공 메시지
      const botMessage = {
        id: Date.now(),
        type: "bot",
        content: "발주 요청이 완료되었습니다",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setShowManualOrderConfirm(false);
      setActiveTab(null); // 발주 요청 탭 닫기
      
      // 발주 수량 초기화
      setOrderQuantities({});

      // 발주 현황 재조회
      const ordRes2 = await sendChatbotRequest(
        "발주 전체 조회",
        "발주 정보를 새로고침하고 있습니다..."
      );
      console.log("발주 재조회 - 응답:", ordRes2);
      
      let orderData2 = null;
      if (ordRes2?.data?.result?.body) orderData2 = ordRes2.data.result.body;
      else if (ordRes2?.result?.body) orderData2 = ordRes2.result.body;
      else if (ordRes2?.body) orderData2 = ordRes2.body;
      
      // purchaseList가 있는 경우 추출
      if (orderData2?.purchaseList && Array.isArray(orderData2.purchaseList)) {
        orderData2 = orderData2.purchaseList;
      }
      
      console.log("발주 재조회 - 처리된 데이터:", orderData2);
      
      if (orderData2 && Array.isArray(orderData2) && orderData2.length > 0) {
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
    } catch (error) {
      console.error("발주 요청 실패:", error);
      const errorMessage = {
        id: Date.now(),
        type: "bot",
        content: "발주 요청에 실패하였습니다 본사에 문의하여 주십시오",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      return details
        .map((d, idx) => ({
          scheduleId: d.scheduleId ?? `detail-${idx}`,
          date: d.date,
          templateName: d.templateName,
          workTypeName: d.workType,
        }))
        .sort((a, b) => {
          const dateA = a.date || "";
          const dateB = b.date || "";
          return dateA.localeCompare(dateB);
        });
    }
    const schedules = emp.schedules || emp.nextSchedules || [];
    if (Array.isArray(schedules)) {
      return schedules.sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        return dateA.localeCompare(dateB);
      });
    }
    return [];
  };

  const handleAttendanceEditClick = () => {
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

    // 확인 모달 표시
    setShowAttendanceEditConfirm(true);
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

    const payload = {
      employeeId: Number(employeeId),
      scheduleId: isNaN(Number(scheduleId)) ? null : Number(scheduleId),
      date,
      templateId: templateId ? Number(templateId) : null,
      workTypeId: workTypeId ? Number(workTypeId) : null,
      leaveTypeId: leaveTypeId ? Number(leaveTypeId) : null,
    };

    setShowAttendanceEditConfirm(false);
    
    // 스크롤을 맨 아래로
    setTimeout(() => {
      scrollToBottom();
    }, 100);

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

    // 스크롤을 맨 아래로
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    if (ok) {
      // 직원 이름 찾기
      const selectedEmployee = attendanceEmployees?.find(
        (e) => String(e.employeeId) === String(employeeId)
      );
      const employeeName = selectedEmployee?.employeeName || "";

      setIsAttendanceEditMode(false);
      setAttendanceEditSelection({
        employeeId: "",
        scheduleId: "",
        date: "",
        templateId: "",
        workTypeId: "",
        leaveTypeId: "",
      });

      // 해당 직원 이름으로 상세 조회 요청
      if (employeeName) {
        setIsComparing(true);
        const detailResult = await sendChatbotRequest(
          `근태 상세 조회 ${employeeName}`,
          "직원 근태 상세를 조회하고 있습니다..."
        );

        // 가능한 경로에서 데이터 추출
        let summary = null;
        let details = null;
        let body = null;
        if (detailResult?.data?.result?.body) body = detailResult.data.result.body;
        else if (detailResult?.result?.body) body = detailResult.result.body;
        else if (detailResult?.body) body = detailResult.body;

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
        
        // 스크롤을 맨 아래로
        setTimeout(() => {
          scrollToBottom();
        }, 100);
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
      let date = "";

      // 날짜 추출 (plannedClockIn, actualClockIn, 또는 date 필드에서)
      // 년도 제거하고 MM-DD 형식으로 변환
      const formatDateString = (dateValue) => {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${month}-${day}`;
      };

      if (clockInfo?.plannedClockIn) {
        date = formatDateString(clockInfo.plannedClockIn);
      } else if (clockInfo?.actualClockIn) {
        date = formatDateString(clockInfo.actualClockIn);
      } else if (employee.date) {
        date = employee.date;
      }

      // 24시간 형식으로 시간 포맷팅
      const formatTime24 = (dateValue) => {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      switch (status) {
        case "WORKING":
          statusText = "근무중";
          clockInTime = clockInfo.actualClockIn
            ? formatTime24(clockInfo.actualClockIn)
            : "";
          clockOutTime = "";
          break;
        case "CLOCKED_OUT":
          statusText = "퇴근완료";
          clockInTime = clockInfo.actualClockIn
            ? formatTime24(clockInfo.actualClockIn)
            : "";
          clockOutTime = clockInfo.actualClockOut
            ? formatTime24(clockInfo.actualClockOut)
            : "";
          break;
        case "PLANNED":
          statusText = "예정";
          clockInTime = clockInfo.plannedClockIn
            ? formatTime24(clockInfo.plannedClockIn)
            : "";
          clockOutTime = clockInfo.plannedClockOut
            ? formatTime24(clockInfo.plannedClockOut)
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
        date,
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
  const formatTodayAttendanceTable = (employees, startDate = null, endDate = null) => {
    if (!employees || employees.length === 0) {
      return "금일 근무 현황이 존재하지 않습니다.\n스케줄을 등록하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "today_attendance_table",
      data: employees,
      startDate,
      endDate,
    };
  };

  // 근태 정보를 표 형태로 표시하는 함수
  const formatAttendanceTable = (employeeStats, startDate = null, endDate = null) => {
    if (!employeeStats || Object.keys(employeeStats).length === 0) {
      return "관련 정보가 존재하지 않습니다.\n다른 항목을 입력하시거나 다른 날짜를 입력해주세요.";
    }

    return {
      type: "attendance_table",
      data: Object.values(employeeStats),
      startDate,
      endDate,
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
        totalPrice: typeof totalPrice === 'number' ? totalPrice.toLocaleString() : totalPrice,
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
    loadingText = "정보를 조회하고 있습니다...",
    documentId = null
  ) => {
    try {
      setLoadingMessage(loadingText);
      setIsLoading(true);
      console.log("message=============", message);
      const baseUrl = import.meta.env.VITE_BRANCH_URL || "http://localhost:8080/branch-service";
      const apiUrl = `${baseUrl}/chatbot/ask`;
      
      const requestBody = {
        message: message,
      };
      
      // documentId가 있으면 추가
      if (documentId) {
        requestBody.documentId = documentId;
        console.log("sendChatbotRequest - documentId 추가됨:", documentId);
      } else {
        console.log("sendChatbotRequest - documentId 없음");
      }
      
      console.log("sendChatbotRequest - requestBody:", requestBody);
      const response = await axios.post(apiUrl, requestBody);
      const result = response.data;
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
    { id: "document", label: "문서", icon: "📄" },
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

      // 여러 가능한 경로에서 body 추출
      const body = 
        result?.data?.result?.body ||
        result?.result?.body ||
        result?.body;

      console.log("재고 버튼 클릭 - 전체 result:", result);
      console.log("재고 버튼 클릭 - body:", body);

      if (body) {
        let stocks = [];

        // products 배열 확인 (STOCK intent)
        if (body.products && Array.isArray(body.products)) {
          stocks = body.products;
        } else if (Array.isArray(body)) {
          stocks = body;
        } else if (body.stocks && Array.isArray(body.stocks)) {
          stocks = body.stocks;
        } else if (body.branchProductId) {
          stocks = [body];
        }

        console.log("재고 버튼 클릭 - 파싱된 stocks:", stocks);

        if (stocks.length > 0) {
          const processedData = stocks.map((item) => {
            console.log("재고 버튼 클릭 - 원본 item:", item, "productId:", item.productId);
            return {
              id: item.branchProductId || item.id, // 재고 수정용 (branchProductId)
              branchProductId: item.branchProductId || item.id, // 명시적으로 저장
              productId: item.productId, // 발주 요청용
              productName: item.productName || item.name,
              stockQuantity: item.stockQuantity || item.stock || 0,
              safetyStock: item.safetyStock || 0,
              price: item.price || 0,
            };
          });
          console.log("재고 버튼 클릭 - 데이터 저장:", processedData);
          console.log("재고 버튼 클릭 - productId 확인:", processedData.map(d => ({ id: d.id, productId: d.productId })));
          setInventoryData(processedData);
        }
      }
    }

    // 이전에 클릭했던 탭을 기억하고, 버튼 클릭 시 해당 탭을 다시 열기
    setActiveTab(buttonId);
    setPreviousTab(buttonId);
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
          setActiveTab("inventory");
        return; // API 호출 없이 종료
      }

      // 저장된 데이터가 없을 때만 API 호출
      const result = await sendChatbotRequest(
        "재고 전체 조회",
        "재고 정보를 조회하고 있습니다..."
      );

      // 여러 가능한 경로에서 body 추출
      const body = 
        result?.data?.result?.body ||
        result?.result?.body ||
        result?.body;

      console.log("재고 조회 - 전체 result:", result);
      console.log("재고 조회 - body:", body);

      if (body) {
        let stocks = [];

        // products 배열 확인 (STOCK intent)
        if (body.products && Array.isArray(body.products)) {
          stocks = body.products;
        } else if (Array.isArray(body)) {
          stocks = body;
        } else if (body.stocks && Array.isArray(body.stocks)) {
          stocks = body.stocks;
        } else if (body.branchProductId) {
          stocks = [body];
        }

        console.log("재고 조회 - 파싱된 stocks:", stocks);

        if (stocks.length > 0) {
          const processedData = stocks.map((item) => {
            console.log("재고 조회 - 원본 item:", item);
            return {
              id: item.branchProductId || item.id, // 재고 수정용 (branchProductId)
              branchProductId: item.branchProductId || item.id, // 명시적으로 저장
              productId: item.productId, // 발주 요청용
              productName: item.productName || item.name,
              stockQuantity: item.stockQuantity || item.stock || 0,
              safetyStock: item.safetyStock || 0,
              price: item.price || 0,
            };
          });

          console.log("재고 조회 - 처리된 데이터:", processedData);
          console.log("재고 조회 - productId 확인:", processedData.map(d => ({ id: d.id, productId: d.productId })));

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
          setActiveTab("inventory");
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

      orderData = result.result.body.purchaseList

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
            content: "발주 내역이 존재하지 않습니다",
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
        // 재고 데이터가 없으면 자동으로 전체 재고 조회 요청
        const result = await sendChatbotRequest(
          "재고 전체 조회",
          "재고 정보를 조회하고 있습니다..."
        );

        // 여러 가능한 경로에서 body 추출
        const body = 
          result?.data?.result?.body ||
          result?.result?.body ||
          result?.body;

        if (body) {
          let stocks = [];

          // products 배열 확인 (STOCK intent)
          if (body.products && Array.isArray(body.products)) {
            stocks = body.products;
          } else if (Array.isArray(body)) {
            stocks = body;
          } else if (body.stocks && Array.isArray(body.stocks)) {
            stocks = body.stocks;
          } else if (body.branchProductId) {
            stocks = [body];
          }

          if (stocks.length > 0) {
            const processedData = stocks.map((item) => {
              console.log("재고 조회 (handleQuickButton) - 원본 item:", item, "productId:", item.productId);
              return {
                id: item.branchProductId || item.id, // 재고 수정용 (branchProductId)
                branchProductId: item.branchProductId || item.id, // 명시적으로 저장
                productId: item.productId, // 발주 요청용
                productName: item.productName || item.name,
                stockQuantity: item.stockQuantity || item.stock || 0,
                safetyStock: item.safetyStock || 0,
                price: item.price || 0,
              };
            });
            console.log("재고 조회 (handleQuickButton) - productId 확인:", processedData.map(d => ({ id: d.id, productId: d.productId })));

            setInventoryData(processedData);

            const formatted = processedData.map((i) => ({
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
        }

        // 재고 조회 실패 시
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: "재고 데이터를 불러오지 못했습니다.",
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

  // 문서 탭 클릭 핸들러
  const handleDocumentTab = async (tabType) => {
    // 채팅 내용 유지 - 초기화하지 않음
    setActiveTab(null);

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `문서 ${tabType}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 문서 관련 API 요청
    if (tabType === "문서조회") {
      await fetchDocuments();
      // 문서 조회 후 문서 탭 다시 표시
      setActiveTab("document");
      return;
    }

    if (tabType === "문서등록") {
      setShowDocumentUploadModal(true);
      return;
    }

    if (tabType === "문서질의") {
      await fetchDocuments();
      setShowDocumentQueryModal(true);
      return;
    }
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
            : "매출 내역이 존재하지 않습니다.",
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
    const resetMessages = [
      {
        id: 1,
        type: "bot",
        content:
          "안녕하세요!\n케어업 챗봇 케이에요!\n\n이용 관련 궁금한 점이 생기면,\n언제든지 케이에게 물어보세요.",
        timestamp: new Date(),
      },
    ];
    setMessages(resetMessages);
    // localStorage에도 저장 (useEffect가 자동으로 처리하지만 명시적으로 저장)
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(resetMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))));
    } catch (error) {
      console.error('챗봇 메시지 저장 실패:', error);
    }
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
      // "근태 수정"이 포함되어 있으면 근태 수정 탭 열기
      if (messageContent.includes("근태 수정")) {
        const tabType = "근태수정";
        // 근태 수정 탭 열기 로직 실행
        await handleAttendanceTab(tabType);
        setIsComparing(false);
        return;
      }

      const result = await sendChatbotRequest(
        messageContent,
        "정보를 조회하고 있습니다..."
      );

      let botContent = "";

      if (result.error) {
        botContent = `오류가 발생했습니다: ${result.error}`;
      } else {
        // API 응답에서 body 추출
        // sendChatbotRequest가 response.data를 반환하므로 result.result.body가 맞는 경로
        // data.result.body 구조 확인
        console.log("전체 result:", result);
        console.log("result.data:", result?.data);
        console.log("result.data.result:", result?.data?.result);
        console.log("result.data.result.body:", result?.data?.result?.body);
        console.log("result.result:", result?.result);
        console.log("result.result.body:", result?.result?.body);
        
        const responseBody =
          result?.data?.result?.body ||
          result?.result?.body ||
          result?.body;
        
        // 디버깅: responseBody 확인
        console.log("responseBody:", responseBody);
        console.log("responseBody.startDate:", responseBody?.startDate);
        console.log("responseBody.endDate:", responseBody?.endDate);
        console.log("responseBody.encDate:", responseBody?.encDate);
        
        // endDate가 없으면 encDate 사용
        const startDate = responseBody?.startDate;
        const endDate = responseBody?.endDate || responseBody?.encDate;
        console.log("최종 startDate:", startDate, "최종 endDate:", endDate);

        // 채팅으로 요청할 때는 탭을 열지 않음 (intent 기반 탭 설정 제거)

        // 응답 데이터를 적절히 파싱하여 표시
        if (responseBody && typeof responseBody === "object") {
          const intent = responseBody.intent;

          // 근태 데이터 처리
          if (intent === "ATTENDANCE" && responseBody.employees) {
            const employees = Array.isArray(responseBody.employees) 
              ? responseBody.employees 
              : [];
            
            if (employees.length > 0) {
              // action이 "get"이고 employees가 있으면 금일 근무 현황으로 처리 시도
              // employees의 첫 번째 항목에 summary가 없으면 금일 근무 현황으로 간주
              const isTodayAttendance = responseBody.action === "get" && 
                employees.length > 0 && 
                !employees[0]?.summary;
              
              if (isTodayAttendance) {
                // 금일 근무 현황 처리
                const todayData = parseTodayAttendanceData(responseBody);
                if (todayData && todayData.length > 0) {
                  botContent = formatTodayAttendanceTable(
                    todayData,
                    startDate,
                    endDate
                  );
                  console.log("formatTodayAttendanceTable 결과:", botContent);
                  console.log("botContent.startDate:", botContent?.startDate, "botContent.endDate:", botContent?.endDate);
                } else {
                  // 파싱 실패 시 일반 근태 조회로 시도
                  const employeeStats = parseAttendanceData(employees);
                  if (employeeStats && Object.keys(employeeStats).length > 0) {
                    botContent = formatAttendanceTable(
                      employeeStats,
                      startDate,
                      endDate
                    );
                    console.log("formatAttendanceTable 결과:", botContent);
                    console.log("botContent.startDate:", botContent?.startDate, "botContent.endDate:", botContent?.endDate);
                  } else {
                    // summary가 없는 경우에도 employees 데이터를 직접 표시
                    botContent = {
                      type: "attendance_table",
                      data: employees.map((emp) => ({
                        employeeName: emp.employeeName || emp.name || "이름 없음",
                        totalDays: emp.summary?.totalDays ?? 0,
                        workDays: emp.summary?.workDays ?? 0,
                        absentDays: emp.summary?.absentDays ?? 0,
                        leaveDays: emp.summary?.leaveDays ?? 0,
                        totalWorkMinutes: emp.summary?.totalWorkMinutes ?? 0,
                        averageWorkMinutes: emp.summary?.averageWorkMinutes ?? 0,
                      })),
                      startDate: startDate,
                      endDate: endDate,
                    };
                  }
                }
              } else {
                // 일반 근태 조회 처리
                const employeeStats = parseAttendanceData(employees);
                if (employeeStats && Object.keys(employeeStats).length > 0) {
                  botContent = formatAttendanceTable(
                    employeeStats,
                    responseBody.startDate,
                    responseBody.endDate || responseBody.encDate
                  );
                } else {
                  // summary가 없는 경우에도 employees 데이터를 직접 표시
                  botContent = {
                    type: "attendance_table",
                    data: employees.map((emp) => ({
                      employeeName: emp.employeeName || emp.name || "이름 없음",
                      totalDays: emp.summary?.totalDays ?? 0,
                      workDays: emp.summary?.workDays ?? 0,
                      absentDays: emp.summary?.absentDays ?? 0,
                      leaveDays: emp.summary?.leaveDays ?? 0,
                      totalWorkMinutes: emp.summary?.totalWorkMinutes ?? 0,
                      averageWorkMinutes: emp.summary?.averageWorkMinutes ?? 0,
                    })),
                    startDate: responseBody.startDate,
                    endDate: responseBody.endDate,
                  };
                }
              }
            } else {
              botContent = "근태 데이터가 없습니다.";
            }
          } else if (intent === "ORDER" || responseBody.purchaseList) {
            // 발주 데이터 처리
            console.log("ORDER intent 처리 시작");
            console.log("전체 result:", result);
            console.log("responseBody:", responseBody);
            console.log("responseBody.purchaseList:", responseBody?.purchaseList);
            
            let purchaseList = [];
            
            // purchaseList 배열 확인 (ORDER intent)
            // sendChatbotRequest가 response.data를 반환하므로 result는 이미 response.data
            // 따라서 result.result.body.purchaseList가 맞을 수 있음
            if (responseBody.purchaseList && Array.isArray(responseBody.purchaseList)) {
              purchaseList = responseBody.purchaseList;
              console.log("경로1: responseBody.purchaseList에서 찾음:", purchaseList);
            } else if (result?.result?.body?.purchaseList && Array.isArray(result.result.body.purchaseList)) {
              purchaseList = result.result.body.purchaseList;
              console.log("경로2: result.result.body.purchaseList에서 찾음:", purchaseList);
            } else if (result?.data?.result?.body?.purchaseList && Array.isArray(result.data.result.body.purchaseList)) {
              purchaseList = result.data.result.body.purchaseList;
              console.log("경로3: result.data.result.body.purchaseList에서 찾음:", purchaseList);
            } else if (result?.body?.purchaseList && Array.isArray(result.body.purchaseList)) {
              purchaseList = result.body.purchaseList;
              console.log("경로4: result.body.purchaseList에서 찾음:", purchaseList);
            } else if (Array.isArray(responseBody)) {
              purchaseList = responseBody;
              console.log("경로5: responseBody가 배열:", purchaseList);
            }
            
            console.log("최종 purchaseList:", purchaseList);
            
            if (purchaseList.length > 0) {
              const parsedOrders = parseOrderData(purchaseList);
              console.log("parsedOrders:", parsedOrders);
              if (parsedOrders && parsedOrders.length > 0) {
                botContent = formatOrderTable(parsedOrders);
                console.log("formatOrderTable 결과:", botContent);
              } else {
                botContent = "발주 내역이 존재하지 않습니다.";
              }
            } else {
              botContent = "발주 데이터가 없습니다.";
            }
          } else if (intent === "STOCK" || responseBody.products) {
            // 재고 데이터 처리
            let stocks = [];
            
            // products 배열 확인 (STOCK intent)
            if (responseBody.products && Array.isArray(responseBody.products)) {
              stocks = responseBody.products;
            } else if (Array.isArray(responseBody)) {
              stocks = responseBody;
            } else if (responseBody.stocks && Array.isArray(responseBody.stocks)) {
              stocks = responseBody.stocks;
            } else if (responseBody.branchProductId) {
              stocks = [responseBody];
            }
            
            if (stocks.length > 0) {
              const processedData = stocks.map((item) => {
                console.log("재고 조회 (sendChatbotRequest) - 원본 item:", item, "productId:", item.productId);
                return {
                  id: item.branchProductId || item.id, // 재고 수정용 (branchProductId)
                  branchProductId: item.branchProductId || item.id, // 명시적으로 저장
                  productId: item.productId, // 발주 요청용
                  productName: item.productName || item.name,
                  stockQuantity: item.stockQuantity || item.stock || 0,
                  safetyStock: item.safetyStock || 0,
                  price: item.price || 0,
                };
              });
              console.log("재고 조회 (sendChatbotRequest) - productId 확인:", processedData.map(d => ({ id: d.id, productId: d.productId })));
              
              setInventoryData(processedData);
              
              botContent = {
                type: "inventory_table",
                data: processedData,
              };
            } else {
              botContent = "재고 데이터가 없습니다.";
            }
          } else {
            // 다른 타입의 데이터는 JSON으로 표시하거나 적절히 포맷팅
            if (responseBody.employees || responseBody.products || responseBody.data) {
              // 구조화된 데이터가 있는 경우 JSON으로 표시
              botContent = JSON.stringify(responseBody, null, 2);
            } else {
              // 단순 객체인 경우 JSON으로 표시
              botContent = JSON.stringify(responseBody, null, 2);
            }
          }
        } else if (typeof responseBody === "string") {
          botContent = responseBody;
        } else {
          // responseBody가 없거나 다른 타입인 경우 전체 결과를 JSON으로 표시
          botContent = JSON.stringify(result, null, 2);
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
                  message.content.type === "document_list" ? (
                    // 문서 목록은 별도 컨테이너 사용
                    <DocumentList 
                      documents={message.content.data} 
                      onRefresh={() => fetchDocuments()}
                    />
                  ) : message.content &&
                  typeof message.content === "object" &&
                  message.content.type === "document_query_response" ? (
                    // 문서 질의 응답 디자인
                    <div className="document-query-response">
                      <div className="document-query-header">
                        <div className="document-query-icon">📄</div>
                        <div className="document-query-info">
                          <div className="document-query-title">{message.content.data.documentTitle}</div>
                          <div className="document-query-type">{message.content.data.documentType}</div>
                        </div>
                      </div>
                      <div className="document-query-question">
                        <div className="document-query-label">질의:</div>
                        <div className="document-query-text">{message.content.data.query}</div>
                      </div>
                      <div className="document-query-answer">
                        <div className="document-query-label">답변:</div>
                        <div className="document-query-response-text">
                          {typeof message.content.data.response === "string" 
                            ? message.content.data.response.split("\n").map((line, index) => (
                                <div key={index}>{line}</div>
                              ))
                            : message.content.data.response
                          }
                        </div>
                      </div>
                    </div>
                  ) : message.content &&
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
                      <div className="attendance-title" style={{ textAlign: 'center' }}>
                        {message.content.type === "today_attendance_table"
                          ? "📅 근무 현황"
                          : message.content.type === "attendance_table"
                            ? "📊 전체 직원 근무 현황"
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
                                            : message.content.type === "inventory_table"
                                              ? "📦 재고 조회"
                                            : message.content.type === "inventory_edit"
                                              ? "📦 재고 수정"
                                              : message.content.type === "detail_table"
                                                ? ""
                                                : message.content.type === "attendance_edit"
                                                  ? ""
                                                  : "📊 근태 "}
                      </div>
                      {(message.content.type === "attendance_table" || message.content.type === "today_attendance_table") && (() => {
                        const formatDate = (dateStr) => {
                          if (!dateStr) return "";
                          const parts = dateStr.split("-");
                          if (parts.length >= 3) {
                            return `${parts[1]}-${parts[2]}`; // MM-DD 형식
                          }
                          return dateStr;
                        };
                        
                        const startDate = message.content.startDate;
                        const endDate = message.content.endDate;

                        let dateText = null;
                        if (startDate && endDate) {
                          const formattedStart = formatDate(startDate);
                          const formattedEnd = formatDate(endDate);
                          if (formattedStart === formattedEnd) {
                            dateText = formattedStart;
                          } else {
                            dateText = `${formattedStart} ~ ${formattedEnd}`;
                          }
                        } else if (startDate) {
                          dateText = formatDate(startDate);
                        } else if (endDate) {
                          dateText = formatDate(endDate);
                        }
                        
                        return dateText ? (
                          <div style={{ 
                            fontSize: '0.85em', 
                            color: '#666', 
                            fontWeight: 'normal',
                            textAlign: 'right',
                            marginTop: '4px',
                            marginBottom: '8px'
                          }}>
                            기간 : {dateText}
                          </div>
                        ) : null;
                      })()}
                      <div className="attendance-table">
                        {message.content.type === "today_attendance_table" ? (
                          // ✅ 금일 근무 현황
                          <>
                            <div className="attendance-header today-attendance-header">
                              <div className="attendance-cell header">날짜</div>
                              <div className="attendance-cell header">이름</div>
                              <div className="attendance-cell header">
                                근무
                              </div>
                              <div className="attendance-cell header">상태</div>
                              <div className="attendance-cell header">
                                출근
                              </div>
                              <div className="attendance-cell header">
                                퇴근
                              </div>
                            </div>
                            {[...message.content.data]
                              .sort((a, b) => {
                                const dateA = a.date || "";
                                const dateB = b.date || "";
                                return dateA.localeCompare(dateB);
                              })
                              .map((employee, index) => (
                                <div key={index} className="attendance-row today-attendance-row">
                                  <div className="attendance-cell">
                                    {employee.date || "-"}
                                  </div>
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
                            <div className="attendance-header attendance-summary-header">
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
                              <div key={index} className="attendance-row attendance-summary-row">
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
                            <div className="attendance-header detail-summary-header">
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
                            <div className="attendance-row detail-summary-row">
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
                            <div className="attendance-header detail-table-header">
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
                            {[...(message.content.details || [])]
                              .sort((a, b) => {
                                const dateA = a.date || "";
                                const dateB = b.date || "";
                                return dateA.localeCompare(dateB);
                              })
                              .map((detail, index) => {
                                // 날짜를 MM-DD 형식으로 변환
                                const formatDate = (dateStr) => {
                                  if (!dateStr) return "-";
                                  const parts = dateStr.split("-");
                                  if (parts.length >= 3) {
                                    return `${parts[1]}-${parts[2]}`; // MM-DD 형식
                                  }
                                  return dateStr;
                                };

                                // 상태를 한글로 변환
                                const getStatusText = (status) => {
                                  if (!status) return "-";
                                  const statusMap = {
                                    PLANNED: "근무 예정",
                                    LATE: "지각",
                                    CLOCKED_IN: "근무 중",
                                    ON_BREAK: "휴게 중",
                                    EARLY_LEAVE: "조퇴",
                                    CLOCKED_OUT: "근무 완료",
                                    OVERTIME: "초과 근무",
                                    MISSED_CHECKOUT: "퇴근 누락",
                                    LEAVE: "휴가/휴무",
                                    ABSENT: "결근",
                                  };
                                  return statusMap[status.toUpperCase()] || status;
                                };

                                return (
                                  <div key={index} className="attendance-row detail-table-row">
                                    <div className="attendance-cell">
                                      {formatDate(detail.date)}
                                    </div>
                                    <div className="attendance-cell">
                                      {detail.workType || "-"}
                                    </div>
                                    <div className="attendance-cell">
                                      {getStatusText(detail.status)}
                                    </div>
                                    <div className="attendance-cell">
                                      {detail.workMinutes}분
                                    </div>
                                    <div className="attendance-cell">
                                      {detail.breakMinutes}분
                                    </div>
                                  </div>
                                );
                              })}
                          </>
                        ) : message.content.type === "inventory_table" ? (
                          // ✅ 재고 조회 테이블 (새로 추가)
                          <>
                            <div className="attendance-header inventory-table-header">
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
                              <div key={index} className="attendance-row inventory-table-row">
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
                            <div className="inventory-edit-container">
                              <div className="inventory-edit-header">
                                <div className="inventory-edit-cell header">
                                  상품명
                                </div>
                                <div className="inventory-edit-cell header">
                                  현재 재고
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
                                  <div className="inventory-edit-cell current-stock">
                                    {item.stockQuantity || 0}
                                  </div>
                                  <div className="inventory-edit-cell quantity-control">
                                    <input
                                      type="number"
                                      value={orderQuantities[item.id] !== undefined && orderQuantities[item.id] !== null ? String(orderQuantities[item.id]) : ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // 빈 값 허용
                                        if (value === "") {
                                          updateOrderQuantity(item.id, "");
                                          return;
                                        }
                                        // "-"만 입력된 경우 허용
                                        if (value === "-") {
                                          updateOrderQuantity(item.id, "-");
                                          return;
                                        }
                                        // 숫자 또는 음수 숫자 패턴 확인 (예: -10, -123, 10, 123)
                                        const numberPattern = /^-?\d+$/;
                                        if (numberPattern.test(value)) {
                                          const numValue = parseInt(value, 10);
                                          updateOrderQuantity(item.id, numValue);
                                          // 현재 재고보다 -값이 더 크면 경고
                                          const currentStock = item.stockQuantity || 0;
                                          if (numValue < 0 && Math.abs(numValue) > currentStock) {
                                            setSnackbar({
                                              show: true,
                                              message: `${item.productName}: 현재 재고(${currentStock})보다 많은 수량을 차감할 수 없습니다.`
                                            });
                                            setTimeout(() => {
                                              setSnackbar({ show: false, message: "" });
                                            }, 3000);
                                          }
                                        } else {
                                          // 유효하지 않은 입력은 무시 (이전 값 유지)
                                          // 또는 "-"로 시작하는 경우만 허용
                                          if (value.startsWith("-") && value.length === 1) {
                                            updateOrderQuantity(item.id, "-");
                                          }
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || value === "-") {
                                          updateOrderQuantity(item.id, 0);
                                        } else {
                                          const numValue = parseInt(value, 10);
                                          if (!isNaN(numValue)) {
                                            updateOrderQuantity(item.id, numValue);
                                          } else {
                                            updateOrderQuantity(item.id, 0);
                                          }
                                        }
                                      }}
                                      className="quantity-input"
                                      placeholder="0"
                                    />
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
                            <div className="attendance-header order-table-header">
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
                              <div key={index} className="attendance-row order-table-row">
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
                                  <label>기본 출·퇴근시간</label>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 4,
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
                                <label>근무 종류</label>
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
                                  onClick={handleAttendanceEditClick}
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          </>
                        ) : message.content.type === "turnover_table" ? (
                          // ✅ 회전율 테이블 (avgWeeklySales 표시, 권장발주/버튼 제거)
                          <>
                            <div className="turnover-table-container">
                              <div className="turnover-table-header">
                                <div className="turnover-table-cell header">
                                  상품명
                                </div>
                                <div className="turnover-table-cell header">
                                  현재재고
                                </div>
                                <div className="turnover-table-cell header">
                                  주간판매량
                                </div>
                                <div className="turnover-table-cell header">
                                  회전율
                                </div>
                                <div className="turnover-table-cell header">상태</div>
                              </div>
                              {message.content.data.products.map(
                                (product, index) => (
                                  <div key={index} className="turnover-table-row">
                                    <div className="turnover-table-cell">
                                      {product.productName}
                                    </div>
                                    <div className="turnover-table-cell">
                                      {product.currentStock}
                                    </div>
                                    <div className="turnover-table-cell">
                                      {product.avgWeeklySales ?? "-"}
                                    </div>
                                    <div className="turnover-table-cell">
                                      {product.turnoverRate}%
                                    </div>
                                    <div className="turnover-table-cell">
                                      <span
                                        className={`status-badge status-${String(product.status || "").toLowerCase()}`}
                                      >
                                        {product.turnoverStatus || "-"}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                            {message.content?.data?.summary
                              ?.turnoverMessage && (
                              <div className="summary-note">
                                <span className="summary-label">요약:</span>
                                {message.content.data.summary.turnoverMessage}
                              </div>
                            )}
                          </>
                        ) : message.content.type === "order_request_table" ? (
                          <>
                            <div className="attendance-title">📦 발주 요청</div>
                            <div className="inventory-edit-container order-request-container">
                              <div className="inventory-edit-header">
                                <div className="inventory-edit-cell header">
                                  상품명
                                </div>
                                <div className="inventory-edit-cell header">
                                  현재재고
                                </div>
                                <div className="inventory-edit-cell header">
                                  안전재고
                                </div>
                                <div className="inventory-edit-cell header">수량</div>
                                <div className="inventory-edit-cell header">
                                  발주단가
                                </div>
                              </div>
                              {message.content.data.map((item, index) => (
                                <div key={index} className="inventory-edit-row">
                                  <div className="inventory-edit-cell product-name">
                                    {item.productName}
                                  </div>
                                  <div className="inventory-edit-cell current-stock">
                                    {item.stockQuantity}
                                  </div>
                                  <div className="inventory-edit-cell safety-stock">
                                    {item.safetyStock}
                                  </div>
                                  <div className="inventory-edit-cell quantity-control">
                                    <input
                                      type="number"
                                      value={orderQuantities[item.id] ?? 0}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || value === "-") {
                                          updateOrderQuantity(item.id, value === "-" ? "-" : 0);
                                        } else {
                                          const numValue = parseInt(value, 10);
                                          if (!isNaN(numValue)) {
                                            updateOrderQuantity(item.id, numValue);
                                          } else if (value.startsWith("-")) {
                                            updateOrderQuantity(item.id, "-");
                                          }
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value === "" || value === "-") {
                                          updateOrderQuantity(item.id, 0);
                                        }
                                      }}
                                      className="quantity-input"
                                      min="0"
                                      max="9999"
                                    />
                                  </div>
                                  <div className="inventory-edit-cell price">
                                    {Number(item.unitPrice || 0).toLocaleString()}원
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
                            </div>
                          </>
                        ) : message.content.type ===
                          "order_recommendation_table" ? (
                          // ✅ 발주 추천 테이블 (권장발주 기반, 총 발주단가 및 확인)
                          <>
                            <div className="attendance-header order-recommendation-header">
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
                                <div key={index} className="attendance-row order-recommendation-row">
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
                                <span className="summary-label">추천 요약:</span>
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
                            <div className="attendance-header sales-daily-header">
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
                            {(message.content.data || []).map((row, idx) => {
                              // 시간을 "08시" 형식으로 포맷팅
                              const formatHour = (hour) => {
                                if (hour === null || hour === undefined || hour === "") return "-";
                                const hourNum = typeof hour === "number" ? hour : parseInt(hour, 10);
                                if (isNaN(hourNum)) return hour;
                                return `${String(hourNum).padStart(2, "0")}시`;
                              };
                              return (
                                <div key={idx} className="attendance-row sales-daily-row">
                                  <div className="attendance-cell">
                                    {formatHour(row.hour)}
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
                              );
                            })}
                          </>
                        ) : message.content.type === "sales_product_table" ? (
                          // ✅ 상품별 매출 테이블 (상품명/판매수량/판매금액/공급가/마진율)
                          <>
                            <div className="attendance-header sales-product-header">
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
                              <div key={idx} className="attendance-row sales-product-row">
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
                            <div className="attendance-header labor-cost-header">
                              <div className="attendance-cell header">시간</div>
                              <div className="attendance-cell header">
                                인건비율
                              </div>
                            </div>
                            <div className="attendance-row labor-cost-row">
                              <div className="attendance-cell">
                                최고{" "}
                                {(() => {
                                  const hour = message.content.data.summary.highestCostHour;
                                  if (!hour && hour !== 0) return "-";
                                  const hourNum = typeof hour === "number" ? hour : parseInt(hour, 10);
                                  return isNaN(hourNum) ? hour : `${String(hourNum).padStart(2, "0")}시`;
                                })()}
                              </div>
                              <div className="attendance-cell">
                                {Number(
                                  message.content.data.summary.highestCostRatio || 0
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                            <div className="attendance-row labor-cost-row">
                              <div className="attendance-cell">
                                최저{" "}
                                {(() => {
                                  const hour = message.content.data.summary.lowestCostHour;
                                  if (!hour && hour !== 0) return "-";
                                  const hourNum = typeof hour === "number" ? hour : parseInt(hour, 10);
                                  return isNaN(hourNum) ? hour : `${String(hourNum).padStart(2, "0")}시`;
                                })()}
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
                                <div className="attendance-header labor-cost-analysis-header">
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
                                      <div key={idx} className="attendance-row labor-cost-analysis-row">
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
                                {(() => {
                                  const hour = message.content.data.summary.highestCostHour;
                                  if (!hour && hour !== 0) return "-";
                                  const hourNum = typeof hour === "number" ? hour : parseInt(hour, 10);
                                  return isNaN(hourNum) ? hour : `${String(hourNum).padStart(2, "0")}시`;
                                })()} (
                                {Number(
                                  message.content.data.summary
                                    .highestCostRatio || 0
                                ).toFixed(1)}
                                %)
                              </div>
                              <div style={{ marginTop: 6 }}>
                                가장 낮은 인건비율 시간대:{" "}
                                {(() => {
                                  const hour = message.content.data.summary.lowestCostHour;
                                  if (!hour && hour !== 0) return "-";
                                  const hourNum = typeof hour === "number" ? hour : parseInt(hour, 10);
                                  return isNaN(hourNum) ? hour : `${String(hourNum).padStart(2, "0")}시`;
                                })()} (
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
                            <div className="attendance-header order-table-header">
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
                              <div key={index} className="attendance-row order-table-row">
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
          {activeTab === "document" && (
            <DocumentTab onTabClick={handleDocumentTab} />
          )}
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
              placeholder="케이에게 물어보세요"
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

        {/* 근태 수정 확인 모달 */}
        {showAttendanceEditConfirm && (
          <div className="reset-modal">
            <div className="reset-modal-content">
              <div className="reset-modal-title">근태 수정</div>
              <div className="reset-modal-message">정말 수정하시겠습니까?</div>
              <div className="reset-modal-buttons">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setShowAttendanceEditConfirm(false)}
                >
                  취소
                </button>
                <button
                  className="reset-confirm-btn"
                  onClick={submitAttendanceEdit}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 경고 스낵바 */}
        {snackbar.show && (
          <div className="snackbar snackbar-error">
            {snackbar.message}
          </div>
        )}

        {/* 문서 업로드 모달 */}
        {showDocumentUploadModal && (
          <DocumentUploadModal
            isOpen={showDocumentUploadModal}
            onClose={() => setShowDocumentUploadModal(false)}
            branchId={getBranchId()}
            onSuccess={async () => {
              setShowDocumentUploadModal(false);
              const successMessage = {
                id: Date.now(),
                type: "bot",
                content: "문서 등록이 완료되었습니다.",
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, successMessage]);
              
              // 문서 등록 후 문서 목록 다시 불러오기
              await fetchDocuments();
            }}
          />
        )}


        {/* 문서 질의 모달 */}
        {showDocumentQueryModal && (
          <div className="reset-modal">
            <div className="reset-modal-content" style={{ maxWidth: "500px" }}>
              <div className="reset-modal-title">문서 질의</div>
              <div style={{ marginBottom: "15px" }}>
                <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                  문서 선택:
                </div>
                {documents.length === 0 ? (
                  <div style={{ color: "#dc2626", fontSize: "13px" }}>
                    문서를 먼저 조회해주세요.
                  </div>
                ) : (
                  <div style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px"
                  }}>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocumentForQuery(doc)}
                        style={{
                          padding: "8px",
                          marginBottom: "4px",
                          backgroundColor: selectedDocumentForQuery?.id === doc.id ? "#ede9fe" : "white",
                          borderRadius: "4px",
                          cursor: "pointer",
                          border: selectedDocumentForQuery?.id === doc.id ? "1px solid #8b5cf6" : "1px solid #e5e7eb"
                        }}
                      >
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>
                          {doc.title || "제목 없음"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                          {DOCUMENT_TYPES[doc.documentType] || doc.documentType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "15px" }}>
                <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                  질의 내용:
                </div>
                <textarea
                  value={documentQueryText}
                  onChange={(e) => setDocumentQueryText(e.target.value)}
                  placeholder="문서에 대해 질의할 내용을 입력하세요..."
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>
              {isLoading ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "20px",
                  color: "#6b7280"
                }}>
                  <div className="loading-spinner" style={{ 
                    display: "inline-block",
                    marginRight: "10px"
                  }}></div>
                  <span>{loadingMessage}</span>
                </div>
              ) : (
                <div className="reset-modal-buttons">
                  <button
                    className="reset-cancel-btn"
                    onClick={() => {
                      setShowDocumentQueryModal(false);
                      setSelectedDocumentForQuery(null);
                      setDocumentQueryText("");
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="reset-confirm-btn"
                    onClick={handleDocumentQuery}
                    disabled={!selectedDocumentForQuery || !documentQueryText.trim()}
                    style={{
                      opacity: (!selectedDocumentForQuery || !documentQueryText.trim()) ? 0.5 : 1,
                      cursor: (!selectedDocumentForQuery || !documentQueryText.trim()) ? "not-allowed" : "pointer"
                    }}
                  >
                    질의 전송
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;

