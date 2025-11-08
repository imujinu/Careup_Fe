// src/pages/attendance/AttendanceTemplateManagement.jsx
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
  listAttendanceTemplates,
  createAttendanceTemplate,
  updateAttendanceTemplate,
  deleteAttendanceTemplate,
  broadcastAttendanceTemplateChanged,
} from '../../service/attendanceTemplateService';

// 공통 상수(테이블 표준 준수)
const ROW_H = 57;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100];

const COL_WIDTH = {
  id: 90,
  name: 240,
  clockIn: 140,
  breakStart: 140,
  breakEnd: 140,
  clockOut: 140,
  _actions: 200,
};
const TABLE_MIN_WIDTH =
  COL_WIDTH.id +
  COL_WIDTH.name +
  COL_WIDTH.clockIn +
  COL_WIDTH.breakStart +
  COL_WIDTH.breakEnd +
  COL_WIDTH.clockOut +
  COL_WIDTH._actions;

const Mdi = ({ path, size = 0.95, ...props }) => <Icon path={path} size={size} aria-hidden {...props} />;

// 시간을 HH:mm으로 보장
const normalizeTime = (v) => {
  if (!v) return '';
  if (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)) return v;
  try {
    const d = new Date(`1970-01-01T${v}`);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
};

export default function AttendanceTemplateManagement() {
  const { addToast } = useToast();
  const { role: rawRole } = useAppSelector((s) => s.auth);
  const role = useMemo(() => (rawRole || '').replace(/^ROLE_/, '').toUpperCase(), [rawRole]);

  // ✅ 정책 반영: 조회는 HQ/지점관리자/가맹오너, 수정/삭제는 HQ만
  const canView = useMemo(() => ['HQ_ADMIN','BRANCH_ADMIN','FRANCHISE_OWNER'].includes(role), [role]);
  const canManage = role === 'HQ_ADMIN';

  // 상태
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // 서버 정렬 필드: name
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  // 모달
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null); // null=create
  const [form, setForm] = useState({
    name: '',
    defaultClockIn: '',
    defaultBreakStart: '',
    defaultBreakEnd: '',
    defaultClockOut: '',
  });
  const nameInputRef = useRef(null);

  const fetchList = useCallback(async () => {
    if (!canView) return; // 권한 없으면 호출 금지
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sort: `${sort.field},${sort.dir}`,
      };
      const data = await listAttendanceTemplates(params);

      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      // 표시에 맞춰 time 정규화
      const normalized = content.map((t) => ({
        ...t,
        defaultClockIn: normalizeTime(t.defaultClockIn),
        defaultBreakStart: normalizeTime(t.defaultBreakStart),
        defaultBreakEnd: normalizeTime(t.defaultBreakEnd),
        defaultClockOut: normalizeTime(t.defaultClockOut),
      }));

      setItems(normalized);
      setTotalPages(
        Number.isFinite(data?.totalPages)
          ? data.totalPages
          : (Array.isArray(content) ? 1 : 0)
      );
    } catch (e) {
      const status = e?.response?.status;
      const msg403 = e?.response?.data?.status_message || '템플릿 조회 권한이 없습니다.';
      if (status === 403) {
        addToast({ type: 'warning', title: '권한 없음', message: msg403, duration: 3000 });
      } else {
        addToast({ type: 'error', title: '오류', message: '템플릿을 불러오는 중 문제가 발생했습니다.', duration: 3000 });
      }
      setItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort.field, sort.dir, addToast, canView]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const submitSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(searchDraft.trim());
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return (items || []).filter((r) => String(r.name || '').toLowerCase().includes(q));
  }, [items, search]);

  const list = filtered;

  const toggleSort = (field) => {
    setPage(0);
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

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      defaultClockIn: '',
      defaultBreakStart: '',
      defaultBreakEnd: '',
      defaultClockOut: '',
    });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      defaultClockIn: normalizeTime(row.defaultClockIn),
      defaultBreakStart: normalizeTime(row.defaultBreakStart),
      defaultBreakEnd: normalizeTime(row.defaultBreakEnd),
      defaultClockOut: normalizeTime(row.defaultClockOut),
    });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditing(null);
    setForm({
      name: '',
      defaultClockIn: '',
      defaultBreakStart: '',
      defaultBreakEnd: '',
      defaultClockOut: '',
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    const payload = {
      name: form.name?.trim(),
      defaultClockIn: form.defaultClockIn || null,
      defaultBreakStart: form.defaultBreakStart || null,
      defaultBreakEnd: form.defaultBreakEnd || null,
      defaultClockOut: form.defaultClockOut || null,
    };
    if (!payload.name) {
      addToast({ type: 'warning', title: '안내', message: '템플릿명을 입력해 주세요.', duration: 2200 });
      nameInputRef.current?.focus();
      return;
    }

    try {
      if (editing?.id) {
        await updateAttendanceTemplate(editing.id, payload);
        addToast({ type: 'success', title: '완료', message: '템플릿이 수정되었습니다.', duration: 2200 });
      } else {
        await createAttendanceTemplate(payload);
        addToast({ type: 'success', title: '완료', message: '템플릿이 등록되었습니다.', duration: 2200 });
      }
      broadcastAttendanceTemplateChanged();
      closeModal();
      fetchList();
    } catch (err) {
      const msg =
        err?.response?.data?.status_message ||
        err?.response?.data?.message ||
        (editing ? '템플릿 수정 중 오류가 발생했습니다.' : '템플릿 등록 중 오류가 발생했습니다.');
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  const onDelete = async (row) => {
    if (!canManage) return;
    if (!window.confirm(`'(${row.id}) ${row.name}' 템플릿을 삭제하시겠습니까?`)) return;
    try {
      await deleteAttendanceTemplate(row.id);
      addToast({ type: 'success', title: '완료', message: '삭제되었습니다.', duration: 2200 });
      if (list.length === 1 && page > 0) setPage((p) => p - 1);
      broadcastAttendanceTemplateChanged();
      fetchList();
    } catch (err) {
      const msg =
        err?.response?.data?.status_message ||
        err?.response?.data?.message ||
        '삭제 중 오류가 발생했습니다.';
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  // 서버에서 순서 이동 API를 제공하지 않으므로 비활성
  const canMove = false;

  const pageItems = useMemo(() => {
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
  }, [page, totalPages]);

  if (!canView) {
    return <div style={{ padding: 24 }}>템플릿 관리에 접근 권한이 없습니다.</div>;
  }

  return (
    <Wrap>
      <Header>
        <div>
          <Title>근무 템플릿 관리</Title>
        </div>
        <HeaderActions>
          <SearchBox as="form" onSubmit={submitSearch}>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="템플릿명 검색"
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
          <Primary onClick={openCreate} disabled={!canManage} title={canManage ? '템플릿 등록' : 'HQ 관리자만 등록 가능'}>
            <Mdi path={mdiPlus} />
            등록
          </Primary>
        </HeaderActions>
      </Header>

      <TableWrap>
        <table style={{ minWidth: `${TABLE_MIN_WIDTH}px` }}>
          <colgroup>
            <col style={{ width: `${COL_WIDTH.id}px` }} />
            <col style={{ width: `${COL_WIDTH.name}px` }} />
            <col style={{ width: `${COL_WIDTH.clockIn}px` }} />
            <col style={{ width: `${COL_WIDTH.breakStart}px` }} />
            <col style={{ width: `${COL_WIDTH.breakEnd}px` }} />
            <col style={{ width: `${COL_WIDTH.clockOut}px` }} />
            <col style={{ width: `${COL_WIDTH._actions}px` }} />
          </colgroup>

          <thead>
            <tr>
              <th className="id">
                <HeadGroup>
                  <HeadLabel>번호</HeadLabel>
                </HeadGroup>
              </th>
              <th className="name sortable" onClick={() => toggleSort('name')}>
                <HeadGroup>
                  <HeadLabel>템플릿명</HeadLabel>
                  <SortIcon active={sort.field === 'name'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th className="clockIn">
                <HeadGroup><HeadLabel>출근</HeadLabel></HeadGroup>
              </th>
              <th className="breakStart">
                <HeadGroup><HeadLabel>휴게 시작</HeadLabel></HeadGroup>
              </th>
              <th className="breakEnd">
                <HeadGroup><HeadLabel>휴게 종료</HeadLabel></HeadGroup>
              </th>
              <th className="clockOut">
                <HeadGroup><HeadLabel>퇴근</HeadLabel></HeadGroup>
              </th>
              <th>
                <HeadGroup><HeadLabel>조치</HeadLabel></HeadGroup>
              </th>
            </tr>
          </thead>

          <tbody>
            {!loading && (!list || list.length === 0) && (
              <tr>
                <td className="empty" colSpan={7}>데이터가 없습니다</td>
              </tr>
            )}

            {(list || []).map((row, idx) => (
              <tr key={row.id}>
                <td className="id">{page * pageSize + idx + 1}</td>
                <td className="name"><strong>{row.name}</strong></td>
                <td className="clockIn">{row.defaultClockIn || '-'}</td>
                <td className="breakStart">{row.defaultBreakStart || '-'}</td>
                <td className="breakEnd">{row.defaultBreakEnd || '-'}</td>
                <td className="clockOut">{row.defaultClockOut || '-'}</td>
                <td>
                  <Actions>
                    {false && (
                      <>
                        <IconSmallBtn type="button" title="위로" disabled>
                          <Mdi path={mdiChevronUp} size={0.85} />
                        </IconSmallBtn>
                        <IconSmallBtn type="button" title="아래로" disabled>
                          <Mdi path={mdiChevronDown} size={0.85} />
                        </IconSmallBtn>
                      </>
                    )}
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

          {pageItems.map((it, idx) =>
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

      {openModal && (
        <ModalBackdrop onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>{editing ? '템플릿 수정' : '템플릿 등록'}</h3>
            </ModalHeader>
            <form onSubmit={onSubmit}>
              <FormRow>
                <label>템플릿명</label>
                <input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 기본 근무(09:00~18:00)"
                />
              </FormRow>

              <FormRow>
                <label>출근</label>
                <input
                  type="time"
                  value={form.defaultClockIn || ''}
                  onChange={(e) => setForm((p) => ({ ...p, defaultClockIn: e.target.value }))}
                />
              </FormRow>
              <FormRow>
                <label>휴게 시작</label>
                <input
                  type="time"
                  value={form.defaultBreakStart || ''}
                  onChange={(e) => setForm((p) => ({ ...p, defaultBreakStart: e.target.value }))}
                />
              </FormRow>
              <FormRow>
                <label>휴게 종료</label>
                <input
                  type="time"
                  value={form.defaultBreakEnd || ''}
                  onChange={(e) => setForm((p) => ({ ...p, defaultBreakEnd: e.target.value }))}
                />
              </FormRow>
              <FormRow>
                <label>퇴근</label>
                <input
                  type="time"
                  value={form.defaultClockOut || ''}
                  onChange={(e) => setForm((p) => ({ ...p, defaultClockOut: e.target.value }))}
                />
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

// ===== 스타일 (테이블 표준 준수) =====
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

const IconSmallBtn = styled.button`
  height: 30px;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: .45; cursor: not-allowed; }
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
  width: min(520px, 92vw); background: #fff; border-radius: 14px; border: 1px solid #e5e7eb; padding: 16px;
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
