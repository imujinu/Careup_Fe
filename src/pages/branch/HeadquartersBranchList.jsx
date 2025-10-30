import React, { useEffect, useState, useMemo, useRef } from 'react';
import Icon from '@mdi/react';
import { mdiTune } from '@mdi/js';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { fetchBranchList, setParams, deleteBranchAction } from '../../stores/slices/branchSlice';
import BranchTable from '../../components/branchManagement/BranchTable';
import BranchTableSkeleton from '../../components/branchManagement/BranchTableSkeleton';
import Pagination from '../../components/branchManagement/Pagination';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { useToast } from '../../components/common/Toast';
import styled from 'styled-components';

const VISIBLE_COLS_KEY = 'branchList.visibleCols';
const SEARCH_IN_KEY = 'branchList.searchIn';
const FIXED_COLS = ['photo', 'id', 'name', 'actions'];

function HeadquartersBranchList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const { list, pagination, loading, error, params, deleteLoading, deleteError } = useAppSelector((s) => s.branch);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '' });
  const [searchTargets, setSearchTargets] = useState(() => {
    const saved = localStorage.getItem(SEARCH_IN_KEY);
    return saved ? JSON.parse(saved) : { name: true, businessDomain: true, address: true };
  });
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(VISIBLE_COLS_KEY);
    const base = saved ? JSON.parse(saved) : {
      photo: true,
      id: true,
      name: true,
      businessDomain: true,
      status: true,
      openDate: true,
      phone: true,
      businessNumber: true,
      corporationNumber: true,
      zipcode: true,
      address: true,
      actions: true,
    };
    FIXED_COLS.forEach(k => base[k] = true);
    return base;
  });
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);
  const [isSearchPickerOpen, setIsSearchPickerOpen] = useState(false);
  const fieldPickerRef = useRef(null);
  const searchPickerRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, branch: null });

  useEffect(() => {
    dispatch(fetchBranchList(params));
  }, [dispatch, params.page, params.size, params.sort, params.search, params.status]);

  const handleChangePage = (page) => {
    dispatch(setParams({ page }));
  };

  const handleSort = (field, direction) => {
    // Spring Boot 형식의 정렬 문자열 생성 (예: "name,asc" 또는 "id,desc")
    const sortString = `${field},${direction}`;
    dispatch(setParams({ sort: sortString, page: 0 })); // 정렬 변경시 첫 페이지로 이동
  };

  // 현재 정렬 상태 파싱
  const currentSort = useMemo(() => {
    if (!params.sort) return null;
    const [field, direction] = params.sort.split(',');
    return { field, direction: direction || 'asc' };
  }, [params.sort]);

  // 검색/필터링 (클라이언트 사이드 보조)
  const filteredList = useMemo(() => {
    let data = list;
    if (filters.status) {
      data = data.filter(b => (b.status || '').toLowerCase() === filters.status.toLowerCase());
    }
    // 업종 필터 입력창 제거: 검색창 필드 체크 방식 사용
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(branch => 
        branch.name?.toLowerCase().includes(term) ||
        branch.businessDomain?.toLowerCase().includes(term) ||
        branch.status?.toLowerCase().includes(term) ||
        branch.phone?.includes(term) ||
        branch.businessNumber?.includes(term) ||
        branch.address?.toLowerCase().includes(term)
      );
    }
    return data;
  }, [list, searchTerm, filters]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // 서버 파라미터 동기화 (지원 시)
    dispatch(setParams({ search: value, page: 0 }));
  };

  // 검색 대상 저장
  useEffect(() => {
    localStorage.setItem(SEARCH_IN_KEY, JSON.stringify(searchTargets));
  }, [searchTargets]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    dispatch(setParams({ [key]: value || undefined, page: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({ status: '' });
    setSearchTerm('');
    dispatch(setParams({ search: undefined, status: undefined, page: 0 }));
  };

  const handleRegisterClick = () => {
    console.log('등록 버튼 클릭됨 - 지점 등록 페이지로 이동');
    console.log('현재 경로:', window.location.pathname);
    console.log('이동할 경로: /branch/register');
    navigate('/branch/register');
  };

  const handleTestClick = () => {
    console.log('테스트 버튼 클릭됨');
    navigate('/branch/test-register');
  };

  const handleEditBranch = (branch) => {
    console.log('지점 수정 버튼 클릭됨:', branch);
    navigate(`/branch/edit/${branch.id}`);
  };

  // 컬럼 선택 토글 (사진/이름/조치는 고정)
  const toggleColumn = (key) => {
    if (FIXED_COLS.includes(key)) return; // fixed columns
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleShowAll = () => {
    setVisibleColumns(prev => ({ ...prev, id: true, businessDomain: true, status: true, openDate: true, phone: true, businessNumber: true, corporationNumber: true, zipcode: true, address: true }));
  };

  const handleHideAll = () => {
    setVisibleColumns(prev => ({ ...prev, id: true, businessDomain: false, status: false, openDate: false, phone: false, businessNumber: false, corporationNumber: false, zipcode: false, address: false }));
  };

  // 외부 클릭 시 필드 피커 닫기
  useEffect(() => {
    const onClickOutside = (e) => {
      if (fieldPickerRef.current && !fieldPickerRef.current.contains(e.target)) {
        setIsFieldPickerOpen(false);
      }
      if (searchPickerRef.current && !searchPickerRef.current.contains(e.target)) {
        setIsSearchPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const next = { ...visibleColumns };
    FIXED_COLS.forEach(k => next[k] = true);
    localStorage.setItem(VISIBLE_COLS_KEY, JSON.stringify(next));
  }, [visibleColumns]);

  // CSV 내보내기 (엑셀로 열 수 있음)
  const handleExportCsv = () => {
    const rows = filteredList;
    const colDefs = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '지점명' },
      { key: 'businessDomain', label: '업종' },
      { key: 'status', label: '지점상태' },
      { key: 'openDate', label: '개업일' },
      { key: 'phone', label: '지점 전화번호' },
      { key: 'businessNumber', label: '사업자등록번호' },
      { key: 'corporationNumber', label: '법인등록번호' },
      { key: 'zipcode', label: '지점 우편번호' },
      { key: 'address', label: '지점 주소', map: (r) => [r.address, r.addressDetail].filter(Boolean).join(' ') },
    ].filter(c => visibleColumns[c.key] !== false); // respect visible columns

    const header = colDefs.map(c => c.label).join(',');
    const body = rows.map(r => colDefs.map(c => {
      const raw = c.map ? c.map(r) : (r[c.key] ?? '-');
      const val = String(raw).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')).join('\n');
    const csv = [header, body].join('\n');
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `branches_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel(xlsx) 내보내기 (가능하면 xlsx, 실패 시 CSV)
  const handleExportXlsx = async () => {
    const rows = filteredList;
    const colDefs = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '지점명' },
      { key: 'businessDomain', label: '업종' },
      { key: 'status', label: '지점상태' },
      { key: 'openDate', label: '개업일' },
      { key: 'phone', label: '지점 전화번호' },
      { key: 'businessNumber', label: '사업자등록번호' },
      { key: 'corporationNumber', label: '법인등록번호' },
      { key: 'zipcode', label: '지점 우편번호' },
      { key: 'address', label: '지점 주소', map: (r) => [r.address, r.addressDetail].filter(Boolean).join(' ') },
    ].filter(c => visibleColumns[c.key] !== false);

    try {
      const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js');
      const ExcelJS = mod?.default || window.ExcelJS;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('지점목록', { views: [{ state: 'frozen', ySplit: 1 }] });

      const headers = colDefs.map(c => c.label);
      const data = rows.map(r => colDefs.map(c => (c.map ? c.map(r) : (r[c.key] ?? ''))));

      ws.columns = colDefs.map(() => ({ width: 20, style: { alignment: { vertical: 'middle', horizontal: 'center', wrapText: true } } }));

      const headerRow = ws.addRow(headers);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      data.forEach((row) => {
        const r = ws.addRow(row);
        r.height = 20;
        r.eachCell((cell) => {
          cell.font = { size: 11 };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `지점목록_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      handleExportCsv();
    }
  };

  const handleViewBranchDetail = (branch) => {
    console.log('지점 상세 보기 클릭됨:', branch);
    navigate(`/branch/detail/${branch.id}`);
  };

  const handleDeleteBranch = (branch) => {
    console.log('지점 삭제 버튼 클릭됨:', branch);
    setDeleteModal({ isOpen: true, branch });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.branch) return;
    
    try {
      await dispatch(deleteBranchAction(deleteModal.branch.id)).unwrap();
      setDeleteModal({ isOpen: false, branch: null });
      
      // 성공 토스트 알림
      addToast({
        type: 'success',
        title: '지점 삭제 완료',
        message: `${deleteModal.branch.name} 지점이 성공적으로 삭제되었습니다.`,
        duration: 3000
      });
    } catch (error) {
      console.error('지점 삭제 실패:', error);
      
      // 실패 토스트 알림
      addToast({
        type: 'error',
        title: '지점 삭제 실패',
        message: error || '지점 삭제 중 오류가 발생했습니다.',
        duration: 3000
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, branch: null });
  };

  return (
    <Wrap>
      <HeaderRow>
        <div>
          <Title>지점관리</Title>
          <Sub>지점의 기본 정보를 관리하고 목록을 조회합니다</Sub>
        </div>
        <HeaderActions>
          <FieldPickerWrap ref={fieldPickerRef}>
            <SecondaryButton type="button" onClick={() => setIsFieldPickerOpen(v => !v)} title="표시할 열 선택">필드</SecondaryButton>
            {isFieldPickerOpen && (
              <FieldPicker>
                <FieldPickerHeader>
                  <span>표시할 열 선택</span>
                  <div>
                    <SmallLinkButton onClick={handleShowAll}>모두 보이기</SmallLinkButton>
                    <SmallLinkButton onClick={handleHideAll}>모두 숨기기</SmallLinkButton>
                  </div>
                </FieldPickerHeader>
                <FieldList>
                  {[
                    { key: 'photo', label: '사진', fixed: true },
                    { key: 'id', label: 'ID', fixed: true },
                    { key: 'name', label: '지점명', fixed: true },
                    { key: 'businessDomain', label: '업종' },
                    { key: 'status', label: '지점상태' },
                    { key: 'openDate', label: '개업일' },
                    { key: 'phone', label: '지점 전화번호' },
                    { key: 'businessNumber', label: '사업자등록번호' },
                    { key: 'corporationNumber', label: '법인등록번호' },
                    { key: 'zipcode', label: '지점 우편번호' },
                    { key: 'address', label: '지점 주소' },
                    { key: 'actions', label: '조치', fixed: true },
                  ].map(c => (
                    <FieldItem key={c.key} $disabled={c.fixed} onClick={() => toggleColumn(c.key)}>
                      <input type="checkbox" checked={!!visibleColumns[c.key]} onChange={() => toggleColumn(c.key)} disabled={c.fixed} />
                      <span>{c.label}{c.fixed ? ' (고정)' : ''}</span>
                    </FieldItem>
                  ))}
                </FieldList>
              </FieldPicker>
            )}
          </FieldPickerWrap>
          <SecondaryButton type="button" onClick={handleExportXlsx} title="엑셀 내보내기">엑셀 내보내기</SecondaryButton>
          <PrimaryButton type="button" onClick={handleRegisterClick} title="지점 등록">등록</PrimaryButton>
        </HeaderActions>
      </HeaderRow>

      <Toolbar>
        <FieldPickerWrap ref={searchPickerRef}>
          <SearchBox>
            <input placeholder="지점명, 업종, 주소 검색" value={searchTerm} onChange={handleSearch} />
            <IconBtn type="button" title="검색 필드 선택" onClick={() => setIsSearchPickerOpen(v => !v)}>
              <Icon path={mdiTune} size={0.9} aria-hidden />
            </IconBtn>
          </SearchBox>
          {isSearchPickerOpen && (
            <FieldPicker style={{ left: 0, top: 46 }}>
              <FieldPickerHeader>
                <span>검색 대상 필드</span>
              </FieldPickerHeader>
              <FieldList>
                {[
                  { key: 'name', label: '지점명' },
                  { key: 'businessDomain', label: '업종' },
                  { key: 'address', label: '주소' },
                ].map(c => (
                  <FieldItem key={c.key}>
                    <input type="checkbox" checked={!!searchTargets[c.key]} onChange={(e) => setSearchTargets(p => ({ ...p, [c.key]: e.target.checked }))} />
                    <span>{c.label}</span>
                  </FieldItem>
                ))}
              </FieldList>
            </FieldPicker>
          )}
        </FieldPickerWrap>
        <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} title="지점 상태">
          <option value="">상태: 전체</option>
          <option value="OPENED">운영 중</option>
          <option value="SUSPENDED">운영 중지</option>
          <option value="CLOSED">폐점</option>
        </Select>
        <SecondaryButton type="button" onClick={handleClearFilters} title="필터 초기화">초기화</SecondaryButton>
      </Toolbar>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {loading ? (
        <BranchTableSkeleton rows={pagination.size || 5} />
      ) : (
        <BranchTable 
          branches={filteredList} 
          onSort={handleSort}
          currentSort={currentSort}
          onEdit={handleEditBranch}
          onDelete={handleDeleteBranch}
          onViewDetail={handleViewBranchDetail}
          visibleColumns={visibleColumns}
        />
      )}

      {!loading && (
        <PagerBar>
          <Pager>
            <button className="nav" disabled={pagination.currentPage <= 0} onClick={() => handleChangePage(Math.max(0, pagination.currentPage - 1))} title="이전">〈</button>
            {Array.from({ length: pagination.totalPages || 0 }, (_, i) => i)
              .slice(Math.max(0, (pagination.currentPage || 0) - 3), Math.min((pagination.totalPages || 0), (pagination.currentPage || 0) + 4))
              .map((p) => (
                <button key={p} className={`page ${p === pagination.currentPage ? 'active' : ''}`} onClick={() => handleChangePage(p)}>{p + 1}</button>
              ))}
            <button className="nav" disabled={(pagination.currentPage + 1) >= (pagination.totalPages || 0)} onClick={() => handleChangePage((pagination.currentPage || 0) + 1)} title="다음">〉</button>
          </Pager>
          <GotoForm onSubmit={(e)=>{e.preventDefault(); const form = e.currentTarget; const num = Number(form.page.value); if(!Number.isNaN(num)){ const idx = Math.min(Math.max(num-1,0),(pagination.totalPages||1)-1); handleChangePage(idx);} }}>
            <span>페이지 이동</span>
            <input name="page" type="number" min={1} max={Math.max(1, pagination.totalPages||1)} placeholder="번호" />
            <button type="submit">이동</button>
          </GotoForm>
        </PagerBar>
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="지점 삭제"
        message="해당 지점을 영구히 삭제하시겠습니까?"
        itemName={deleteModal.branch?.name}
        isLoading={deleteLoading}
      />
    </Wrap>
  );
}

export default HeadquartersBranchList;

const Wrap = styled.div`
  padding: 24px;
  padding-bottom: 80px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Sub = styled.p`
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchInput = styled.input`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const InputSmall = styled.input`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  width: 160px;
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
`;

const PrimaryButton = styled.button`
  background: #6d28d9;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #5b21b6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background: #4c1d95;
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.3);
  }
`;

const SecondaryButton = styled.button`
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  &:hover { background: #f9fafb; }
`;

const ErrorMsg = styled.div`
  color: #b91c1c;
  margin-bottom: 8px;
`;

const FieldPickerWrap = styled.div`
  position: relative;
`;

const FieldPicker = styled.div`
  position: absolute;
  right: 0;
  top: 40px;
  width: 320px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  padding: 12px;
  z-index: 20;
`;

const FieldPickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
`;

const SmallLinkButton = styled.button`
  background: transparent;
  border: none;
  color: #6d28d9;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
`;

const FieldList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FieldItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  ${props => props.$disabled ? 'opacity: 0.6; cursor: not-allowed;' : ''}
  &:hover { background: #f9fafb; }
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: clamp(220px, 26vw, 360px);
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 44px 0 12px;
  background: #fff;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus-within {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
  }
  input {
    border: 0;
    outline: 0;
    width: 100%;
    font-size: 14px;
    background: transparent;
  }
`;

const IconBtn = styled.button`
  position: absolute;
  right: 6px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  &:hover { color: #4b5563; }
`;

const PagerBar = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: auto auto;
  gap: 12px;
  justify-content: center;
  align-items: center;
`;

const Pager = styled.div`
  display: inline-flex;
  gap: 6px;
  align-items: center;

  .nav {
    background: transparent;
    border: 0;
    padding: 6px 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .nav:disabled { opacity: 0.35; cursor: not-allowed; }
  .page {
    min-width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #8b5cf6;
    background: #fff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #8b5cf6;
    padding: 0 10px;
  }
  .page.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
`;

const GotoForm = styled.form`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  input {
    width: 72px;
    height: 34px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0 10px;
    font-size: 13px;
    outline: 0;
    transition: box-shadow .15s ease, border-color .15s ease;
  }
  input:focus {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
  }
  button {
    height: 34px;
    border-radius: 8px;
    padding: 0 12px;
    border: 1px solid #8b5cf6;
    background: #8b5cf6;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }
`;

