// 지점 정보 매핑 유틸리티
export const getBranchName = (branchId) => {
  const branchNames = {
    1: '본사',
    2: '강남점',
    3: '홍대점',
    4: '신촌점',
    5: '이태원점'
  };
  return branchNames[branchId] || `지점-${branchId}`;
};

export const getBranchInfo = (branchId) => {
  const branchInfo = {
    1: { name: '본사', address: '서울시 강남구 테헤란로 123', phone: '02-1234-5678' },
    2: { name: '강남점', address: '서울시 강남구 강남대로 456', phone: '02-2345-6789' },
    3: { name: '홍대점', address: '서울시 마포구 홍익로 789', phone: '02-3456-7890' },
    4: { name: '신촌점', address: '서울시 서대문구 신촌로 101', phone: '02-4567-8901' },
    5: { name: '이태원점', address: '서울시 용산구 이태원로 202', phone: '02-5678-9012' }
  };
  return branchInfo[branchId] || { name: `지점-${branchId}`, address: '주소 정보 없음', phone: '전화번호 정보 없음' };
};
