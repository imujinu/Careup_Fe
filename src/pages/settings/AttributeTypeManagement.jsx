// src/pages/settings/AttributeTypeManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiPlus, mdiMagnify, mdiPencil, mdiDelete, mdiChevronRight } from '@mdi/js';
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

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;

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

const ValueCount = styled.span`
  color: #6b7280;
  font-size: 13px;
  margin-left: 8px;
`;

const ViewValuesBtn = styled.button`
  background: none;
  border: none;
  color: #6b46c1;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;

  &:hover {
    text-decoration: underline;
  }
`;

export default function AttributeTypeManagement() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isRequired: false,
    displayOrder: 0
  });

  const fetchAttributeTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAttributeTypesWithValues();
      setAttributeTypes(data || []);
    } catch (error) {
      console.error('속성 타입 조회 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '속성 타입 조회에 실패했습니다.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAttributeTypes();
  }, [fetchAttributeTypes]);

  const handleSearch = (e) => {
    e.preventDefault();
    // 검색 로직은 필요시 구현
    fetchAttributeTypes();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      isRequired: false,
      displayOrder: 0
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      isRequired: item.isRequired || false,
      displayOrder: item.displayOrder || 0
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm({
      name: '',
      description: '',
      isRequired: false,
      displayOrder: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || form.name.trim() === '') {
      addToast({
        type: 'warning',
        title: '입력 오류',
        message: '속성 타입명을 입력해주세요.',
        duration: 2000
      });
      return;
    }

    try {
      if (editing) {
        await inventoryService.updateAttributeType(editing.id, form);
        addToast({
          type: 'success',
          title: '완료',
          message: '속성 타입이 수정되었습니다.',
          duration: 2000
        });
      } else {
        await inventoryService.createAttributeType(form);
        addToast({
          type: 'success',
          title: '완료',
          message: '속성 타입이 등록되었습니다.',
          duration: 2000
        });
      }
      closeModal();
      fetchAttributeTypes();
    } catch (error) {
      console.error('속성 타입 저장 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '속성 타입 저장에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`'${item.name}' 속성 타입을 삭제하시겠습니까?\n\n주의: 연결된 속성 값들도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      await inventoryService.deleteAttributeType(item.id);
      addToast({
        type: 'success',
        title: '완료',
        message: '속성 타입이 삭제되었습니다.',
        duration: 2000
      });
      fetchAttributeTypes();
    } catch (error) {
      console.error('속성 타입 삭제 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '속성 타입 삭제에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const filteredTypes = attributeTypes.filter(type =>
    type.name?.toLowerCase().includes(search.toLowerCase()) ||
    type.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Wrap>
      <Header>
        <Title>속성 타입 관리</Title>
        <HeaderActions>
          <SearchBox onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="속성 타입명 검색"
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

      <Card>
        {loading ? (
          <EmptyState>
            <p>로딩 중...</p>
          </EmptyState>
        ) : filteredTypes.length === 0 ? (
          <EmptyState>
            <p>등록된 속성 타입이 없습니다.</p>
            <p>상단의 '등록' 버튼을 클릭하여 속성 타입을 추가하세요.</p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>속성 타입명</th>
                <th>설명</th>
                <th>필수 여부</th>
                <th>표시 순서</th>
                <th>속성 값 수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((type) => (
                <tr key={type.id}>
                  <td>{type.id}</td>
                  <td>
                    <strong>{type.name}</strong>
                  </td>
                  <td>{type.description || '-'}</td>
                  <td>{type.isRequired ? '필수' : '선택'}</td>
                  <td>{type.displayOrder}</td>
                  <td>
                    {type.attributeValues?.length || 0}개
                    {type.id && (
                      <ViewValuesBtn
                        onClick={() => navigate(`/settings/attribute-types/${type.id}/values`)}
                      >
                        관리
                        <Icon path={mdiChevronRight} size={0.8} />
                      </ViewValuesBtn>
                    )}
                  </td>
                  <td>
                    <Actions>
                      <ActionBtn className="edit" onClick={() => openEdit(type)}>
                        <Icon path={mdiPencil} size={0.8} />
                        수정
                      </ActionBtn>
                      <ActionBtn className="delete" onClick={() => handleDelete(type)}>
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
              <ModalTitle>{editing ? '속성 타입 수정' : '속성 타입 등록'}</ModalTitle>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>
                  속성 타입명 <span className="required">*</span>
                </Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 색상, 사이즈, 재질"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>설명</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="속성 타입에 대한 설명을 입력하세요"
                />
              </FormGroup>
              <FormGroup>
                <Checkbox>
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                  />
                  <span>필수 속성으로 설정</span>
                </Checkbox>
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

