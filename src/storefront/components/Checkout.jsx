import React from "react";

function Checkout({ product, onBack }) {
  return (
    <div className="container checkout-page">
      <button className="tab" onClick={onBack}>
        ← 돌아가기
      </button>
      <div className="checkout-grid">
        <div className="checkout-left">
          <section className="ck-section">
            <h3>상품정보</h3>
            <div className="ck-item">
              <img 
                src={product.image || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"} 
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                }}
              />
              <div>
                <div className="name">{product.name}</div>
                <div className="price">{(
                  product.selectedBranchPrice ?? product.price ?? product.minPrice ?? 0
                ).toLocaleString()}원</div>
              </div>
            </div>
          </section>
          <section className="ck-section">
            <h3>주문 고객정보</h3>
            <div className="form-grid">
              <input placeholder="이름" />
              <input placeholder="휴대폰 번호" />
              <input placeholder="이메일" />
            </div>
          </section>
          <section className="ck-section">
            <h3>배송정보</h3>
            <div className="ship-tabs">
              <button className="tab active">일반 택배</button>
              <button className="tab">매장 픽업</button>
            </div>
            <div className="form-grid">
              <input placeholder="우편번호" />
              <input placeholder="주소" />
              <input placeholder="상세 주소" />
            </div>
          </section>
        </div>
        <aside className="checkout-summary">
          <h3>결제정보</h3>
          <div className="sum-row">
            <span>총 상품금액</span>
            <b>{(
              product.selectedBranchPrice ?? product.price ?? product.minPrice ?? 0
            ).toLocaleString()}원</b>
          </div>
          <div className="sum-row">
            <span>배송비</span>
            <b>0원</b>
          </div>
          <div className="sum-row total">
            <span>총 결제예정금액</span>
            <b>{(
              product.selectedBranchPrice ?? product.price ?? product.minPrice ?? 0
            ).toLocaleString()}원</b>
          </div>
          <button className="buy-btn" style={{ width: "100%" }}>
            결제하기
          </button>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;

