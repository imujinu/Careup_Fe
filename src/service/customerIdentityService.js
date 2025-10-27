// src/service/customerIdentityService.js
import publicAxios from '../utils/publicAxios';

/**
 * 고객 로그인 아이디(이메일/휴대폰) 찾기
 * @param {{name:string, birthday:string(YYYY-MM-DD), nickname:string}} payload
 * @param {{mask?: boolean}} opts 
 * @returns {{email:string, phone:string}}
 */
export const findCustomerId = async (payload, opts = {}) => {
  const mask = opts.mask ?? true;
  const { data } = await publicAxios.post(
    '/public/auth/customers/id/find',
    {
      name: payload.name?.trim(),
      birthday: payload.birthday, // 'YYYY-MM-DD'
      nickname: payload.nickname?.trim(),
    },
    { params: { mask } }
  );
  return data?.result || data;
};

export default { findCustomerId };
