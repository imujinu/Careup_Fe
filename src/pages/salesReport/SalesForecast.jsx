import React, { useState, useEffect, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiChartLine, mdiSend, mdiCalculator, mdiDownload, mdiFileExcel } from '@mdi/js';
import { format } from 'date-fns';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchSalesForecast,
  calculateSalesForecast,
  saveSalesForecast,
  calculateAndSaveAllBranchForecasts,
} from '../../stores/slices/salesReportSlice';
import { branchService } from '../../service/branchService';
import { salesReportService } from '../../service/salesReportService';
import { useToast } from '../../components/common/Toast';

const Section = styled.div`
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 200px;
  height: 42px;
  box-sizing: border-box;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
  width: 150px;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  box-sizing: border-box;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #6b46c1;
          color: white;
          &:hover {
            background: #553c9a;
          }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover {
            background: #059669;
          }
        `;
      case 'warning':
        return `
          background: #f59e0b;
          color: white;
          &:hover {
            background: #d97706;
          }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          &:hover {
            background: #e5e7eb;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #6b46c1;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const InfoValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1f2937;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  ${props => {
    if (props.$type === 'current') {
      return 'background: #dcfce7; color: #16a34a;';
    }
    return 'background: #f3f4f6; color: #6b7280;';
  }}
`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(value);
};

const SalesForecast = React.forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const { salesForecast, forecastCalculation, loading, error } = useSelector((state) => state.salesReport);
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [forecastDays, setForecastDays] = useState(30);
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 지점 목록 가져오기
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.fetchBranches({ size: 100 });
        setBranches(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedBranchId(response.data[0].id);
        }
      } catch (err) {
        console.error('지점 목록 가져오기 실패:', err);
      }
    };
    fetchBranches();
  }, []);

  const handleFetchForecast = () => {
    if (selectedBranchId) {
      dispatch(fetchSalesForecast(selectedBranchId));
    }
  };

  const handleCalculateForecast = async () => {
    if (selectedBranchId) {
      try {
        await dispatch(calculateSalesForecast({ branchId: selectedBranchId, forecastDays })).unwrap();
        toast.addToast({
          type: 'success',
          title: '계산 완료',
          message: '예상 매출액 계산이 완료되었습니다.',
        });
      } catch (err) {
        toast.addToast({
          type: 'error',
          title: '계산 실패',
          message: err.message || '알 수 없는 오류가 발생했습니다.',
        });
      }
    }
  };

  const handleSendForecast = async () => {
    if (!salesForecast?.currentForecast) return;

    setSending(true);
    try {
      await dispatch(saveSalesForecast({
        branchId: salesForecast.currentForecast.branchId,
        amount: salesForecast.currentForecast.amount,
        periodStart: salesForecast.currentForecast.periodStart,
        periodEnd: salesForecast.currentForecast.periodEnd,
      })).unwrap();

      toast.addToast({
        type: 'success',
        title: '전송 완료',
        message: '예상 매출액이 전송되었습니다.',
      });
      handleFetchForecast();
    } catch (err) {
      toast.addToast({
        type: 'error',
        title: '전송 실패',
        message: err.message || '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendToAllClick = () => {
    setShowConfirmModal(true);
  };

  const handleSendToAll = async () => {
    setShowConfirmModal(false);
    setSending(true);
    try {
      await dispatch(calculateAndSaveAllBranchForecasts(forecastDays)).unwrap();
      toast.addToast({
        type: 'success',
        title: '전송 완료',
        message: '모든 지점에 예상 매출액이 전송되었습니다.',
      });
    } catch (err) {
      toast.addToast({
        type: 'error',
        title: '전송 실패',
        message: err.message || '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await salesReportService.exportSalesForecast(forecastDays);
      
      toast.addToast({
        type: 'success',
        title: '다운로드 완료',
        message: '엑셀 파일이 다운로드되었습니다.',
      });
    } catch (error) {
      toast.addToast({
        type: 'error',
        title: '다운로드 실패',
        message: error.message || '엑셀 파일 다운로드에 실패했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    isExporting,
  }));

  const prepareChartData = () => {
    if (!salesForecast?.forecastHistory) return [];
    return salesForecast.forecastHistory.map((item, index) => ({
      name: `이력 ${index + 1}`,
      예상매출: item.amount || 0,
      일자: format(new Date(item.createdAt), 'yyyy-MM-dd'),
    }));
  };

  const chartData = prepareChartData();

  return (
    <>
      <Section>
        <Card>
          <CardTitle>
            <Icon path={mdiCalculator} size={1} />
            지점 선택
          </CardTitle>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Select
              value={selectedBranchId || ''}
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
            >
              <option value="">지점 선택</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branchName || branch.name}
                </option>
              ))}
            </Select>
            <Button onClick={handleFetchForecast} disabled={!selectedBranchId}>
              조회
            </Button>
          </div>
        </Card>
      </Section>

      {loading ? (
        <Card>
          <div>로딩 중...</div>
        </Card>
      ) : error ? (
        <Card>
          <div style={{ color: '#dc2626' }}>에러: {error}</div>
        </Card>
      ) : salesForecast ? (
        <>
          <Section>
            <Card>
              <CardTitle>
                <Icon path={mdiChartLine} size={1} />
                현재 예상 매출액
              </CardTitle>
              {salesForecast.currentForecast ? (
                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>지점명</InfoLabel>
                    <InfoValue>{salesForecast.branchName}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>예상 매출액</InfoLabel>
                    <InfoValue>
                      {formatCurrency(salesForecast.currentForecast.amount || 0)}
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>기간</InfoLabel>
                    <InfoValue>
                      {format(new Date(salesForecast.currentForecast.periodStart), 'yyyy-MM-dd')}
                      ~ {format(new Date(salesForecast.currentForecast.periodEnd), 'yyyy-MM-dd')}
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>생성일시</InfoLabel>
                    <InfoValue>
                      {format(new Date(salesForecast.currentForecast.createdAt), 'yyyy-MM-dd HH:mm')}
                    </InfoValue>
                  </InfoCard>
                </InfoGrid>
              ) : (
                <div style={{ color: '#6b7280' }}>현재 적용 중인 예상 매출액이 없습니다.</div>
              )}
            </Card>
          </Section>

          <Section>
            <Card>
              <CardTitle>
                <Icon path={mdiSend} size={1} />
                예상 매출액 관리
              </CardTitle>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Input
                  type="number"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                  placeholder="예측 기간 (일)"
                />
              </div>
              <ButtonGroup>
                <Button $variant="primary" onClick={handleCalculateForecast} disabled={!selectedBranchId}>
                  <Icon path={mdiCalculator} size={0.9} />
                  계산
                </Button>
                <Button $variant="success" onClick={handleSendForecast} disabled={!salesForecast?.currentForecast || sending}>
                  <Icon path={mdiSend} size={0.9} />
                  전송
                </Button>
                <Button $variant="warning" onClick={handleSendToAllClick} disabled={sending}>
                  <Icon path={mdiDownload} size={0.9} />
                  전체 전송
                </Button>
              </ButtonGroup>
            </Card>
          </Section>

          {forecastCalculation && (
            <Section>
              <Card>
                <CardTitle>
                  <Icon path={mdiCalculator} size={1} />
                  계산 결과
                </CardTitle>
                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>지점명</InfoLabel>
                    <InfoValue>{forecastCalculation.branchName || 'N/A'}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>예상 매출액</InfoLabel>
                    <InfoValue>
                      {formatCurrency(forecastCalculation.amount || 0)}
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>기간</InfoLabel>
                    <InfoValue>
                      {forecastCalculation.periodStart && forecastCalculation.periodEnd
                        ? `${format(new Date(forecastCalculation.periodStart), 'yyyy-MM-dd')} ~ ${format(new Date(forecastCalculation.periodEnd), 'yyyy-MM-dd')}`
                        : 'N/A'}
                    </InfoValue>
                  </InfoCard>
                  {forecastCalculation.forecastBasis && (
                    <InfoCard>
                      <InfoLabel>예측 근거</InfoLabel>
                      <InfoValue style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                        {forecastCalculation.forecastBasis}
                      </InfoValue>
                    </InfoCard>
                  )}
                </InfoGrid>
              </Card>
            </Section>
          )}

          {chartData.length > 0 && (
            <Section>
              <Card>
                <CardTitle>예상 매출액 이력</CardTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="예상매출" stroke="#6b46c1" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          <Section>
            <Card>
              <CardTitle>예상 매출액 이력 테이블</CardTitle>
              {salesForecast.forecastHistory && salesForecast.forecastHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>예상 매출액</TableHeaderCell>
                      <TableHeaderCell>기간</TableHeaderCell>
                      <TableHeaderCell>생성일시</TableHeaderCell>
                      <TableHeaderCell>상태</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {salesForecast.forecastHistory.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatCurrency(item.amount || 0)}</TableCell>
                        <TableCell>
                          {format(new Date(item.periodStart), 'yyyy-MM-dd')}
                          ~ {format(new Date(item.periodEnd), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                        <TableCell>
                          {index === 0 ? (
                            <Badge $type="current">현재</Badge>
                          ) : (
                            <Badge>이력</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>
                  예상 매출액 이력이 없습니다.
                </div>
              )}
            </Card>
          </Section>
        </>
      ) : (
        <Card>
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>
            지점을 선택하고 조회 버튼을 클릭하세요.
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSendToAll}
        title="전체 전송 확인"
        message="모든 지점에 예상 매출액을 자동 계산하여 전송하시겠습니까?"
        confirmText="전송"
        cancelText="취소"
        confirmColor="#f59e0b"
        isLoading={sending}
      />
    </>
  );
});

export default SalesForecast;

