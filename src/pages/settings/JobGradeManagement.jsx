// src/pages/settings/JobGradeManagement.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  listJobGrades,
  createJobGrade,
  updateJobGrade,
  deleteJobGrade,
  broadcastJobGradeChanged,
  moveJobGrade,         // ✅ 순서 이동 API
  // reorderJobGrades   // (DnD 도입 시 사용)
} from '../../service/jobGradeService';

// 공통 상수(다른 테이블과 높이 통일)
const ROW_H = 57;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100];

const COL_WIDTH = {
  id: 90,
  name: 220,
  authorityType: 160,
  createdAt: 180,
  updatedAt: 180,
  _actions: 210, // 이동 버튼 추가로 살짝 확대
};
const TABLE_MIN_WIDTH =
  COL_WIDTH.id +
  COL_WIDTH.name +
  COL_WIDTH.authorityType +
  COL_WIDTH.createdAt +
  COL_WIDTH.updatedAt +
  COL_WIDTH._actions;

const Mdi = ({ path, size = 0.95, ...props }) => <Icon path={path} size={size} aria-hidden {...props} />;

const AUTHORITY_OPTIONS = [
  { value: 'HQ_ADMIN', label: '본사관리자' },
  { value: 'BRANCH_ADMIN', label: '지점관리자' },
  { value: 'FRANCHISE_OWNER', label: '가맹점주' },
  { value: 'STAFF', label: '직원' },
];

const AUTH_LABEL = AUTHORITY_OPTIONS.reduce((m, o) => (m[o.value] = o.label, m), {});

export default function JobGradeManagement() {
  const { addToast } = useToast();
  const { role: rawRole } = useAppSelector((s) => s.auth);
  const role = useMemo(() => (rawRole || '').replace(/^ROLE_/, '').toUpperCase(), [rawRole]);
  const isHqAdmin = role === 'HQ_ADMIN';

  // 상태
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

  // ✅ 기본 정렬을 orderIndex 로(이동 후 즉시 반영)
  const [sort, setSort] = useState({ field: 'orderIndex', dir: 'asc' });
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  // 모달
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null); // null=create
  const [form, setForm] = useState({ name: '', authorityType: 'STAFF' });
  const nameInputRef = useRef(null);

  // ✅ 서버 정렬 허용 필드에 orderIndex 포함
  const serverSortable = new Set(['orderIndex', 'id', 'name', 'authorityType', 'createdAt', 'updatedAt']);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sort: serverSortable.has(sort.field) ? `${sort.field},${sort.dir}` : undefined,
      };
      const data = await listJobGrades(params);

      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setItems(content);
      setTotalPages(
        Number.isFinite(data?.totalPages)
          ? data.totalPages
          : (Array.isArray(content) ? 1 : 0)
      );
    } catch (e) {
      addToast({ type: 'error', title: '오류', message: '직급 목록을 불러오는 중 문제가 발생했습니다.', duration: 3000 });
      setItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sort.field, sort.dir, addToast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ✅ 다른 탭/라우트도 실시간 갱신 수신
  useEffect(() => {
    const handleLocal = () => fetchList();
    const handleStorage = (e) => {
      if (e?.key === 'jobGrade:ping') fetchList();
    };

    window.addEventListener('jobGrade:changed', handleLocal);
    window.addEventListener('storage', handleStorage);

    let bc;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('jobGrade');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'changed') fetchList();
      };
    }
    return () => {
      window.removeEventListener('jobGrade:changed', handleLocal);
      window.removeEventListener('storage', handleStorage);
      bc?.close();
    };
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
    // '번호' 헤더 클릭은 정렬 변화 없이 orderIndex 유지
    if (field === 'id') field = 'orderIndex';
    setPage(0);
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      // 마지막 클릭에서 기본(orderIndex)으로 복귀
      return { field: 'orderIndex', dir: 'asc' };
    });
  };

  const SortIcon = ({ active, dir }) => (
    <HeadSort $active={active} aria-hidden>
      <Mdi path={dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
    </HeadSort>
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', authorityType: 'STAFF' });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', authorityType: row.authorityType || 'STAFF' });
    setOpenModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditing(null);
    setForm({ name: '', authorityType: 'STAFF' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isHqAdmin) return;
    const payload = { name: form.name?.trim(), authorityType: form.authorityType };
    if (!payload.name) {
      addToast({ type: 'warning', title: '안내', message: '직급명을 입력해 주세요.', duration: 2200 });
      nameInputRef.current?.focus();
      return;
    }
    try {
      if (editing) {
        await updateJobGrade(editing.id, payload);
        addToast({ type: 'success', title: '완료', message: '직급이 수정되었습니다.', duration: 2200 });
      } else {
        await createJobGrade(payload);
        addToast({ type: 'success', title: '완료', message: '직급이 등록되었습니다.', duration: 2200 });
      }
      broadcastJobGradeChanged();
      closeModal();
      fetchList();
    } catch (err) {
      const msg =
        err?.response?.data?.status_message ||
        err?.response?.data?.message ||
        (editing ? '직급 수정 중 오류가 발생했습니다.' : '직급 등록 중 오류가 발생했습니다.');
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  const onDelete = async (row) => {
    if (!isHqAdmin) return;
    if (!window.confirm(`'(${row.id}) ${row.name}' 직급을 삭제하시겠습니까?`)) return;
    try {
      await deleteJobGrade(row.id);
      addToast({ type: 'success', title: '완료', message: '삭제되었습니다.', duration: 2200 });
      if (list.length === 1 && page > 0) setPage((p) => p - 1);
      broadcastJobGradeChanged();
      fetchList();
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        status === 409
          ? '해당 직급을 사용하는 직원이 있어 삭제할 수 없습니다.'
          : (err?.response?.data?.status_message ||
             err?.response?.data?.message ||
             '삭제 중 오류가 발생했습니다.');
      addToast({ type: 'error', title: '오류', message: msg, duration: 3200 });
    }
  };

  // ✅ 순서 이동(낙관적 스왑 + 서버 반영 + 브로드캐스트)
  const move = async (id, direction) => {
    if (!isHqAdmin) return;

    // 1) 낙관적 스왑: 현재 페이지에서만 이웃과 자리바꿈
    setItems((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((x) => x.id === id);
      if (idx === -1) return prev;
      if (direction === 'UP' && idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      } else if (direction === 'DOWN' && idx < arr.length - 1) {
        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      }
      return arr;
    });

    // 2) 서버 반영
    try {
      await moveJobGrade(id, direction);
      // 3) 전파 + 서버 기준 재조회(다른 탭/페이지 포함)
      broadcastJobGradeChanged();
      fetchList();
    } catch (e) {
      // 실패 시 서버 데이터로 롤백 동기화
      addToast({ type: 'error', title: '오류', message: '순서를 변경하지 못했습니다.', duration: 2800 });
      fetchList();
    }
  };

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

  return (
    <Wrap>
      <Header>
        <div>
          <Title>직급관리</Title>
        </div>
        <HeaderActions>
          <SearchBox as="form" onSubmit={submitSearch}>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="직급명 검색"
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
          <Primary onClick={openCreate} disabled={!isHqAdmin} title={isHqAdmin ? '직급 등록' : '본사관리자만 등록 가능'}>
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
            <col style={{ width: `${COL_WIDTH.authorityType}px` }} />
            <col style={{ width: `${COL_WIDTH.createdAt}px` }} />
            <col style={{ width: `${COL_WIDTH.updatedAt}px` }} />
            <col style={{ width: `${COL_WIDTH._actions}px` }} />
          </colgroup>

          <thead>
            <tr>
              {/* '번호'는 페이지 순번 표기이므로 정렬 영향과 무관(비활성화) */}
              <th className="id">
                <HeadGroup>
                  <HeadLabel>번호</HeadLabel>
                </HeadGroup>
              </th>
              <th className="name sortable" onClick={() => toggleSort('name')}>
                <HeadGroup>
                  <HeadLabel>직급명</HeadLabel>
                  <SortIcon active={sort.field === 'name'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th className="authorityType sortable" onClick={() => toggleSort('authorityType')}>
                <HeadGroup>
                  <HeadLabel>권한유형</HeadLabel>
                  <SortIcon active={sort.field === 'authorityType'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th className="createdAt sortable" onClick={() => toggleSort('createdAt')}>
                <HeadGroup>
                  <HeadLabel>생성일</HeadLabel>
                  <SortIcon active={sort.field === 'createdAt'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th className="updatedAt sortable" onClick={() => toggleSort('updatedAt')}>
                <HeadGroup>
                  <HeadLabel>수정일</HeadLabel>
                  <SortIcon active={sort.field === 'updatedAt'} dir={sort.dir} />
                </HeadGroup>
              </th>
              <th>
                <HeadGroup>
                  <HeadLabel>조치</HeadLabel>
                </HeadGroup>
              </th>
            </tr>
          </thead>

          <tbody>
            {!loading && (!list || list.length === 0) && (
              <tr>
                <td className="empty" colSpan={6}>데이터가 없습니다</td>
              </tr>
            )}

            {(list || []).map((row, idx) => (
              <tr key={row.id}>
                {/* ✅ DB id 대신 페이지 순번 */}
                <td className="id">{page * pageSize + idx + 1}</td>
                <td className="name"><strong>{row.name}</strong></td>
                <td className="authorityType">{AUTH_LABEL[row.authorityType] || row.authorityType || '-'}</td>
                <td className="createdAt">{formatDate(row.createdAt)}</td>
                <td className="updatedAt">{formatDate(row.updatedAt)}</td>
                <td>
                  <Actions>
                    {/* 순서 이동(본사 관리자만) */}
                    <IconSmallBtn
                      type="button"
                      title="위로"
                      onClick={() => move(row.id, 'UP')}
                      disabled={!isHqAdmin}
                    >
                      <Mdi path={mdiChevronUp} size={0.85} />
                    </IconSmallBtn>
                    <IconSmallBtn
                      type="button"
                      title="아래로"
                      onClick={() => move(row.id, 'DOWN')}
                      disabled={!isHqAdmin}
                    >
                      <Mdi path={mdiChevronDown} size={0.85} />
                    </IconSmallBtn>

                    <TextBtn
                      onClick={() => openEdit(row)}
                      disabled={!isHqAdmin}
                      title={isHqAdmin ? '수정' : '본사관리자만 수정 가능'}
                    >
                      수정
                    </TextBtn>
                    <TextBtn
                      $danger
                      onClick={() => onDelete(row)}
                      disabled={!isHqAdmin}
                      title={isHqAdmin ? '삭제' : '본사관리자만 삭제 가능'}
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
              <h3>{editing ? '직급 수정' : '직급 등록'}</h3>
            </ModalHeader>
            <form onSubmit={onSubmit}>
              <FormRow>
                <label>직급명</label>
                <input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 점장"
                />
              </FormRow>
              <FormRow>
                <label>권한유형</label>
                <select
                  value={form.authorityType}
                  onChange={(e) => setForm((p) => ({ ...p, authorityType: e.target.value }))}
                  disabled={!isHqAdmin}
                  title={isHqAdmin ? undefined : '본사관리자만 변경 가능'}
                >
                  {AUTHORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {!isHqAdmin && <Help>본사 외 계정은 ‘직원’만 생성/수정 가능합니다.</Help>}
              </FormRow>

              <ModalActions>
                <GhostButton type="button" onClick={closeModal}>취소</GhostButton>
                <Primary type="submit" disabled={!isHqAdmin}>
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

// 유틸
function formatDate(v) {
  if (!v) return '-';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(v);
  }
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
const Help = styled.div`
  grid-column: 2 / span 1; font-size: 12px; color: #6b7280; margin-top: 6px;
`;
const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;
`;
