// src/pages/staff/StaffCreate.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiContentSave, mdiUpload, mdiClose, mdiPlus, mdiDelete, mdiEye, mdiEyeOff } from '@mdi/js';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import {
  createStaffAction,
  updateStaffAction,
  fetchStaffDetailAction,
  fetchJobGradesAction,
  clearErrors
} from '../../stores/slices/staffSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { fetchBranchOptions } from '../../service/staffService';

const g = (k, s) => new URLSearchParams(s).get(k);

export default function StaffCreate() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    createLoading, updateLoading,
    detail, detailError, createError, updateError,
    jobGrades, jobGradeLoading
  } = useAppSelector((s) => s.staff);
  const { role: rawRole, user: authUser } = useAppSelector((s) => s.auth);

  const role = useMemo(() => (rawRole || '').replace(/^ROLE_/, '').toUpperCase(), [rawRole]);
  const isHqAdmin = role === 'HQ_ADMIN';
  const isManager = role === 'BRANCH_ADMIN' || role === 'FRANCHISE_OWNER';
  const isGeneralStaff = role === 'STAFF';

  const location = useLocation();
  const search = location?.search || '';
  const pathIsMy = location.pathname === '/my';

  const myId = useMemo(
    () => authUser?.id || authUser?.employeeId || authUser?.staffId || null,
    [authUser]
  );
  const id = useMemo(() => g('id', search) || (pathIsMy ? myId : null), [search, pathIsMy, myId]);

  const isSelf = useMemo(() => {
    if (!myId || !id) return pathIsMy;
    return String(myId) === String(id) || pathIsMy;
  }, [myId, id, pathIsMy]);

  const isSelfRestricted = !isHqAdmin && !!isSelf;

  const targetAuthorityType = (detail?.authorityType || 'STAFF');

  const canEditJobGrade = !isSelf && (isHqAdmin || (isManager && targetAuthorityType === 'STAFF'));
  const canEditAuthorityType = isHqAdmin && !isSelf;

  const [form, setForm] = useState({
    employeeNumber: '',
    name: '',
    jobGradeId: '',
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    zipcode: '',
    address: '',
    addressDetail: '',
    mobile: '',
    emergencyTel: '',
    emergencyName: '',
    relationship: 'PARENT',
    hireDate: '',
    terminateDate: '',
    authorityType: 'STAFF',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    profileImageUrl: '',
    remark: '',
    rawPassword: '',
  });
  const [dispatches, setDispatches] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [doneOpen, setDoneOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const isEdit = useMemo(() => Boolean(id), [id]);

  useEffect(() => {
    if (isEdit && id) dispatch(fetchStaffDetailAction(id));
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (!jobGrades || (Array.isArray(jobGrades) && jobGrades.length === 0)) {
      if (!isGeneralStaff && !isSelfRestricted) dispatch(fetchJobGradesAction());
    }
  }, [dispatch, jobGrades, isGeneralStaff, isSelfRestricted]);

  useEffect(() => {
    (async () => {
      try {
        const arr = await fetchBranchOptions();
        setBranchOptions(arr);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (detail && isEdit) {
      const toStr = (v) => (v === undefined || v === null || v === '' ? '' : String(v));
      setForm({
        employeeNumber: detail.employeeNumber || '',
        name: detail.name || '',
        jobGradeId: toStr(detail.jobGradeId ?? detail.jobGrade?.id),
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
        rawPassword: '',
      });
      const ds = Array.isArray(detail.dispatches) ? detail.dispatches : [];
      setDispatches(ds.map(d => ({
        branchId: d.branchId ?? d.branch?.id ?? null,
        assignedFrom: d.assignedFrom ?? '',
        assignedTo: d.assignedTo ?? '',
        placementYn: d.placementYn ?? 'N',
      })));
      setPreview(detail.profileImageUrl || null);
    }
  }, [detail, isEdit]);

  const rawJobGradeOptions = useMemo(() => {
    const jg = jobGrades;
    if (Array.isArray(jg)) return jg;
    if (jg?.content && Array.isArray(jg.content)) return jg.content;
    if (jg?.result && Array.isArray(jg.result)) return jg.result;
    if (jg?.items && Array.isArray(jg.items)) return jg.items;
    return [];
  }, [jobGrades]);

  const currentJobGradeId = useMemo(() => {
    return String(form.jobGradeId || detail?.jobGradeId || detail?.jobGrade?.id || '');
  }, [form.jobGradeId, detail?.jobGradeId, detail?.jobGrade?.id]);

  const currentJobGradeName = useMemo(() => {
    const found = rawJobGradeOptions.find(o => String(o?.id) === String(currentJobGradeId));
    return found?.name || detail?.jobGrade?.name || detail?.jobGradeName || '';
  }, [rawJobGradeOptions, currentJobGradeId, detail?.jobGrade?.name, detail?.jobGradeName]);

  const jobGradeOptionsWithCurrent = useMemo(() => {
    let opts = [...rawJobGradeOptions];
    const exists = opts.some(o => String(o?.id) === String(currentJobGradeId));
    if (!exists && currentJobGradeId) {
      opts = [{ id: Number(currentJobGradeId), name: currentJobGradeName || '(현재 직급)', authorityType: targetAuthorityType }, ...opts];
    }
    return opts;
  }, [rawJobGradeOptions, currentJobGradeId, currentJobGradeName, targetAuthorityType]);

  const effectiveJobGradeOptions = useMemo(() => {
    if (isHqAdmin) return jobGradeOptionsWithCurrent;
    if (isSelf) return jobGradeOptionsWithCurrent;
    return jobGradeOptionsWithCurrent.filter(
      o => (o?.authorityType || 'STAFF') === 'STAFF' || String(o?.id) === String(currentJobGradeId)
    );
  }, [isHqAdmin, isSelf, jobGradeOptionsWithCurrent, currentJobGradeId]);

  useEffect(() => {
    if (!canEditAuthorityType && detail?.authorityType) {
      setForm((f) => ({ ...f, authorityType: detail.authorityType }));
    }
  }, [canEditAuthorityType, detail?.authorityType]);

  useEffect(() => {
    if (!isHqAdmin || isSelf) return;
    const jg = effectiveJobGradeOptions.find((x) => String(x?.id) === String(currentJobGradeId));
    if (jg?.authorityType && form.authorityType !== jg.authorityType) {
      setForm((f) => ({ ...f, authorityType: jg.authorityType }));
    }
  }, [isHqAdmin, isSelf, effectiveJobGradeOptions, currentJobGradeId, form.authorityType]);

  useEffect(() => {
    if (createError) { addToast({ type: 'error', title: '등록 실패', message: createError, duration: 3000 }); dispatch(clearErrors()); }
  }, [createError, addToast, dispatch]);
  useEffect(() => {
    if (updateError) { addToast({ type: 'error', title: '수정 실패', message: updateError, duration: 3000 }); dispatch(clearErrors()); }
  }, [updateError, addToast, dispatch]);
  useEffect(() => {
    if (detailError) { addToast({ type: 'error', title: '상세 조회 실패', message: detailError, duration: 3000 }); dispatch(clearErrors()); }
  }, [detailError, addToast, dispatch]);

  useEffect(() => {
    if (!isEdit || !detail) return;
    if (!form.jobGradeId) {
      const idStr = String(detail?.jobGradeId ?? detail?.jobGrade?.id ?? '');
      if (idStr) setForm((f) => ({ ...f, jobGradeId: idStr }));
    }
  }, [isEdit, detail, form.jobGradeId]);

  const pick = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };

  const onAddress = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data) => {
          setForm((f) => ({ ...f, zipcode: data.zonecode, address: data.address }));
          if (errors.zipcode) setErrors((e) => ({ ...e, zipcode: null }));
          if (errors.address) setErrors((e) => ({ ...e, address: null }));
        },
      }).open();
    }
  };

  const onImage = (e) => {
    if (isSelfRestricted) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    if (isSelfRestricted) return;
    setImageFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const validate = () => {
    const m = {};
    if (!form.email.trim()) m.email = '이메일을 입력하세요';
    if (!form.zipcode.trim()) m.zipcode = '우편번호를 입력하세요';
    if (!form.address.trim()) m.address = '주소를 입력하세요';
    if (!form.addressDetail.trim()) m.addressDetail = '상세주소를 입력하세요';
    if (!form.mobile.trim()) m.mobile = '휴대폰번호를 입력하세요';
    if (!form.emergencyTel.trim()) m.emergencyTel = '비상연락처를 입력하세요';
    if (!form.emergencyName.trim()) m.emergencyName = '비상연락처 이름을 입력하세요';

    if (!isSelfRestricted) {
      if (!form.employeeNumber.trim()) m.employeeNumber = '사번을 입력하세요';
      if (!form.name.trim()) m.name = '이름을 입력하세요';
      if (!form.dateOfBirth) m.dateOfBirth = '생년월일을 입력하세요';
      if (!isEdit && !form.rawPassword.trim()) m.rawPassword = '비밀번호를 입력하세요';
      if (!currentJobGradeId) m.jobGradeId = '직급을 선택하세요';
      if (!form.hireDate) m.hireDate = '입사일을 입력하세요';
    }

    setErrors(m);
    return Object.keys(m).length === 0;
  };

  const viewBranchOptions = useMemo(() => {
    if (isHqAdmin) return branchOptions;
    const ids = new Set(
      Array.isArray(authUser?.managedBranchIds) && authUser.managedBranchIds.length
        ? authUser.managedBranchIds
        : [authUser?.branchId].filter(Boolean)
    );
    if (ids.size === 0) return branchOptions;
    return branchOptions.filter(b => ids.has(b.id));
  }, [isHqAdmin, branchOptions, authUser?.managedBranchIds, authUser?.branchId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let payload = {
      ...form,
      jobGradeId: currentJobGradeId ? Number(currentJobGradeId) : null,
      dispatches: dispatches.map(d => ({
        branchId: d.branchId ? Number(d.branchId) : null,
        assignedFrom: d.assignedFrom || null,
        assignedTo: d.assignedTo || null,
        placementYn: d.placementYn || 'N',
      })),
    };

    if (isSelfRestricted && detail) {
      const keep = (k, fallback = null) => (detail[k] === undefined ? fallback : detail[k]);
      payload.employeeNumber   = keep('employeeNumber', payload.employeeNumber);
      payload.name             = keep('name', payload.name);
      payload.jobGradeId       = detail.jobGradeId ?? detail.jobGrade?.id ?? payload.jobGradeId;
      payload.dateOfBirth      = keep('dateOfBirth', payload.dateOfBirth);
      payload.gender           = keep('gender', payload.gender);
      payload.hireDate         = keep('hireDate', payload.hireDate);
      payload.terminateDate    = keep('terminateDate', payload.terminateDate);
      payload.authorityType    = keep('authorityType', payload.authorityType);
      payload.employmentStatus = keep('employmentStatus', payload.employmentStatus);
      payload.employmentType   = keep('employmentType', payload.employmentType);
      payload.profileImageUrl  = keep('profileImageUrl', payload.profileImageUrl);
      payload.remark           = keep('remark', payload.remark);
      payload.dispatches = (Array.isArray(detail.dispatches) ? detail.dispatches : []).map(d => ({
        branchId: d.branchId ?? d.branch?.id ?? null,
        assignedFrom: d.assignedFrom ?? null,
        assignedTo: d.assignedTo ?? null,
        placementYn: d.placementYn ?? 'N',
      }));
      payload.rawPassword = '';
    }

    if (!isHqAdmin && !isSelf) {
      payload.authorityType = 'STAFF';
    }

    if (isEdit && !payload.rawPassword) delete payload.rawPassword;

    if (isEdit) {
      await dispatch(
        updateStaffAction({
          staffId: id,
          payload,
          profileImage: isSelfRestricted ? null : imageFile,
        })
      ).unwrap();
      setDoneOpen(true);
    } else {
      await dispatch(createStaffAction({ payload, profileImage: imageFile })).unwrap();
      setDoneOpen(true);
    }
  };

  const addDispatch = () => {
    if (isSelfRestricted) return;
    setDispatches(arr => [...arr, { branchId: '', assignedFrom: '', assignedTo: '', placementYn: 'N' }]);
  };
  const removeDispatch = (idx) => {
    if (isSelfRestricted) return;
    setDispatches(arr => arr.filter((_, i) => i !== idx));
  };
  const changeDispatch = (idx, key, val) => {
    if (isSelfRestricted) return;
    setDispatches(arr => arr.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };

  return (
    <Wrap>
      <Card>
        <Head>
          <h2>{isEdit ? (isSelf ? '내 정보 수정' : '직원수정') : '직원등록'}</h2>
          <HeadSub>
            {isEdit
              ? (isSelfRestricted ? '연락처와 주소 정보만 수정 가능합니다' : '직원 정보를 수정합니다')
              : '새로운 직원을 등록합니다'}
          </HeadSub>
        </Head>

        <TopSection>
          <TopTitle>프로필 이미지</TopTitle>
          <TopUpload>
            <PreviewWrap>
              <TopPreview $disabled={isSelfRestricted}>
                {preview ? (
                  <img src={preview} alt="profile" />
                ) : (
                  <TopPlaceholder>
                    <Icon path={mdiUpload} size={2} />
                    <span>{isSelfRestricted ? '이미지 변경 불가' : '이미지 업로드'}</span>
                  </TopPlaceholder>
                )}
                {!isSelfRestricted && (
                  <input ref={fileRef} type="file" accept="image/*" onChange={onImage} />
                )}
              </TopPreview>

              {preview && !isSelfRestricted && (
                <ClearBadge
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearImage(); }}
                  aria-label="이미지 제거"
                  title="이미지 제거"
                >
                  <Icon path={mdiClose} size={0.82} />
                </ClearBadge>
              )}
            </PreviewWrap>
          </TopUpload>
        </TopSection>

        <Form onSubmit={submit}>
          <Section>
            <SectionTitle>기본 정보</SectionTitle>
            <Grid>
              <Label $required={!isSelfRestricted}>사번</Label>
              <Input
                value={form.employeeNumber}
                onChange={(e) => pick('employeeNumber', e.target.value)}
                placeholder="사번"
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />
              {errors.employeeNumber && <Err>{errors.employeeNumber}</Err>}

              <Label $required={!isSelfRestricted}>직원명</Label>
              <Input
                value={form.name}
                onChange={(e) => pick('name', e.target.value)}
                placeholder="직원명을 입력하세요."
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />
              {errors.name && <Err>{errors.name}</Err>}

              <Label $required={!isSelfRestricted}>직급</Label>
              {isSelfRestricted ? (
                <ReadOnlyBox>{currentJobGradeName || '-'}</ReadOnlyBox>
              ) : (
                <Select
                  value={currentJobGradeId}
                  onChange={(e) => pick('jobGradeId', e.target.value)}
                  disabled={!canEditJobGrade}
                >
                  {!currentJobGradeId && (
                    <option value="">{jobGradeLoading ? '불러오는 중...' : '선택'}</option>
                  )}
                  {effectiveJobGradeOptions.map((jg) => (
                    <option key={jg.id} value={String(jg.id)}>{jg.name}</option>
                  ))}
                </Select>
              )}
              {errors.jobGradeId && <Err>{errors.jobGradeId}</Err>}

              <Label $required={!isSelfRestricted}>생년월일</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => pick('dateOfBirth', e.target.value)}
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />
              {errors.dateOfBirth && <Err>{errors.dateOfBirth}</Err>}

              <Label>성별</Label>
              <Select
                value={form.gender}
                onChange={(e) => pick('gender', e.target.value)}
                disabled={isSelfRestricted}
              >
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </Select>
            </Grid>
          </Section>

          <Section>
            <SectionTitle>연락처 정보</SectionTitle>
            <Grid>
              <Label $required>이메일</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => pick('email', e.target.value)}
                placeholder="example@care-up.com"
              />
              {errors.email && <Err>{errors.email}</Err>}

              <Label $required>휴대폰</Label>
              <Input
                value={form.mobile}
                onChange={(e) => pick('mobile', e.target.value)}
                placeholder="010-0000-0000"
              />
              {errors.mobile && <Err>{errors.mobile}</Err>}

              <Label $required>비상연락망</Label>
              <Input
                value={form.emergencyTel}
                onChange={(e) => pick('emergencyTel', e.target.value)}
                placeholder="대체 연락처"
              />
              {errors.emergencyTel && <Err>{errors.emergencyTel}</Err>}

              <Label $required>비상연락처 이름</Label>
              <Input
                value={form.emergencyName}
                onChange={(e) => pick('emergencyName', e.target.value)}
                placeholder="관계자 성명"
              />
              {errors.emergencyName && <Err>{errors.emergencyName}</Err>}

              <Label $required>관계</Label>
              <Select
                value={form.relationship}
                onChange={(e) => pick('relationship', e.target.value)}
              >
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
              <Label $required>우편번호</Label>
              <Row>
                <Input
                  value={form.zipcode}
                  onChange={(e) => pick('zipcode', e.target.value)}
                  placeholder="우편번호를 입력하거나 '주소 검색'을 누르세요"
                  inputMode="numeric"
                />
                <Btn type="button" onClick={onAddress}>주소 검색</Btn>
              </Row>
              {errors.zipcode && <Err>{errors.zipcode}</Err>}

              <Label $required>주소</Label>
              <Input
                value={form.address}
                onChange={(e) => pick('address', e.target.value)}
                placeholder="주소를 직접 입력하거나 검색 결과를 사용하세요."
              />
              {errors.address && <Err>{errors.address}</Err>}

              <Label $required>상세주소</Label>
              <Input
                value={form.addressDetail}
                onChange={(e) => pick('addressDetail', e.target.value)}
                placeholder="상세주소를 입력하세요."
              />
              {errors.addressDetail && <Err>{errors.addressDetail}</Err>}
            </Grid>
          </Section>

          <Section>
            <SectionTitle>고용 정보</SectionTitle>
            <Grid>
              <Label $required={!isSelfRestricted}>입사일</Label>
              <Input
                type="date"
                value={form.hireDate}
                onChange={(e) => pick('hireDate', e.target.value)}
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />
              {errors.hireDate && <Err>{errors.hireDate}</Err>}

              <Label>퇴사일</Label>
              <Input
                type="date"
                value={form.terminateDate || ''}
                onChange={(e) => pick('terminateDate', e.target.value)}
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />

              <Label $required={canEditAuthorityType}>권한 유형</Label>
              {canEditAuthorityType ? (
                <Select
                  value={form.authorityType}
                  onChange={(e) => pick('authorityType', e.target.value)}
                >
                  <option value="HQ_ADMIN">본점(본사) 관리자</option>
                  <option value="BRANCH_ADMIN">지점(직영점) 관리자</option>
                  <option value="FRANCHISE_OWNER">가맹점주 (관리자)</option>
                  <option value="STAFF">직원</option>
                </Select>
              ) : (
                <ReadOnlyBox>
                  {form.authorityType === 'HQ_ADMIN' && '본점(본사) 관리자'}
                  {form.authorityType === 'BRANCH_ADMIN' && '지점(직영점) 관리자'}
                  {form.authorityType === 'FRANCHISE_OWNER' && '가맹점주 (관리자)'}
                  {form.authorityType === 'STAFF' && '직원'}
                </ReadOnlyBox>
              )}

              <Label $required={!isSelfRestricted}>고용상태</Label>
              <Select
                value={form.employmentStatus}
                onChange={(e) => pick('employmentStatus', e.target.value)}
                disabled={isSelfRestricted}
              >
                <option value="ACTIVE">재직</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="TERMINATED">퇴사</option>
              </Select>

              <Label $required={!isSelfRestricted}>고용형태</Label>
              <Select
                value={form.employmentType}
                onChange={(e) => pick('employmentType', e.target.value)}
                disabled={isSelfRestricted}
              >
                <option value="FULL_TIME">정규직</option>
                <option value="PART_TIME">계약직</option>
              </Select>
            </Grid>
          </Section>

          <Section>
            <SectionTitle>지점 배치</SectionTitle>
            <DispatchList>
              {dispatches.map((d, idx) => (
                <DispatchRow key={idx}>
                  <Field>
                    <SmallLabel>지점</SmallLabel>
                    <Select
                      value={d.branchId != null ? String(d.branchId) : ''}
                      onChange={(e) => changeDispatch(idx, 'branchId', e.target.value ? Number(e.target.value) : '')}
                      disabled={isSelfRestricted}
                    >
                      <option value="">선택</option>
                      {viewBranchOptions.map((b) => (
                        <option key={b.id} value={String(b.id)}>{b.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field>
                    <SmallLabel>시작일</SmallLabel>
                    <Input
                      type="date"
                      value={d.assignedFrom}
                      onChange={(e) => changeDispatch(idx, 'assignedFrom', e.target.value)}
                      disabled={isSelfRestricted}
                      readOnly={isSelfRestricted}
                    />
                  </Field>
                  <Field>
                    <SmallLabel>종료일</SmallLabel>
                    <Input
                      type="date"
                      value={d.assignedTo}
                      onChange={(e) => changeDispatch(idx, 'assignedTo', e.target.value)}
                      disabled={isSelfRestricted}
                      readOnly={isSelfRestricted}
                    />
                  </Field>
                  {!isSelfRestricted && (
                    <IconBtn
                      type="button"
                      aria-label="배치 삭제"
                      onClick={() => removeDispatch(idx)}
                      title="배치 삭제"
                    >
                      <Icon path={mdiDelete} size={0.9} />
                    </IconBtn>
                  )}
                </DispatchRow>
              ))}
            </DispatchList>
            {!isSelfRestricted && (
              <AddLine>
                <Ghost type="button" onClick={addDispatch}>
                  <Icon path={mdiPlus} size={1} />
                  배치 추가
                </Ghost>
              </AddLine>
            )}
          </Section>

          {!isEdit && (
            <Section>
              <SectionTitle>계정 정보</SectionTitle>
              <Grid>
                <Label $required>비밀번호</Label>
                <InputAffix>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={form.rawPassword}
                    onChange={(e) => pick('rawPassword', e.target.value)}
                    placeholder="8자 이상"
                  />
                  <AffixBtn type="button" onClick={() => setShowPw(v => !v)} aria-label="비밀번호 표시 전환">
                    <Icon path={mdiEyeOff} size={0.9} style={{ display: showPw ? 'none' : 'block' }} />
                    <Icon path={mdiEye} size={0.9} style={{ display: showPw ? 'block' : 'none' }} />
                  </AffixBtn>
                </InputAffix>
                {errors.rawPassword && <Err>{errors.rawPassword}</Err>}
              </Grid>
            </Section>
          )}

          <Section>
            <SectionTitle>비고</SectionTitle>
            <Grid>
              <TextAreaWide
                rows={8}
                value={form.remark}
                onChange={(e) => pick('remark', e.target.value)}
                placeholder="비고란을 작성하실 수 있습니다."
                disabled={isSelfRestricted}
                readOnly={isSelfRestricted}
              />
            </Grid>
          </Section>

          <Footer>
            <Ghost type="button" onClick={() => navigate(pathIsMy ? '/my' : '/staff')}>취소</Ghost>
            <Primary type="submit" disabled={createLoading || updateLoading}>
              <Icon path={mdiContentSave} size={1} />
              확인
            </Primary>
          </Footer>
        </Form>
      </Card>

      {doneOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>{isEdit ? '수정이 완료되었습니다' : '등록이 완료되었습니다'}</ModalTitle>
            <ModalSub>
              {isSelfRestricted
                ? '확인을 누르면 내 정보 페이지로 이동합니다.'
                : '확인을 누르면 직원 목록으로 이동합니다.'}
            </ModalSub>
            <ModalActions>
              <Primary onClick={() => navigate(pathIsMy ? '/my' : '/staff', { replace: true })}>
                확인
              </Primary>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrap>
  );
}

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
  h2{margin:0;font-size:22px;font-weight:700;color:#111827;}
`;

const HeadSub = styled.p`
  margin:8px 0 0;
  font-size:14px;
  color:#6b7280;
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

const TopPreview = styled.label.withConfig({ shouldForwardProp:(p)=>p!=='$disabled' })`
  position:relative;
  width:168px;
  height:168px;
  border:2px dashed #d1d5db;
  border-radius:50%;
  display:grid;
  place-items:center;
  overflow:hidden;
  cursor:${(p)=>p.$disabled ? 'default' : 'pointer'};
  transition:.15s ease;
  background:#fff;
  ${(p)=>p.$disabled ? '' : '&:hover{border-color:#8b5cf6;background:#f9fafb;}'}
  img{width:100%;height:100%;object-fit:cover;}
  input{
    position:absolute;
    inset:0;
    opacity:0;
    cursor:pointer;
    z-index:1;
  }
`;

const TopPlaceholder = styled.div`
  display:grid;
  place-items:center;
  gap:8px;
  color:#6b7280;
  font-size:12px;
  transform: translateY(8px);
`;

const ClearBadge = styled.button`
  position:absolute;
  top:-10px;
  right:-10px;
  width:30px;
  height:30px;
  border-radius:999px;
  border:2px solid #e5e7eb;
  background:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  z-index:3;
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
  &:hover{background:#f9fafb;border-color:#d1d5db;}
  &:focus{outline:0; box-shadow:0 0 0 3px rgba(109,40,217,0.15);}
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

const Label = styled.label.withConfig({ shouldForwardProp:(p)=>p!=='$required' })`
  color:#374151;
  font-size:14px;
  font-weight:600;
  &::after{
    content:${(p)=>p.$required ? '" *"' : '""'};
    color:#dc2626;
  }
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
`;

const ReadOnlyBox = styled.div`
  min-height:48px;
  display:flex;
  align-items:center;
  padding:0 14px;
  border:2px solid #e5e7eb;
  border-radius:8px;
  background:#f9fafb;
  color:#374151;
  font-size:14px;
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
`;

const TextAreaWide = styled(TextArea)`
  grid-column: 1 / -1;
`;

const Row = styled.div`
  display:flex;
  gap:8px;
  align-items:center;
  input{flex:1;}
`;

const Btn = styled.button`
  height:44px;
  border:2px solid #e5e7eb;
  border-radius:8px;
  background:#f3f4f6;
  padding:0 14px;
  cursor:pointer;
  font-weight:600;
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
  &:hover{background:#e5e7eb;}
  &:focus{ outline:0; ${focusRing} }
`;

const Err = styled.div`
  grid-column:2/3;
  color:#dc2626;
  font-size:12px;
  margin-top:-6px;
`;

const Footer = styled.div`
  display:flex;
  justify-content:flex-end;
  gap:12px;
  margin-top:28px;
  padding-top:20px;
  border-top:1px solid #e5e7eb;
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

const Ghost = styled(BaseBtn)`
  background:#fff;
  color:#374151;
  border:2px solid #e5e7eb;
  &:hover{background:#f9fafb;}
`;

const Primary = styled(BaseBtn)`
  background:#8b5cf6;
  color:#fff;
  border:0;
  &:hover{filter:brightness(0.98);}
  &:disabled{opacity:.6;cursor:not-allowed;}
`;

const ModalOverlay = styled.div`
  position:fixed; inset:0; background:rgba(17,24,39,.45);
  display:grid; place-items:center; z-index:1000;
`;

const ModalCard = styled.div`
  width:min(420px,92vw); background:#fff; border-radius:14px;
  box-shadow:0 20px 40px rgba(0,0,0,.18); padding:22px;
`;

const ModalTitle = styled.h3`
  margin:0 0 6px; font-size:18px; color:#111827; font-weight:700;
`;

const ModalSub = styled.p`
  margin:0 0 16px; color:#6b7280; font-size:14px;
`;

const ModalActions = styled.div`
  display:flex; justify-content:flex-end; gap:10px;
`;

const DispatchList = styled.div`
  display:flex;
  flex-direction:column;
  gap:12px;
`;

const DispatchRow = styled.div`
  display:grid;
  grid-template-columns: 1.2fr 1fr 1fr 48px;
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

const IconBtn = styled.button`
  height:48px;
  border:0;
  background:transparent;
  display:grid;
  place-items:center;
  cursor:pointer;
`;

const AddLine = styled.div`
  display:flex; justify-content:flex-end; margin-top:10px;
`;

const InputAffix = styled.div`
  position:relative;
  display:flex;
  align-items:center;
  input{width:100%; padding-right:44px;}
`;

const AffixBtn = styled.button`
  position:absolute;
  right:10px;
  top:50%;
  transform:translateY(-50%);
  width:28px;
  height:28px;
  border-radius:8px;
  border:1px solid #e5e7eb;
  background:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  &:hover{background:#f9fafb;}
`;
