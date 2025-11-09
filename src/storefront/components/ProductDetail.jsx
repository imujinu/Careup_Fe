import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "./ProductDetail.css";

const ProductDetail = ({ product, onBack, onBuy, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState("reviews");
  const cartItems = useSelector(state => state.cart?.items || []);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // 속성 선택 맵: { [attributeTypeName]: attributeValueId }
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [currentProductImage, setCurrentProductImage] = useState(product?.image || null);

  useEffect(() => {
    if (!product?.productId) {
      setIsInCart(false);
      return;
    }
    const exists = cartItems.some(item => String(item.productId) === String(product.productId));
    setIsInCart(exists);
  }, [cartItems, product?.productId]);

  // product가 변경될 때 기본 이미지 설정
  useEffect(() => {
    const defaultImage = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
    
    // 옵션 선택이 없을 때는 상품 기본 이미지 사용
    if (Object.keys(selectedAttributes).length === 0) {
      // product.image가 있으면 사용, 없으면 기본 이미지
      const baseImage = product?.image || (product?.images && product.images.length > 0 ? product.images[0] : null) || defaultImage;
      setCurrentProductImage(baseImage);
    }
  }, [product?.image, product?.images, selectedAttributes]);

  // 선택된 속성에 해당하는 이미지 가져오기
  useEffect(() => {
    const defaultImage = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
    
    // 옵션이 선택되지 않았으면 상품 기본 이미지 사용
    if (Object.keys(selectedAttributes).length === 0) {
      const baseImage = product?.image || (product?.images && product.images.length > 0 ? product.images[0] : null) || defaultImage;
      setCurrentProductImage(baseImage);
      return;
    }
    
    // 옵션이 선택된 경우: optionCombos에서 선택된 옵션에 맞는 product의 imageUrl 찾기
    const type1 = product.optionTypes?.[0];
    const type2 = product.optionTypes?.[1];
    const opt1Selected = type1 ? selectedAttributes[type1] : undefined;
    const opt2Selected = type2 ? selectedAttributes[type2] : undefined;
    
    // 1순위: optionCombos에서 선택된 옵션 조합에 맞는 product의 imageUrl 찾기
    if (opt1Selected && opt2Selected && Array.isArray(product.optionCombos)) {
      const combo = product.optionCombos.find(c => 
        String(c.opt1Id) === String(opt1Selected) && 
        String(c.opt2Id) === String(opt2Selected)
      );
      
      if (combo?.imageUrl) {
        setCurrentProductImage(combo.imageUrl);
        return;
      }
      
      // combo에 imageUrl이 없으면 해당 productId로 variants에서 찾기
      if (combo?.productId && product?.variants) {
        const variantProduct = product.variants.find(v => 
          String(v.productId) === String(combo.productId)
        );
        
        if (variantProduct?.imageUrl) {
          setCurrentProductImage(variantProduct.imageUrl);
          return;
        }
        
        if (variantProduct?.image) {
          setCurrentProductImage(variantProduct.image);
          return;
        }
      }
    }
    
    // 2순위: 하나의 옵션만 선택된 경우 - 해당 옵션에 맞는 product 찾기
    if ((opt1Selected || opt2Selected) && Array.isArray(product.optionCombos)) {
      // 첫 번째 옵션만 선택된 경우
      if (opt1Selected && !opt2Selected) {
        const matchingCombos = product.optionCombos.filter(c => 
          String(c.opt1Id) === String(opt1Selected)
        );
        
        // 첫 번째 매칭되는 combo의 이미지 사용
        if (matchingCombos.length > 0) {
          const firstCombo = matchingCombos[0];
          if (firstCombo.imageUrl) {
            setCurrentProductImage(firstCombo.imageUrl);
            return;
          }
        }
      }
      // 두 번째 옵션만 선택된 경우
      else if (!opt1Selected && opt2Selected) {
        const matchingCombos = product.optionCombos.filter(c => 
          String(c.opt2Id) === String(opt2Selected)
        );
        
        if (matchingCombos.length > 0) {
          const firstCombo = matchingCombos[0];
          if (firstCombo.imageUrl) {
            setCurrentProductImage(firstCombo.imageUrl);
            return;
          }
        }
      }
    }
    
    // 3순위: attributeGroups에서 찾기
    if (product?.attributeGroups) {
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
    
    // 모든 방법으로 이미지를 찾지 못한 경우 상품 기본 이미지 사용
    const baseImage = product?.image || (product?.images && product.images.length > 0 ? product.images[0] : null) || defaultImage;
    setCurrentProductImage(baseImage);
  }, [
    selectedAttributes, 
    product?.availableBranches, 
    product?.optionCombos, 
    product?.optionTypes, 
    product?.attributeGroups, 
    product?.image, 
    product?.variants
  ]);

  const getBranchKey = (branch) => {
    if (!branch) return '';
    if (branch.branchProductId != null) return String(branch.branchProductId);
    const branchIdPart = branch.branchId != null ? branch.branchId : 'no-branch';
    const attrPart = branch.attributeValueId != null ? branch.attributeValueId : (branch.attributeValueName || 'no-attr');
    return `${branchIdPart}-${attrPart}`;
  };

  // 옵션 선택에 따라 지점 자동 선택(재고 있는 첫 지점)
  useEffect(() => {
    if (!product?.availableBranches) return;
    const type1 = product.optionTypes?.[0];
    const type2 = product.optionTypes?.[1];
    const opt1Selected = type1 ? selectedAttributes[type1] : undefined;
    const opt2Selected = type2 ? selectedAttributes[type2] : undefined;
    let candidates = [];
    
    // 두 옵션이 모두 선택된 조합 우선
    if (Array.isArray(product.optionCombos) && opt1Selected && opt2Selected) {
      const combo = product.optionCombos.find(c => 
        String(c.opt1Id) === String(opt1Selected) && 
        String(c.opt2Id) === String(opt2Selected)
      );
      candidates = combo?.branches || [];
    } 
    // 옵션1만 선택된 경우: 옵션1에 맞는 모든 조합의 브랜치 수집
    else if (opt1Selected && !opt2Selected && Array.isArray(product.optionCombos)) {
      const matchingCombos = product.optionCombos.filter(c => 
        String(c.opt1Id) === String(opt1Selected)
      );
      const allBranches = [];
      matchingCombos.forEach(combo => {
        if (combo.branches) {
          allBranches.push(...combo.branches);
        }
      });
      // 중복 제거
      const uniqueBranches = Array.from(
        new Map(allBranches.map(b => [getBranchKey(b), b])).values()
      );
      candidates = uniqueBranches;
    }
    // 옵션2만 선택된 경우: 옵션2에 맞는 모든 조합의 브랜치 수집
    else if (!opt1Selected && opt2Selected && Array.isArray(product.optionCombos)) {
      const matchingCombos = product.optionCombos.filter(c => 
        String(c.opt2Id) === String(opt2Selected)
      );
      const allBranches = [];
      matchingCombos.forEach(combo => {
        if (combo.branches) {
          allBranches.push(...combo.branches);
        }
      });
      // 중복 제거
      const uniqueBranches = Array.from(
        new Map(allBranches.map(b => [`${b.branchId}-${b.attributeValueId || 'no-attr'}`, b])).values()
      );
      candidates = uniqueBranches;
    }
    // 단일 옵션 선택 시 (일반적인 경우)
    else {
      const keys = Object.keys(selectedAttributes);
      if (keys.length > 0) {
        const type = keys[0];
        const val = selectedAttributes[type];
        candidates = product.availableBranches.filter(b => 
          b.attributeTypeName === type && String(b.attributeValueId) === String(val)
        );
      } else {
        candidates = product.availableBranches;
      }
    }
    
    const firstInStock = candidates.find(b => (b.stockQuantity || 0) > 0) || candidates[0];
    if (firstInStock) {
      setSelectedBranch(firstInStock);
    } else if (candidates.length === 0) {
      // 선택 가능한 지점이 없으면 선택 해제
      setSelectedBranch(null);
    }
  }, [selectedAttributes, product?.availableBranches, product?.optionCombos, product?.optionTypes]);

  // 이미지 배열 처리 - images 배열이 있으면 사용, 없으면 image를 배열로 변환
  const productImages = currentProductImage 
    ? [currentProductImage]
    : (product?.images && product.images.length > 0 
      ? product.images 
      : (product?.image ? [product.image] : []));

  const currentImage = productImages[selectedImageIndex] || productImages[0] || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";

  const buildSelectedOptions = () => {
    if (!product?.attributeGroups || !selectedAttributes) return [];
    const options = [];
    product.attributeGroups.forEach(group => {
      const typeName = group.attributeTypeName;
      if (!typeName) return;
      const selectedValueId = selectedAttributes[typeName];
      if (!selectedValueId) return;
      const valueObj = group.values?.find(v => String(v.attributeValueId) === String(selectedValueId));
      const label = typeName;
      const value = valueObj?.attributeValueName || valueObj?.displayName || valueObj?.name || selectedValueId;
      options.push({ label, value });
    });
    return options;
  };

  const handleAddToCart = () => {
    // 옵션1+옵션2 조합 검증 (2단 옵션이 있는 경우)
    const type1 = product?.optionTypes?.[0];
    const type2 = product?.optionTypes?.[1];
    const opt1Selected = type1 ? selectedAttributes[type1] : undefined;
    const opt2Selected = type2 ? selectedAttributes[type2] : undefined;
    
    // 2단 옵션이 있는 경우, 두 옵션이 모두 선택되어야 함
    if (type1 && type2) {
      if (!opt1Selected || !opt2Selected) {
        alert('옵션1과 옵션2를 모두 선택해주세요.');
        return;
      }
      
      // 선택된 조합에 해당하는 지점만 사용
      if (Array.isArray(product.optionCombos)) {
        const combo = product.optionCombos.find(c => 
          String(c.opt1Id) === String(opt1Selected) && 
          String(c.opt2Id) === String(opt2Selected)
        );
        
        if (!combo || !combo.branches || combo.branches.length === 0) {
          alert('선택하신 옵션 조합에 해당하는 상품이 없습니다.');
          return;
        }
        
        // 선택된 지점이 해당 조합의 지점인지 확인
        if (resolvedSelectedBranch) {
          const isValidBranch = combo.branches.some(b => 
            getBranchKey(b) === getBranchKey(resolvedSelectedBranch)
          );
          if (!isValidBranch) {
            // 조합에 맞는 첫 번째 지점으로 자동 선택
            const firstBranch = combo.branches.find(b => (b.stockQuantity || 0) > 0) || combo.branches[0];
            if (firstBranch) {
              setSelectedBranch(firstBranch);
              alert(`선택하신 옵션 조합에 맞는 지점(${firstBranch.branchName})으로 변경되었습니다.`);
            }
          }
        } else {
          // 지점이 선택되지 않았으면 조합에 맞는 첫 번째 지점 자동 선택
          const firstBranch = combo.branches.find(b => (b.stockQuantity || 0) > 0) || combo.branches[0];
          if (firstBranch) {
            setSelectedBranch(firstBranch);
          }
        }
      }
    }
    
    // 지점 선택은 필수가 아님 - 장바구니에서 선택하도록 함
    setIsInCart(true);
    if (onAddToCart) {
      const branchData = resolvedSelectedBranch;
      const selectedOptions = buildSelectedOptions();
      const productWithBranch = {
        ...product,
        selectedBranchId: branchData?.branchId,
        selectedBranchProductId: branchData?.branchProductId,
        selectedBranchKey: getBranchKey(branchData),
        selectedOptions,
        availableBranches: product?.availableBranches || []
      };
      onAddToCart(productWithBranch);
    } else {
      console.error('❌ onAddToCart 함수가 없습니다!');
    }
  };

  const handleBuy = () => {
    // 옵션1+옵션2 조합 검증 (2단 옵션이 있는 경우)
    const type1 = product?.optionTypes?.[0];
    const type2 = product?.optionTypes?.[1];
    const opt1Selected = type1 ? selectedAttributes[type1] : undefined;
    const opt2Selected = type2 ? selectedAttributes[type2] : undefined;
    
    // 2단 옵션이 있는 경우, 두 옵션이 모두 선택되어야 함
    if (type1 && type2) {
      if (!opt1Selected || !opt2Selected) {
        alert('옵션1과 옵션2를 모두 선택해주세요.');
        return;
      }
    }
    
    // 지점이 여러 개인 경우 반드시 선택해야 함
    if (product?.availableBranches && product.availableBranches.length > 0) {
      if (!resolvedSelectedBranch) {
        alert('구매 지점을 선택해주세요.');
        return;
      }
    }

    const branchData = resolvedSelectedBranch;
    const selectedOptions = buildSelectedOptions();
    const productWithBranch = {
      ...product,
      selectedBranchId: branchData?.branchId,
      selectedBranchProductId: branchData?.branchProductId,
      selectedBranchKey: getBranchKey(branchData),
      selectedOptions
    };

    if (onBuy) {
      onBuy(productWithBranch);
    }
  };

  const resolvedSelectedBranch = selectedBranch && product?.availableBranches
    ? product.availableBranches.find(b => getBranchKey(b) === getBranchKey(selectedBranch)) || selectedBranch
    : selectedBranch;

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
                  e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
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
                      src={image || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"}
                      alt={`thumb${index + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
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
                  {resolvedSelectedBranch && product?.availableBranches
                    ? (() => {
                        return resolvedSelectedBranch?.price
                          ? `₩${resolvedSelectedBranch.price.toLocaleString()}`
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
                  {resolvedSelectedBranch 
                    ? '선택하신 지점의 판매가입니다.' 
                    : '지점을 선택하면 정확한 판매가를 확인할 수 있습니다.'}
                </div>
              </div>
            </div>

            <div className="product-title">
              <h1>{product?.name || product?.productName || "상품명"}</h1>
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
                                if (b) setSelectedBranch(b);
                              }
                              
                              // 속성 선택 시 이미지는 useEffect에서 자동으로 처리됨
                              // 여기서는 이미지 인덱스만 초기화
                              if (!isSelected) {
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
                  value={resolvedSelectedBranch ? getBranchKey(resolvedSelectedBranch) : ''}
                  onChange={(e) => {
                    const branch = product.availableBranches.find(b => getBranchKey(b) === e.target.value);
                    setSelectedBranch(branch || null);
                  }}
                >
                  <option value="">구매할 지점을 선택하세요</option>
                  {Array.from(
                    new Map(
                      product.availableBranches
                        .filter(branch => {
                      // 선택된 모든 속성과 일치하는 브랜치만 표시
                      const selectedKeys = Object.keys(selectedAttributes);
                      const type1 = product.optionTypes?.[0];
                      const type2 = product.optionTypes?.[1];
                      const opt1Selected = type1 ? selectedAttributes[type1] : undefined;
                      const opt2Selected = type2 ? selectedAttributes[type2] : undefined;
                      
                      // 두 옵션이 모두 선택되면 조합 브랜치만 사용
                      if (Array.isArray(product.optionCombos) && opt1Selected && opt2Selected) {
                        const combo = product.optionCombos.find(c => 
                          String(c.opt1Id) === String(opt1Selected) && 
                          String(c.opt2Id) === String(opt2Selected)
                        );
                        if (combo && combo.branches) {
                          const comboKeys = new Set(combo.branches.map(b => getBranchKey(b)));
                          return comboKeys.has(getBranchKey(branch));
                        }
                        return false;
                      }
                      
                      // 옵션1만 선택된 경우: 옵션1의 값과 일치하는 모든 브랜치 표시
                      if (opt1Selected && !opt2Selected && type1) {
                        // 브랜치가 옵션1의 속성 타입을 가지고 있고 값이 일치하면 표시
                        if (branch.attributeTypeName === type1 && branch.attributeValueId) {
                          return String(branch.attributeValueId) === String(opt1Selected);
                        }
                        // 또는 조합에서 옵션1이 일치하는 모든 조합의 브랜치를 찾아서 표시
                        if (Array.isArray(product.optionCombos)) {
                          const matchingCombos = product.optionCombos.filter(c => 
                            String(c.opt1Id) === String(opt1Selected)
                          );
                          const allBranchKeys = new Set();
                          matchingCombos.forEach(combo => {
                            if (combo.branches) {
                              combo.branches.forEach(b => {
                                allBranchKeys.add(getBranchKey(b));
                              });
                            }
                          });
                          return allBranchKeys.has(getBranchKey(branch));
                        }
                      }
                      
                      // 옵션2만 선택된 경우: 옵션2의 값과 일치하는 모든 브랜치 표시
                      if (!opt1Selected && opt2Selected && type2) {
                        // 브랜치가 옵션2의 속성 타입을 가지고 있고 값이 일치하면 표시
                        if (branch.attributeTypeName === type2 && branch.attributeValueId) {
                          return String(branch.attributeValueId) === String(opt2Selected);
                        }
                        // 또는 조합에서 옵션2가 일치하는 모든 조합의 브랜치를 찾아서 표시
                        if (Array.isArray(product.optionCombos)) {
                          const matchingCombos = product.optionCombos.filter(c => 
                            String(c.opt2Id) === String(opt2Selected)
                          );
                          const allBranchKeys = new Set();
                          matchingCombos.forEach(combo => {
                            if (combo.branches) {
                              combo.branches.forEach(b => {
                                allBranchKeys.add(`${b.branchId}-${b.attributeValueId || 'no-attr'}`);
                              });
                            }
                          });
                          const key = `${branch.branchId}-${branch.attributeValueId || 'no-attr'}`;
                          return allBranchKeys.has(key);
                        }
                      }
                      
                      if (selectedKeys.length === 0) {
                        return true; // 속성이 선택되지 않았으면 모든 브랜치 표시
                      }
                      
                      // 브랜치가 가진 속성이 선택된 속성과 일치하는지 확인
                      // 브랜치는 하나의 속성만 가지므로, 해당 속성 타입이 선택되어 있고 값이 일치하면 표시
                      if (branch.attributeTypeName && branch.attributeValueId) {
                        const selectedValueId = selectedAttributes[branch.attributeTypeName];
                        return selectedValueId && String(selectedValueId) === String(branch.attributeValueId);
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
                      <option key={getBranchKey(branch)} value={getBranchKey(branch)}>
                        {branch.branchName} {branch.attributeValueName ? `(${branch.attributeTypeName}: ${branch.attributeValueName})` : ''} (재고: {branch.stockQuantity}개, 가격: {branch.price?.toLocaleString()}원)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* 상품 정보 */}
            <div className="product-specs">
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
                  {resolvedSelectedBranch && product?.availableBranches
                    ? (() => {
                        return resolvedSelectedBranch?.price
                          ? `₩${resolvedSelectedBranch.price.toLocaleString()}`
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
                  {resolvedSelectedBranch && product?.availableBranches
                    ? (() => {
                        return resolvedSelectedBranch?.price
                          ? `${resolvedSelectedBranch.price.toLocaleString()}원`
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
                {(product?.description || product?.productDescription) && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#333', 
                      marginBottom: '12px' 
                    }}>
                      상품 설명
                    </h4>
                    <div 
                      className="description-text"
                      dangerouslySetInnerHTML={{
                        __html: product?.description || product?.productDescription
                      }}
                    />
                  </div>
                )}

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


                {/* 상품 이미지 */}
                {product?.image && (
                  <div className="product-detail-image">
                    <img 
                      src={product.image || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"} 
                      alt={product.name || product.productName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;