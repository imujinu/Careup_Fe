import React, { useState } from "react";
import { productInquiryService } from "../../service/productInquiryService";
import "./ProductInquiryModal.css";

function ProductInquiryModal({ product, memberId, isOpen, onClose, onSuccess }) {
  const [inquiryData, setInquiryData] = useState({ title: '', content: '', inquiryType: 'PRODUCT_INFO', isSecret: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inquiryData.title.trim() || !inquiryData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (!memberId) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!product.branchProductId) {
      setError('상품 정보가 올바르지 않습니다.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const requestData = {
        memberId: memberId,
        branchProductId: product.branchProductId,
        title: inquiryData.title.trim(),
        content: inquiryData.content.trim(),
        inquiryType: inquiryData.inquiryType,
        isSecret: inquiryData.isSecret || false,
        // status는 백엔드에서 자동으로 PENDING으로 설정되지만, 명시적으로 보내면 더 안전함
        // status: 'PENDING' // 백엔드에서 자동 설정됨
      };
      
      await productInquiryService.createInquiry(requestData);
      alert('문의가 성공적으로 등록되었습니다.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setInquiryData({ title: '', content: '', inquiryType: 'PRODUCT_INFO', isSecret: false });
    } catch (err) {
      console.error('문의 제출 실패:', err);
      const errorMessage = err.response?.data?.status_message || err.message || '문의 등록 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setInquiryData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="inquiry-modal-overlay" onClick={onClose}>
      <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inquiry-modal-header">
          <h3>상품 문의</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="inquiry-product-info">
          <img 
            src={product.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80"} 
            alt={product.name} 
            className="product-thumbnail"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80";
            }}
          />
          <div className="product-details">
            <h4>{product.name}</h4>
            <p className="product-price">{product.promotionPrice ? `${product.promotionPrice.toLocaleString()}원` : `${product.price.toLocaleString()}원`}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="inquiry-form">
          <div className="form-group">
            <label htmlFor="inquiryType">문의 유형</label>
            <select id="inquiryType" value={inquiryData.inquiryType} onChange={(e) => handleInputChange('inquiryType', e.target.value)} className="form-select">
              <option value="PRODUCT_INFO">상품 문의</option>
              <option value="DELIVERY">배송 문의</option>
              <option value="RETURN">반품/환불 문의</option>
              <option value="ETC">기타 문의</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input id="title" type="text" value={inquiryData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="문의 제목을 입력해주세요" className="form-input" maxLength={100} />
          </div>
          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea id="content" value={inquiryData.content} onChange={(e) => handleInputChange('content', e.target.value)} placeholder="문의 내용을 자세히 입력해주세요" className="form-textarea" rows={6} maxLength={1000} />
            <div className="char-count">{inquiryData.content.length}/1000</div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={inquiryData.isSecret} onChange={(e) => handleInputChange('isSecret', e.target.checked)} className="form-checkbox" />
              <span>비공개 문의로 등록</span>
            </label>
            <p className="checkbox-description">비공개 문의는 본인과 관리자만 확인할 수 있습니다.</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>취소</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>{isSubmitting ? '등록 중...' : '문의 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductInquiryModal;

