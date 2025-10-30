// src/pages/staff/StaffList.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import {
  fetchStaffListByBranchAction,
  fetchStaffListAction,
  deactivateStaffAction,
  rehireStaffAction,
  clearErrors,
} from '../../stores/slices/staffSlice';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import Icon from '@mdi/react';
import {
  mdiMagnify,
  mdiTune,
  mdiPlus,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronUp,
  mdiChevronDown,
  mdiChevronDoubleLeft,
  mdiChevronDoubleRight,
  mdiFocusField,
} from '@mdi/js';
import excelIcon from '../../assets/icons/excel_icon.svg';

const omitEmpty = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => !(v === '' || v === undefined || v === null)));

const DEFAULT_VISIBLE_COLS = {
  id: true,
  photo: true,
  name: true,
  jobGrade: true,
  branches: true,
  employeeNumber: true,
  dateOfBirth: true,
  gender: true,
  email: true,
  mobile: true,
  hireDate: true,
  terminateDate: true,
  employmentStatus: true,
  employmentType: true,
  remark: true,
};

const FIXED_COLS = ['id', 'photo', 'name', 'jobGrade'];
const VISIBLE_COLS_KEY = 'staffList.visibleCols';
const SEARCH_IN_KEY = 'staffList.searchIn';
const PAGE_SIZE_KEY = 'staffList.pageSize';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50, 100, 'ALL'];

const STATUS_ORDER = { ACTIVE: 0, ON_LEAVE: 1, TERMINATED: 2 };
const TYPE_ORDER = { FULL_TIME: 0, PART_TIME: 1 };
const GENDER_ORDER = { MALE: 0, FEMALE: 1 };

const COL_WIDTH = {
  _check: 65,
  id: 75,
  photo: 75,
  name: 155,
  jobGrade: 125,
  _actions: 175,
};

const MIN_DYN_PX_DEFAULT = 200;
const COL_WIDTH_DYN = {
  branches: 265,
  employeeNumber: 175,
  dateOfBirth: 175,
  gender: 125,
  email: 350,
  mobile: 175,
  hireDate: 175,
  terminateDate: 175,
  employmentStatus: 175,
  employmentType: 175,
  remark: 350,
};
const getDynWidthPx = (key) => COL_WIDTH_DYN[key] ?? MIN_DYN_PX_DEFAULT;

const ROW_H = 56;
const SEARCH_FETCH_SIZE = 2000;

const SERVER_SORTABLE_FIELDS = new Set([
  'id',
  'name',
  'employeeNumber',
  'dateOfBirth',
  'gender',
  'email',
  'mobile',
  'hireDate',
  'terminateDate',
  'employmentStatus',
  'employmentType',
]);

// === 윈도우 스크롤 기반 가상 스크롤 설정 ===
const OVERSCAN = 6;

const Mdi = ({ path, size = 0.95, ...props }) => <Icon path={path} size={size} aria-hidden {...props} />;

export default function StaffList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { user: me, branchId, role: rawRole } = useAppSelector((s) => s.auth);
  const role = useMemo(() => (rawRole || '').replace(/^ROLE_/, '').toUpperCase(), [rawRole]);
  const isHqAdmin = role === 'HQ_ADMIN';

  const myIdCandidates = useMemo(() => {
    const ids = new Set();
    if (me?.id) ids.add(me.id);
    if (me?.employeeId) ids.add(me.employeeId);
    if (me?.staffId) ids.add(me.staffId);
    return ids;
  }, [me]);

  const { list, pagination, loading, error, deactivateError, rehireError } = useAppSelector((s) => s.staff);

  const [allList, setAllList] = useState(null);
  const [globalList, setGlobalList] = useState(null);
  const usingGlobalList = !!globalList;

  const [page, setPage] = useState(0);
  const [gotoDraft, setGotoDraft] = useState('');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [searchIn, setSearchIn] = useState(() => {
    const saved = localStorage.getItem(SEARCH_IN_KEY);
    return saved ? JSON.parse(saved) : { name: true, email: true, mobile: true };
  });

  const [pageSize, setPageSize] = useState(() => {
    const savedRaw = localStorage.getItem(PAGE_SIZE_KEY);
    if (savedRaw === 'ALL') return 'ALL';
    const savedNum = Number(savedRaw);
    return PAGE_SIZE_OPTIONS.includes(savedNum) ? savedNum : 20;
  });

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem(VISIBLE_COLS_KEY);
    const base = saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLS;
    FIXED_COLS.forEach((k) => (base[k] = true));
    return base;
  });

  const [sort, setSort] = useState({ field: 'id', dir: 'desc' }); // 기본: id desc
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openColumnPanel, setOpenColumnPanel] = useState(false);
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
  const [exporting, setExporting] = useState(false);

  const columnBtnRef = useRef(null);
  const columnPanelRef = useRef(null);
  const searchFilterBtnRef = useRef(null);
  const searchPanelRef = useRef(null);

  // === 윈도우 스크롤 가상 스크롤에서 기준이 되는 tbody 참조 ===
  const rowsHostRef = useRef(null);
  const [virt, setVirt] = useState({ start: 0, end: 0 });
  const virtActive = pageSize === 'ALL';

  const Avatar = ({ url, name }) => (
    <AvatarWrap>{url ? <img src={url} alt={name} /> : <span>{(name || '?').slice(0, 1)}</span>}</AvatarWrap>
  );

  const renderBranches = (r) => {
    const names = (r.dispatches || [])
      .map((d) => d.branchName || d.branch?.name)
      .filter(Boolean);
    return names.length ? names.join(', ') : '-';
  };

  const COLUMNS = useMemo(
    () => [
      { key: 'id', title: '번호', sortable: false, render: () => null },
      { key: 'photo', title: '사진', sortable: false, render: (r) => <Avatar url={r.profileImageUrl} name={r.name} /> },
      { key: 'name', title: '성명', sortable: true, render: (r) => <strong>{r.name}</strong>, sortField: 'name' },
      {
        key: 'jobGrade',
        title: '직급',
        sortable: true,
        render: (r) => r.jobGradeName || r.jobGrade?.name || '-',
        sortField: 'jobGrade',
      },
      { key: 'branches', title: '소속지점', sortable: true, render: renderBranches, sortField: 'branches' },
      { key: 'employeeNumber', title: '사번', sortable: true, render: (r) => r.employeeNumber, sortField: 'employeeNumber' },
      { key: 'dateOfBirth', title: '생년월일', sortable: true, render: (r) => r.dateOfBirth || '-', sortField: 'dateOfBirth' },
      { key: 'gender', title: '성별', sortable: true, render: (r) => (r.gender === 'FEMALE' ? '여' : '남'), sortField: 'gender' },
      { key: 'email', title: '이메일', sortable: true, render: (r) => r.email, sortField: 'email' },
      { key: 'mobile', title: '휴대폰', sortable: true, render: (r) => r.mobile, sortField: 'mobile' },
      { key: 'hireDate', title: '입사일', sortable: true, render: (r) => r.hireDate || '-', sortField: 'hireDate' },
      { key: 'terminateDate', title: '퇴사일', sortable: true, render: (r) => r.terminateDate || '-', sortField: 'terminateDate' },
      {
        key: 'employmentStatus',
        title: '고용상태',
        sortable: true,
        render: (r) => (
          <Badge $type={r.employmentStatus}>
            {r.employmentStatus === 'ACTIVE' ? '재직' : r.employmentStatus === 'ON_LEAVE' ? '휴직' : '퇴사'}
          </Badge>
        ),
        sortField: 'employmentStatus',
      },
      {
        key: 'employmentType',
        title: '고용형태',
        sortable: true,
        render: (r) => (r.employmentType === 'FULL_TIME' ? '정규직' : '계약직'),
        sortField: 'employmentType',
      },
      { key: 'remark', title: '비고', sortable: false, render: (r) => <Remark>{r.remark || '-'}</Remark> },
    ],
    []
  );

  const effectiveTargets = useMemo(
    () => Object.entries(searchIn).filter(([, v]) => !!v).map(([k]) => k),
    [searchIn]
  );
  const hasTargets = effectiveTargets.length > 0;

  useEffect(() => {
    const onDocClick = (e) => {
      if (openColumnPanel) {
        if (!columnPanelRef.current?.contains(e.target) && !columnBtnRef.current?.contains(e.target)) {
          setOpenColumnPanel(false);
        }
      }
      if (openSearchPanel) {
        if (!searchPanelRef.current?.contains(e.target) && !searchFilterBtnRef.current?.contains(e.target)) {
          setOpenSearchPanel(false);
        }
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openColumnPanel, openSearchPanel]);

  // ===== 데이터 조회 =====
  const buildQueryParams = useCallback(
    (p, s) => {
      const includeSearch = !!search && hasTargets;
      const serverSort =
        sort.field && SERVER_SORTABLE_FIELDS.has(sort.field)
          ? `${sort.field},${sort.dir}`
          : undefined;

      return omitEmpty({
        page: includeSearch ? 0 : p,
        size: includeSearch ? SEARCH_FETCH_SIZE : s,
        ...(includeSearch ? { search, targets: effectiveTargets.join(',') } : {}),
        ...(serverSort ? { sort: serverSort } : {}),
      });
    },
    [search, hasTargets, effectiveTargets, sort]
  );

  const fetchOnePageForExport = useCallback(
    async (p, s) => {
      const params = buildQueryParams(p, s);
      if (isHqAdmin) {
        return dispatch(fetchStaffListAction({ params })).unwrap();
      } else {
        return dispatch(fetchStaffListByBranchAction({ branchId, params })).unwrap();
      }
    },
    [dispatch, isHqAdmin, branchId, buildQueryParams]
  );

  const fetchAllForExport = useCallback(async () => {
    const PAGE_CHUNK = 500;
    let pageIdx = 0;
    let totalP = 1;
    const acc = [];
    while (pageIdx < totalP) {
      const res = await fetchOnePageForExport(pageIdx, PAGE_CHUNK);
      const content = res?.content || res?.data?.content || res?.list || [];
      const tp = res?.totalPages ?? res?.data?.totalPages;
      const te = res?.totalElements ?? res?.data?.totalElements;
      if (typeof tp === 'number') totalP = tp;
      else if (typeof te === 'number') totalP = Math.max(1, Math.ceil(te / PAGE_CHUNK));
      acc.push(...content);
      if (!content.length) break;
      pageIdx += 1;
    }
    return acc;
  }, [fetchOnePageForExport]);

  const fetchData = useCallback(() => {
    const includeSearch = !!search && hasTargets;
    const serverSort =
      sort.field && SERVER_SORTABLE_FIELDS.has(sort.field)
        ? `${sort.field},${sort.dir}`
        : undefined;

    const params = omitEmpty({
      page: includeSearch ? 0 : page,
      size: includeSearch ? SEARCH_FETCH_SIZE : (pageSize === 'ALL' ? 1 : pageSize),
      ...(includeSearch ? { search, targets: effectiveTargets.join(',') } : {}),
      ...(serverSort ? { sort: serverSort } : {}),
    });

    if (pageSize === 'ALL') {
      setAllList(null);
      (async () => {
        try {
          const all = await fetchAllForExport();
          setAllList(all);
        } catch {
          // ignore
        } finally {
          if (isHqAdmin) dispatch(fetchStaffListAction({ params: { page: 0, size: 1 } }));
          else if (branchId) dispatch(fetchStaffListByBranchAction({ branchId, params: { page: 0, size: 1 } }));
        }
      })();
      return;
    }

    if (isHqAdmin) {
      dispatch(fetchStaffListAction({ params }));
    } else {
      if (!branchId) return;
      dispatch(fetchStaffListByBranchAction({ branchId, params }));
    }
  }, [dispatch, isHqAdmin, branchId, page, pageSize, search, hasTargets, effectiveTargets, sort, fetchAllForExport]);

  // 클라이언트 정렬(서버 불가 필드 선택 시 전체 수집)
  useEffect(() => {
    let cancelled = false;
    if (!sort.field || SERVER_SORTABLE_FIELDS.has(sort.field)) {
      setGlobalList(null);
      setPage(0);
      return () => { cancelled = true; };
    }
    (async () => {
      try {
        const all = await fetchAllForExport();
        if (!cancelled) {
          setGlobalList(all);
          setPage(0);
        }
      } catch {
        if (!cancelled) setGlobalList(null);
      }
    })();
    return () => { cancelled = true; };
  }, [sort.field, sort.dir, fetchAllForExport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (error) {
      addToast({ type: 'error', title: '오류', message: error, duration: 3000 });
      dispatch(clearErrors());
    }
  }, [error, addToast, dispatch]);

  useEffect(() => {
    if (deactivateError) addToast({ type: 'error', title: '비활성화 실패', message: deactivateError, duration: 3000 });
    if (rehireError) addToast({ type: 'error', title: '재입사 실패', message: rehireError, duration: 3000 });
    if (deactivateError || rehireError) dispatch(clearErrors());
  }, [deactivateError, rehireError, addToast, dispatch]);

  useEffect(() => {
    const next = { ...visibleCols };
    FIXED_COLS.forEach((k) => (next[k] = true));
    localStorage.setItem(VISIBLE_COLS_KEY, JSON.stringify(next));
  }, [visibleCols]);

  useEffect(() => {
    localStorage.setItem(SEARCH_IN_KEY, JSON.stringify(searchIn));
  }, [searchIn]);

  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_KEY, String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    setPage(0);
    if (pageSize !== 'ALL') setAllList(null);
  }, [pageSize, search]);

  const sourceList = useMemo(
    () => (globalList ? globalList : (pageSize === 'ALL' ? (allList ?? list) : list)),
    [globalList, pageSize, allList, list]
  );

  const pageOffset = useMemo(() => {
    if (pageSize === 'ALL') return 0;
    if (usingGlobalList) return page * (typeof pageSize === 'number' ? pageSize : 20);
    if (search && hasTargets) return page * (typeof pageSize === 'number' ? pageSize : 20);
    const p = pagination?.page ?? 0;
    const s = pagination?.size ?? (typeof pageSize === 'number' ? pageSize : 20);
    return p * s;
  }, [pageSize, usingGlobalList, search, hasTargets, page, pagination?.page, pagination?.size]);

  const getComparable = (row, field) => {
    switch (field) {
      case 'id':
        return Number(row.id ?? 0);
      case '_createdAt': // ★ 인덱스(번호) 정렬 전용: createdAt 우선, 없으면 id
      case 'createdAt':
        return row.createdAt ? new Date(row.createdAt).getTime() : Number(row.id ?? 0);
      case 'name':
        return String(row.name ?? '');
      case 'jobGrade':
        return String(row.jobGradeName || row.jobGrade?.name || '');
      case 'branches':
        return renderBranches(row);
      case 'employeeNumber':
        return String(row.employeeNumber ?? '');
      case 'dateOfBirth':
      case 'hireDate':
      case 'terminateDate':
        return row[field] ? new Date(row[field]).getTime() : 0;
      case 'gender':
        return GENDER_ORDER[row.gender] ?? 99;
      case 'email':
      case 'mobile':
        return String(row[field] ?? '');
      case 'employmentStatus':
        return STATUS_ORDER[row.employmentStatus] ?? 99;
      case 'employmentType':
        return TYPE_ORDER[row.employmentType] ?? 99;
      default:
        return String(row[field] ?? '');
    }
  };
  const localeStringCompare = (a, b) => a.localeCompare(b, 'ko', { sensitivity: 'base', numeric: true });
  const compare = (a, b, field) => {
    if (!field) return 0;
    const av = getComparable(a, field);
    const bv = getComparable(b, field);
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    if (typeof av === 'string' && typeof bv === 'string') return localeStringCompare(av, bv);
    return (av ?? 0) - (bv ?? 0);
  };

  const filtered = useMemo(() => {
    if (!search || !hasTargets) return sourceList;
    const q = search.toLowerCase();
    const pick = (r, key) => {
      if (key === 'name') return String(r.name ?? '');
      if (key === 'email') return String(r.email ?? '');
      if (key === 'mobile') return String(r.mobile ?? '');
      return '';
    };
    return (sourceList || []).filter((r) => effectiveTargets.some((t) => pick(r, t).toLowerCase().includes(q)));
  }, [sourceList, search, hasTargets, effectiveTargets]);

  const sorted = useMemo(() => {
    if (!sort.field) return filtered || [];
    const cloned = [...(filtered || [])];
    cloned.sort((a, b) => {
      const res = compare(a, b, sort.field);
      return sort.dir === 'desc' ? -res : res;
    });
    return cloned;
  }, [filtered, sort]);

  const listById = useMemo(() => new Map((sorted || []).map((r) => [r.id, r])), [sorted]);

  const getExportRows = useCallback(async () => {
    if (selectedIds.size > 0) {
      const picked = Array.from(selectedIds)
        .map((id) => listById.get(id))
        .filter(Boolean);
      const dedup = Array.from(new Map(picked.map((r) => [r.id, r])).values());
      if (!sort.field) return dedup;
      const cloned = [...dedup];
      cloned.sort((a, b) => {
        const res = compare(a, b, sort.field);
        return sort.dir === 'desc' ? -res : res;
      });
      return cloned;
    }
    const all = usingGlobalList ? (globalList || []) : await fetchAllForExport();
    if (!sort.field) return all;
    const cloned = [...all];
    cloned.sort((a, b) => {
      const res = compare(a, b, sort.field);
      return sort.dir === 'desc' ? -res : res;
    });
    return cloned;
  }, [selectedIds, listById, sort, fetchAllForExport, usingGlobalList, globalList]);

  const totalPagesServer = pagination?.totalPages ?? 0;
  const totalPages = useMemo(() => {
    if (pageSize === 'ALL') return 1;
    if (usingGlobalList) {
      const size = typeof pageSize === 'number' ? pageSize : 20;
      return Math.max(1, Math.ceil((sorted?.length || 0) / size));
    }
    if (search && hasTargets) {
      const size = typeof pageSize === 'number' ? pageSize : 20;
      return Math.max(1, Math.ceil((sorted?.length || 0) / size));
    }
    return totalPagesServer || 0;
  }, [pageSize, usingGlobalList, sorted?.length, search, hasTargets, totalPagesServer]);

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

  const currentRows = useMemo(() => {
    if (pageSize === 'ALL') return sorted || [];
    const size = typeof pageSize === 'number' ? pageSize : 20;

    if (usingGlobalList || (search && hasTargets)) {
      const start = page * size;
      return (sorted || []).slice(start, start + size);
    }
    return sorted || [];
  }, [sorted, page, pageSize, usingGlobalList, search, hasTargets]);

  // ====== 윈도우 스크롤 가상 스크롤 계산 (ALL 모드에서만 활성) ======
  useEffect(() => {
    if (!virtActive) return;
    const recalc = () => {
      const host = rowsHostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const total = (sorted?.length || 0);

      const scrollTopWithin = Math.max(0, -rect.top);
      const start = Math.max(0, Math.floor(scrollTopWithin / ROW_H) - OVERSCAN);
      const visCount = Math.ceil(vh / ROW_H) + OVERSCAN * 2;
      const end = Math.min(total, start + visCount);

      setVirt({ start, end });
    };

    recalc();
    window.addEventListener('scroll', recalc, { passive: true });
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc);
      window.removeEventListener('resize', recalc);
    };
  }, [virtActive, sorted?.length]);

  const renderRows = useMemo(() => {
    if (!virtActive) return currentRows || [];
    const rows = sorted || [];
    return rows.slice(virt.start, virt.end);
  }, [virtActive, currentRows, sorted, virt.start, virt.end]);

  const topSpacerH = virtActive ? virt.start * ROW_H : 0;
  const bottomSpacerH = virtActive ? Math.max(0, ((sorted?.length || 0) - virt.end) * ROW_H) : 0;

  const visibleRowOffset = virtActive ? 0 : pageOffset;

  const bulkDeactivate = async (ids) => {
    const results = await Promise.allSettled(ids.map((id) => dispatch(deactivateStaffAction(id)).unwrap()));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    addToast({ type: fail ? 'warning' : 'success', title: '퇴사 처리', message: `성공 ${ok}건, 실패 ${fail}건`, duration: 2800 });
    setSelectedIds(new Set());
    fetchData();
  };

  const bulkRehire = async (ids) => {
    const results = await Promise.allSettled(ids.map((id) => dispatch(rehireStaffAction(id)).unwrap()));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    addToast({ type: fail ? 'warning' : 'success', title: '재입사 처리', message: `성공 ${ok}건, 실패 ${fail}건`, duration: 2800 });
    setSelectedIds(new Set());
    fetchData();
  };

  const handleTerminateClick = async (row) => {
    const baseIds = selectedIds.size > 0 ? Array.from(selectedIds) : [row.id];
    const targets = baseIds
      .filter((id) => !myIdCandidates.has(id))
      .filter((id) => {
        const r = listById.get(id);
        return r && r.employmentStatus !== 'TERMINATED';
      });
    if (targets.length === 0) {
      addToast({ type: 'info', title: '안내', message: '처리할 대상이 없습니다.', duration: 2000 });
      return;
    }
    if (!window.confirm(`선택된 ${targets.length}명을 퇴사 처리하시겠습니까? (본인은 자동 제외)`)) return;
    await bulkDeactivate(targets);
  };

  const handleRehireClick = async (row) => {
    const baseIds = selectedIds.size > 0 ? Array.from(selectedIds) : [row.id];
    const targets = baseIds
      .filter((id) => !myIdCandidates.has(id))
      .filter((id) => {
        const r = listById.get(id);
        return r && r.employmentStatus === 'TERMINATED';
      });
    if (targets.length === 0) {
      addToast({ type: 'info', title: '안내', message: '재입사 처리 대상이 없습니다.', duration: 2000 });
      return;
    }
    if (!window.confirm(`선택된 ${targets.length}명을 재입사 처리하시겠습니까? (본인은 자동 제외)`)) return;
    await bulkRehire(targets);
  };

  const submitSearch = (e) => {
    if (e) e.preventDefault();
    setSearch(searchDraft.trim());
    setPage(0);
  };

  const loadExcelJs = () =>
    new Promise((resolve, reject) => {
      if (window.ExcelJS) return resolve(window.ExcelJS);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
      s.onload = () => resolve(window.ExcelJS);
      s.onerror = reject;
      document.head.appendChild(s);
    });

  const computeTextLen = (v) => {
    const s = (v ?? '').toString();
    let len = 0;
    for (const ch of s) len += ch.charCodeAt(0) > 127 ? 2 : 1;
    return len;
  };

  const limitByKey = (key) => {
    if (key === 'remark') return 60;
    if (key === 'branches') return 50;
    if (key === 'name') return 24;
    if (key === 'email') return 60;
    return 22;
  };

  const minByKey = (key) => {
    if (key === 'email') return 18;
    return 10;
  };

  const buildExportMatrix = (rows) => {
    const cols = COLUMNS.filter((c) => visibleCols[c.key] || FIXED_COLS.includes(c.key)).filter((c) => c.key !== 'photo');
    const headers = cols.map((c) => c.title);
    const mapValue = (key, r, idx) => {
      switch (key) {
        case 'employeeNumber':
          return r.employeeNumber ?? '';
        case 'id':
          return String(idx + 1);
        case 'name':
          return r.name ?? '';
        case 'jobGrade':
          return r.jobGradeName || r.jobGrade?.name || '';
        case 'branches':
          return renderBranches(r);
        case 'dateOfBirth':
          return r.dateOfBirth || '';
        case 'gender':
          return r.gender === 'FEMALE' ? '여' : r.gender === 'MALE' ? '남' : '';
        case 'email':
          return r.email ?? '';
        case 'mobile':
          return r.mobile ?? '';
        case 'hireDate':
          return r.hireDate || '';
        case 'terminateDate':
          return r.terminateDate || '';
        case 'employmentStatus':
          return r.employmentStatus === 'ACTIVE'
            ? '재직'
            : r.employmentStatus === 'ON_LEAVE'
            ? '휴직'
            : r.employmentStatus === 'TERMINATED'
            ? '퇴사'
            : '';
        case 'employmentType':
          return r.employmentType === 'FULL_TIME' ? '정규직' : r.employmentType === 'PART_TIME' ? '계약직' : '';
        case 'remark':
          return r.remark || '';
        default:
          return '';
      }
    };
    const dataRows = rows.map((r, idx) => cols.map((c) => mapValue(c.key, r, idx)));
    return { cols, matrix: [headers, ...dataRows] };
  };

  const exportToCsv = async (rowsArg) => {
    const rows = rowsArg ?? (await getExportRows());
    const { matrix } = buildExportMatrix(rows);
    const escape = (v) => {
      const s = (v ?? '').toString().replaceAll('"', '""');
      return `"${s}"`;
    };
    const csv = '\uFEFF' + matrix.map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `직원목록_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToXlsx = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rowsSorted = await getExportRows();
      const ExcelJS = await loadExcelJs();
      const { cols, matrix } = buildExportMatrix(rowsSorted);

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('직원목록', { views: [{ state: 'frozen', ySplit: 1 }] });

      const colWidths = cols.map((c, idx) => {
        let max = 0;
        for (let r = 0; r < matrix.length; r++) {
          const v = (matrix[r][idx] ?? '').toString();
          const l = computeTextLen(v);
          if (l > max) max = l;
        }
        const limit = limitByKey(c.key);
        const minw = minByKey(c.key);
        const wch = Math.min(limit, Math.max(minw, Math.ceil(max) + 2));
        return wch;
      });

      ws.columns = cols.map((c, idx) => ({
        key: c.key,
        width: colWidths[idx],
        style: {
          font: { size: 11 },
          alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        },
      }));

      const HEADER_FILL = 'FFEDE9FE';
      const BORDER_COLOR = 'FF666666';
      const THIN_BORDER = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } },
      };

      const headerRow = ws.addRow(matrix[0]);
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
        cell.border = THIN_BORDER;
      });

      for (let r = 1; r < matrix.length; r++) {
        const row = ws.addRow(matrix[r]);
        let maxLines = 1;
        row.eachCell((cell) => {
          const str = (cell.value ?? '').toString();
          cell.font = { size: 11 };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = THIN_BORDER;
          const manualBreaks = (str.match(/\n/g) || []).length + 1;
          const colIdx = cell.col - 1;
          const approxPerLine = Math.max(8, (colWidths[colIdx] || 10) - 2);
          const wrapEst = Math.max(1, Math.ceil(computeTextLen(str) / approxPerLine));
          maxLines = Math.max(maxLines, manualBreaks, wrapEst);
        });
        row.height = Math.min(72, 18 + (maxLines - 1) * 14);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `직원목록_${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast({
        type: 'warning',
        title: '안내',
        message: '엑셀 모듈 로드 실패로 CSV로 내보냅니다.',
        duration: 3200,
      });
      try {
        await exportToCsv();
      } catch {
        const fallback = selectedIds.size > 0
          ? Array.from(selectedIds).map((id) => listById.get(id)).filter(Boolean)
          : sorted;
        await exportToCsv(fallback);
      }
    } finally {
      setExporting(false);
      fetchData();
    }
  };

  const toggleSort = (field) => {
    setPage(0);
    setSelectedIds(new Set());
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      if (prev.dir === 'desc') return { field: '', dir: 'asc' };
      return { field, dir: 'asc' };
    });
  };

  const onToggleAll = (e) => {
    const checked = e.target.checked;
    if (!checked) setSelectedIds(new Set());
    else setSelectedIds(new Set((renderRows || []).map((r) => r.id)));
  };
  const onToggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const allChecked = (renderRows || []).length > 0 && (renderRows || []).every((r) => selectedIds.has(r.id));

  const SortIcon = ({ active, dir }) => (
    <HeadSort $active={active} aria-hidden>
      <Mdi path={dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
    </HeadSort>
  );

  const dynamicVisible = useMemo(
    () => COLUMNS.filter((c) => !FIXED_COLS.includes(c.key) && (visibleCols[c.key] || false)),
    [COLUMNS, visibleCols]
  );

  const fixedPx =
    COL_WIDTH._check + COL_WIDTH.id + COL_WIDTH.photo + COL_WIDTH.name + COL_WIDTH.jobGrade + COL_WIDTH._actions;

  const sumDynPx = (dynamicVisible.length ? dynamicVisible : [{ key: '_pad' }]).reduce(
    (acc, c) => acc + (c.key === '_pad' ? MIN_DYN_PX_DEFAULT : getDynWidthPx(c.key)),
    0
  );
  const tableMinPx = fixedPx + sumDynPx;

  const handleGotoSubmit = (e) => {
    e.preventDefault();
    if (!totalPages) return;
    const n = parseInt(gotoDraft, 10);
    if (Number.isNaN(n)) return;
    const idx = Math.min(Math.max(n - 1, 0), totalPages - 1);
    setPage(idx);
    setGotoDraft('');
  };

  const colSpanAll = 6 + Math.max(dynamicVisible.length, 1);

  return (
    <Wrap>
      <Header>
        <div>
          <Title>직원관리</Title>
          <Sub>지점의 직원 계정을 생성·수정·삭제하고 목록을 조회합니다</Sub>
        </div>
        <HeaderActions>
          <GhostButton
            ref={columnBtnRef}
            type="button"
            title="컬럼 표시/숨김"
            onClick={() => setOpenColumnPanel((v) => !v)}
          >
            <Mdi path={mdiFocusField} />
            필드
          </GhostButton>
          <GhostButton type="button" onClick={exportToXlsx} title="엑셀(xlsx)로 내보내기" disabled={exporting}>
            <SvgIcon src={excelIcon} alt="" aria-hidden />
            {exporting ? '내보내는 중…' : '엑셀 내보내기'}
          </GhostButton>
          <Primary onClick={() => navigate('/staff/create')}>
            <Mdi path={mdiPlus} />
            등록
          </Primary>
          {openColumnPanel && (
            <PopPanel ref={columnPanelRef} style={{ right: 0 }}>
              <PanelTitle>표시할 열 선택</PanelTitle>
              <div>
                {COLUMNS.filter((c) => !FIXED_COLS.includes(c.key)).map((c) => (
                  <Check key={c.key}>
                    <input
                      type="checkbox"
                      checked={!!visibleCols[c.key]}
                      onChange={(e) => setVisibleCols((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    />
                    {c.title}
                  </Check>
                ))}
                <FixedNote>ID, 사진, 성명, 직급은 항상 표시됩니다.</FixedNote>
              </div>
              <PanelRow>
                <SmallGhost
                  onClick={() =>
                    setVisibleCols((prev) => {
                      const all = { ...prev };
                      Object.keys(DEFAULT_VISIBLE_COLS).forEach((k) => (all[k] = true));
                      FIXED_COLS.forEach((k) => (all[k] = true));
                      return all;
                    })
                  }
                >
                  모두 보이기
                </SmallGhost>
                <SmallGhost
                  onClick={() =>
                    setVisibleCols((prev) => {
                      const all = { ...prev };
                      Object.keys(DEFAULT_VISIBLE_COLS).forEach((k) => (all[k] = false));
                      FIXED_COLS.forEach((k) => (all[k] = true));
                      return all;
                    })
                  }
                >
                  모두 숨기기(고정 제외)
                </SmallGhost>
              </PanelRow>
            </PopPanel>
          )}
        </HeaderActions>
      </Header>

      <Toolbar as="form" onSubmit={submitSearch}>
        <SearchBox>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="이름, 이메일, 휴대폰 검색"
          />
          <IconBtn
            ref={searchFilterBtnRef}
            type="button"
            title="검색 필드 선택"
            onClick={() => setOpenSearchPanel((v) => !v)}
          >
            <Mdi path={mdiTune} size={0.9} />
          </IconBtn>
          {openSearchPanel && (
            <PopPanel ref={searchPanelRef} style={{ left: 12, top: 'calc(100% + 8px)' }}>
              <PanelTitle>검색 대상 필드</PanelTitle>
              <div>
                <Check>
                  <input
                    type="checkbox"
                    checked={!!searchIn.name}
                    onChange={(e) => setSearchIn((p) => ({ ...p, name: e.target.checked }))}
                  />
                  성명
                </Check>
                <Check>
                  <input
                    type="checkbox"
                    checked={!!searchIn.email}
                    onChange={(e) => setSearchIn((p) => ({ ...p, email: e.target.checked }))}
                  />
                  이메일
                </Check>
                <Check>
                  <input
                    type="checkbox"
                    checked={!!searchIn.mobile}
                    onChange={(e) => setSearchIn((p) => ({ ...p, mobile: e.target.checked }))}
                  />
                  휴대폰
                </Check>
              </div>
            </PopPanel>
          )}
        </SearchBox>

        <SearchButton type="submit" title="검색">
          <Mdi path={mdiMagnify} />
          검색
        </SearchButton>

        <PageSizeWrap>
          <span>페이지당</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setPageSize(val);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) =>
              typeof opt === 'number' ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt} value={opt}>
                  전체
                </option>
              )
            )}
          </select>
          <span>명</span>
        </PageSizeWrap>
      </Toolbar>

      <TableWrap
        style={{
          ['--table-min']: `${tableMinPx}px`,
          ['--w-check']: `${COL_WIDTH._check}px`,
          ['--w-id']: `${COL_WIDTH.id}px`,
          ['--w-photo']: `${COL_WIDTH.photo}px`,
          ['--w-name']: `${COL_WIDTH.name}px`,
          ['--w-job']: `${COL_WIDTH.jobGrade}px`,
        }}
      >
        <table>
          <colgroup>
            {(() => {
              const arr = [<col key="_check" style={{ width: `${COL_WIDTH._check}px` }} />];
              arr.push(<col key="id" style={{ width: `${COL_WIDTH.id}px` }} />);
              arr.push(<col key="photo" style={{ width: `${COL_WIDTH.photo}px` }} />);
              arr.push(<col key="name" style={{ width: `${COL_WIDTH.name}px` }} />);
              arr.push(<col key="jobGrade" style={{ width: `${COL_WIDTH.jobGrade}px` }} />);
              COLUMNS.forEach((c) => {
                if (FIXED_COLS.includes(c.key)) return;
                if (!visibleCols[c.key]) return;
                arr.push(<col key={c.key} style={{ width: `${getDynWidthPx(c.key)}px` }} />);
              });
              if (dynamicVisible.length === 0) {
                arr.push(<col key="_pad" style={{ width: `${MIN_DYN_PX_DEFAULT}px` }} />);
              }
              arr.push(<col key="_actions" style={{ width: `${COL_WIDTH._actions}px` }} />);
              return arr;
            })()}
          </colgroup>
          <thead>
            <tr>
              <th className="checkbox sticky s0">
                <CheckHead>
                  <BigCheckbox
                    checked={allChecked}
                    ref={(el) => {
                      if (el)
                        el.indeterminate = (renderRows || []).some((r) => selectedIds.has(r.id)) && !allChecked;
                    }}
                    onChange={onToggleAll}
                  />
                </CheckHead>
              </th>
              {/* ▼ 번호 헤더를 정렬 가능하게 변경: createdAt(없으면 id) 기준 */}
              <th
                className="id sticky s1 sortable"
                onClick={() => toggleSort('_createdAt')}
                title="최신/오래된 순 정렬"
              >
                <HeadGroup>
                  <HeadLabel>번호</HeadLabel>
                  <HeadSort $active={sort.field === '_createdAt'} aria-hidden>
                    <Mdi path={sort.dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
                  </HeadSort>
                </HeadGroup>
              </th>
              <th className="photo sticky s2">
                <HeadGroup>
                  <HeadLabel>사진</HeadLabel>
                </HeadGroup>
              </th>
              <th className="name sticky s3 sortable" onClick={() => toggleSort('name')}>
                <HeadGroup>
                  <HeadLabel>성명</HeadLabel>
                  <HeadSort $active={sort.field === 'name'} aria-hidden>
                    <Mdi path={sort.dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
                  </HeadSort>
                </HeadGroup>
              </th>
              <th className="jobGrade sticky s4 sortable" onClick={() => toggleSort('jobGrade')}>
                <HeadGroup>
                  <HeadLabel>직급</HeadLabel>
                  <HeadSort $active={sort.field === 'jobGrade'} aria-hidden>
                    <Mdi path={sort.dir === 'asc' ? mdiChevronUp : mdiChevronDown} size={0.75} />
                  </HeadSort>
                </HeadGroup>
              </th>

              {COLUMNS.filter((c) => !FIXED_COLS.includes(c.key) && visibleCols[c.key]).map((col) => {
                const field = col.sortField || col.key;
                const active = !!col.sortable && sort.field === field;
                const thClass = `${col.sortable ? 'sortable' : ''} ${col.key}`.trim();
                return (
                  <th
                    key={col.key}
                    className={thClass}
                    onClick={() => {
                      if (!col.sortable) return;
                      toggleSort(field);
                    }}
                  >
                    <HeadGroup>
                      <HeadLabel>{col.title}</HeadLabel>
                      {col.sortable && <SortIcon active={active} dir={sort.dir} />}
                    </HeadGroup>
                  </th>
                );
              })}

              {dynamicVisible.length === 0 && (
                <th>
                  <HeadGroup>
                    <HeadLabel>&nbsp;</HeadLabel>
                  </HeadGroup>
                </th>
              )}
              <th>
                <HeadGroup>
                  <HeadLabel>조치</HeadLabel>
                </HeadGroup>
              </th>
            </tr>
          </thead>

          <tbody ref={rowsHostRef}>
            {!loading && (renderRows || []).length === 0 && (
              <tr>
                <td colSpan={colSpanAll} className="empty">
                  데이터가 없습니다
                </td>
              </tr>
            )}

            {/* 윈도우 스크롤용 상단 스페이서 */}
            {virtActive && topSpacerH > 0 && (
              <tr className="spacer"><td colSpan={colSpanAll} style={{ height: topSpacerH }} /></tr>
            )}

            {(renderRows || []).map((row, idx) => {
              const isSelf = myIdCandidates.has(row.id);
              const canTerminate = row.employmentStatus !== 'TERMINATED' && !isSelf;
              const number = visibleRowOffset + (virtActive ? virt.start : 0) + idx + 1;
              return (
                <tr key={row.id}>
                  <td className="checkbox sticky s0">
                    <CheckCell>
                      <BigCheckbox
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => onToggleOne(row.id, e.target.checked)}
                      />
                    </CheckCell>
                  </td>
                  <td className="id sticky s1">{number}</td>
                  <td className="photo sticky s2">
                    <Avatar url={row.profileImageUrl} name={row.name} />
                  </td>
                  <td className="name sticky s3">
                    {/* ▼ 이름 클릭 → 상세 페이지 이동, 호버 시 보라색 + 밑줄 */}
                    <NameLink
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/staff/detail/${row.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/staff/detail/${row.id}`); }}
                      title="상세 보기"
                    >
                      {row.name}
                    </NameLink>
                  </td>
                  <td className="jobGrade sticky s4">{row.jobGradeName || row.jobGrade?.name || '-'}</td>

                  {COLUMNS.filter((c) => !FIXED_COLS.includes(c.key) && visibleCols[c.key]).map((col) => (
                    <td key={col.key} className={col.key}>
                      {col.render(row)}
                    </td>
                  ))}

                  {dynamicVisible.length === 0 && <td />}

                  <td>
                    <TextBtn onClick={() => navigate(`/staff/create?id=${row.id}`)}>수정</TextBtn>
                    {row.employmentStatus === 'TERMINATED' ? (
                      <TextBtn onClick={() => handleRehireClick(row)}>재입사</TextBtn>
                    ) : (
                      <TextBtn
                        $danger
                        disabled={!canTerminate}
                        onClick={() => {
                          if (!canTerminate) return;
                          handleTerminateClick(row);
                        }}
                      >
                        퇴사
                      </TextBtn>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* 윈도우 스크롤용 하단 스페이서 */}
            {virtActive && bottomSpacerH > 0 && (
              <tr className="spacer"><td colSpan={colSpanAll} style={{ height: bottomSpacerH }} /></tr>
            )}
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

        <GotoForm onSubmit={handleGotoSubmit}>
          <span>페이지 이동</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, totalPages)}
            value={gotoDraft}
            onChange={(e) => setGotoDraft(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="번호"
            disabled={totalPages <= 1}
          />
          <button type="submit" disabled={totalPages <= 1}>이동</button>
        </GotoForm>
      </PaginationBar>
    </Wrap>
  );
}

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
const Sub = styled.p`
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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
    border: 0;
    outline: 0;
    width: 100%;
    font-size: 14px;
  }
`;

const SearchButton = styled.button`
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #8b5cf6;
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  font-weight: 700;
  cursor: pointer;
  &:hover { filter: brightness(0.98); }
`;

const PageSizeWrap = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  select {
    height: 44px;
    min-width: 112px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    padding: 0 34px 0 10px;
    outline: 0;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
`;

const GhostButton = styled.button`
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 12px;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

const Primary = styled.button`
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #8b5cf6;
  color: #fff;
  border: 0;
  border-radius: 10px;
  padding: 0 14px;
  font-weight: 700;
  cursor: pointer;
  &:hover { filter: brightness(0.98); }
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

const SvgIcon = styled.img`
  width: 21px;
  height: 21px;
  display: inline-block;
`;

const PopPanel = styled.div`
  position: absolute;
  top: 48px;
  min-width: 240px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  z-index: 20;
`;

const PanelTitle = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;
const PanelRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;
const SmallGhost = styled.button`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #f9fafb; }
`;
const FixedNote = styled.div`
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: #7c3aed;
    cursor: pointer;
  }
`;

const BigCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: #7c3aed;
  cursor: pointer;
`;

const TableWrap = styled.div`
  --w-check: ${COL_WIDTH._check}px;
  --w-id: ${COL_WIDTH.id}px;
  --w-photo: ${COL_WIDTH.photo}px;
  --w-name: ${COL_WIDTH.name}px;
  --w-job: ${COL_WIDTH.jobGrade}px;

  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* 가로 스크롤만 허용(세로 스크롤은 페이지에 위임) */
  overflow-x: auto;
  overflow-y: visible;

  width: 100%;
  table {
    width: max(100%, var(--table-min));
    border-collapse: collapse;
    table-layout: fixed;
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

  /* 상단 고정이 필요한 헤더(th.sticky)용 top 지정 (윈도우 스크롤 기준) */
  thead th.sticky { top: 0; z-index: 5; }

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
  thead th.sticky { position: sticky; background: #fafafa; }
  tbody td.sticky { position: sticky; z-index: 3; background: #fff; }
  thead th.checkbox, tbody td.checkbox { width: var(--w-check); }
  thead th.id, tbody td.id { width: var(--w-id); }
  thead th.photo, tbody td.photo { width: var(--w-photo); }
  thead th.name, tbody td.name { width: var(--w-name); }
  thead th.jobGrade, tbody td.jobGrade { width: var(--w-job); }
  .s0 { left: 0; }
  .s1 { left: var(--w-check); }
  .s2 { left: calc(var(--w-check) + var(--w-id)); }
  .s3 { left: calc(var(--w-check) + var(--w-id) + var(--w-photo)); }
  .s4 { left: calc(var(--w-check) + var(--w-id) + var(--w-photo) + var(--w-name)); }
  thead th.s4, tbody td.s4 { box-shadow: 2px 0 0 #e5e7eb; }

  /* 스페이서 행(윈도우 스크롤) */
  tbody tr.spacer td {
    padding: 0;
    border: 0;
    height: 0;
    line-height: 0;
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
  &:disabled {
    opacity: 0.45; cursor: not-allowed; background: #f3f4f6; border-color: #e5e7eb; color: #9ca3af;
  }
  & + & { margin-left: 8px; }
`;

/* ▼ 이름 링크(호버 시 보라 + 밑줄) */
const NameLink = styled.span`
  font-weight: 700;
  color: #111827;
  text-decoration: none;
  cursor: pointer;
  &:hover {
    color: #7c3aed;
    text-decoration: underline;
  }
  &:focus {
    outline: none;
    text-decoration: underline;
  }
`;

const CheckHead = styled.div`
  display: flex; align-items: center; justify-content: center; height: ${ROW_H}px;
`;
const CheckCell = styled.div`
  display: flex; align-items: center; justify-content: center; height: ${ROW_H}px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  background: ${(p) => (p.$type === 'ACTIVE' ? '#dcfce7' : p.$type === 'ON_LEAVE' ? '#fef9c3' : '#fee2e2')};
  color: ${(p) => (p.$type === 'ACTIVE' ? '#166534' : p.$type === 'ON_LEAVE' ? '#854d0e' : '#991b1b')};
`;

const Remark = styled.span`
  display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;
`;

const AvatarWrap = styled.div`
  width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: #f1f5f9;
  display: grid; place-items: center; color: #94a3b8; font-weight: 700;
  margin: 0 auto;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const PaginationBar = styled.div`
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
  .ellipsis { padding: 0 4px; color: #6b7280; user-select: none; }
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
