import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiCash, mdiPackageVariant, mdiAlertCircle, mdiTrendingUp } from '@mdi/js';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useAppSelector } from '../../stores/hooks';
import { salesReportService } from '../../service/salesReportService';
import orderService from '../../service/orderService';
import { inventoryService } from '../../service/inventoryService';

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
          branchId ? salesReportService.getBranchSalesStatistics(branchId, fmt(start), fmt(end), 'DAY') : Promise.resolve(null),
          branchId ? orderService.getOrdersByBranch(branchId) : Promise.resolve([]),
          branchId ? inventoryService.getBranchProducts(branchId) : Promise.resolve({ result: [] }),
        ]);

        // 매출 KPI
        let todaySales = 0;
        if (stats?.statistics?.length) {
          const todayKey = fmt(end);
          const todayItem = stats.statistics.find((x) => x.date === todayKey || x.period === todayKey);
          todaySales = todayItem?.totalSales || 0;
        }

        // 미처리 주문
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.result || ordersRes?.data || []);
        const pendingOrders = orders.filter((o) => (o.orderStatus || o.status) === 'PENDING').length;
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

  if (loading) return <Page><Title>대시보드</Title>로딩 중...</Page>;

  return (
    <Page>
      <Title>대시보드</Title>
      <KPI>
        <KPICard>
          <KPIIcon $bg="#dbeafe"><Icon path={mdiCash} size={1.1} color="#1e40af" /></KPIIcon>
          <div>
            <KPILabel>오늘 매출</KPILabel>
            <KPIValue>₩{(kpi.todaySales||0).toLocaleString()}</KPIValue>
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

      <Grid2>
        <ChartCard>
          <div style={{fontWeight:600, marginBottom:12}}>일별 매출 추이 (천원)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" name="매출(천원)" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" name="주문수" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

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
                  <td>₩{(o.totalAmount||0).toLocaleString()}</td>
                  <td>{String(o.status).toUpperCase()}</td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ChartCard>
      </Grid2>
    </Page>
  );
}

export default FranchiseDashboard;


