// src/pages/staff/StaffCreate.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiContentSave, mdiUpload } from '@mdi/js';
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

const g = (k, s) => new URLSearchParams(s).get(k);

export default function StaffCreate() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { branchId } = useAppSelector((s) => s.auth);
  const {
    createLoading, updateLoading,
    detail, detailError, createError, updateError,
    jobGrades, jobGradeLoading
  } = useAppSelector((s) => s.staff);

  const search = useLocation().search;
  const id = g('id', search);

  const [form, setForm] = useState({
    employeeNumber: '',
    name: '',
    jobGradeId: null,
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
    authorityType: 'FRANCHISE_OWNER',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    profileImageUrl: '',
    remark: '',
    rawPassword: '',
    // ❌ 배치 제거: dispatches는 이 화면에서 사용하지 않음
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [doneOpen, setDoneOpen] = useState(false);

  const isEdit = useMemo(() => Boolean(id), [id]);

  // 카카오 우편번호 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // 수정 모드: 상세 조회
  useEffect(() => {
    if (isEdit) dispatch(fetchStaffDetailAction(id));
  }, [dispatch, isEdit, id]);

  // 직급 목록 없으면 로드
  useEffect(() => {
    if (!jobGrades || jobGrades.length === 0) {
      dispatch(fetchJobGradesAction());
    }
  }, [dispatch, jobGrades]);

  // 상세 로드되면 폼에 채우기
  useEffect(() => {
    if (detail && isEdit) {
      setForm({
        employeeNumber: detail.employeeNumber || '',
        name: detail.name || '',
        jobGradeId: detail.jobGradeId ?? detail.jobGrade?.id ?? null,
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
        authorityType: detail.authorityType || 'FRANCHISE_OWNER',
        employmentStatus: detail.employmentStatus || 'ACTIVE',
        employmentType: detail.employmentType || 'FULL_TIME',
        profileImageUrl: detail.profileImageUrl || '',
        remark: detail.remark || '',
        rawPassword: '',
      });
      setPreview(detail.profileImageUrl || null);
    }
  }, [detail, isEdit]);

  // 에러 토스트
  useEffect(() => {
    if (createError) { addToast({ type: 'error', title: '등록 실패', message: createError, duration: 3000 }); dispatch(clearErrors()); }
  }, [createError, addToast, dispatch]);
  useEffect(() => {
    if (updateError) { addToast({ type: 'error', title: '수정 실패', message: updateError, duration: 3000 }); dispatch(clearErrors()); }
  }, [updateError, addToast, dispatch]);
  useEffect(() => {
    if (detailError) { addToast({ type: 'error', title: '상세 조회 실패', message: detailError, duration: 3000 }); dispatch(clearErrors()); }
  }, [detailError, addToast, dispatch]);

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
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const m = {};
    if (!form.employeeNumber.trim()) m.employeeNumber = '사번을 입력하세요';
    if (!form.name.trim()) m.name = '이름을 입력하세요';
    if (!form.dateOfBirth) m.dateOfBirth = '생년월일을 입력하세요';
    if (!form.email.trim()) m.email = '이메일을 입력하세요';
    if (!form.zipcode.trim()) m.zipcode = '우편번호를 입력하세요';
    if (!form.address.trim()) m.address = '주소를 입력하세요';
    if (!form.addressDetail.trim()) m.addressDetail = '상세주소를 입력하세요';
    if (!form.mobile.trim()) m.mobile = '휴대폰번호를 입력하세요';
    if (!form.emergencyTel.trim()) m.emergencyTel = '비상연락처를 입력하세요';
    if (!form.emergencyName.trim()) m.emergencyName = '비상연락처 이름을 입력하세요';
    if (!form.hireDate) m.hireDate = '입사일을 입력하세요';
    if (!isEdit && !form.rawPassword.trim()) m.rawPassword = '비밀번호를 입력하세요';
    if (!form.jobGradeId) m.jobGradeId = '직급을 선택하세요';
    setErrors(m);
    return Object.keys(m).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...form };
    if (isEdit && !payload.rawPassword) delete payload.rawPassword;

    if (isEdit) {
      await dispatch(updateStaffAction({ staffId: id, payload, profileImage: imageFile })).unwrap();
      setDoneOpen(true);
    } else {
      await dispatch(createStaffAction({ payload, profileImage: imageFile })).unwrap();
      setDoneOpen(true);
    }
  };

  return (
    <Wrap>
      <Card>
        <Head>
          <h2>{isEdit ? '직원수정' : '직원등록'}</h2>
        </Head>
        <Form onSubmit={submit}>
          <Grid>
            <Label>사번</Label>
            <Input value={form.employeeNumber} onChange={(e) => pick('employeeNumber', e.target.value)} placeholder="사번" />
            {errors.employeeNumber && <Err>{errors.employeeNumber}</Err>}

            <Label>직원명</Label>
            <Input value={form.name} onChange={(e) => pick('name', e.target.value)} placeholder="직원명을 입력하세요." />
            {errors.name && <Err>{errors.name}</Err>}

            <Label>직급</Label>
            <Select
              value={form.jobGradeId || ''}
              onChange={(e) => pick('jobGradeId', e.target.value ? Number(e.target.value) : null)}
              disabled={jobGradeLoading}
            >
              <option value="">{jobGradeLoading ? '불러오는 중...' : '선택'}</option>
              {(jobGrades || []).map((jg) => (
                <option key={jg.id} value={jg.id}>{jg.name}</option>
              ))}
            </Select>
            {errors.jobGradeId && <Err>{errors.jobGradeId}</Err>}

            <Label>생년월일</Label>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => pick('dateOfBirth', e.target.value)} />
            {errors.dateOfBirth && <Err>{errors.dateOfBirth}</Err>}

            <Label>성별</Label>
            <Select value={form.gender} onChange={(e) => pick('gender', e.target.value)}>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </Select>

            <Label>이메일</Label>
            <Input type="email" value={form.email} onChange={(e) => pick('email', e.target.value)} placeholder="example@care-up.com" />
            {errors.email && <Err>{errors.email}</Err>}

            <Label>우편번호</Label>
            <Row>
              <Input readOnly value={form.zipcode} placeholder="Kakao 우편번호 서비스 사용" />
              <Btn type="button" onClick={onAddress}>주소 검색</Btn>
            </Row>
            {errors.zipcode && <Err>{errors.zipcode}</Err>}

            <Label>주소</Label>
            <Input readOnly value={form.address} placeholder="주소를 입력하세요." />
            {errors.address && <Err>{errors.address}</Err>}

            <Label>상세주소</Label>
            <Input value={form.addressDetail} onChange={(e) => pick('addressDetail', e.target.value)} placeholder="상세주소를 입력하세요." />
            {errors.addressDetail && <Err>{errors.addressDetail}</Err>}

            <Label>휴대폰</Label>
            <Input value={form.mobile} onChange={(e) => pick('mobile', e.target.value)} placeholder="010-0000-0000" />
            {errors.mobile && <Err>{errors.mobile}</Err>}

            <Label>비상연락망</Label>
            <Input value={form.emergencyTel} onChange={(e) => pick('emergencyTel', e.target.value)} placeholder="대체 연락처" />
            {errors.emergencyTel && <Err>{errors.emergencyTel}</Err>}

            <Label>관계</Label>
            <Select value={form.relationship} onChange={(e) => pick('relationship', e.target.value)}>
              <option value="PARENT">부모</option>
              <option value="SIBLING">형제자매</option>
              <option value="SPOUSE">배우자</option>
              <option value="CHILD">자녀</option>
              <option value="FRIEND">친구</option>
              <option value="NEIGHBOR">이웃</option>
              <option value="OTHER">기타</option>
            </Select>

            <Label>관계자 성명</Label>
            <Input value={form.emergencyName} onChange={(e) => pick('emergencyName', e.target.value)} placeholder="관계자 성명" />
            {errors.emergencyName && <Err>{errors.emergencyName}</Err>}

            <Label>입사일</Label>
            <Input type="date" value={form.hireDate} onChange={(e) => pick('hireDate', e.target.value)} />
            {errors.hireDate && <Err>{errors.hireDate}</Err>}

            <Label>퇴사일</Label>
            <Input type="date" value={form.terminateDate || ''} onChange={(e) => pick('terminateDate', e.target.value)} />

            {!isEdit && (
              <>
                <Label>비밀번호</Label>
                <Input type="password" value={form.rawPassword} onChange={(e) => pick('rawPassword', e.target.value)} placeholder="8자 이상" />
                {errors.rawPassword && <Err>{errors.rawPassword}</Err>}
              </>
            )}

            <Label>권한 유형</Label>
            <Select value={form.authorityType} onChange={(e) => pick('authorityType', e.target.value)}>
              <option value="HQ_ADMIN">본점(본사) 관리자</option>
              <option value="BRANCH_ADMIN">지점(직영점) 관리자</option>
              <option value="FRANCHISE_OWNER">가맹점주 (관리자)</option>
              <option value="STAFF">직원</option>
            </Select>

            <Label>고용상태</Label>
            <Select value={form.employmentStatus} onChange={(e) => pick('employmentStatus', e.target.value)}>
              <option value="ACTIVE">재직</option>
              <option value="ON_LEAVE">휴직</option>
              <option value="TERMINATED">퇴사</option>
            </Select>

            <Label>고용형태</Label>
            <Select value={form.employmentType} onChange={(e) => pick('employmentType', e.target.value)}>
              <option value="FULL_TIME">정규직</option>
              <option value="PART_TIME">계약직</option>
            </Select>

            <Label>프로필 이미지</Label>
            <Upload>
              <Preview>
                {preview ? <img src={preview} alt="profile" /> : <span>미리보기</span>}
              </Preview>
              <label>
                <Icon path={mdiUpload} size={0.9} />
                파일 선택
                <input type="file" accept="image/*" onChange={onImage} />
              </label>
            </Upload>

            <Label style={{ alignSelf: 'start' }}>비고</Label>
            <TextArea rows={6} value={form.remark} onChange={(e) => pick('remark', e.target.value)} placeholder="비고란을 작성하실 수 있습니다." />
          </Grid>

          <Footer>
            <Ghost type="button" onClick={() => navigate('/staff')}>취소</Ghost>
            <Primary type="submit" disabled={createLoading || updateLoading}>
              <Icon path={mdiContentSave} size={1} />
              {isEdit ? '수정' : '등록'}
            </Primary>
          </Footer>
        </Form>
      </Card>

      {doneOpen && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>{isEdit ? '수정이 완료되었습니다' : '등록이 완료되었습니다'}</ModalTitle>
            <ModalSub>확인을 누르면 직원 목록으로 이동합니다.</ModalSub>
            <ModalActions>
              <Primary onClick={() => navigate('/staff')}>확인</Primary>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`display:flex;justify-content:center;`;
const Card = styled.section`width:min(920px,96vw);background:#fff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);overflow:hidden;`;
const Head = styled.header`padding:24px 28px;border-bottom:1px solid #e5e7eb;h2{margin:0;font-size:20px;font-weight:700;color:#111827;}`;
const Form = styled.form`padding:28px;`;
const Grid = styled.div`display:grid;grid-template-columns:160px 1fr;grid-auto-rows:minmax(44px,auto);gap:14px 16px;align-items:center;`;
const Label = styled.label`color:#374151;font-size:14px;font-weight:600;`;
const Input = styled.input`border:2px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px;outline:0;`;
const Select = styled.select`border:2px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px;background:#fff;`;
const Row = styled.div`display:flex;gap:8px;align-items:center; input{flex:1;}`;
const Btn = styled.button`border:2px solid #e5e7eb;border-radius:8px;background:#f3f4f6;padding:10px 14px;cursor:pointer;`;
const Upload = styled.div`display:flex;align-items:center;gap:12px;
  label{display:inline-flex;gap:6px;align-items:center;border:1px dashed #cbd5e1;border-radius:8px;padding:10px 12px;cursor:pointer;background:#f8fafc;position:relative;}
  input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;}
`;
const Preview = styled.div`width:64px;height:64px;border-radius:50%;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#9ca3af;
  img{width:100%;height:100%;object-fit:cover;}
`;
const TextArea = styled.textarea`border:2px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px;resize:vertical;`;
const Err = styled.div`grid-column:2/3;color:#dc2626;font-size:12px;margin-top:-6px;`;
const Footer = styled.div`display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;`;
const Ghost = styled.button`background:#fff;border:2px solid #e5e7eb;border-radius:8px;padding:12px 18px;cursor:pointer;`; // ✅ pointer
const Primary = styled.button`display:inline-flex;align-items:center;gap:8px;background:#8b5cf6;color:#fff;border:0;border-radius:8px;padding:12px 18px;font-weight:700;cursor:pointer;`; // ✅ pointer

const ModalOverlay = styled.div`position:fixed;inset:0;background:rgba(17,24,39,.45);display:grid;place-items:center;z-index:1000;`;
const ModalCard = styled.div`width:min(420px,92vw);background:#fff;border-radius:14px;box-shadow:0 20px 40px rgba(0,0,0,.18);padding:22px;`;
const ModalTitle = styled.h3`margin:0 0 6px;font-size:18px;color:#111827;font-weight:700;`;
const ModalSub = styled.p`margin:0 0 16px;color:#6b7280;font-size:14px;`;
const ModalActions = styled.div`display:flex;justify-content:flex-end;gap:10px;`;
