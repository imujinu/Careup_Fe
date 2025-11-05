// src/pages/settings/CategoryAttributeManagement.jsx
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiPlus, mdiMagnify, mdiPencil, mdiDelete, mdiCheckCircle, mdiCancel } from '@mdi/js';
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
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const CategoryCard = styled(Card)`
  margin-bottom: 16px;
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const CategoryTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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

const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.required {
    background: #fee2e2;
    color: #dc2626;
  }

  &.optional {
    background: #d1fae5;
    color: #059669;
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

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: white;

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
  padding: 40px 20px;
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

export default function CategoryAttributeManagement() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [attributeTypes, setAttributeTypes] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    attributeTypeId: '',
    isRequired: false,
    displayOrder: 0
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await inventoryService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    }
  }, []);

  const fetchAttributeTypes = useCallback(async () => {
    try {
      const data = await inventoryService.getAttributeTypes();
      setAttributeTypes(data || []);
    } catch (error) {
      console.error('속성 타입 조회 실패:', error);
    }
  }, []);

  const fetchCategoryAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const categoriesData = await inventoryService.getCategories();
      const attributesMap = {};
      
      for (const category of categoriesData || []) {
        try {
          const attrs = await inventoryService.getCategoryAttributesWithoutValues(category.categoryId || category.id);
          attributesMap[category.categoryId || category.id] = attrs || [];
        } catch (err) {
          attributesMap[category.categoryId || category.id] = [];
        }
      }
      
      setCategoryAttributes(attributesMap);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('카테고리 속성 조회 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '카테고리 속성 조회에 실패했습니다.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
    fetchAttributeTypes();
    fetchCategoryAttributes();
  }, [fetchCategories, fetchAttributeTypes, fetchCategoryAttributes]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCategoryAttributes();
  };

  const openCreate = (category) => {
    setSelectedCategory(category);
    setEditing(null);
    setForm({
      categoryId: category?.categoryId || category?.id || '',
      attributeTypeId: '',
      isRequired: false,
      displayOrder: 0
    });
    setModalOpen(true);
  };

  const openEdit = (categoryAttr, category) => {
    setSelectedCategory(category);
    setEditing(categoryAttr);
    setForm({
      categoryId: category?.categoryId || category?.id || '',
      attributeTypeId: categoryAttr.attributeTypeId || categoryAttr.attributeType?.id || '',
      isRequired: categoryAttr.isRequired || false,
      displayOrder: categoryAttr.displayOrder || 0
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setSelectedCategory(null);
    setForm({
      categoryId: '',
      attributeTypeId: '',
      isRequired: false,
      displayOrder: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.categoryId) {
      addToast({
        type: 'warning',
        title: '입력 오류',
        message: '카테고리를 선택해주세요.',
        duration: 2000
      });
      return;
    }

    if (!form.attributeTypeId) {
      addToast({
        type: 'warning',
        title: '입력 오류',
        message: '속성 타입을 선택해주세요.',
        duration: 2000
      });
      return;
    }

    try {
      if (editing) {
        await inventoryService.updateCategoryAttribute(editing.id, form);
        addToast({
          type: 'success',
          title: '완료',
          message: '카테고리 속성이 수정되었습니다.',
          duration: 2000
        });
      } else {
        await inventoryService.addCategoryAttribute(form);
        addToast({
          type: 'success',
          title: '완료',
          message: '카테고리 속성이 등록되었습니다.',
          duration: 2000
        });
      }
      closeModal();
      fetchCategoryAttributes();
    } catch (error) {
      console.error('카테고리 속성 저장 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '카테고리 속성 저장에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleDelete = async (categoryAttr, category) => {
    if (!window.confirm(`'${category.name}' 카테고리에서 '${categoryAttr.attributeTypeName || categoryAttr.attributeType?.name}' 속성을 제거하시겠습니까?`)) {
      return;
    }

    try {
      await inventoryService.deleteCategoryAttribute(categoryAttr.id);
      addToast({
        type: 'success',
        title: '완료',
        message: '카테고리 속성이 삭제되었습니다.',
        duration: 2000
      });
      fetchCategoryAttributes();
    } catch (error) {
      console.error('카테고리 속성 삭제 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: error.response?.data?.status_message || '카테고리 속성 삭제에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(search.toLowerCase())
  );

  // 이미 연결된 속성 타입 필터링
  const getAvailableAttributeTypes = (categoryId) => {
    const connectedIds = (categoryAttributes[categoryId] || []).map(ca => 
      ca.attributeTypeId || ca.attributeType?.id
    );
    return attributeTypes.filter(at => {
      if (editing && (at.id === (editing.attributeTypeId || editing.attributeType?.id))) {
        return true; // 수정 중인 속성 타입은 포함
      }
      return !connectedIds.includes(at.id);
    });
  };

  return (
    <Wrap>
      <Header>
        <Title>카테고리 속성 연결 관리</Title>
        <HeaderActions>
          <SearchBox onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="카테고리명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <IconBtn type="submit">
              <Icon path={mdiMagnify} size={0.9} />
            </IconBtn>
          </SearchBox>
        </HeaderActions>
      </Header>

      <InfoBox>
        각 카테고리에서 사용할 속성 타입을 연결합니다. 상품 등록 시 연결된 속성 타입들이 자동으로 표시됩니다.
      </InfoBox>

      {loading ? (
        <Card>
          <EmptyState>
            <p>로딩 중...</p>
          </EmptyState>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <EmptyState>
            <p>등록된 카테고리가 없습니다.</p>
          </EmptyState>
        </Card>
      ) : (
        filteredCategories.map((category) => {
          const categoryId = category.categoryId || category.id;
          const attrs = categoryAttributes[categoryId] || [];
          
          return (
            <CategoryCard key={categoryId}>
              <CategoryHeader>
                <CategoryTitle>{category.name}</CategoryTitle>
                <Primary onClick={() => openCreate(category)}>
                  <Icon path={mdiPlus} size={0.9} />
                  속성 추가
                </Primary>
              </CategoryHeader>
              
              {attrs.length === 0 ? (
                <EmptyState>
                  <p>연결된 속성이 없습니다.</p>
                </EmptyState>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>속성 타입</th>
                      <th>필수 여부</th>
                      <th>표시 순서</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attrs
                      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((attr) => (
                      <tr key={attr.id}>
                        <td>
                          <strong>{attr.attributeTypeName || attr.attributeType?.name}</strong>
                        </td>
                        <td>
                          <Badge className={attr.isRequired ? 'required' : 'optional'}>
                            {attr.isRequired ? '필수' : '선택'}
                          </Badge>
                        </td>
                        <td>{attr.displayOrder || 0}</td>
                        <td>
                          <Actions>
                            <ActionBtn className="edit" onClick={() => openEdit(attr, category)}>
                              <Icon path={mdiPencil} size={0.8} />
                              수정
                            </ActionBtn>
                            <ActionBtn className="delete" onClick={() => handleDelete(attr, category)}>
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
            </CategoryCard>
          );
        })
      )}

      {modalOpen && (
        <ModalOverlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editing ? '카테고리 속성 수정' : '카테고리 속성 추가'}
                {selectedCategory && ` - ${selectedCategory.name}`}
              </ModalTitle>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>
                  카테고리
                </Label>
                <Select
                  value={form.categoryId}
                  onChange={(e) => {
                    const cat = categories.find(c => (c.categoryId || c.id) === parseInt(e.target.value));
                    setSelectedCategory(cat);
                    setForm({ ...form, categoryId: e.target.value });
                  }}
                  disabled={!!selectedCategory}
                >
                  <option value="">카테고리 선택</option>
                  {categories.map(cat => (
                    <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>
                  속성 타입 <span className="required">*</span>
                </Label>
                <Select
                  value={form.attributeTypeId}
                  onChange={(e) => setForm({ ...form, attributeTypeId: e.target.value })}
                  required
                >
                  <option value="">속성 타입 선택</option>
                  {getAvailableAttributeTypes(parseInt(form.categoryId)).map(attrType => (
                    <option key={attrType.id} value={attrType.id}>
                      {attrType.name}
                    </option>
                  ))}
                </Select>
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

