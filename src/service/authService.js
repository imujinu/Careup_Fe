import axios, { SKIP_FLAG } from '../utils/axiosConfig';
import { decodeToken } from '../utils/jwt';

const AUTH_API_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const explicit = trim(import.meta.env.VITE_AUTH_URL);
  if (explicit) return explicit; // e.g. https://server.careup.store
  const api =
    trim(import.meta.env.VITE_API_URL) ||
    (typeof window !== 'undefined' ? trim(window.location.origin) : 'http://localhost:8080');
  return api; // /auth/* 는 게이트웨이 루트에 매핑되어 있다고 가정
})();

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },
  getUserInfo: () => {
    const raw = localStorage.getItem('userInfo');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },
};

const pickRole = (decoded) => {
  if (!decoded) return undefined;
  if (decoded.role) return decoded.role;
  if (Array.isArray(decoded.roles) && decoded.roles.length) return decoded.roles[0];
  if (typeof decoded.auth === 'string') return decoded.auth.replace(/^ROLE_/, '');
  if (Array.isArray(decoded.authorities) && decoded.authorities.length) {
    const r = decoded.authorities[0];
    return typeof r === 'string' ? r.replace(/^ROLE_/, '') : r?.authority;
  }
  return undefined;
};

export const isHQAdmin = (u) =>
  !!u && (u.role === 'HQ_ADMIN' || u.roles?.includes?.('HQ_ADMIN') || u.branchType === 'HQ');

export const getUserInfoFromToken = (token) => {
  const d = decodeToken(token);
  if (!d) return null;

  const branchId =
    d.branchId ?? d.branch_id ?? d.branch?.id ?? d.orgId ?? null;
  const branchType =
    d.branchType ?? d.branch_type ?? d.branch?.type ?? d.orgType ?? null;
  const branchName =
    d.branchName ?? d.branch_name ?? d.branch?.name ?? d.orgName ?? undefined;

  const employeeId = d.employeeId ?? d.empId ?? d.userId ?? d.sub ?? null;
  const role = pickRole(d);
  const roles = Array.isArray(d.roles) ? d.roles : (role ? [role] : []);

  // 이름/직급/프로필 이미지 클레임도 최대한 수용
  const name =
    d.name ??
    d.employeeName ?? d.employee_name ??
    d.username ?? d.user_name ??
    d.nick ?? d.nickname ??
    d.given_name ?? d.preferred_username ?? '';

  const title =
    d.title ??
    d.jobGradeName ?? d.job_grade_name ??
    d.position ?? d.rank ?? '';

  const profileImageUrl =
    d.profileImageUrl ??
    d.profile_image_url ?? d.profile_image ??
    d.profileImage ?? d.imageUrl ?? d.image_url ??
    d.picture ??
    d.avatarUrl ?? d.avatar_url ?? d.avatar ?? '';

  const base = {
    employeeId,
    role,
    roles,
    branchId,
    branchType,
    sub: d.sub,
    exp: d.exp,
  };

  return {
    ...base,
    userType: isHQAdmin(base) ? 'headquarters' : 'franchise',
    name,
    title,
    email: d.email ?? d.user_email,
    branchName,
    profileImageUrl,
  };
};

// 서버 응답 바디(AuthLoginResponse 등) → 표준 유저객체로 정규화
const normalizeFromResponse = (box = {}) => {
  const name =
    box.name ??
    box.employeeName ?? box.employee_name ??
    box.username ?? box.user_name ??
    box.nick ?? box.nickname ??
    box.given_name ?? box.preferred_username ?? '';

  const profileImageUrl =
    box.profileImageUrl ??
    box.profileImage ?? box.imageUrl ?? box.image_url ??
    box.picture ??
    box.avatarUrl ?? box.avatar_url ?? box.avatar ?? '';

  const title =
    box.title ??
    box.jobGradeName ?? box.job_grade_name ??
    box.position ?? box.rank ?? '';

  const role = box.role || box.roleCode || box.authority || '';

  return {
    employeeId: box.employeeId ?? box.userId ?? null,
    role,
    roles: role ? [String(role).replace(/^ROLE_/, '')] : [],
    branchId: box.branchId ?? null,
    branchName: box.branchName ?? undefined,
    name,
    title,
    email: box.email ?? undefined,
    profileImageUrl,
  };
};

const unwrapLoginResult = (data) => {
  const box = data?.result ?? data?.data ?? data;
  return {
    accessToken: box?.accessToken ?? box?.access_token ?? box?.token,
    refreshToken: box?.refreshToken ?? box?.refresh_token,
    payload: box,
    statusMessage: data?.status_message ?? data?.message,
    statusCode: data?.status_code ?? data?.status,
    errorCode: data?.error_code,
  };
};

export const authService = {
  login: async (credentials) => {
    const payload = {
      id: credentials.email,
      password: credentials.password,
      rememberMe: !!credentials.rememberMe,
    };

    // 로그인 요청은 401이어도 리프레시 시도 금지
    const config = { [SKIP_FLAG]: true };

    const { data } = await axios.post(`${AUTH_API_URL}/auth/login`, payload, config);

    const r = unwrapLoginResult(data);
    if (!r.accessToken) {
      const msg = r.statusMessage || '로그인 응답에 accessToken이 없습니다.';
      throw new Error(msg);
    }

    tokenStorage.setTokens(r.accessToken, r.refreshToken);

    const fromJwt = getUserInfoFromToken(r.accessToken) || {};
    const fromResp = normalizeFromResponse(r.payload || {});

    const userInfo = {
      ...fromJwt,
      ...fromResp,
      name: fromResp.name || fromJwt.name || '',
      title: fromResp.title || fromJwt.title || '',
      profileImageUrl: fromResp.profileImageUrl || fromJwt.profileImageUrl || '',
      userType: isHQAdmin({ ...fromJwt, ...fromResp }) ? 'headquarters' : 'franchise',
    };

    tokenStorage.setUserInfo(userInfo);

    return {
      accessToken: r.accessToken,
      refreshToken: r.refreshToken,
      userInfo,
    };
  },

  logout: async () => {
    const rt = tokenStorage.getRefreshToken();
    try {
      if (rt) {
        // 로그아웃은 항상 리프레시 스킵 (401이어도 재시도/리프레시 금지)
        await axios.post(`${AUTH_API_URL}/auth/logout`, { refreshToken: rt }, { [SKIP_FLAG]: true });
      }
    } catch (_e) {
      // 이미 폐기되었을 수 있으므로 무시
    } finally {
      tokenStorage.clearTokens();
      // 로그아웃 시 챗봇 메시지 삭제
      try {
        localStorage.removeItem('chatbot_messages');
      } catch (error) {
        console.error('챗봇 메시지 삭제 실패:', error);
      }
    }
  },

  refreshToken: async () => {
    const rt = tokenStorage.getRefreshToken();
    if (!rt) throw new Error('No refresh token available');

    const { data } = await axios.post(`${AUTH_API_URL}/auth/refresh`, { refreshToken: rt }, { [SKIP_FLAG]: true });

    const box = data?.result ?? data?.data ?? data;
    const newAT = box?.accessToken ?? box?.access_token;
    const newRT = box?.refreshToken ?? box?.refresh_token ?? rt;

    if (!newAT) throw new Error('No access token in refresh response');

    tokenStorage.setTokens(newAT, newRT);

    // 기존 정보 유지 + JWT로 갱신 (이름/사진/직급은 기존 것이 우선)
    const prev = tokenStorage.getUserInfo() || {};
    const fromJwt = getUserInfoFromToken(newAT) || {};
    const fromResp = normalizeFromResponse(box || {});
    const merged = {
      ...prev,
      ...fromJwt,
      ...fromResp,
      name: prev.name || fromResp.name || fromJwt.name || '',
      title: prev.title || fromResp.title || fromJwt.title || '',
      branchName: prev.branchName || fromResp.branchName || fromJwt.branchName || undefined,
      profileImageUrl: prev.profileImageUrl || fromResp.profileImageUrl || fromJwt.profileImageUrl || '',
      userType: isHQAdmin({ ...prev, ...fromJwt, ...fromResp }) ? 'headquarters' : 'franchise',
    };
    tokenStorage.setUserInfo(merged);

    return newAT;
  },

  isAuthenticated: () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;
    const u = getUserInfoFromToken(token);
    if (!u) return false;
    const now = Math.floor(Date.now() / 1000);
    return (u.exp ?? 0) > now;
  },

  getCurrentUser: () => tokenStorage.getUserInfo(),
};

export default authService;
