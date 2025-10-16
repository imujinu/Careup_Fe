import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #dc2626;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const InfoSection = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #064e3b;
  margin: 0 0 4px 0;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #065f46;
  margin: 0;
`;

const SettingsSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 4px 0;
`;

const SettingDescription = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #10b981;
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const AutomationStatus = styled.div`
  background: #f3f4f6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const StatusTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatusLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const StatusValue = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const SaveButton = styled(Button)`
  background: #10b981;
  color: #ffffff;
  
  &:hover {
    background: #059669;
  }
`;

function OrderAutomationModal({ isOpen, onClose, onSaveSettings }) {
  const [settings, setSettings] = useState({
    autoOrder: true,
    lowStockAlert: true,
    weeklyOrder: false,
    monthlyOrder: true,
    orderThreshold: 20
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = () => {
    onSaveSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '발주 자동화'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoSection, null,
          React.createElement(InfoIcon, null, '🤖'),
          React.createElement(InfoContent, null,
            React.createElement(InfoTitle, null, '스마트 발주 자동화'),
            React.createElement(InfoText, null, '재고 상태를 모니터링하여 자동으로 발주를 생성하고 관리합니다.')
          )
        ),
        React.createElement(SettingsSection, null,
          React.createElement(SectionTitle, null, '자동화 설정'),
          React.createElement(SettingItem, null,
            React.createElement(SettingInfo, null,
              React.createElement(SettingTitle, null, '자동 발주 활성화'),
              React.createElement(SettingDescription, null, '재고가 부족할 때 자동으로 발주를 생성합니다')
            ),
            React.createElement(ToggleSwitch, null,
              React.createElement(ToggleInput, {
                type: 'checkbox',
                checked: settings.autoOrder,
                onChange: (e) => handleSettingChange('autoOrder', e.target.checked)
              }),
              React.createElement(ToggleSlider, null)
            )
          ),
          React.createElement(SettingItem, null,
            React.createElement(SettingInfo, null,
              React.createElement(SettingTitle, null, '재고 부족 알림'),
              React.createElement(SettingDescription, null, '재고가 부족할 때 알림을 보냅니다')
            ),
            React.createElement(ToggleSwitch, null,
              React.createElement(ToggleInput, {
                type: 'checkbox',
                checked: settings.lowStockAlert,
                onChange: (e) => handleSettingChange('lowStockAlert', e.target.checked)
              }),
              React.createElement(ToggleSlider, null)
            )
          ),
          React.createElement(SettingItem, null,
            React.createElement(SettingInfo, null,
              React.createElement(SettingTitle, null, '주간 정기 발주'),
              React.createElement(SettingDescription, null, '매주 정해진 요일에 정기 발주를 생성합니다')
            ),
            React.createElement(ToggleSwitch, null,
              React.createElement(ToggleInput, {
                type: 'checkbox',
                checked: settings.weeklyOrder,
                onChange: (e) => handleSettingChange('weeklyOrder', e.target.checked)
              }),
              React.createElement(ToggleSlider, null)
            )
          ),
          React.createElement(SettingItem, null,
            React.createElement(SettingInfo, null,
              React.createElement(SettingTitle, null, '월간 정기 발주'),
              React.createElement(SettingDescription, null, '매월 정해진 날에 정기 발주를 생성합니다')
            ),
            React.createElement(ToggleSwitch, null,
              React.createElement(ToggleInput, {
                type: 'checkbox',
                checked: settings.monthlyOrder,
                onChange: (e) => handleSettingChange('monthlyOrder', e.target.checked)
              }),
              React.createElement(ToggleSlider, null)
            )
          )
        ),
        React.createElement(AutomationStatus, null,
          React.createElement(StatusTitle, null, '현재 자동화 상태'),
          React.createElement(StatusItem, null,
            React.createElement(StatusLabel, null, '자동 발주 상태:'),
            React.createElement(StatusValue, null, settings.autoOrder ? '활성화' : '비활성화')
          ),
          React.createElement(StatusItem, null,
            React.createElement(StatusLabel, null, '마지막 자동 발주:'),
            React.createElement(StatusValue, null, '2025.09.18 14:30')
          ),
          React.createElement(StatusItem, null,
            React.createElement(StatusLabel, null, '다음 정기 발주:'),
            React.createElement(StatusValue, null, '2025.09.25 09:00')
          ),
          React.createElement(StatusItem, null,
            React.createElement(StatusLabel, null, '자동 발주 건수 (이번 달):'),
            React.createElement(StatusValue, null, '3건')
          )
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(SaveButton, { onClick: handleSave }, '설정 저장')
        )
      )
    )
  );
}

export default OrderAutomationModal;
