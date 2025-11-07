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

const AttributeSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const AttributeTypeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  
  .required {
    color: #ef4444;
    margin-left: 4px;
  }
`;

const AttributeValueList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  transition: all 0.2s;
  
  &:hover {
    border-color: #6b46c1;
    background: #f3f4f6;
  }
  
  input[type="checkbox"]:checked + & {
    border-color: #6b46c1;
    background: #ede9fe;
  }
  
  input[type="checkbox"] {
    margin-right: 6px;
  }
`;

const AttributeInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  font-style: italic;
`;

const AddValueButton = styled.button`
  padding: 6px 12px;
  border: 1px dashed #6b46c1;
  border-radius: 6px;
  background: #f9fafb;
  color: #6b46c1;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;

  &:hover {
    background: #ede9fe;
    border-color: #553c9a;
  }
`;

const ValueModalOverlay = styled(ModalOverlay)`
  z-index: 10001;
`;

const ValueModal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
`;

const ValueModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ValueModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const ValueFormGroup = styled.div`
  margin-bottom: 16px;
`;

const ValueLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;

  .required {
    color: #ef4444;
  }
`;

const ValueInput = styled.input`
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

const ValueModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const ValueButton = styled.button`
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
  
  // 속성 관련 상태
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  
  // 속성 값 추가 모달 상태
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [selectedAttributeType, setSelectedAttributeType] = useState(null);
  const [valueForm, setValueForm] = useState({
    displayName: '',
    displayOrder: 0
  });
  
  // 속성 타입 추가 모달 상태
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    isRequired: false,
    displayOrder: 0
  });
  const [availableAttributeTypes, setAvailableAttributeTypes] = useState([]);
  const [useExistingType, setUseExistingType] = useState(false);
  const [selectedExistingTypeId, setSelectedExistingTypeId] = useState('');

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
          
          // 카테고리 속성 및 기존 상품 속성 값 로드
          const categoryId = productData?.categoryId || productData?.category?.categoryId;
          if (categoryId) {
            await fetchCategoryAttributes(categoryId);
            setTimeout(async () => {
              await fetchProductAttributeValues(productId);
            }, 100);
          }
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

  // 카테고리 속성이 로드된 후 기존 속성 값 다시 매핑
  useEffect(() => {
    if (categoryAttributes.length > 0 && item?.product?.id && isOpen) {
      fetchProductAttributeValues(item.product.id);
    }
  }, [categoryAttributes, item?.product?.id, isOpen]);

  // 카테고리 변경 시 속성 타입 조회
  useEffect(() => {
    if (formData.category && isOpen && item?.product?.id) {
      // 카테고리 ID가 숫자인지 확인 (문자열로 온 경우도 변환)
      const categoryId = typeof formData.category === 'number' 
        ? formData.category 
        : isNaN(formData.category) 
          ? categories.find(c => (c.categoryId || c.id) == formData.category || c.name === formData.category)?.categoryId || categories.find(c => (c.categoryId || c.id) == formData.category || c.name === formData.category)?.id
          : Number(formData.category);
      if (categoryId) {
        fetchCategoryAttributes(categoryId);
      }
    }
  }, [formData.category, isOpen, categories]);

  // 카테고리별 속성 조회
  const fetchCategoryAttributes = async (categoryId) => {
    try {
      setLoadingAttributes(true);
      // 카테고리 ID가 숫자인지 확인 (문자열로 온 경우도 변환)
      let id = categoryId;
      if (typeof categoryId !== 'number') {
        if (!isNaN(categoryId)) {
          id = Number(categoryId);
        } else {
          // 카테고리 이름으로 온 경우 ID 찾기
          const found = categories.find(c => 
            (c.categoryId || c.id) == categoryId || c.name === categoryId
          );
          id = found?.categoryId || found?.id;
        }
      }
      
      if (!id) {
        console.error('카테고리 ID를 찾을 수 없습니다:', categoryId);
        setCategoryAttributes([]);
        return;
      }
      
      console.log('카테고리 속성 조회 시작:', id);
      const data = await inventoryService.getCategoryAttributes(id);
      console.log('카테고리 속성 API 응답:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setCategoryAttributes(data);
      } else {
        setCategoryAttributes([]);
      }
    } catch (error) {
      console.error('카테고리 속성 조회 실패:', error);
      setCategoryAttributes([]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  // 상품의 기존 속성 값 조회
  const fetchProductAttributeValues = async (productId) => {
    try {
      console.log('상품 속성 값 조회 시작:', productId);
      const data = await inventoryService.getProductAttributeValues(productId);
      console.log('상품 속성 값 API 응답:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        // 속성 타입별로 그룹화하여 각 타입당 하나만 선택 (첫 번째 값 사용)
        const selectedByType = {};
        data.forEach(av => {
          // attributeTypeId를 우선 사용, 없으면 categoryAttributes에서 찾기
          let typeId = av.attributeTypeId;
          
          // attributeTypeId가 없으면 categoryAttributes에서 attributeTypeName으로 찾기
          if (!typeId && av.attributeTypeName && categoryAttributes.length > 0) {
            const matchedAttr = categoryAttributes.find(ca => 
              (ca.attributeTypeName || ca.attributeType?.name) === av.attributeTypeName
            );
            if (matchedAttr) {
              typeId = matchedAttr.attributeTypeId || matchedAttr.attributeType?.id || matchedAttr.id;
            }
          }
          
          const valueId = av.attributeValueId || av.id;
          if (typeId && valueId) {
            const typeIdStr = String(typeId);
            // 같은 타입의 값이 이미 있으면 첫 번째 것만 사용 (또는 마지막 것 사용)
            if (!selectedByType[typeIdStr]) {
              selectedByType[typeIdStr] = valueId;
            }
          }
        });
        console.log('선택된 속성 값 (타입별):', selectedByType);
        setSelectedAttributeValues(selectedByType);
      } else {
        setSelectedAttributeValues({});
      }
    } catch (error) {
      console.error('상품 속성 값 조회 실패:', error);
      setSelectedAttributeValues({});
    }
  };

  // 속성 값 선택/해제 핸들러 (속성 타입별로 하나만 선택 가능)
  const handleAttributeValueToggle = (attributeTypeId, attributeValueId) => {
    setSelectedAttributeValues(prev => {
      const typeId = String(attributeTypeId);
      // 같은 속성 타입의 다른 값이 선택되어 있으면 교체, 없으면 추가
      if (prev[typeId] === attributeValueId) {
        // 이미 선택된 경우 제거 (선택 해제)
        const newState = { ...prev };
        delete newState[typeId];
        return newState;
      } else {
        // 새로운 값 선택 (같은 타입의 기존 값은 자동으로 교체됨)
        return {
          ...prev,
          [typeId]: attributeValueId
        };
      }
    });
  };

  // 속성 값 추가 모달 열기
  const openAddValueModal = (categoryAttr) => {
    setSelectedAttributeType(categoryAttr);
    setValueForm({
      displayName: '',
      displayOrder: categoryAttr.availableValues?.length || 0
    });
    setValueModalOpen(true);
  };

  // 속성 값 추가 모달 닫기
  const closeAddValueModal = () => {
    setValueModalOpen(false);
    setSelectedAttributeType(null);
    setValueForm({
      displayName: '',
      displayOrder: 0
    });
  };

  // 속성 타입 추가 모달 열기
  const openAddTypeModal = async () => {
    if (!formData.category) {
      alert('먼저 카테고리를 선택해주세요.');
      return;
    }
    
    // 사용 가능한 속성 타입 목록 조회
    try {
      const allTypes = await inventoryService.getAttributeTypes();
      // 이미 연결된 속성 타입 ID 목록
      const connectedIds = categoryAttributes.map(ca => 
        ca.attributeTypeId || ca.attributeType?.id
      ).filter(Boolean);
      // 연결되지 않은 속성 타입만 필터링
      const available = allTypes.filter(at => !connectedIds.includes(at.id));
      setAvailableAttributeTypes(available || []);
    } catch (error) {
      console.error('속성 타입 조회 실패:', error);
      setAvailableAttributeTypes([]);
    }
    
    setTypeForm({
      name: '',
      description: '',
      isRequired: false,
      displayOrder: categoryAttributes.length
    });
    setUseExistingType(false);
    setSelectedExistingTypeId('');
    setTypeModalOpen(true);
  };

  // 속성 타입 추가 모달 닫기
  const closeAddTypeModal = () => {
    setTypeModalOpen(false);
    setTypeForm({
      name: '',
      description: '',
      isRequired: false,
      displayOrder: 0
    });
    setUseExistingType(false);
    setSelectedExistingTypeId('');
    setAvailableAttributeTypes([]);
  };

  // 속성 타입 추가 핸들러
  const handleAddAttributeType = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      let attributeTypeId;
      
      if (useExistingType) {
        // 기존 속성 타입 사용
        if (!selectedExistingTypeId) {
          alert('속성 타입을 선택해주세요.');
          return;
        }
        attributeTypeId = selectedExistingTypeId;
      } else {
        // 새 속성 타입 생성
        if (!typeForm.name || typeForm.name.trim() === '') {
          alert('속성 타입명을 입력해주세요.');
          return;
        }

        const newAttributeType = await inventoryService.createAttributeType({
          name: typeForm.name.trim(),
          description: typeForm.description.trim() || '',
          isRequired: typeForm.isRequired,
          displayOrder: typeForm.displayOrder || 0
        });

        console.log('속성 타입 생성 성공:', newAttributeType);
        attributeTypeId = newAttributeType.id || newAttributeType.attributeTypeId;
        
        if (!attributeTypeId) {
          alert('속성 타입 ID를 찾을 수 없습니다.');
          return;
        }
      }

      // 카테고리와 속성 타입 연결
      await inventoryService.addCategoryAttribute({
        categoryId: formData.category,
        attributeTypeId: attributeTypeId,
        isRequired: typeForm.isRequired,
        displayOrder: typeForm.displayOrder || 0
      });

      console.log('카테고리-속성 연결 성공');

      // 속성 목록 다시 로드
      setTimeout(async () => {
        if (formData.category) {
          await fetchCategoryAttributes(formData.category);
        }
      }, 300);
      
      // 성공 메시지
      const typeName = useExistingType 
        ? availableAttributeTypes.find(t => t.id === selectedExistingTypeId)?.name || '속성 타입'
        : typeForm.name;
      alert(`'${typeName}' 속성 타입이 추가되었습니다.\n\n목록에 자동으로 반영됩니다.`);
      
      closeAddTypeModal();
    } catch (error) {
      console.error('속성 타입 추가 실패:', error);
      alert(error.response?.data?.status_message || '속성 타입 추가에 실패했습니다.');
    }
  };

  // 속성 값 추가 핸들러
  const handleAddAttributeValue = async (e) => {
    e.preventDefault();

    if (!valueForm.displayName || valueForm.displayName.trim() === '') {
      alert('속성 값을 입력해주세요.');
      return;
    }

    if (!selectedAttributeType) return;

    try {
      const attributeTypeId = selectedAttributeType.attributeTypeId || selectedAttributeType.attributeType?.id;
      if (!attributeTypeId) {
        alert('속성 타입 ID를 찾을 수 없습니다.');
        return;
      }

      const displayName = valueForm.displayName.trim();
      const newValue = await inventoryService.createAttributeValue({
        attributeTypeId: attributeTypeId,
        displayName: displayName,
        displayOrder: valueForm.displayOrder || 0,
        isActive: true
      });

      console.log('속성 값 추가 성공:', newValue);

      // 새로 추가된 속성 값을 선택 목록에 추가
      const newValueId = newValue.id || newValue.attributeValueId;
      if (newValueId) {
        // 새로 추가된 속성 값을 해당 속성 타입에 자동 선택
        const typeId = String(selectedAttributeType.attributeTypeId || selectedAttributeType.attributeType?.id || selectedAttributeType.id);
        setSelectedAttributeValues(prev => ({
          ...prev,
          [typeId]: newValueId
        }));
      }

      // 속성 목록 다시 로드 (with-values로 다시 조회)
      // 약간의 지연을 두어 서버에 반영되도록 함
      setTimeout(async () => {
        if (formData.category) {
          await fetchCategoryAttributes(formData.category);
        }
      }, 300);
      
      // 성공 메시지
      alert(`'${valueForm.displayName}' 속성 값이 추가되었습니다.\n\n목록에 자동으로 반영됩니다.`);
      
      closeAddValueModal();
    } catch (error) {
      console.error('속성 값 추가 실패:', error);
      alert(error.response?.data?.status_message || '속성 값 추가에 실패했습니다.');
    }
  };

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

  // 상품 설명에 이미지 삽입 핸들러
  const handleInsertDescriptionImage = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

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

      try {
        // 업로드 시작 알림
        alert('이미지 업로드 중...');
        
        // 이미지 업로드
        const imageUrl = await inventoryService.uploadDescriptionImage(file);
        
        console.log('업로드된 이미지 URL:', imageUrl);
        
        if (!imageUrl) {
          alert('이미지 URL을 받지 못했습니다. 응답을 확인해주세요.');
          console.error('API 응답:', imageUrl);
          return;
        }
        
        // textarea 찾기 (여러 방법 시도)
        let textarea = document.getElementById('editProductDescription');
        if (!textarea) {
          textarea = document.querySelector('textarea[placeholder*="상품에 대한 설명"]');
        }
        if (!textarea) {
          // 모든 textarea 중에서 찾기
          const textareas = document.querySelectorAll('textarea');
          textarea = Array.from(textareas).find(ta => 
            ta.placeholder && ta.placeholder.includes('상품에 대한 설명')
          );
        }
        
        if (textarea) {
          const start = textarea.selectionStart || 0;
          const end = textarea.selectionEnd || 0;
          const text = formData.description || '';
          const imageTag = `<img src="${imageUrl}" alt="상품 설명 이미지" style="max-width: 100%; height: auto;" />`;
          const newText = text.substring(0, start) + imageTag + text.substring(end);
          handleInputChange('description', newText);
          
          // 커서 위치 조정
          setTimeout(() => {
            textarea.focus();
            const newPosition = start + imageTag.length;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 100);
          
          alert('이미지가 삽입되었습니다.');
        } else {
          // textarea를 찾을 수 없으면 끝에 추가
          const imageTag = `<img src="${imageUrl}" alt="상품 설명 이미지" style="max-width: 100%; height: auto;" />`;
          const currentDescription = formData.description || '';
          handleInputChange('description', currentDescription + (currentDescription ? '\n' : '') + imageTag);
          alert('이미지가 설명 끝에 추가되었습니다.');
        }
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        console.error('에러 상세:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        alert('이미지 업로드에 실패했습니다: ' + (error.response?.data?.status_message || error.response?.data?.message || error.message));
      }
    };
    fileInput.click();
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
    
    // 필수 속성 검증
    for (const categoryAttr of categoryAttributes) {
      if (categoryAttr.isRequired) {
        const typeId = String(categoryAttr.attributeTypeId || categoryAttr.attributeType?.id || categoryAttr.id);
        const hasSelectedValue = selectedAttributeValues[typeId] != null;
        
        if (!hasSelectedValue) {
          alert(`'${categoryAttr.attributeTypeName || categoryAttr.attributeType?.name}' 속성은 필수입니다. 1개를 선택해주세요.`);
          return;
        }
      }
    }
    
    // selectedAttributeValues 객체를 배열로 변환
    const attributeValueIds = Object.values(selectedAttributeValues).filter(id => id != null);
    
    onSave({
      ...formData,
      imageFile: imageFile || null,
      removeImage: removeImage,
      productId: item.product?.id,
      attributeValueIds: attributeValueIds // 선택한 속성 값 ID들 (속성 타입별로 하나씩)
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
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
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
          React.createElement(FormGroup, { style: { marginTop: '24px' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
              React.createElement(Label, { style: { margin: 0 } }, '상품설명'),
              React.createElement('button', {
                type: 'button',
                onClick: handleInsertDescriptionImage,
                style: {
                  padding: '8px 12px',
                  backgroundColor: '#6b46c1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }
              },
                React.createElement('span', null, '📷'),
                React.createElement('span', null, '이미지 삽입')
              )
            ),
            React.createElement(TextArea, {
              id: 'editProductDescription',
              placeholder: '상품에 대한 설명을 입력하세요. 이미지를 삽입하려면 위의 "이미지 삽입" 버튼을 클릭하세요.',
              value: formData.description,
              onChange: (e) => handleInputChange('description', e.target.value),
              style: { minHeight: '120px' }
            }),
            React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '4px' } },
              '💡 이미지를 삽입하면 HTML 형식으로 저장됩니다.'
            )
          ),
          // 속성 선택 섹션
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '상품 속성'),
            formData.category ? (
              React.createElement(React.Fragment, null,
                categoryAttributes.length > 0 ? categoryAttributes.map(categoryAttr => {
              const activeValues = categoryAttr.availableValues?.filter(av => av.isActive !== false) || [];
              const typeId = String(categoryAttr.attributeTypeId || categoryAttr.attributeType?.id || categoryAttr.id);
              const selectedValueId = selectedAttributeValues[typeId];
              const hasSelectedValue = selectedValueId != null;
              
              return React.createElement(AttributeSection, { key: categoryAttr.id || categoryAttr.categoryAttributeId },
                React.createElement(AttributeTypeTitle, null,
                  categoryAttr.attributeTypeName || categoryAttr.attributeType?.name,
                  categoryAttr.isRequired && React.createElement('span', { className: 'required' }, '*')
                ),
                loadingAttributes ? React.createElement('div', { style: { padding: '12px', textAlign: 'center', color: '#6b7280' } }, '속성 로딩 중...') :
                React.createElement(React.Fragment, null,
                  activeValues.length > 0 ? React.createElement(AttributeValueList, null,
                    activeValues.map(attrValue => {
                      const valueId = attrValue.id || attrValue.attributeValueId;
                      const isSelected = selectedValueId === valueId;
                      return React.createElement(CheckboxWrapper, {
                        key: valueId,
                        style: {
                          borderColor: isSelected ? '#6b46c1' : '#d1d5db',
                          background: isSelected ? '#ede9fe' : '#ffffff'
                        }
                      },
                        React.createElement('input', {
                          type: 'radio',
                          name: `attribute-${typeId}`, // 같은 속성 타입끼리 같은 name을 가져서 하나만 선택됨
                          checked: isSelected,
                          onChange: () => handleAttributeValueToggle(typeId, valueId)
                        }),
                        React.createElement('span', null, attrValue.displayName || '-')
                      );
                    })
                  ) : React.createElement(AttributeInfo, null, '등록된 속성 값이 없습니다. 아래 버튼을 클릭하여 추가하세요.'),
                  React.createElement(AddValueButton, {
                    type: 'button',
                    onClick: () => openAddValueModal(categoryAttr)
                  },
                    React.createElement('span', null, '+'),
                    React.createElement('span', null, '속성 값 추가')
                  ),
                  categoryAttr.isRequired && !hasSelectedValue && 
                  React.createElement(AttributeInfo, null, '필수 속성입니다. 최소 1개를 선택해주세요.')
                )
              );
            }) : (
              loadingAttributes ? React.createElement('div', { style: { padding: '12px', textAlign: 'center', color: '#6b7280' } }, '속성 로딩 중...') :
              React.createElement(AttributeInfo, null, '등록된 속성이 없습니다. 아래 버튼을 클릭하여 속성 타입을 추가하세요.')
            ),
            // 속성 타입 추가 버튼 (항상 표시 - 속성 타입이 있어도 추가 가능)
            !loadingAttributes && React.createElement(AddValueButton, {
              type: 'button',
              onClick: openAddTypeModal,
              style: { 
                marginTop: '12px', 
                backgroundColor: '#6b46c1',
                color: 'white',
                border: 'none',
                width: '100%'
              }
            },
              React.createElement('span', null, '+'),
              React.createElement('span', null, '속성 타입 추가')
            )
              )
            ) : React.createElement(AttributeInfo, null, '카테고리를 선택하면 속성을 추가할 수 있습니다.')
          ),
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
                min: '0',
                value: formData.safetyStock,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('safetyStock', '');
                  const n = parseInt(v, 10);
                  if (n < 0) return;
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
                type: 'text',
                inputMode: 'numeric',
                maxLength: 16,
                value: formData.unitPrice === 0 ? '' : String(formData.unitPrice),
                onChange: (e) => {
                  let v = e.target.value.replace(/[^0-9]/g, '');
                  if (v.length > 16) {
                    v = v.slice(0, 16);
                  }
                  if (v === '') {
                    handleInputChange('unitPrice', 0);
                    return;
                  }
                  const n = Number(v);
                  if (isNaN(n) || n < 0) return;
                  handleInputChange('unitPrice', n);
                }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '판매가 (원) ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'text',
                inputMode: 'numeric',
                maxLength: 16,
                value: formData.sellingPrice === 0 ? '' : String(formData.sellingPrice),
                onChange: (e) => {
                  let v = e.target.value.replace(/[^0-9]/g, '');
                  if (v.length > 16) {
                    v = v.slice(0, 16);
                  }
                  if (v === '') {
                    handleInputChange('sellingPrice', 0);
                    return;
                  }
                  const n = Number(v);
                  if (isNaN(n) || n < 0) return;
                  handleInputChange('sellingPrice', n);
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
                type: 'text',
                inputMode: 'numeric',
                maxLength: 16,
                value: formData.minPrice === 0 ? '' : String(formData.minPrice),
                onChange: (e) => {
                  let v = e.target.value.replace(/[^0-9]/g, '');
                  if (v.length > 16) {
                    v = v.slice(0, 16);
                  }
                  if (v === '') {
                    handleInputChange('minPrice', 0);
                    return;
                  }
                  const n = Number(v);
                  if (isNaN(n) || n < 0) return;
                  handleInputChange('minPrice', n);
                }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '최고 가격 (원)',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'text',
                inputMode: 'numeric',
                maxLength: 16,
                value: formData.maxPrice === 0 ? '' : String(formData.maxPrice),
                onChange: (e) => {
                  let v = e.target.value.replace(/[^0-9]/g, '');
                  if (v.length > 16) {
                    v = v.slice(0, 16);
                  }
                  if (v === '') {
                    handleInputChange('maxPrice', 0);
                    return;
                  }
                  const n = Number(v);
                  if (isNaN(n) || n < 0) return;
                  handleInputChange('maxPrice', n);
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
      }),
      // 속성 값 추가 모달
      valueModalOpen && React.createElement(ValueModalOverlay, { onClick: closeAddValueModal },
        React.createElement(ValueModal, { onClick: (e) => e.stopPropagation() },
          React.createElement(ValueModalHeader, null,
            React.createElement(ValueModalTitle, null,
              '속성 값 추가',
              selectedAttributeType && ` - ${selectedAttributeType.attributeTypeName || selectedAttributeType.attributeType?.name}`
            ),
            React.createElement(CloseButton, { onClick: closeAddValueModal }, '×')
          ),
          React.createElement('form', { onSubmit: handleAddAttributeValue },
            React.createElement(ValueFormGroup, null,
              React.createElement(ValueLabel, null,
                '속성 값 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(ValueInput, {
                type: 'text',
                value: valueForm.displayName,
                onChange: (e) => setValueForm({ ...valueForm, displayName: e.target.value }),
                placeholder: '예: 빨강, S, 면, Red, Small',
                required: true
              }),
              React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '4px' } },
                '사용자에게 표시되는 속성 값 이름'
              )
            ),
            React.createElement(ValueFormGroup, null,
              React.createElement(ValueLabel, null, '표시 순서'),
              React.createElement(ValueInput, {
                type: 'number',
                value: valueForm.displayOrder,
                onChange: (e) => setValueForm({ ...valueForm, displayOrder: parseInt(e.target.value) || 0 }),
                min: '0'
              })
            ),
            React.createElement(ValueModalActions, null,
              React.createElement(ValueButton, {
                type: 'button',
                className: 'cancel',
                onClick: closeAddValueModal
              }, '취소'),
              React.createElement(ValueButton, {
                type: 'submit',
                className: 'save'
              }, '추가')
            )
          )
        )
      ),
      // 속성 타입 추가 모달
      typeModalOpen && React.createElement(ValueModalOverlay, { onClick: closeAddTypeModal },
        React.createElement(ValueModal, { onClick: (e) => e.stopPropagation() },
          React.createElement(ValueModalHeader, null,
            React.createElement(ValueModalTitle, null, '속성 타입 추가'),
            React.createElement(CloseButton, { onClick: closeAddTypeModal }, '×')
          ),
          React.createElement('form', { onSubmit: handleAddAttributeType },
            // 기존 속성 타입 사용 / 새로 만들기 선택
            React.createElement(ValueFormGroup, null,
              React.createElement(ValueLabel, null,
                React.createElement('input', {
                  type: 'radio',
                  name: 'typeOption',
                  checked: !useExistingType,
                  onChange: () => setUseExistingType(false),
                  style: { marginRight: '8px' }
                }),
                '새 속성 타입 만들기'
              ),
              React.createElement(ValueLabel, { style: { marginTop: '8px' } },
                React.createElement('input', {
                  type: 'radio',
                  name: 'typeOption',
                  checked: useExistingType,
                  onChange: () => setUseExistingType(true),
                  style: { marginRight: '8px' }
                }),
                '기존 속성 타입 사용'
              )
            ),
            useExistingType ? (
              // 기존 속성 타입 선택
              React.createElement(ValueFormGroup, null,
                React.createElement(ValueLabel, null,
                  '속성 타입 선택 ',
                  React.createElement('span', { className: 'required' }, '*')
                ),
                availableAttributeTypes.length > 0 ? React.createElement(Select, {
                  value: selectedExistingTypeId,
                  onChange: (e) => setSelectedExistingTypeId(e.target.value),
                  required: true,
                  style: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }
                },
                  React.createElement('option', { value: '' }, '속성 타입을 선택하세요'),
                  availableAttributeTypes.map(type => 
                    React.createElement('option', { key: type.id, value: type.id }, type.name)
                  )
                ) : React.createElement('div', { style: { padding: '12px', textAlign: 'center', color: '#6b7280' } }, '사용 가능한 속성 타입이 없습니다. 새로 만들어주세요.')
              )
            ) : (
              // 새 속성 타입 생성 폼
              React.createElement(React.Fragment, null,
                React.createElement(ValueFormGroup, null,
                  React.createElement(ValueLabel, null,
                    '속성 타입명 ',
                    React.createElement('span', { className: 'required' }, '*')
                  ),
                  React.createElement(ValueInput, {
                    type: 'text',
                    value: typeForm.name,
                    onChange: (e) => setTypeForm({ ...typeForm, name: e.target.value }),
                    placeholder: '예: 색상, 사이즈, 재질',
                    required: true
                  }),
                  React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '4px' } },
                    '속성의 이름 (예: 색상, 사이즈)'
                  )
                ),
                React.createElement(ValueFormGroup, null,
                  React.createElement(ValueLabel, null, '설명'),
                  React.createElement(ValueInput, {
                    type: 'text',
                    value: typeForm.description,
                    onChange: (e) => setTypeForm({ ...typeForm, description: e.target.value }),
                    placeholder: '속성에 대한 설명 (선택사항)'
                  })
                )
              )
            ),
            React.createElement(ValueFormGroup, null,
              React.createElement(ValueLabel, null,
                React.createElement('input', {
                  type: 'checkbox',
                  checked: typeForm.isRequired,
                  onChange: (e) => setTypeForm({ ...typeForm, isRequired: e.target.checked }),
                  style: { marginRight: '8px' }
                }),
                '필수 속성'
              ),
              React.createElement('div', { style: { fontSize: '12px', color: '#6b7280', marginTop: '4px' } },
                '체크 시 상품 등록 시 이 속성 값 선택이 필수입니다.'
              )
            ),
            React.createElement(ValueFormGroup, null,
              React.createElement(ValueLabel, null, '표시 순서'),
              React.createElement(ValueInput, {
                type: 'number',
                value: typeForm.displayOrder,
                onChange: (e) => setTypeForm({ ...typeForm, displayOrder: parseInt(e.target.value) || 0 }),
                min: '0'
              })
            ),
            React.createElement(ValueModalActions, null,
              React.createElement(ValueButton, {
                type: 'button',
                className: 'cancel',
                onClick: closeAddTypeModal
              }, '취소'),
              React.createElement(ValueButton, {
                type: 'submit',
                className: 'save'
              }, '추가')
            )
          )
        )
      )
    )
  );
}

export default EditInventoryModal;

