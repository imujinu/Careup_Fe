import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

const ChatBot = ({ onClose }) => {
  // localStorage에서 챗봇 메시지 불러오기
  const getInitialMessages = () => {
    try {
      const savedMessages = localStorage.getItem('chatbot_messages_customer');
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      // timestamp를 문자열로 변환하여 저장
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }));
      localStorage.setItem('chatbot_messages_customer', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('챗봇 메시지 저장 실패:', error);
    }
  }, [messages]);

  const quickButtons = [
    { id: "attendance", label: "근태", icon: "👤" },
    { id: "inventory", label: "재고", icon: "📦" },
    { id: "order", label: "발주", icon: "📋" },
    { id: "sales", label: "매출", icon: "💰" },
    { id: "reset", label: "채팅 초기화", icon: "🔄" },
  ];

  const handleQuickButton = (buttonId) => {
    if (buttonId === "reset") {
      setShowResetConfirm(true);
      return;
    }

    const buttonLabels = {
      attendance: "근태",
      inventory: "재고",
      order: "발주",
      sales: "매출",
    };

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: buttonLabels[buttonId],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 봇 응답 시뮬레이션
    setTimeout(() => {
      const botResponses = {
        attendance:
          "근태 관련 정보를 확인해드리겠습니다.\n\n📊 오늘 출근 현황:\n- 출근: 8명\n- 지각: 1명\n- 결근: 0명\n\n더 자세한 정보가 필요하시면 말씀해주세요!",
        inventory:
          "재고 현황을 조회해드리겠습니다.\n\n📦 현재 재고 상황:\n- 러닝화: 45개\n- 트레이닝복: 23개\n- 액세서리: 67개\n\n⚠️ 재고 부족 상품이 있습니다.",
        order:
          "발주 관련 정보입니다.\n\n📋 이번 주 발주 현황:\n- 대기중: 3건\n- 처리완료: 12건\n- 배송중: 5건\n\n새로운 발주를 원하시면 알려주세요!",
        sales:
          "매출 현황을 확인해드리겠습니다.\n\n💰 오늘 매출:\n- 총 매출: ₩2,450,000\n- 주문 건수: 28건\n- 평균 주문액: ₩87,500\n\n📈 전일 대비 +15.3% 증가했습니다!",
      };

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botResponses[buttonId],
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
          "안녕하세요!\n케어업 챗봇 환이에요!\n\n이용 관련 궁금한 점이 생기면,\n언제든지 환이에게 물어보세요.",
        timestamp: new Date(),
      },
    ];
    setMessages(resetMessages);
    // localStorage에도 저장 (useEffect가 자동으로 처리하지만 명시적으로 저장)
    try {
      localStorage.setItem('chatbot_messages_customer', JSON.stringify(resetMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))));
    } catch (error) {
      console.error('챗봇 메시지 저장 실패:', error);
    }
    setShowResetConfirm(false);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // 간단한 봇 응답
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "죄송합니다. 현재는 빠른 버튼을 통한 문의만 지원하고 있습니다.\n위의 버튼 중 하나를 선택해주세요!",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
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
                  {message.content.split("\n").map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
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
      </div>
    </div>
  );
};

export default ChatBot;
