import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { inventoryService } from '../../../service/inventoryService';
import AddCategoryModal from './AddCategoryModal';

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
  z-index: 10000;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    height: 1px;
    background: #6b46c1;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  
  .required {
    color: #ef4444;
  }
`;

const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const TextArea = styled.textarea`
  height: 80px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const ResetButton = styled(Button)`
  background: #f59e0b;
  color: #ffffff;
  
  &:hover {
    background: #d97706;
  }
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const AddButton = styled(Button)`
  background: #6b46c1;
  color: #ffffff;
  
  &:hover {
    background: #553c9a;
  }
`;

function AddInventoryModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    minPrice: 0,
    maxPrice: 0,
    supplyPrice: 0,
    imageUrl: '',
    visibility: 'ALL'
  });
  
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      console.log('카테고리 목록 조회 시작...');
      const data = await inventoryService.getCategories();
      console.log('카테고리 API 응답:', data);
      
      // CategoryController는 ResponseDto.result 구조로 응답
      if (Array.isArray(data) && data.length > 0) {
        console.log('카테고리 목록 설정:', data);
        setCategories(data);
      } else {
        console.warn('API 응답이 비어있거나 잘못된 구조:', data);
        // 임시 하드코딩된 카테고리 사용
        console.log('하드코딩된 카테고리 사용');
        setCategories([
          { categoryId: 1, name: '음료' },
          { categoryId: 2, name: '디저트' },
          { categoryId: 3, name: '빵' }
        ]);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      // 임시 하드코딩된 카테고리 사용
      console.log('하드코딩된 카테고리 사용');
      setCategories([
        { categoryId: 1, name: '음료' },
        { categoryId: 2, name: '디저트' },
        { categoryId: 3, name: '빵' }
      ]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      minPrice: 0,
      maxPrice: 0,
      supplyPrice: 0,
      imageUrl: '',
      visibility: 'ALL'
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
    handleReset();
  };

  const handleCategorySave = async (categoryData) => {
    try {
      const result = await inventoryService.createCategory(categoryData);
      console.log('카테고리 등록 성공:', result);
      
      // 등록된 카테고리를 로컬 상태에 추가
      if (result && result.categoryId) {
        const newCategory = {
          categoryId: result.categoryId,
          name: result.name || categoryData.name
        };
        
        setCategories(prevCategories => {
          // 중복 체크
          const exists = prevCategories.some(cat => 
            cat.categoryId === newCategory.categoryId || cat.name === newCategory.name
          );
          
          if (!exists) {
            console.log('새 카테고리를 로컬 상태에 추가:', newCategory);
            return [...prevCategories, newCategory];
          }
          
          return prevCategories;
        });
      } else {
        console.warn('카테고리 등록 응답에서 categoryId를 찾을 수 없음:', result);
      }
      
      alert('카테고리가 성공적으로 등록되었습니다.');
      
      // 카테고리 목록 새로고침
      console.log('카테고리 목록 새로고침 시작...');
      await fetchCategories();
      console.log('카테고리 목록 새로고침 완료');
    } catch (error) {
      console.error('카테고리 등록 실패:', error);
      alert('카테고리 등록에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
    }
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement('div', null,
          React.createElement(ModalTitle, null, '상품 등록'),
          React.createElement(ModalSubtitle, null, '새로운 상품을 등록합니다')
        ),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '기본 정보'),
          React.createElement(FormGroup, null,
            React.createElement(Label, null,
              '상품명 ',
              React.createElement('span', { className: 'required' }, '*')
            ),
            React.createElement(Input, {
              type: 'text',
              placeholder: '예: 원두, 설탕, 우유 등',
              value: formData.name,
              onChange: (e) => handleInputChange('name', e.target.value)
            })
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null,
              '카테고리 ',
              React.createElement('span', { className: 'required' }, '*')
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement(Select, {
                value: formData.category,
                onChange: (e) => handleInputChange('category', e.target.value),
                style: { flex: 1 }
              },
                React.createElement('option', { value: '' }, `카테고리 선택 (${categories.length}개)`),
                ...(Array.isArray(categories) ? categories.map(category => 
                  React.createElement('option', { 
                    key: category.categoryId || category.id, 
                    value: category.categoryId || category.id 
                  }, category.name)
                ) : [])
              ),
              React.createElement('button', {
                type: 'button',
                onClick: () => setIsCategoryModalOpen(true),
                style: {
                  padding: '8px 12px',
                  backgroundColor: '#6b46c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }
              }, '+ 카테고리 추가')
            )
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '상품설명'),
            React.createElement(TextArea, {
              placeholder: '상품에 대한 설명을 입력하세요',
              value: formData.description,
              onChange: (e) => handleInputChange('description', e.target.value)
            })
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '이미지URL'),
            React.createElement(Input, {
              type: 'text',
              placeholder: 'https://example.com/image.jpg',
              value: formData.imageUrl,
              onChange: (e) => handleInputChange('imageUrl', e.target.value)
            })
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '가격 정보'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '최저 가격 (원)'),
              React.createElement(Input, {
                type: 'number',
                value: formData.minPrice,
                onChange: (e) => handleInputChange('minPrice', e.target.value)
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '최고 가격 (원)'),
              React.createElement(Input, {
                type: 'number',
                value: formData.maxPrice,
                onChange: (e) => handleInputChange('maxPrice', e.target.value)
              })
            )
          ),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '공급가 (원)'),
              React.createElement(Input, {
                type: 'number',
                value: formData.supplyPrice,
                onChange: (e) => handleInputChange('supplyPrice', e.target.value)
              })
            ),
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '공개범위'),
            React.createElement(Select, {
              value: formData.visibility,
              onChange: (e) => handleInputChange('visibility', e.target.value)
            },
              React.createElement('option', { value: 'ALL' }, '전체 공개'),
              React.createElement('option', { value: 'LIMITED' }, '제한 공개')
            )
          )
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(ResetButton, { onClick: handleReset }, '초기화'),
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(AddButton, { onClick: handleSave }, '추가')
        )
      ),
      React.createElement(AddCategoryModal, {
        isOpen: isCategoryModalOpen,
        onClose: () => setIsCategoryModalOpen(false),
        onSave: handleCategorySave
      })
    )
  );
}

export default AddInventoryModal;

