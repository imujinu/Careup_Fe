import React, { useState, useEffect } from "react";
import "./ProductDetail.css";

const ProductDetail = ({ product, onBack, onBuy, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState("reviews");
  const [isInCart, setIsInCart] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // 속성 선택 맵: { [attributeTypeName]: attributeValueId }
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [currentProductImage, setCurrentProductImage] = useState(product?.image || null);

  // product가 변경될 때 기본 이미지 설정
  useEffect(() => {
    if (product?.image && Object.keys(selectedAttributes).length === 0) {
      setCurrentProductImage(product.image);
    }
  }, [product?.image]);

  // 선택된 속성에 해당하는 이미지 가져오기
  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0 && product?.attributeGroups) {
      // 선택된 속성 중 가장 최근에 선택된 속성의 이미지 사용
      // 또는 첫 번째 선택된 속성의 이미지 사용
      const selectedKeys = Object.keys(selectedAttributes);
      if (selectedKeys.length > 0) {
        // 마지막으로 선택된 속성 타입의 이미지 사용
        const lastSelectedType = selectedKeys[selectedKeys.length - 1];
        const lastSelectedValueId = selectedAttributes[lastSelectedType];
        
        for (const attrGroup of product.attributeGroups) {
          if (attrGroup.attributeTypeName === lastSelectedType && attrGroup.values) {
            const selectedValue = attrGroup.values.find(
              v => v.attributeValueId === lastSelectedValueId
            );
            if (selectedValue && selectedValue.imageUrl) {
              setCurrentProductImage(selectedValue.imageUrl);
              return;
            }
          }
        }
      }
    }
    // 속성이 선택되지 않았거나 이미지를 찾을 수 없으면 기본 이미지 사용
    if (Object.keys(selectedAttributes).length === 0) {
      setCurrentProductImage(product?.image || null);
    }
  }, [selectedAttributes, product?.attributeGroups, product?.image]);

  // 옵션 선택에 따라 지점 자동 선택(재고 있는 첫 지점)
  useEffect(() => {
    if (!product?.availableBranches) return;
    const keys = Object.keys(selectedAttributes);
    let candidates = product.availableBranches;
    // 두 옵션이 모두 선택된 조합 우선
    if (Array.isArray(product.optionCombos) && product.optionTypes && selectedAttributes[product.optionTypes[0]] && product.optionTypes[1] && selectedAttributes[product.optionTypes[1]]) {
      const combo = product.optionCombos.find(c => String(c.opt1Id) === String(selectedAttributes[product.optionTypes[0]]) && String(c.opt2Id) === String(selectedAttributes[product.optionTypes[1]]));
      candidates = combo?.branches || [];
    } else if (keys.length === 1) {
      // 단일 옵션 선택 시 해당 옵션에 맞는 브랜치
      const type = keys[0];
      const val = selectedAttributes[type];
      candidates = product.availableBranches.filter(b => b.attributeTypeName === type && String(b.attributeValueId) === String(val));
    }
    const firstInStock = candidates.find(b => (b.stockQuantity || 0) > 0) || candidates[0];
    if (firstInStock?.branchId) setSelectedBranchId(firstInStock.branchId);
  }, [selectedAttributes, product?.availableBranches, product?.optionCombos, product?.optionTypes]);

  // 이미지 배열 처리 - images 배열이 있으면 사용, 없으면 image를 배열로 변환
  const productImages = currentProductImage 
    ? [currentProductImage]
    : (product?.images && product.images.length > 0 
      ? product.images 
      : (product?.image ? [product.image] : []));

  const currentImage = productImages[selectedImageIndex] || productImages[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

  const handleAddToCart = () => {
    // 지점 선택 강제 검사 제거 - 장바구니 담을 때는 지점 확인 불필요
    setIsInCart(true);
    if (onAddToCart) {
      const productWithBranch = {
        ...product,
        selectedBranchId: selectedBranchId
      };
      onAddToCart(productWithBranch);
    }
  };

  const handleBuy = () => {
    // 지점이 여러 개인 경우 반드시 선택해야 함
    if (product?.availableBranches && product.availableBranches.length > 0) {
      if (!selectedBranchId) {
        alert('구매 지점을 선택해주세요.');
        return;
      }
    }

    const productWithBranch = {
      ...product,
      selectedBranchId: selectedBranchId
    };

    if (onBuy) {
      onBuy(productWithBranch);
    }
  };

  return (
    <div className="product-detail">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 목록으로
        </button>

        {/* 메인 상품 정보 섹션 */}
        <div className="product-main">
          {/* 왼쪽: 상품 이미지 */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={currentImage}
                alt={product?.name || "New Balance 204L Suede Mushroom Arid Stone"}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";
                }}
              />
              {productImages.length > 1 && (
                <>
                  <div className="image-nav">
                    <button 
                      className="nav-btn prev"
                      onClick={() => setSelectedImageIndex((prev) => 
                        prev > 0 ? prev - 1 : productImages.length - 1
                      )}
                    >
                      ‹
                    </button>
                    <button 
                      className="nav-btn next"
                      onClick={() => setSelectedImageIndex((prev) => 
                        prev < productImages.length - 1 ? prev + 1 : 0
                      )}
                    >
                      ›
                    </button>
                  </div>
                  <div className="image-indicator">
                    {productImages.map((_, index) => (
                      <div
                        key={index}
                        className={`indicator-dot ${index === selectedImageIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="thumbnail-gallery">
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                      alt={`thumb${index + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 상품 정보 및 구매 */}
          <div className="product-info">
            <div className="price-section">
              <div className="instant-price">
                <span className="price-label">즉시 구매가</span>
                <span className="price-value">
                  {selectedBranchId && product?.availableBranches
                    ? (() => {
                        const selectedBranch = product.availableBranches.find(b => String(b.branchId) === String(selectedBranchId));
                        return selectedBranch?.price
                          ? `₩${selectedBranch.price.toLocaleString()}`
                          : '지점을 선택하세요';
                      })()
                    : product?.maxPrice
                    ? `₩${product.maxPrice?.toLocaleString()}`
                    : (product?.availableBranches && product.availableBranches.length > 0)
                    ? (() => {
                        const max = product.availableBranches
                          .map(b => Number(b?.price || 0))
                          .reduce((acc, v) => (v > acc ? v : acc), 0);
                        return max > 0 ? `₩${max.toLocaleString()}` : '가격 문의';
                      })()
                    : '가격 문의'}
                </span>
                <div className="price-note" style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                  {selectedBranchId 
                    ? '선택하신 지점의 판매가입니다.' 
                    : '지점을 선택하면 정확한 판매가를 확인할 수 있습니다.'}
                </div>
              </div>
            </div>

            <div className="product-title">
              <h1>{product?.name || product?.productName || "상품명"}</h1>
              <p className="product-subtitle">
                {product?.description || product?.productDescription || "상품 설명이 없습니다."}
              </p>
            </div>

            {/* 속성 선택 (색상, 사이즈 등) - 옵션1 → 옵션2 단계 */}
            {product?.attributeGroups && product.attributeGroups.length > 0 && (
              product.attributeGroups.map((attrGroup, idx) => {
                if (!attrGroup.attributeTypeName || !attrGroup.values || attrGroup.values.length === 0) return null;
                
                const attributeTypeName = attrGroup.attributeTypeName;
                const selectedValueId = selectedAttributes[attributeTypeName];
                
                const isSecondLevel = idx === 1; // 옵션2
                const firstType = product.attributeGroups?.[0]?.attributeTypeName;
                const firstSelected = firstType ? selectedAttributes[firstType] : undefined;
                
                return (
                  <div key={idx} className="option-section">
                    <label className="option-label">{attributeTypeName}</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', opacity: isSecondLevel && !firstSelected ? 0.6 : 1 }}>
                      {attrGroup.values.map((valueGroup, valueIdx) => {
                        // 각 속성 값의 첫 번째 브랜치를 확인하여 재고 확인
                        const firstBranch = valueGroup.branches && valueGroup.branches.length > 0 ? valueGroup.branches[0] : null;
                        let hasStock = firstBranch ? firstBranch.stockQuantity > 0 : true;
                        const isSelected = selectedValueId === valueGroup.attributeValueId;
                        
                        // 옵션2는 옵션1이 선택된 조합이 존재하는지로 활성/비활성 판단
                        if (isSecondLevel) {
                          if (!firstSelected) {
                            hasStock = false; // 옵션1 선택 전에는 비활성화 표시
                          } else if (Array.isArray(product.optionCombos)) {
                            const exists = product.optionCombos.some(c => (
                              String(c.opt1Id) === String(firstSelected) && String(c.opt2Id) === String(valueGroup.attributeValueId)
                            ));
                            hasStock = exists;
                          }
                        }
                        
                        return (
                          <button
                            key={`${attributeTypeName}-${valueGroup.attributeValueId}`}
                            type="button"
                            onClick={() => {
                              // 최대 2개까지만 선택 가능 (이미 2개 선택되어 있고, 현재 타입이 선택되지 않은 경우)
                              const currentSelectedCount = Object.keys(selectedAttributes).length;
                              const isCurrentTypeSelected = selectedAttributes[attributeTypeName] !== undefined;
                              
                              if (currentSelectedCount >= 2 && !isCurrentTypeSelected) {
                                // 이미 2개 선택되어 있고 현재 타입이 선택되지 않았으면 선택 불가
                                return;
                              }
                              
                              // 속성 선택/해제
                              setSelectedAttributes(prev => {
                                const newAttributes = { ...prev };
                                if (isSelected) {
                                  // 이미 선택된 경우 해제
                                  delete newAttributes[attributeTypeName];
                                } else {
                                  // 선택
                                  newAttributes[attributeTypeName] = valueGroup.attributeValueId;
                                }
                                return newAttributes;
                              });
                              
                              // 선택 조합의 브랜치로 기본 선택
                              if (!isSelected) {
                                let candidateBranches = [];
                                if (product.optionCombos && Object.keys(selectedAttributes).length > 0) {
                                  const t1 = product.optionTypes?.[0];
                                  const t2 = product.optionTypes?.[1];
                                  const chosen1 = selectedAttributes[t1];
                                  const chosen2 = attributeTypeName === t2 ? valueGroup.attributeValueId : selectedAttributes[t2];
                                  const combo = product.optionCombos.find(c => String(c.opt1Id) === String(chosen1) && String(c.opt2Id) === String(chosen2));
                                  candidateBranches = combo?.branches || [];
                                }
                                const b = candidateBranches[0] || firstBranch;
                                if (b?.branchId) setSelectedBranchId(b.branchId);
                              }
                              
                              // 속성 선택 시 해당 상품의 이미지로 변경
                              if (!isSelected && valueGroup.imageUrl) {
                                setCurrentProductImage(valueGroup.imageUrl);
                                setSelectedImageIndex(0); // 이미지 인덱스 초기화
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              border: `2px solid ${isSelected ? '#111' : '#e5e7eb'}`,
                              background: isSelected ? '#111' : 'white',
                              color: isSelected ? 'white' : hasStock ? '#111' : '#9ca3af',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: hasStock ? 'pointer' : 'not-allowed',
                              opacity: hasStock ? 1 : 0.5,
                              fontWeight: isSelected ? 'bold' : 'normal'
                            }}
                            disabled={!hasStock}
                          >
                            {valueGroup.attributeValueName || '기본'}
                            {!hasStock && ' (품절)'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* 구매 가능한 지점 선택 */}
            {product?.availableBranches && product.availableBranches.length > 0 && (
              <div className="option-section">
                <label className="option-label">구매 지점</label>
                <select
                  className="size-select branch-select"
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="">구매할 지점을 선택하세요</option>
                  {Array.from(
                    new Map(
                      product.availableBranches
                        .filter(branch => {
                      // 선택된 모든 속성과 일치하는 브랜치만 표시
                      const selectedKeys = Object.keys(selectedAttributes);
                      // 두 옵션이 모두 선택되면 조합 브랜치만 사용
                      if (Array.isArray(product.optionCombos) && product.optionTypes && selectedAttributes[product.optionTypes[0]] && product.optionTypes[1] && selectedAttributes[product.optionTypes[1]]) {
                        const combo = product.optionCombos.find(c => String(c.opt1Id) === String(selectedAttributes[product.optionTypes[0]]) && String(c.opt2Id) === String(selectedAttributes[product.optionTypes[1]]));
                        const comboKeys = new Set((combo?.branches || []).map(b => `${b.branchId}-${b.attributeValueId || 'no-attr'}`));
                        const key = `${branch.branchId}-${branch.attributeValueId || 'no-attr'}`;
                        return comboKeys.has(key);
                      }
                      if (selectedKeys.length === 0) {
                        return true; // 속성이 선택되지 않았으면 모든 브랜치 표시
                      }
                      
                      // 브랜치가 가진 속성이 선택된 속성과 일치하는지 확인
                      // 브랜치는 하나의 속성만 가지므로, 해당 속성 타입이 선택되어 있고 값이 일치하면 표시
                      if (branch.attributeTypeName && branch.attributeValueId) {
                        const selectedValueId = selectedAttributes[branch.attributeTypeName];
                        return selectedValueId === branch.attributeValueId;
                      }
                      
                      return false;
                        })
                        // 고유 키로 중복 제거 (동일 지점-속성 조합)
                        .map(b => {
                          const uniqKey = `${b.branchId}-${b.attributeValueId || 'no-attr'}`;
                          return [uniqKey, b];
                        })
                    ).values()
                  )
                    .map(branch => (
                      <option key={`${branch.branchId}-${branch.attributeValueId || 'no-attr'}`} value={branch.branchId}>
                        {branch.branchName} {branch.attributeValueName ? `(${branch.attributeTypeName}: ${branch.attributeValueName})` : ''} (재고: {branch.stockQuantity}개, 가격: {branch.price?.toLocaleString()}원)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 상품 정보 */}
            <div className="product-specs">
              {product?.category && (
                <div className="spec-item">
                  <span className="spec-label">카테고리</span>
                  <span className="spec-value">{product.category.categoryName || product.category}</span>
                </div>
              )}
              {product?.supplyPrice && (
                <div className="spec-item">
                  <span className="spec-label">공급가</span>
                  <span className="spec-value">{product.supplyPrice.toLocaleString()}원</span>
                </div>
              )}
              {product?.status && (
                <div className="spec-item">
                  <span className="spec-label">상태</span>
                  <span className="spec-value">{product.status === 'ACTIVE' ? '판매중' : '판매중지'}</span>
                </div>
              )}
            </div>

            {/* 구매 버튼들 */}
            <div className="purchase-buttons">
              <button className="buy-btn" onClick={handleBuy}>
                <div className="btn-price">
                  {selectedBranchId && product?.availableBranches
                    ? (() => {
                        const selectedBranch = product.availableBranches.find(b => String(b.branchId) === String(selectedBranchId));
                        return selectedBranch?.price
                          ? `₩${selectedBranch.price.toLocaleString()}`
                          : '구매하기';
                      })()
                    : product?.maxPrice
                    ? `₩${product.maxPrice.toLocaleString()}`
                    : (product?.availableBranches && product.availableBranches.length > 0)
                    ? (() => {
                        const max = product.availableBranches
                          .map(b => Number(b?.price || 0))
                          .reduce((acc, v) => (v > acc ? v : acc), 0);
                        return max > 0 ? `₩${max.toLocaleString()}` : '구매하기';
                      })()
                    : '구매하기'}
                </div>
                <div className="btn-label">구매</div>
              </button>
              <button
                className={`cart-btn ${isInCart ? "added" : ""}`}
                onClick={handleAddToCart}
              >
                <div className="btn-price">
                  {selectedBranchId && product?.availableBranches
                    ? (() => {
                        const selectedBranch = product.availableBranches.find(b => String(b.branchId) === String(selectedBranchId));
                        return selectedBranch?.price
                          ? `${selectedBranch.price.toLocaleString()}원`
                          : '가격보기';
                      })()
                    : product?.maxPrice
                    ? `₩${product.maxPrice.toLocaleString()}`
                    : (product?.availableBranches && product.availableBranches.length > 0)
                    ? (() => {
                        const max = product.availableBranches
                          .map(b => Number(b?.price || 0))
                          .reduce((acc, v) => (v > acc ? v : acc), 0);
                        return max > 0 ? `₩${max.toLocaleString()}` : '가격보기';
                      })()
                    : '가격보기'}
                </div>
                <div className="btn-label">
                  {isInCart ? "장바구니 담김" : "장바구니"}
                </div>
              </button>
            </div>

            {/* 추가 혜택 */}
            <div className="benefits-section">
              <h3>추가 혜택</h3>
              <div className="benefit-item">
                <span className="benefit-label">포인트</span>
                <span className="benefit-text">계좌 간편결제 시 1% 적립</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-label">결제</span>
                <span className="benefit-text">
                  크림카드 최대 20만원 상당 혜택 외 7건
                </span>
              </div>
              <button className="more-benefits">더보기</button>
            </div>
          </div>
        </div>

        {/* 상품 정보 섹션 */}
        <div className="price-info-section">
          <div className="price-info-grid">
            <div className="price-info-item">
              <span className="info-label">판매가격</span>
              <span className="info-value">
                {selectedBranchId && product?.availableBranches
                  ? (() => {
                      const selectedBranch = product.availableBranches.find(b => String(b.branchId) === String(selectedBranchId));
                      return selectedBranch?.price
                        ? `₩${selectedBranch.price.toLocaleString()}`
                        : product?.maxPrice
                        ? `₩${product.maxPrice.toLocaleString()}`
                        : '가격 문의';
                    })()
                  : product?.maxPrice
                  ? `₩${product.maxPrice.toLocaleString()}`
                  : (product?.availableBranches && product.availableBranches.length > 0)
                  ? (() => {
                      const max = product.availableBranches
                        .map(b => Number(b?.price || 0))
                        .reduce((acc, v) => (v > acc ? v : acc), 0);
                      return max > 0 ? `₩${max.toLocaleString()}` : '가격 문의';
                    })()
                  : '가격 문의'}
              </span>
            </div>
            <div className="price-info-item">
              <span className="info-label">상품ID</span>
              <span className="info-value">{product?.productId || '-'}</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">카테고리</span>
              <span className="info-value">{product?.category?.categoryName || product?.category || '-'}</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">재고상태</span>
              <span className="info-value">
                {product?.status === 'ACTIVE' ? '판매중' : 
                 product?.status === 'INACTIVE' ? '판매중지' : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tabs-section">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              상품설명
            </button>
            <button
              className={`tab-btn ${activeTab === "qa" ? "active" : ""}`}
              onClick={() => setActiveTab("qa")}
            >
              구매정보
            </button>
          </div>

          {/* 상품 설명 탭 */}
          {activeTab === "reviews" && (
            <div className="reviews-content">
              <div className="product-description">
                <h3>
                  <span className="description-icon">📄</span>
                  상품 상세 정보
                </h3>
                
                {/* 상품 기본 정보 */}
                <div className="product-basic-info">
                  {product?.productId && (
                    <div className="info-row">
                      <span className="info-label">품번</span>
                      <span className="info-value">{product.productId}</span>
                    </div>
                  )}
                  {product?.category && (
                    <div className="info-row">
                      <span className="info-label">카테고리</span>
                      <span className="info-value">{product.category.categoryName || product.category}</span>
                    </div>
                  )}
                  {product?.brand && (
                    <div className="info-row">
                      <span className="info-label">브랜드</span>
                      <span className="info-value">{product.brand}</span>
                    </div>
                  )}
                  {product?.status && (
                    <div className="info-row">
                      <span className="info-label">상태</span>
                      <span className="info-value">{product.status === 'ACTIVE' ? '판매중' : '판매중지'}</span>
                    </div>
                  )}
                </div>

                {/* 상품 설명 */}
                <div className="description-text">
                  {product?.description || product?.productDescription || "상품 설명이 없습니다."}
                </div>

                {/* 소재 정보 (있는 경우) */}
                {product?.material && (
                  <div className="material-info">
                    <div className="material-item">
                      <span className="material-label">겉감</span>
                      <span className="material-value">{product.material.outer || product.material}</span>
                    </div>
                    {product.material?.lining && (
                      <div className="material-item">
                        <span className="material-label">안감</span>
                        <span className="material-value">{product.material.lining}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 관리 방법 */}
                <div className="care-instructions">
                  <h4>관리 방법</h4>
                  <ul>
                    <li>단독 손세탁하여 주십시오.</li>
                    <li>열과 수축에 주의하여 주십시오.</li>
                    <li>이염에 주의하여 주십시오.</li>
                    <li>건조기 사용을 지양해 주십시오.</li>
                  </ul>
                </div>

                {/* 색상 안내 */}
                <div className="color-notice">
                  <ul>
                    <li>품의 색상은 상품 상세 이미지와 가장 흡사함으로 해당 이미지를 참고해주세요.</li>
                    <li>모니터에 따라 컬러의 오차가 있을 수 있습니다.</li>
                  </ul>
                </div>

                {/* 상품 이미지 */}
                {product?.image && (
                  <div className="product-detail-image">
                    <img 
                      src={product.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"} 
                      alt={product.name || product.productName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 구매정보 탭 */}
          {activeTab === "qa" && (
            <div className="qa-content">
              <div className="purchase-info">
                <h3>구매 안내</h3>
                <div className="info-section">
                  <h4>배송 정보</h4>
                  <p>• 배송비: 무료 배송</p>
                  <p>• 배송 소요일: 1-3일</p>
                </div>
                <div className="info-section">
                  <h4>교환/환불 안내</h4>
                  <p>• 제품 하자 또는 오배송 시 100% 재발송 또는 환불 처리</p>
                  <p>• 고객 단순 변심 시 7일 이내 교환/환불 가능</p>
                </div>
                <div className="info-section">
                  <h4>결제 안내</h4>
                  <p>• 무통장입금 / 카드결제 / 휴대폰결제</p>
                  <p>• 할부 결제 가능 (3개월 무이자)</p>
                </div>
                <div className="info-section">
                  <h4>포인트 적립</h4>
                  <p>• 구매금액의 1% 포인트 적립</p>
                  <p>• 다음 결제 시 사용 가능</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;