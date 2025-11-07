import React, { useState, useEffect } from "react";
import { customerOrderService } from "../../service/orderService";
import "./OrderDetailModal.css";

const OrderDetailModal = ({ order, currentUser, isOpen, onClose }) => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order?.orderId) {
      fetchOrderDetail();
    }
  }, [isOpen, order?.orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const orderId = order.orderId || order.id;
      const response = await customerOrderService.getOrderDetail(orderId);
      // 응답 구조 확인 및 정규화
      const detail = response?.result || response?.data || response;
      console.log("주문 상세 응답:", detail);
      console.log("주문 상품 목록:", detail?.orderItems);
      setOrderDetail(detail);
    } catch (error) {
      console.error("주문 상세 조회 실패:", error);
      console.error("에러 상세:", error.response);
      alert("주문 상세 정보를 불러오는데 실패했습니다.");
      onClose();
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="order-detail-modal-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "40px", textAlign: "center" }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="order-detail-modal-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "40px", textAlign: "center" }}>
            주문 상세 정보를 불러올 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  // orderItems 추출 - 다양한 응답 구조 대응
  let orderItems = orderDetail.orderItems || orderDetail.orderItemList || orderDetail.items || [];
  
  // 배열이 아닌 경우 처리
  if (!Array.isArray(orderItems)) {
    orderItems = [];
  }

  console.log("표시할 주문 상품:", orderItems);

  const statusText =
    orderDetail.orderStatus === "CONFIRMED" || orderDetail.orderStatus === "APPROVED"
      ? "구매완료"
      : orderDetail.orderStatus === "PENDING"
      ? "주문대기"
      : orderDetail.orderStatus === "REJECTED"
      ? "거부됨"
      : orderDetail.orderStatus === "CANCELLED"
      ? "취소됨"
      : orderDetail.orderStatus || "대기중";

  return (
    <>
      <div className="order-detail-modal-overlay" onClick={onClose}>
        <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="order-detail-modal-header">
            <h2>주문 상세</h2>
            <button className="order-detail-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="order-detail-content">
            <div className="order-info-section">
              <h3>주문 정보</h3>
              <div className="info-row">
                <span className="info-label">주문번호:</span>
                <span className="info-value">{orderDetail.orderId || orderDetail.id || "-"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">주문일시:</span>
                <span className="info-value">
                  {orderDetail.createdAt
                    ? new Date(orderDetail.createdAt).toLocaleString("ko-KR")
                    : orderDetail.createdDate || "-"}
                </span>
              </div>
              {orderDetail.memberName && (
                <div className="info-row">
                  <span className="info-label">주문자:</span>
                  <span className="info-value">{orderDetail.memberName}</span>
                </div>
              )}
              {orderDetail.branchId && (
                <div className="info-row">
                  <span className="info-label">지점:</span>
                  <span className="info-value">
                    {orderDetail.branchName || orderDetail.branch?.name || `지점 ${orderDetail.branchId}`}
                  </span>
                </div>
              )}
              {orderDetail.rejectedReason && (
                <div className="info-row">
                  <span className="info-label">거부 사유:</span>
                  <span className="info-value">{orderDetail.rejectedReason}</span>
                </div>
              )}
              {orderDetail.rejectedByName && (
                <div className="info-row">
                  <span className="info-label">거부자:</span>
                  <span className="info-value">
                    {orderDetail.rejectedByName}
                  </span>
                </div>
              )}
              {orderDetail.rejectedAt && (
                <div className="info-row">
                  <span className="info-label">거부 시간:</span>
                  <span className="info-value">
                    {new Date(orderDetail.rejectedAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              )}
              {(orderDetail.cancelledReason || orderDetail.cancelReason || orderDetail.cancellationReason) && (
                <div className="info-row">
                  <span className="info-label">취소 사유:</span>
                  <span className="info-value">{orderDetail.cancelledReason || orderDetail.cancelReason || orderDetail.cancellationReason}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">주문 상태:</span>
                <span className={`info-value status ${orderDetail.orderStatus?.toLowerCase() || "pending"}`}>
                  {statusText}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">총 결제금액:</span>
                <span className="info-value price">
                  {(orderDetail.totalAmount || orderDetail.totalPrice || 0).toLocaleString()}원
                </span>
              </div>
              {orderDetail.orderType && (
                <div className="info-row">
                  <span className="info-label">주문 유형:</span>
                  <span className="info-value">
                    {orderDetail.orderType === 'ONLINE' ? '온라인 주문' :
                     orderDetail.orderType === 'OFFLINE' ? '매장 주문' :
                     orderDetail.orderType}
                  </span>
                </div>
              )}
            </div>

            <div className="order-items-section">
              <h3>주문 상품</h3>
              {orderItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p>주문 상품이 없습니다.</p>
                </div>
              ) : (
                <div className="order-items-list">
                  {orderItems.map((item, index) => {
                    // 다양한 필드명 대응
                    const branchProductId = item.branchProductId || item.branchProduct?.id || item.productId;
                    const productName = item.productName || item.name || item.product?.name || `상품 ${index + 1}`;
                    // 이미지 URL 처리 - placeholder 대신 기본 이미지 사용
                    const imageUrl = item.imageUrl || item.image || item.product?.image || undefined;
                    const quantity = item.quantity || item.orderQuantity || 0;
                    const unitPrice = item.unitPrice || item.price || item.productPrice || 0;
                    const totalPrice = item.totalPrice || item.subtotalPrice || (unitPrice * quantity);
                    
                    return (
                      <div key={branchProductId || `item-${index}`} className="order-item-card">
                        <div className="order-item-image">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={productName}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                              }}
                            />
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              background: '#f0f0f0', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: '#999',
                              fontSize: '12px'
                            }}>
                              <img 
                                src="https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png" 
                                alt="기본 이미지"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="order-item-info">
                          <h4 className="order-item-name">{productName}</h4>
                          <div className="order-item-details">
                            <span>수량: {quantity}개</span>
                            <span>단가: {unitPrice.toLocaleString()}원</span>
                            <span className="order-item-total">
                              합계: {totalPrice.toLocaleString()}원
                            </span>
                          </div>
                          {item.productCode && (
                            <div className="order-item-code">상품코드: {item.productCode}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="order-detail-modal-footer">
            <button className="order-detail-close-button" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailModal;

