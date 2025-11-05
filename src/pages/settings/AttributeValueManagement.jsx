// src/pages/settings/AttributeValueManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiPlus, mdiMagnify, mdiPencil, mdiDelete, mdiArrowLeft, mdiCheckCircle, mdiCancel } from '@mdi/js';
import { useToast } from '../../components/common/Toast';
import { inventoryService } from '../../service/inventoryService';

const Wrap = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;

  &:hover {
    background: #f3f4f6;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchBox = styled.form`
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0 8px;
  background: white;

  input {
    border: none;
    outline: none;
    padding: 8px;
    font-size: 14px;
    width: 200px;
  }
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;

  &:hover {
    color: #374151;
  }
`;

const Primary = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #6b46c1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #553c9a;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
    background: #f9fafb;
  }

  td {
    padding: 12px;
    font-size: 14px;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
  }

  tr:hover {
    background: #f9fafb;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #f3f4f6;
  }

  &.edit {
    color: #6b46c1;
    border-color: #6b46c1;

    &:hover {
      background: #ede9fe;
    }
  }

  &.delete {
    color: #ef4444;
    border-color: #ef4444;

    &:hover {
      background: #fee2e2;
    }
  }

  &.toggle {
    color: #059669;
    border-color: #059669;

    &:hover {
      background: #d1fae5;
    }
  }
`;

const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.active {
    background: #d1fae5;
    color: #059669;
  }

  &.inactive {
    background: #fee2e2;
    color: #dc2626;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  max-width: 90vw;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;

  &:hover {
    color: #374151;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;

  .required {
    color: #ef4444;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #6b46c1;
  }
`;

const NumberInput = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #6b46c1;
  }
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &.cancel {
    background: #f3f4f6;
    color: #374151;

    &:hover {
      background: #e5e7eb;
    }
  }

  &.save {
    background: #6b46c1;
    color: white;

    &:hover {
      background: #553c9a;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  p {
    margin: 8px 0;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 24px;
  color: #1e40af;
  font-size: 14px;
`;

export default function AttributeValueManagement() {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [attributeType, setAttributeType] = useState(null);
  const [attributeValues, setAttributeValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    value: '',
    displayName: '',
    displayOrder: 0,
    isActive: true
  });

  const fetchAttributeType = useCallback(async () => {
    if (!typeId) return;
    try {
      const data = await inventoryService.getAttributeType(typeId);
      setAttributeType(data);
    } catch (error) {
      console.error('속성 타입 조회 실패:', error);
    }
  }, [typeId]);

  const fetchAttributeValues = useCallback(async () => {
    if (!typeId) return;
    setLoading(true);
    try {
      const data = await inventoryService.getAttributeValuesByType(typeId);
      setAttributeValues(data || []);
    } catch (error) {
      console.error('속성 값 조회 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '속성 값 조회에 실패했습니다.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [typeId, addToast]);

  useEffect(() => {
    fetchAttributeType();
    fetchAttributeValues();
  }, [fetchAttributeType, fetchAttributeValues]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAttributeValues();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      value: '',
      displayName: '',
      displayOrder: attributeValues.length,
      isActive: true
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      value: item.value || '',
      displayName: item.displayName || '',
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm({
      value: '',
      displayName: '',
      displayOrder: 0,
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.value || form.value.trim() === '') {
      addToast({
        type: 'warning',
        title: '입력 오류',
        message: '속성 값을 입력해주세요.',
        duration: 2000
      });
      return;
    }

    if (!form.displayName || form.displayName.trim() === '') {
      addToast({
        type: 'warning',
        title: '입력 오류',
        message: '표시명을 입력해주세요.',
        duration: 2000
      });
      return;
    }

    try {
      const data = {
        attributeTypeId: parseInt(typeId),
        value: form.value.trim(),
        displayName: form.displayName.trim(),
        displayOrder: form.displayOrder || 0,
        isActive: form.isActive
      };

      if (editing) {
        await inventoryService.updateAttributeValue(editing.id, data);
        addToast({
          type: 'success',
          title: '완료',
          message: '속성 값이 수정되었습니다.',
          duration: 2000
        });
      } else {
        await inventoryService.createAttributeValue(data);
        addToast({
          type: 'success',
          title: '완료',
          message: '속성 값이 등록되었습니다.',
          duration: 2000
        });
      }
      closeModal();
      fetchAttributeValues();
    } catch (error) {
      console.error('속성 값 저장 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '속성 값 저장에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`'${item.displayName || item.value}' 속성 값을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await inventoryService.deleteAttributeValue(item.id);
      addToast({
        type: 'success',
        title: '완료',
        message: '속성 값이 삭제되었습니다.',
        duration: 2000
      });
      fetchAttributeValues();
    } catch (error) {
      console.error('속성 값 삭제 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '속성 값 삭제에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleToggle = async (item) => {
    try {
      await inventoryService.toggleAttributeValue(item.id);
      addToast({
        type: 'success',
        title: '완료',
        message: `속성 값이 ${item.isActive ? '비활성화' : '활성화'}되었습니다.`,
        duration: 2000
      });
      fetchAttributeValues();
    } catch (error) {
      console.error('속성 값 상태 변경 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '속성 값 상태 변경에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const filteredValues = attributeValues.filter(value =>
    value.value?.toLowerCase().includes(search.toLowerCase()) ||
    value.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Wrap>
      <Header>
        <HeaderLeft>
          <BackBtn onClick={() => navigate('/settings/attribute-types')}>
            <Icon path={mdiArrowLeft} size={0.9} />
            뒤로
          </BackBtn>
          <Title>
            속성 값 관리
            {attributeType && ` - ${attributeType.name}`}
          </Title>
        </HeaderLeft>
        <HeaderActions>
          <SearchBox onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="속성 값 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <IconBtn type="submit">
              <Icon path={mdiMagnify} size={0.9} />
            </IconBtn>
          </SearchBox>
          <Primary onClick={openCreate}>
            <Icon path={mdiPlus} size={0.9} />
            등록
          </Primary>
        </HeaderActions>
      </Header>

      {attributeType && (
        <InfoBox>
          <strong>{attributeType.name}</strong> 속성 타입의 속성 값들을 관리합니다.
          {attributeType.description && <div style={{ marginTop: '4px', fontSize: '13px' }}>{attributeType.description}</div>}
        </InfoBox>
      )}

      <Card>
        {loading ? (
          <EmptyState>
            <p>로딩 중...</p>
          </EmptyState>
        ) : filteredValues.length === 0 ? (
          <EmptyState>
            <p>등록된 속성 값이 없습니다.</p>
            <p>상단의 '등록' 버튼을 클릭하여 속성 값을 추가하세요.</p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>값</th>
                <th>표시명</th>
                <th>표시 순서</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredValues
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((value) => (
                <tr key={value.id}>
                  <td>{value.id}</td>
                  <td><code>{value.value}</code></td>
                  <td><strong>{value.displayName}</strong></td>
                  <td>{value.displayOrder || 0}</td>
                  <td>
                    <Badge className={value.isActive ? 'active' : 'inactive'}>
                      {value.isActive ? '활성' : '비활성'}
                    </Badge>
                  </td>
                  <td>
                    <Actions>
                      <ActionBtn className="toggle" onClick={() => handleToggle(value)}>
                        <Icon path={value.isActive ? mdiCancel : mdiCheckCircle} size={0.8} />
                        {value.isActive ? '비활성화' : '활성화'}
                      </ActionBtn>
                      <ActionBtn className="edit" onClick={() => openEdit(value)}>
                        <Icon path={mdiPencil} size={0.8} />
                        수정
                      </ActionBtn>
                      <ActionBtn className="delete" onClick={() => handleDelete(value)}>
                        <Icon path={mdiDelete} size={0.8} />
                        삭제
                      </ActionBtn>
                    </Actions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {modalOpen && (
        <ModalOverlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editing ? '속성 값 수정' : '속성 값 등록'}</ModalTitle>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>
                  값 <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="예: red, small, cotton"
                  required
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  시스템에서 사용하는 실제 값 (영문 권장)
                </div>
              </FormGroup>
              <FormGroup>
                <Label>
                  표시명 <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="예: 빨강, S, 면"
                  required
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  사용자에게 표시되는 이름
                </div>
              </FormGroup>
              <FormGroup>
                <Label>표시 순서</Label>
                <NumberInput
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </FormGroup>
              <FormGroup>
                <Checkbox>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span>활성화</span>
                </Checkbox>
              </FormGroup>
              <ModalActions>
                <Button type="button" className="cancel" onClick={closeModal}>
                  취소
                </Button>
                <Button type="submit" className="save">
                  {editing ? '수정' : '등록'}
                </Button>
              </ModalActions>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </Wrap>
  );
}



