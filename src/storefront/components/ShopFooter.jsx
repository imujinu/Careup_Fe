import React from 'react';

const ShopFooter = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>이용안내</h4>
          <ul>
            <li>검수기준</li>
            <li>이용정책</li>
            <li>패널티 정책</li>
            <li>커뮤니티 가이드라인</li>
          </ul>
        </div>
        <div>
          <h4>고객지원</h4>
          <ul>
            <li>공지사항</li>
            <li>서비스 소개</li>
            <li>스토어 안내</li>
            <li>판매자 방문접수</li>
          </ul>
        </div>
        <div>
          <h4>ABOUT 샤크</h4>
          <ul>
            <li>회사소개</li>
            <li>인재채용</li>
            <li>제휴문의</li>
          </ul>
        </div>
        <div>
          <h4>고객센터 1588-7813</h4>
          <div>운영시간 평일 10:00 - 18:00</div>
          <div>점심시간 평일 13:00 - 14:00</div>
          <div>1:1 문의하기는 앱에서만 가능합니다.</div>
        </div>
      </div>
    </footer>
  );
};

export default ShopFooter;
