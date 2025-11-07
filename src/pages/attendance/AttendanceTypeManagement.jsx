// src/pages/attendance/AttendanceTypeManagement.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import {
  mdiPlus,
  mdiMagnify,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronDoubleLeft,
  mdiChevronDoubleRight,
  mdiChevronUp,
  mdiChevronDown,
} from '@mdi/js';
import { useAppSelector } from '../../stores/hooks';
import { useToast } from '../../components/common/Toast';
import {
  listWorkTypes,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from '../../service/attendanceTypeService';

// 공통 상수(테이블 표준 준수)
const ROW_H = 57;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100];

const COL_WIDTH_WORK = {
  id: 90,
  name: 280,
  flag: 160, // 지오펜스 필요
  _actions: 220,
};
const TABLE_MIN_WIDTH_WORK =
  COL_WIDTH_WORK.id + COL_WIDTH_WORK.name + COL_WIDTH_WORK.flag + COL_WIDTH_WORK._actions;

const COL_WIDTH_LEAVE = {
  id: 90,
  name: 280,
  flag: 120, // 유급
  _actions: 220,
};
const TABLE_MIN_WIDTH_LEAVE =
  COL_WIDTH_LEAVE.id + COL_WIDTH_LEAVE.name + COL_WIDTH_LEAVE.flag + COL_WIDTH_LEAVE._actions;

const Mdi = ({ path, size = 0.95, ...props }) => <Icon path={path} size={size} aria-hidden {...props} />;

// 탭 유형
const TABS = {
  WORK: 'WORK',
  LEAVE: 'LEAVE',
};

export default function AttendanceTypeManagement() {
  const { addToast } = useToast();
  const { role: rawRole } = useAppSelector((s) => s.auth);
  const role = useMemo(() => (rawRole || '').replace(/^ROLE_/, '').toUpperCase(), [rawRole]);

  // ✅ 정책 반영: 조회는 HQ/지점관리자/가맹오너, 수정/삭제는 HQ만
  const canView = useMemo(() => ['HQ_ADMIN', 'BRANCH_ADMIN', 'FRANCHISE_OWNER'].includes(role), [role]);
  const canManage = role === 'HQ_ADMIN';

  // 탭
  const [tab, setTab] = useState(TABS.WORK);

  // 공통 UI 상태
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');

  // 정렬(서버는 name 정렬만 사용)
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });

  // WorkType 상태
  const [workLoading, setWorkLoading] = useState(false);
  const [workItems, setWorkItems] = useState([]);
  const [workPage, setWorkPage] = useState(0);
  const [workPageSize, setWorkPageSize] = useState(20);
  const [workTotalPages, setWorkTotalPages] = useState(0);

  // LeaveType 상태
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveItems, setLeaveItems] = useState([]);
  const [leavePage, setLeavePage] = useState(0);
  const [leavePageSize, setLeavePageSize] = useState(20);
  const [leaveTotalPages, setLeaveTotalPages] = useState(0);

  // 모달 및 폼 상태
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null); // null=create
  const [form, setForm] = useState({ name: '', flag: false }); // flag: geofenceRequired | paid
  const nameInputRef = useRef(null);

  const toggleSort = (field) => {
    if (field !== 'name') return;
    if (tab === TABS.WORK) setWorkPage(0);
    else setLeavePage(0);
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return { field, dir: 'asc' };
    });
  };

  const SortIcon = ({ active, dir }) => (
    <HeadSort $active={active} aria-hidden>
      <Mdi path={dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
    </HeadSort>
  );

  /** ====== 서버 통신 ====== */
  const fetchWorkList = useCallback(async () => {
    if (!canView) return;
    setWorkLoading(true);
    try {
      const params = { page: workPage, size: workPageSize, sort: `${sort.field},${sort.dir}` };
      const data = await listWorkTypes(params);
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setWorkItems(content);
      setWorkTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : (Array.isArray(content) ? 1 : 0));
    } catch (e) {
      const status = e?.response?.status;
      const msg403 = e?.response?.data?.status_message || '근무 타입 조회 권한이 없습니다.';
      if (status === 403) {
        addToast({ type: 'warning', title: '권한 없음', message: msg403, duration: 3000 });
      } else {
        addToast({ type: 'error', title: '오류', message: '근무 타입을 불러오는 중 문제가 발생했습니다.', duration: 3000 });
      }
      setWorkItems([]);
      setWorkTotalPages(0);
    } finally {
      setWorkLoading(false);
    }
  }, [canView, workPage, workPageSize, sort.field, sort.dir, addToast]);

  const fetchLeaveList = useCallback(async () => {
    if (!canView) return;
    setLeaveLoading(true);
    try {
      const params = { page: leavePage, size: leavePageSize, sort: `${sort.field},${sort.dir}` };
      const data = await listLeaveTypes(params);
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setLeaveItems(content);
      setLeaveTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : (Array.isArray(content) ? 1 : 0));
    } catch (e) {
      const status = e?.response?.status;
      const msg403 = e?.response?.data?.status_message || '휴가 타입 조회 권한이 없습니다.';
      if (status === 403) {
        addToast({ type: 'warning', title: '권한 없음', message: msg403, duration: 3000 });
      } else {
        addToast({ type: 'error', title: '오류', message: '휴가 타입을 불러오는 중 문제가 발생했습니다.', duration: 3000 });
      }
      setLeaveItems([]);
      setLeaveTotalPages(0);
    } finally {
      setLeaveLoading(false);
    }
  }, [canView, leavePage, leavePageSize, sort.field, sort.dir, addToast]);

  // 탭/페이지/정렬 변경 시 목록 로딩
  useEffect(() => {
    if (tab === TABS.WORK) fetchWorkList();
  }, [tab, fetchWorkList]);

  useEffect(() => {
    if (tab === TABS.LEAVE) fetchLeaveList();
  }, [tab, fetchLeaveList]);

  // 검색
  const submitSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(searchDraft.trim());
    if (tab === TABS.WORK) setWorkPage(0);
    else setLeavePage(0);
  };

  // 프론트단 필터링(서버 검색은 미제공 → name 부분검색)
  const filteredWork = useMemo(() => {
    if (!search) return workItems;
    const q = search.toLowerCase();
    return (workItems || []).filter((r) => String(r.name || '').toLowerCase().includes(q));
  }, [workItems, search]);

  const filteredLeave = useMemo(() => {
    if (!search) return leaveItems;
    const q = search.toLowerCase();
    return (leaveItems || []).filter((r) => String(r.name || '').toLowerCase().includes(q));
  }, [leaveItems, search]);

  // 모달 열기/닫기/폼
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', flag: false });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };
  const openEdit = (row) => {
    setEditing(row);
    // work: geofenceRequired / leave: paid
    setForm({ name: row.name || '', flag: !!(tab === TABS.WORK ? row.geofenceRequired : row.paid) });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };
  const closeModal = () => {
    setOpenModal(false);
    setEditing(null);
    setForm({ name: '', flag: false });
  };

  // 저장/수정
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    const payload =
      tab === TABS.WORK
        ? { name: form.name?.trim(), geofenceRequired: !!form.flag }
        : { name: form.name?.trim(), paid: !!form.flag };

    if (!payload.name) {
      addToast({ type: 'warning', title: '안내', message: '이름을 입력해 주세요.', duration: 2200 });
      nameInputRef.current?.focus();
      return;
    }

    try {
      if (editing?.id) {
        if (tab === TABS.WORK) {
          await updateWorkType(editing.id, payload);
          addToast({ type: 'success', title: '완료', message: '근무 타입이 수정되었습니다.', duration: 2200 });
          fetchWorkList();
        } else {
          await updateLeaveType(editing.id, payload);
          addToast({ type: 'success', title: '완료', message: '휴가 타입이 수정되었습니다.', duration: 2200 });
          fetchLeaveList();
        }
      } else {
        if (tab === TABS.WORK) {
          await createWorkType(payload);
          addToast({ type: 'success', title: '완료', message: '근무 타입이 등록되었습니다.', duration: 2200 });
          fetchWorkList();
        } else {
          await createLeaveType(payload);
          addToast({ type: 'success', title: '완료', message: '휴가 타입이 등록되었습니다.', duration: 2200 });
          fetchLeaveList();
        }
      }
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.status_message ||
        err?.response?.data?.message ||
        (editing
          ? tab === TABS.WORK
            ? '근무 타입 수정 중 오류가 발생했습니다.'
            : '휴가 타입 수정 중 오류가 발생했습니다.'
          : tab === TABS.WORK
          ? '근무 타입 등록 중 오류가 발생했습니다.'
          : '휴가 타입 등록 중 오류가 발생했습니다.');
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  const onDelete = async (row) => {
    if (!canManage) return;
    const label = tab === TABS.WORK ? '근무 타입' : '휴가 타입';
    if (!window.confirm(`'(${row.id}) ${row.name}' ${label}을 삭제하시겠습니까?`)) return;
    try {
      if (tab === TABS.WORK) {
        await deleteWorkType(row.id);
        addToast({ type: 'success', title: '완료', message: '삭제되었습니다.', duration: 2200 });
        if (filteredWork.length === 1 && workPage > 0) setWorkPage((p) => p - 1);
        fetchWorkList();
      } else {
        await deleteLeaveType(row.id);
        addToast({ type: 'success', title: '완료', message: '삭제되었습니다.', duration: 2200 });
        if (filteredLeave.length === 1 && leavePage > 0) setLeavePage((p) => p - 1);
        fetchLeaveList();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.status_message ||
        err?.response?.data?.message ||
        '삭제 중 오류가 발생했습니다.';
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  // 페이지네이션 번호(공통 로직)
  const pageItems = useCallback((page, totalPages) => {
    const tp = Math.max(0, totalPages);
    const last = Math.max(0, tp - 1);
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i);
    let start = Math.max(1, page - 2);
    let end = Math.min(last - 1, page + 2);
    const need = 5 - (end - start + 1);
    if (need > 0) {
      if (start === 1) end = Math.min(last - 1, end + need);
      else if (end === last - 1) start = Math.max(1, start - need);
    }
    const items = [];
    items.push(0);
    if (start > 1) items.push('ellipsis');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < last - 1) items.push('ellipsis');
    items.push(last);
    return items;
  }, []);

  if (!canView) {
    return <div style={{ padding: 24 }}>타입 관리에 접근 권한이 없습니다.</div>;
  }

  // 현재 탭 기준 데이터/상태 선택
  const isWork = tab === TABS.WORK;
  const loading = isWork ? workLoading : leaveLoading;
  const list = isWork ? filteredWork : filteredLeave;
  const page = isWork ? workPage : leavePage;
  const setPage = isWork ? setWorkPage : setLeavePage;
  const pageSize = isWork ? workPageSize : leavePageSize;
  const setPageSize = isWork ? setWorkPageSize : setLeavePageSize;
  const totalPages = isWork ? workTotalPages : leaveTotalPages;

  return (
    <Wrap>
      <Header>
        <div>
          <Title>근무/휴가 타입 관리</Title>
          <Tabs>
            <TabButton
              className={isWork ? 'active' : ''}
              onClick={() => setTab(TABS.WORK)}
              type="button"
            >
              근무 타입
            </TabButton>
            <TabButton
              className={!isWork ? 'active' : ''}
              onClick={() => setTab(TABS.LEAVE)}
              type="button"
            >
              휴가 타입
            </TabButton>
          </Tabs>
        </div>
        <HeaderActions>
          <SearchBox as="form" onSubmit={submitSearch}>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="이름 검색"
            />
            <IconBtn type="submit" title="검색">
              <Mdi path={mdiMagnify} size={0.9} />
            </IconBtn>
          </SearchBox>

          <PageSizeWrap>
            <span>페이지당</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>개</span>
          </PageSizeWrap>

          <Primary onClick={openCreate} disabled={!canManage} title={canManage ? '등록' : 'HQ 관리자만 등록 가능'}>
            <Mdi path={mdiPlus} />
            등록
          </Primary>
        </HeaderActions>
      </Header>

      {/* 표 */}
      <TableWrap>
        <table style={{ minWidth: `${isWork ? TABLE_MIN_WIDTH_WORK : TABLE_MIN_WIDTH_LEAVE}px` }}>
          <colgroup>
            <col style={{ width: `${isWork ? COL_WIDTH_WORK.id : COL_WIDTH_LEAVE.id}px` }} />
            <col style={{ width: `${isWork ? COL_WIDTH_WORK.name : COL_WIDTH_LEAVE.name}px` }} />
            <col style={{ width: `${isWork ? COL_WIDTH_WORK.flag : COL_WIDTH_LEAVE.flag}px` }} />
            <col style={{ width: `${isWork ? COL_WIDTH_WORK._actions : COL_WIDTH_LEAVE._actions}px` }} />
          </colgroup>

          <thead>
            <tr>
              <th className="id">
                <HeadGroup><HeadLabel>번호</HeadLabel></HeadGroup>
              </th>
              <th className="name sortable" onClick={() => toggleSort('name')}>
                <HeadGroup>
                  <HeadLabel>이름</HeadLabel>
                  <SortIcon active={sort.field === 'name'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th className="flag">
                <HeadGroup>
                  {/* 라벨 변경 */}
                  <HeadLabel>{isWork ? 'GPS 적용 여부' : '유급 여부'}</HeadLabel>
                </HeadGroup>
              </th>
              <th>
                <HeadGroup><HeadLabel>조치</HeadLabel></HeadGroup>
              </th>
            </tr>
          </thead>

          <tbody>
            {!loading && (!list || list.length === 0) && (
              <tr>
                <td className="empty" colSpan={4}>데이터가 없습니다</td>
              </tr>
            )}

            {(list || []).map((row, idx) => (
              <tr key={`${isWork ? 'w' : 'l'}-${row.id}`}>
                <td className="id">{(page * pageSize) + idx + 1}</td>
                <td className="name"><strong>{row.name}</strong></td>
                {/* 값 표기 변경 */}
                <td className="flag">{isWork ? (row.geofenceRequired ? '필요' : '불필요') : (row.paid ? '유급' : '무급')}</td>
                <td>
                  <Actions>
                    <TextBtn
                      onClick={() => openEdit(row)}
                      disabled={!canManage}
                      title={canManage ? '수정' : 'HQ 관리자만 수정 가능'}
                    >
                      수정
                    </TextBtn>
                    <TextBtn
                      $danger
                      onClick={() => onDelete(row)}
                      disabled={!canManage}
                      title={canManage ? '삭제' : 'HQ 관리자만 삭제 가능'}
                    >
                      삭제
                    </TextBtn>
                  </Actions>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {/* 페이지네이션 */}
      <PaginationBar>
        <Pager>
          <button
            className="nav"
            disabled={page <= 0 || totalPages <= 1}
            onClick={() => setPage(0)}
            title="맨 처음으로"
          >
            <Mdi path={mdiChevronDoubleLeft} />
          </button>
          <button
            className="nav"
            disabled={page <= 0 || totalPages <= 1}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            title="이전"
          >
            <Mdi path={mdiChevronLeft} />
          </button>

          {pageItems(page, totalPages).map((it, idx) =>
            it === 'ellipsis' ? (
              <span key={`e${idx}`} className="ellipsis">…</span>
            ) : (
              <button
                key={it}
                className={`page ${it === page ? 'active' : ''}`}
                onClick={() => setPage(it)}
                type="button"
              >
                {it + 1}
              </button>
            )
          )}

          <button
            className="nav"
            disabled={page + 1 >= totalPages || totalPages <= 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            title="다음"
          >
            <Mdi path={mdiChevronRight} />
          </button>
          <button
            className="nav"
            disabled={page + 1 >= totalPages || totalPages <= 1}
            onClick={() => setPage(Math.max(0, totalPages - 1))}
            title="맨 끝으로"
          >
            <Mdi path={mdiChevronDoubleRight} />
          </button>
        </Pager>
      </PaginationBar>

      {/* 모달 */}
      {openModal && (
        <ModalBackdrop onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{editing ? (isWork ? '근무 타입 수정' : '휴가 타입 수정') : (isWork ? '근무 타입 등록' : '휴가 타입 등록')}</h3>
            </ModalHeader>
            <form onSubmit={onSubmit}>
              <FormRow>
                <label>이름</label>
                <input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={isWork ? '예: 기본 근무' : '예: 연차'}
                />
              </FormRow>

              <FormRow>
                {/* 라벨 변경 + 드롭다운으로 변경 */}
                <label>{isWork ? 'GPS 적용 여부' : '유급 여부'}</label>
                <select
                  value={String(!!form.flag)}
                  onChange={(e) => setForm((p) => ({ ...p, flag: e.target.value === 'true' }))}
                >
                  {isWork ? (
                    <>
                      <option value="true">필요</option>
                      <option value="false">불필요</option>
                    </>
                  ) : (
                    <>
                      <option value="true">유급</option>
                      <option value="false">무급</option>
                    </>
                  )}
                </select>
              </FormRow>

              <ModalActions>
                <GhostButton type="button" onClick={closeModal}>취소</GhostButton>
                <Primary type="submit" disabled={!canManage}>
                  {editing ? '수정' : '등록'}
                </Primary>
              </ModalActions>
            </form>
          </Modal>
        </ModalBackdrop>
      )}
    </Wrap>
  );
}

/* ===== 스타일 (AttendanceTemplateManagement와 동일 톤) ===== */
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
`;
const Tabs = styled.div`
  margin-top: 8px;
  display: inline-flex;
  gap: 8px;
`;
const TabButton = styled.button`
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &.active {
    border-color: #8b5cf6;
    background: #8b5cf6;
    color: #fff;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
`;
const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  width: clamp(200px, 22vw, 300px);
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 46px 0 12px;
  background: #fff;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus-within {
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
  }
  input {
    border: 0; outline: 0; width: 100%; font-size: 14px;
  }
`;
const PageSizeWrap = styled.label`
  display: inline-flex; align-items: center; gap: 8px; color: #374151; font-size: 14px;
  select {
    height: 44px; min-width: 112px; border: 1px solid #e5e7eb; border-radius: 10px;
    background: #fff; padding: 0 34px 0 10px; outline: 0; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
  }
`;
const Primary = styled.button`
  height: 44px; display: inline-flex; align-items: center; gap: 8px;
  background: #8b5cf6; color: #fff; border: 0; border-radius: 10px; padding: 0 14px; font-weight: 700; cursor: pointer;
  &:hover { filter: brightness(0.98); }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
const GhostButton = styled.button`
  height: 44px; display: inline-flex; align-items: center; gap: 8px;
  background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0 12px; cursor: pointer;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
const IconBtn = styled.button`
  position: absolute; right: 6px; width: 32px; height: 32px; display: grid; place-items: center;
  border: 0; background: transparent; color: #6b7280; cursor: pointer;
  &:hover { color: #4b5563; }
`;

const TableWrap = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  overflow-x: auto;
  width: 100%;

  table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    width: 100%;
  }

  thead th {
    position: relative;
    font-size: 14px;
    color: #6b7280;
    background: #fafafa;
    text-align: center;
    padding: 0 12px;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    height: ${ROW_H}px;
    vertical-align: middle;
  }
  th.sortable { cursor: pointer; user-select: none; }

  tbody td {
    padding: 0 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #374151;
    vertical-align: middle;
    white-space: nowrap;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    height: ${ROW_H}px;
  }
  tbody tr:hover { background: #fafafa; }

  .empty {
    color: #6b7280;
    text-align: center;
    height: ${ROW_H}px;
    padding: 0 12px;
    vertical-align: middle;
  }
`;

const HeadGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: ${ROW_H}px;
  width: 100%;
`;
const HeadLabel = styled.span`
  grid-column: 2;
  justify-self: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const HeadSort = styled.span`
  grid-column: 3;
  justify-self: start;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: ${(p) => (p.$active ? 1 : 0.35)};
`;

const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
`;
const TextBtn = styled.button`
  height: 30px;
  padding: 0 10px;
  min-width: 56px;
  border: 1px solid ${(p) => (p.$danger ? '#fecaca' : '#e5e7eb')};
  background: #fff;
  color: ${(p) => (p.$danger ? '#b91c1c' : '#374151')};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  line-height: 28px;
  &:hover { background: ${(p) => (p.$danger ? '#fff1f2' : '#f9fafb')}; }
  &:disabled { opacity: 0.45; cursor: not-allowed; background: #f3f4f6; border-color: #e5e7eb; color: #9ca3af; }
`;

const PaginationBar = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: auto;
  gap: 12px;
  justify-content: center;
  align-items: center;
`;
const Pager = styled.div`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  .nav { background: transparent; border: 0; padding: 6px 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
  .nav:disabled { opacity: 0.35; cursor: not-allowed; }
  .ellipsis { padding: 0 4px; color: #6b7280; user-select: none; }
  .page {
    min-width: 36px; height: 36px; border-radius: 10px; border: 1px solid #8b5cf6; background: #fff; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; font-weight: 700; color: #8b5cf6; padding: 0 10px;
  }
  .page.active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
`;

const ModalBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: grid; place-items: center; z-index: 50;
`;
const Modal = styled.div`
  width: min(520px, 92vw); background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px;
`;
const ModalHeader = styled.div`
  padding: 4px 4px 12px; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px;
  h3 { margin: 0; font-size: 18px; color: #111827; }
`;
const FormRow = styled.label`
  display: grid; grid-template-columns: 120px 1fr; gap: 10px; align-items: center; margin: 10px 0;
  > label { color: #374151; }
  input, select {
    height: 40px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0 12px; outline: 0;
    transition: box-shadow .15s ease, border-color .15s ease;
  }
  input:focus, select:focus {
    border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
  }
`;
const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;
`;

// 토글 스위치 비주얼(간단하게)
const SelectLike = styled.button`
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 0 12px;
  text-align: left;
  cursor: pointer;
  span {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 26px; border-radius: 14px;
    background: #f3f4f6; color: #374151; font-weight: 700;
  }
  span.on { background: #8b5cf6; color: #fff; }
`;
