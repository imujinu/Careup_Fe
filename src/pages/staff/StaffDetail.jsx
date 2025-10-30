// src/pages/staff/StaffDetail.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiUpload } from '@mdi/js';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import {
  fetchStaffDetailAction,
  clearErrors,
  deactivateStaffAction,
  rehireStaffAction,
} from '../../stores/slices/staffSlice';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { fetchBranchOptions } from '../../service/staffService';

const g = (k, s) => new URLSearchParams(s).get(k);

export default function StaffDetail() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { user: me } = useAppSelector((s) => s.auth);
  const params = useParams();
  const search = useLocation().search;
  const id = params?.id || g('id', search);

  const {
    detail, detailError,
    deactivateLoading, deactivateError,
    rehireLoading, rehireError,
  } = useAppSelector((s) => s.staff);

  const [branchOptions, setBranchOptions] = useState([]);

  const myIdCandidates = useMemo(() => {
    const ids = new Set();
    if (me?.id) ids.add(String(me.id));
    if (me?.employeeId) ids.add(String(me.employeeId));
    if (me?.staffId) ids.add(String(me.staffId));
    return ids;
  }, [me]);

  const isSelf = useMemo(() => {
    if (!detail?.id) return false;
    return myIdCandidates.has(String(detail.id));
  }, [detail?.id, myIdCandidates]);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchStaffDetailAction(id));
  }, [dispatch, id]);

  useEffect(() => {
    (async () => {
      try {
        const arr = await fetchBranchOptions();
        setBranchOptions(arr);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (detailError) {
      addToast({ type: 'error', title: '상세 조회 실패', message: detailError, duration: 3000 });
      dispatch(clearErrors());
    }
  }, [detailError, addToast, dispatch]);

  useEffect(() => {
    if (deactivateError) {
      addToast({ type: 'error', title: '퇴사 처리 실패', message: deactivateError, duration: 3000 });
      dispatch(clearErrors());
    }
  }, [deactivateError, addToast, dispatch]);

  useEffect(() => {
    if (rehireError) {
      addToast({ type: 'error', title: '재입사 실패', message: rehireError, duration: 3000 });
      dispatch(clearErrors());
    }
  }, [rehireError, addToast, dispatch]);

  const onTerminate = async () => {
    if (!detail?.id) return;
    if (isSelf) {
      addToast({ type: 'info', title: '안내', message: '본인은 퇴사 처리할 수 없습니다.', duration: 2200 });
      return;
    }
    if (detail.employmentStatus === 'TERMINATED') {
      addToast({ type: 'info', title: '안내', message: '이미 퇴사 상태입니다.', duration: 2000 });
      return;
    }
    if (!window.confirm('해당 직원을 퇴사 처리하시겠습니까?')) return;
    await dispatch(deactivateStaffAction(detail.id)).unwrap();
    addToast({ type: 'success', title: '완료', message: '퇴사 처리되었습니다.', duration: 2200 });
    dispatch(fetchStaffDetailAction(detail.id));
  };

  const onRehire = async () => {
    if (!detail?.id) return;
    await dispatch(rehireStaffAction(detail.id)).unwrap();
    addToast({ type: 'success', title: '완료', message: '재입사되었습니다.', duration: 2200 });
    dispatch(fetchStaffDetailAction(detail.id));
  };

  if (!detail) {
    return (
      <Wrap>
        <Card>
          <Head>
            <div>
              <h2>직원상세</h2>
              <HeadSub>직원 정보를 확인합니다 (읽기 전용)</HeadSub>
            </div>
          </Head>
          <Loading>불러오는 중…</Loading>
        </Card>
      </Wrap>
    );
  }

  const f = {
    employeeNumber: detail.employeeNumber ?? '',
    name: detail.name ?? '',
    jobGradeName: detail.jobGradeName || detail.jobGrade?.name || '',
    jobGradeId: detail.jobGradeId ?? detail.jobGrade?.id ?? '',
    dateOfBirth: detail.dateOfBirth || '',
    gender: detail.gender || 'MALE',
    email: detail.email || '',
    zipcode: detail.zipcode || '',
    address: detail.address || '',
    addressDetail: detail.addressDetail || '',
    mobile: detail.mobile || '',
    emergencyTel: detail.emergencyTel || '',
    emergencyName: detail.emergencyName || '',
    relationship: detail.relationship || 'PARENT',
    hireDate: detail.hireDate || '',
    terminateDate: detail.terminateDate || '',
    authorityType: detail.authorityType || 'STAFF',
    employmentStatus: detail.employmentStatus || 'ACTIVE',
    employmentType: detail.employmentType || 'FULL_TIME',
    profileImageUrl: detail.profileImageUrl || '',
    remark: detail.remark || '',
  };

  const dispatches = Array.isArray(detail.dispatches) ? detail.dispatches : [];
  const isTerminated = f.employmentStatus === 'TERMINATED';

  const branchNameById = (bid) => {
    const found = branchOptions.find((b) => String(b.id) === String(bid));
    return found?.name ?? '';
  };

  const disabled = true;

  return (
    <Wrap>
      <Card>
        <Head>
          <div>
            <h2>직원상세</h2>
            <HeadSub>직원 정보를 확인합니다 (읽기 전용)</HeadSub>
          </div>
          <HeadActions>
            <Primary type="button" onClick={() => navigate(`/staff/create?id=${detail.id}`)}>수정</Primary>
            {isTerminated ? (
              <Primary
                type="button"
                disabled={rehireLoading}
                onClick={onRehire}
                title="재입사"
              >
                재입사
              </Primary>
            ) : (
              <Danger
                type="button"
                disabled={isSelf || deactivateLoading}
                onClick={onTerminate}
                title={isSelf ? '본인은 퇴사 불가' : '퇴사 처리'}
              >
                퇴사
              </Danger>
            )}
          </HeadActions>
        </Head>

        <TopSection>
          <TopTitle>프로필 이미지</TopTitle>
          <TopUpload>
            <PreviewWrap>
              {/* 상세 페이지: 이미지 위 hover/커서 효과 제거 */}
              <TopPreview>
                {f.profileImageUrl ? (
                  <img src={f.profileImageUrl} alt="profile" />
                ) : (
                  <TopPlaceholder>
                    <Icon path={mdiUpload} size={2} />
                    <span>이미지 없음</span>
                  </TopPlaceholder>
                )}
              </TopPreview>
            </PreviewWrap>
          </TopUpload>
        </TopSection>

        <Form>
          <Section>
            <SectionTitle>기본 정보</SectionTitle>
            <Grid>
              <Label>사번</Label>
              <Input value={f.employeeNumber} readOnly disabled={disabled} />

              <Label>직원명</Label>
              <Input value={f.name} readOnly disabled={disabled} />

              <Label>직급</Label>
              <Input value={f.jobGradeName} readOnly disabled={disabled} />

              <Label>생년월일</Label>
              <Input type="date" value={f.dateOfBirth} readOnly disabled={disabled} />

              <Label>성별</Label>
              <Select value={f.gender} disabled>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </Select>
            </Grid>
          </Section>

          <Section>
            <SectionTitle>연락처 정보</SectionTitle>
            <Grid>
              <Label>이메일</Label>
              <Input type="email" value={f.email} readOnly disabled={disabled} />

              <Label>휴대폰</Label>
              <Input value={f.mobile} readOnly disabled={disabled} />

              <Label>비상연락망</Label>
              <Input value={f.emergencyTel} readOnly disabled={disabled} />

              <Label>비상연락처 이름</Label>
              <Input value={f.emergencyName} readOnly disabled={disabled} />

              <Label>관계</Label>
              <Select value={f.relationship} disabled>
                <option value="PARENT">부모</option>
                <option value="SIBLING">형제자매</option>
                <option value="SPOUSE">배우자</option>
                <option value="CHILD">자녀</option>
                <option value="FRIEND">친구</option>
                <option value="NEIGHBOR">이웃</option>
                <option value="OTHER">기타</option>
              </Select>
            </Grid>
          </Section>

          <Section>
            <SectionTitle>주소 정보</SectionTitle>
            <Grid>
              <Label>우편번호</Label>
              <Input value={f.zipcode} readOnly disabled={disabled} />

              <Label>주소</Label>
              <Input value={f.address} readOnly disabled={disabled} />

              <Label>상세주소</Label>
              <Input value={f.addressDetail} readOnly disabled={disabled} />
            </Grid>
          </Section>

          <Section>
            <SectionTitle>고용 정보</SectionTitle>
            <Grid>
              <Label>입사일</Label>
              <Input type="date" value={f.hireDate} readOnly disabled={disabled} />

              <Label>퇴사일</Label>
              <Input type="date" value={f.terminateDate || ''} readOnly disabled={disabled} />

              <Label>권한 유형</Label>
              <Select value={f.authorityType} disabled>
                <option value="HQ_ADMIN">본점(본사) 관리자</option>
                <option value="BRANCH_ADMIN">지점(직영점) 관리자</option>
                <option value="FRANCHISE_OWNER">가맹점주 (관리자)</option>
                <option value="STAFF">직원</option>
              </Select>

              <Label>고용상태</Label>
              <Select value={f.employmentStatus} disabled>
                <option value="ACTIVE">재직</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="TERMINATED">퇴사</option>
              </Select>

              <Label>고용형태</Label>
              <Select value={f.employmentType} disabled>
                <option value="FULL_TIME">정규직</option>
                <option value="PART_TIME">계약직</option>
              </Select>
            </Grid>
          </Section>

          <Section>
            <SectionTitle>지점 배치</SectionTitle>
            <DispatchList>
              {dispatches.length === 0 && <EmptyLine>배치 이력이 없습니다.</EmptyLine>}
              {dispatches.map((d, idx) => (
                <DispatchRow key={idx}>
                  <Field>
                    <SmallLabel>지점</SmallLabel>
                    <Input
                      value={d.branchName || d.branch?.name || branchNameById(d.branchId) || ''}
                      readOnly
                      disabled
                    />
                  </Field>
                  <Field>
                    <SmallLabel>시작일</SmallLabel>
                    <Input type="date" value={d.assignedFrom || ''} readOnly disabled />
                  </Field>
                  <Field>
                    <SmallLabel>종료일</SmallLabel>
                    <Input type="date" value={d.assignedTo || ''} readOnly disabled />
                  </Field>
                </DispatchRow>
              ))}
            </DispatchList>
          </Section>

          <Section>
            <SectionTitle>비고</SectionTitle>
            <Grid>
              <TextAreaWide rows={8} value={f.remark} readOnly disabled />
            </Grid>
          </Section>
        </Form>
      </Card>
    </Wrap>
  );
}

/* ==== 스타일: StaffCreate.jsx 과 동일 규격(단, 상세 페이지는 이미지 hover/커서 효과 제거) ==== */
const Wrap = styled.div`
  display:flex;
  justify-content:center;
`;

const Card = styled.section`
  width:min(960px,96vw);
  background:#fff;
  border-radius:12px;
  box-shadow:0 4px 6px -1px rgba(0,0,0,.1);
  overflow:hidden;
`;

const Head = styled.header`
  padding:28px 32px;
  border-bottom:2px solid #e5e7eb;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  h2{margin:0;font-size:22px;font-weight:700;color:#111827;}
`;

const HeadSub = styled.p`
  margin:8px 0 0;
  font-size:14px;
  color:#6b7280;
`;

const HeadActions = styled.div`
  display:flex;
  gap:8px;
`;

const TopSection = styled.section`
  padding:24px 32px 0;
  border-bottom:1px solid #eef2f7;
`;

const TopTitle = styled.h3`
  margin:0;
  font-size:16px;
  font-weight:700;
  color:#374151;
  padding-bottom:10px;
  border-bottom:2px solid #e5e7eb;
`;

const TopUpload = styled.div`
  padding:32px 0;
  display:flex;
  justify-content:center;
  align-items:center;
`;

const PreviewWrap = styled.div`
  position:relative;
  width:168px;
  height:168px;
`;

/* 상세 페이지 전용: hover/포인터 제거 */
const TopPreview = styled.div`
  position:relative;
  width:168px;
  height:168px;
  border:2px dashed #d1d5db;
  border-radius:50%;
  display:grid;
  place-items:center;
  overflow:hidden;
  background:#fff;
  img{width:100%;height:100%;object-fit:cover;}
`;

const TopPlaceholder = styled.div`
  display:grid;
  place-items:center;
  gap:8px;
  color:#6b7280;
  font-size:12px;
  transform: translateY(8px);
`;

const Form = styled.form`
  padding:0 32px 32px;
`;

const Section = styled.section`
  margin-top:32px;
`;

const SectionTitle = styled.h3`
  margin:0 0 16px;
  font-size:16px;
  font-weight:700;
  color:#374151;
  padding-bottom:10px;
  border-bottom:2px solid #e5e7eb;
`;

const Grid = styled.div`
  display:grid;
  grid-template-columns:180px 1fr;
  grid-auto-rows:minmax(44px,auto);
  gap:14px 16px;
  align-items:center;
`;

const Label = styled.label`
  color:#374151;
  font-size:14px;
  font-weight:600;
`;

const focusRing = `
  border-color:#6d28d9;
  box-shadow:0 0 0 3px rgba(109,40,217,0.15);
`;

const Input = styled.input`
  border:2px solid #e5e7eb;
  border-radius:8px;
  padding:12px 14px;
  font-size:14px;
  outline:0;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus{ ${focusRing} }
  &[type="date"]{
    position:relative;
    height:48px;
  }
  &[type="date"]::-webkit-calendar-picker-indicator{
    position:absolute;
    right:12px;
    top:50%;
    transform:translateY(-50%);
    cursor:pointer;
  }
  &[disabled]{ background:#f9fafb; color:#6b7280; cursor:not-allowed; }
`;

const Select = styled.select`
  border:2px solid #e5e7eb;
  border-radius:8px;
  height:48px;
  padding:12px 14px;
  padding-right:40px;
  font-size:14px;
  background:#fff;
  outline:0;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus{ ${focusRing} }
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%23111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 14px 14px;
  &[disabled]{ background:#f9fafb; color:#6b7280; cursor:not-allowed; }
`;

const TextArea = styled.textarea`
  border:2px solid #e5e7eb;
  border-radius:8px;
  padding:12px 14px;
  font-size:14px;
  resize:vertical;
  outline:0;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus{ ${focusRing} }
  &[disabled]{ background:#f9fafb; color:#6b7280; cursor:not-allowed; }
`;

const TextAreaWide = styled(TextArea)`
  grid-column: 1 / -1;
`;

const DispatchList = styled.div`
  display:flex;
  flex-direction:column;
  gap:12px;
`;

const DispatchRow = styled.div`
  display:grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap:12px;
  align-items:end;
  padding:14px;
  border:1px solid #e5e7eb;
  border-radius:10px;
  background:#fff;
`;

const Field = styled.div`
  display:flex;
  flex-direction:column;
`;

const SmallLabel = styled.div`
  font-size:12px;
  color:#6b7280;
  margin:0 0 6px;
`;

const EmptyLine = styled.div`
  font-size:14px;
  color:#6b7280;
  padding:10px 0;
`;

const BaseBtn = styled.button`
  height:44px;
  border-radius:10px;
  padding:0 16px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  font-weight:700;
  cursor:pointer;
`;

const Primary = styled(BaseBtn)`
  background:#8b5cf6;
  color:#fff;
  border:0;
  &:hover{filter:brightness(0.98);}
  &:disabled{opacity:.6;cursor:not-allowed;}
`;

const Danger = styled(BaseBtn)`
  background:#ef4444;
  color:#fff;
  border:0;
  &:hover{filter:brightness(0.98);}
  &:disabled{opacity:.6;cursor:not-allowed;}
`;

const Loading = styled.div`
  padding:24px 32px 40px;
  color:#6b7280;
`;
