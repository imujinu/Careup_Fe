import React from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import './EmployeeCard.css';

const EmployeeCard = ({ data }) => {
  const totalEmployees = data?.totalEmployees || 0;
  const presentEmployees = data?.presentEmployees || 0;
  const absentEmployees = totalEmployees - presentEmployees;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentEmployees / totalEmployees) * 100) : 0;

  // 원형 차트를 위한 각도 계산 (308도 = 85.6%)
  const angle = (attendanceRate / 100) * 360;

  return (
    <div className="employee-card">
      <div className="card-header">
        <Users className="card-icon" size={24} />
        <h3>직원 현황</h3>
      </div>
      
      <div className="employee-stats">
        <div className="stat-item">
          <div className="stat-label">총 직원 수</div>
          <div className="stat-value primary">
            {totalEmployees}명
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">출근 중</div>
          <div className="stat-value success">
            {presentEmployees}명
          </div>
          <div className="stat-indicator">
            <UserCheck size={14} />
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">결근/휴가</div>
          <div className="stat-value warning">
            {absentEmployees}명
          </div>
          <div className="stat-indicator">
            <UserX size={14} />
          </div>
        </div>
      </div>

      <div className="attendance-summary">
        <div className="attendance-header">
          <Clock size={16} />
          <span>출근률</span>
        </div>
        <div className="attendance-rate">
          <div 
            className="rate-circle"
            style={{
              background: `conic-gradient(from 0deg, #8B7FE6 0deg, #8B7FE6 ${angle}deg, #f0f0f0 ${angle}deg, #f0f0f0 360deg)`
            }}
          >
            <div className="rate-text">
              {attendanceRate}%
            </div>
          </div>
          <div className="rate-info">
            <div className="rate-label">오늘 출근률</div>
            <div className="rate-detail">
              {presentEmployees}/{totalEmployees}명
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;

