import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiCash, mdiPackageVariant, mdiAlertCircle, mdiTrendingUp } from '@mdi/js';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useAppSelector } from '../../stores/hooks';
import { salesReportService } from '../../service/salesReportService';
import orderService from '../../service/orderService';
import { inventoryService } from '../../service/inventoryService';
import { formatDateKST } from '../../utils/dateUtils';

const Page = styled.div`
  width: 100%;
  padding: 24px;
  background: #f9fafb;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
  color: #1f2937;
`;

const KPI = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const KPICard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  display: flex;
  gap: 12px;
  align-items: center;
`;

const KPIIcon = styled.div`
  width: 48px; height: 48px; border-radius: 10px; display:flex; align-items:center; justify-content:center;
  background: ${(p) => p.$bg || '#eef2ff'};
`;

const KPILabel = styled.div`
  font-size: 12px; color: #6b7280;
`;

const KPIValue = styled.div`
  font-size: 20px; font-weight: 700; color: #111827;
`;

const ChartCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`;

const Grid2 = styled.div`
  display: grid; grid-template-columns: 2fr 1fr; gap: 16px;
`;

const GridLeftRight = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
`;

const ChartsColumn = styled.div`
  display: flex; flex-direction: column; gap: 16px;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px;
  th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align:left; }
  th { background: #f9fafb; font-weight: 600; color: #374151; }
`;

function FranchiseDashboard() {
  const { branchId } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ todaySales: 0, pendingOrders: 0, lowStock: 0, trend: 0 });
  const [salesStats, setSalesStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);

        const fmt = (d) => d.toISOString().slice(0,10);

        const [stats, ordersRes, invRes] = await Promise.all([
          branchId ? salesReportService.getBranchSalesStatistics(branchId, fmt(start), fmt(end), 'DAY').catch(() => null) : Promise.resolve(null),
          branchId ? orderService.getOrdersByBranch(branchId).catch(() => []) : Promise.resolve([]),
          branchId ? inventoryService.getBranchProducts(branchId).catch(() => ({ result: [] })) : Promise.resolve({ result: [] }),
        ]);

        // 매출 KPI
        let todaySales = 0;
        if (stats?.statistics?.length) {
          const todayKey = fmt(end);
          const todayItem = stats.statistics.find((x) => x.date === todayKey || x.period === todayKey);
          todaySales = todayItem?.totalSales || 0;
        }

        // 미처리 주문 (정규화된 상태로 필터링)
        const normalizeStatus = (status) => {
          if (!status) return status;
          const upperStatus = String(status).toUpperCase();
          if (upperStatus === 'CONFIRMED') return 'APPROVED';
          if (upperStatus === 'CANCELED') return 'CANCELLED';
          return upperStatus;
        };
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.result || ordersRes?.data || []);
        const pendingOrders = orders.filter((o) => normalizeStatus(o.orderStatus || o.status) === 'PENDING').length;
        const lastOrders = orders
          .slice()
          .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map((o) => ({
            id: o.orderId || o.id,
            status: (o.orderStatus || o.status),
            totalAmount: o.totalAmount || 0,
            createdAt: o.createdAt,
            memberName: o.memberName || '-',
          }));

        // 재고 부족 (안전재고 이하)
        const inv = invRes?.result ?? invRes?.data ?? invRes ?? [];
        const lowStock = Array.isArray(inv)
          ? inv.filter((p) => (p.safetystock ?? p.safetyStock ?? 0) >= (p.stockQuantity ?? p.quantity ?? 0)).length
          : 0;

        setKpi({ todaySales, pendingOrders, lowStock, trend: 0 });
        setSalesStats(stats);
        setRecentOrders(lastOrders);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [branchId]);

  const chartData = useMemo(() => {
    if (!salesStats?.statistics) return [];
    return salesStats.statistics.map((it) => ({
      label: it.date || it.period || it.dayOfWeek || '',
      sales: (it.totalSales || 0) / 1000,
      orders: it.totalOrders || 0,
    }));
  }, [salesStats]);

  // 주문 상태를 한국어로 변환하는 함수
  const translateOrderStatus = (status) => {
    if (!status) return status;
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PENDING':
        return '대기중';
      case 'CONFIRMED':
      case 'APPROVED':
        return '승인됨';
      case 'CANCELLED':
      case 'CANCELED':
        return '취소됨';
      case 'REJECTED':
        return '거부됨';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  // 원 → 만원 → 억 자동 변환 포맷팅 함수
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0원';
    
    const numValue = typeof value === 'number' ? value : Number(value);
    
    // 1억 이상이면 억 단위로 표시
    if (numValue >= 100000000) {
      const eok = Math.floor(numValue / 100000000);
      const remainder = Math.floor((numValue % 100000000) / 10000);
      if (remainder > 0) {
        return `${eok}억 ${remainder}만원`;
      }
      return `${eok}억원`;
    }
    
    // 1만원 이상이면 만원 단위로 표시
    if (numValue >= 10000) {
      const man = Math.floor(numValue / 10000);
      const remainder = numValue % 10000;
      if (remainder > 0) {
        return `${man}만 ${remainder.toLocaleString()}원`;
      }
      return `${man}만원`;
    }
    
    // 그 외는 원 단위로 표시
    return `${numValue.toLocaleString()}원`;
  };

  if (loading) return <Page><Title>대시보드</Title>로딩 중...</Page>;

  return (
    <Page>
      <Title>대시보드</Title>
      <KPI>
        <KPICard>
          <KPIIcon $bg="#dbeafe"><Icon path={mdiCash} size={1.1} color="#1e40af" /></KPIIcon>
          <div>
            <KPILabel>오늘 매출</KPILabel>
            <KPIValue>{formatCurrency(kpi.todaySales || 0)}</KPIValue>
          </div>
        </KPICard>
        <KPICard>
          <KPIIcon $bg="#fef3c7"><Icon path={mdiPackageVariant} size={1.1} color="#92400e" /></KPIIcon>
          <div>
            <KPILabel>미처리 주문</KPILabel>
            <KPIValue>{kpi.pendingOrders}</KPIValue>
          </div>
        </KPICard>
        <KPICard>
          <KPIIcon $bg="#fee2e2"><Icon path={mdiAlertCircle} size={1.1} color="#991b1b" /></KPIIcon>
          <div>
            <KPILabel>재고 부족 품목</KPILabel>
            <KPIValue>{kpi.lowStock}</KPIValue>
          </div>
        </KPICard>
        <KPICard>
          <KPIIcon $bg="#d1fae5"><Icon path={mdiTrendingUp} size={1.1} color="#065f46" /></KPIIcon>
          <div>
            <KPILabel>주간 추이(천원)</KPILabel>
            <KPIValue>{chartData.length ? `${chartData[chartData.length-1].sales.toFixed(1)}k` : '0k'}</KPIValue>
          </div>
        </KPICard>
      </KPI>

      <GridLeftRight>
        <ChartsColumn>
          <ChartCard>
            <div style={{fontWeight:600, marginBottom:12}}>일별 매출 추이 (금액)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barCategoryGap="20%" maxBarSize={100}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}천원`} />
                <Legend />
                <Bar dataKey="sales" name="매출(천원)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard>
            <div style={{fontWeight:600, marginBottom:12}}>일별 주문 추이 (주문 수)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barCategoryGap="20%" maxBarSize={100}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}건`} />
                <Legend />
                <Bar dataKey="orders" name="주문수" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </ChartsColumn>

        <ChartCard>
          <div style={{fontWeight:600, marginBottom:12}}>최근 주문</div>
          <Table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>고객</th>
                <th>금액</th>
                <th>상태</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', color:'#6b7280', padding:'16px'}}>최근 주문이 없습니다.</td></tr>
              ) : recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.memberName}</td>
                  <td>{formatCurrency(o.totalAmount || 0)}</td>
                  <td>{translateOrderStatus(o.status)}</td>
                  <td>{formatDateKST(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ChartCard>
      </GridLeftRight>
    </Page>
  );
}

export default FranchiseDashboard;



