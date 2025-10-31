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
  width: 700px;
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
  display: flex;
  align-items: center;
  gap: 8px;
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
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
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
  min-height: 80px;
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
  justify-content: flex-end;
  gap: 12px;
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

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const UploadText = styled.span`
  color: #6b7280;
  font-size: 14px;
  text-align: center;
`;

const ImageUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 16px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  transition: all 0.2s;
  min-height: 120px;
  
  &:hover {
    border-color: #6b46c1;
    background-color: #f9fafb;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${FileInputLabel}:hover & {
    opacity: 1;
  }
`;

const ChangeText = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

const UploadIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
`;

const SaveButton = styled(Button)`
  background: #6b46c1;
  color: #ffffff;
  
  &:hover {
    background: #553c9a;
  }
`;

function EditInventoryModal({ isOpen, onClose, item, onSave }) {
  const [formData, setFormData] = useState({
    productName: '',
    safetyStock: 0,
    unitPrice: 0,
    sellingPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    description: '',
    category: '',
    visibility: 'ALL'
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      console.log('카테고리 목록 조회 시작...');
      const data = await inventoryService.getCategories();
      console.log('카테고리 API 응답:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('카테고리 목록 설정:', data);
        setCategories(data);
      } else {
        console.warn('API 응답이 비어있거나 잘못된 구조:', data);
        setCategories([
          { categoryId: 1, name: '음료' },
          { categoryId: 2, name: '디저트' },
          { categoryId: 3, name: '빵' }
        ]);
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      setCategories([
        { categoryId: 1, name: '음료' },
        { categoryId: 2, name: '디저트' },
        { categoryId: 3, name: '빵' }
      ]);
    }
  };

  // 모달이 열릴 때마다 상품 정보와 재고 정보 로드
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
    
    if (item && isOpen && item.product?.id) {
      const productId = item.product.id;
      
      // 재고 정보 설정
      setFormData({
        productName: item.product?.name || '',
        safetyStock: item.safetyStock || 0,
        unitPrice: item.unitPrice || 0,
        sellingPrice: item.salesPrice || item.price || item.unitPrice || 0,
        minPrice: item.product?.minPrice || item.minPrice || 0,
        maxPrice: item.product?.maxPrice || item.maxPrice || 0,
        description: item.product?.description || item.description || '',
        category: item.product?.categoryId || item.categoryId || item.category || '',
        visibility: item.product?.visibility || item.visibility || 'ALL'
      });
      
      // 상품 상세 정보 가져오기 (이미지 URL 및 추가 정보)
      const fetchProductInfo = async () => {
        try {
          const response = await inventoryService.getProduct(productId);
          const productData = response.data?.data || response.data;
          
          // 기존 이미지 URL이 있으면 미리보기 설정 (빈 문자열이 아닌 경우만)
          if (productData?.imageUrl && productData.imageUrl.trim() !== "") {
            setImagePreview(productData.imageUrl);
          } else {
            setImagePreview(null);
          }
          
          // 상품 상세 정보 업데이트
          setFormData(prev => ({
            ...prev,
            minPrice: productData?.minPrice || prev.minPrice || 0,
            maxPrice: productData?.maxPrice || prev.maxPrice || 0,
            description: productData?.description || prev.description || '',
            category: productData?.categoryId || productData?.category?.categoryId || prev.category || '',
            visibility: productData?.visibility || prev.visibility || 'ALL',
            sellingPrice: item.salesPrice || item.price || prev.sellingPrice || 0
          }));
        } catch (err) {
          console.error('상품 정보 조회 실패:', err);
        }
      };
      
      fetchProductInfo();
      
      // 이미지 상태 초기화
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [item, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일만 허용
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('이미지 파일 크기는 10MB 이하로 제한됩니다.');
        return;
      }
      
      setImageFile(file);
      setRemoveImage(false);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    const fileInput = document.getElementById('editProductImage');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleCategorySave = async (categoryData) => {
    try {
      const result = await inventoryService.createCategory(categoryData);
      console.log('카테고리 등록 성공:', result);
      
      if (result && result.categoryId) {
        const newCategory = {
          categoryId: result.categoryId,
          name: result.name || categoryData.name
        };
        
        setCategories(prevCategories => {
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
      await fetchCategories();
    } catch (error) {
      console.error('카테고리 등록 실패:', error);
      alert('카테고리 등록에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
    }
  };

  const handleSave = () => {
    // 필수 항목 검증
    const errors = [];
    
    if (!formData.productName || formData.productName.trim() === '') {
      errors.push('상품명');
    }
    
    if (!formData.safetyStock || formData.safetyStock === '' || formData.safetyStock < 0) {
      errors.push('안전재고');
    }
    
    if (!formData.unitPrice || formData.unitPrice === '' || formData.unitPrice < 0) {
      errors.push('공급가');
    }
    
    if (!formData.minPrice || formData.minPrice === '' || formData.minPrice <= 0) {
      errors.push('최저 가격');
    }
    
    if (!formData.maxPrice || formData.maxPrice === '' || formData.maxPrice <= 0) {
      errors.push('최고 가격');
    }
    
    // 최고가격이 최저가격보다 크거나 같은지 검증
    if (formData.minPrice > 0 && formData.maxPrice > 0) {
      const minPrice = parseInt(formData.minPrice) || 0;
      const maxPrice = parseInt(formData.maxPrice) || 0;
      if (maxPrice < minPrice) {
        alert('최고 가격은 최저 가격보다 크거나 같아야 합니다.');
        return;
      }
    }
    
    if (!formData.sellingPrice || formData.sellingPrice === '' || formData.sellingPrice < 0) {
      errors.push('판매가');
    }
    
    // 판매가 검증 (최저가격 ~ 최고가격 사이)
    if (formData.minPrice > 0 && formData.maxPrice > 0) {
      const sellingPrice = parseInt(formData.sellingPrice) || 0;
      if (sellingPrice > 0 && (sellingPrice < formData.minPrice || sellingPrice > formData.maxPrice)) {
        alert(`판매가는 ${formData.minPrice.toLocaleString()}원 ~ ${formData.maxPrice.toLocaleString()}원 사이로 입력해주세요.`);
        return;
      }
    }
    
    if (!formData.category || formData.category === '') {
      errors.push('카테고리');
    }
    
    if (errors.length > 0) {
      alert(`다음 필수 항목을 입력해주세요:\n${errors.join(', ')}`);
      return;
    }
    
    onSave({
      ...formData,
      imageFile: imageFile || null,
      removeImage: removeImage,
      productId: item.product?.id
    });
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, null,
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '재고 수정'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '상품 정보 수정'),
          React.createElement(FormGroup, null,
            React.createElement(Label, null,
              '상품명 ',
              React.createElement('span', { className: 'required' }, '*')
            ),
            React.createElement(Input, {
              type: 'text',
              value: formData.productName,
              onChange: (e) => handleInputChange('productName', e.target.value),
              placeholder: '상품명을 입력하세요'
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
            React.createElement(Label, null, '상품 이미지'),
            React.createElement(ImageUploadContainer, null,
              React.createElement(FileInput, {
                type: 'file',
                id: 'editProductImage',
                accept: 'image/*',
                onChange: handleImageChange
              }),
              imagePreview ? React.createElement(React.Fragment, null,
                React.createElement(FileInputLabel, { htmlFor: 'editProductImage' },
                  React.createElement(ImagePreview, null,
                    React.createElement('img', {
                      src: imagePreview,
                      alt: '상품 미리보기',
                      style: { width: '100%', height: '100%', objectFit: 'cover' }
                    }),
                    React.createElement(ImageOverlay, null,
                      React.createElement(ChangeText, null, '이미지 변경')
                    )
                  )
                ),
                React.createElement('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: '8px'
                  }
                },
                  React.createElement('button', {
                    type: 'button',
                    onClick: handleRemoveImage,
                    style: {
                      padding: '8px 24px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      minWidth: '120px'
                    }
                  }, '이미지 제거')
                )
              ) : React.createElement(FileInputLabel, { htmlFor: 'editProductImage' },
                React.createElement(React.Fragment, null,
                  React.createElement(UploadIcon, null, '📷'),
                  React.createElement(UploadText, null, '이미지를 업로드하세요')
                )
              )
            )
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '상품설명'),
            React.createElement(TextArea, {
              placeholder: '상품에 대한 설명을 입력하세요',
              value: formData.description,
              onChange: (e) => handleInputChange('description', e.target.value)
            })
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '재고 정보 수정'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '현재고'),
              React.createElement(Input, {
                type: 'number',
                value: item?.currentStock || 0,
                disabled: true
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null, 
                '안전재고 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.safetyStock,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('safetyStock', '');
                  const n = parseInt(v, 10);
                  handleInputChange('safetyStock', isNaN(n) ? 0 : n);
                }
              })
            )
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '가격 정보'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, 
                '공급가 (원) ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.unitPrice,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('unitPrice', '');
                  const n = parseInt(v, 10);
                  handleInputChange('unitPrice', isNaN(n) ? 0 : n);
                }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '판매가 (원) ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                min: formData.minPrice > 0 ? formData.minPrice : undefined,
                max: formData.maxPrice > 0 ? formData.maxPrice : undefined,
                value: formData.sellingPrice,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('sellingPrice', '');
                  const n = parseInt(v, 10);
                  handleInputChange('sellingPrice', isNaN(n) ? 0 : n);
                },
                placeholder: formData.minPrice > 0 && formData.maxPrice > 0 
                  ? `${formData.minPrice.toLocaleString()}원 ~ ${formData.maxPrice.toLocaleString()}원 사이로 입력`
                  : '판매가를 입력하세요'
              })
            )
          ),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '최저 가격 (원)',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.minPrice,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('minPrice', '');
                  const n = parseInt(v, 10);
                  handleInputChange('minPrice', isNaN(n) ? 0 : n);
                }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '최고 가격 (원)',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.maxPrice,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('maxPrice', '');
                  const n = parseInt(v, 10);
                  handleInputChange('maxPrice', isNaN(n) ? 0 : n);
                }
              })
            )
          )
        ),
        React.createElement(Section, null,
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
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(SaveButton, { onClick: handleSave }, '저장')
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

export default EditInventoryModal;

