# 한화시스템 Beyond SW 16기 최종 프로젝트 — 2팀 Care-Up

> 프랜차이즈 본사·가맹점 운영(근태, 발주/재고, 매출/정산)과 고객 쇼핑을 아우르는 ERP·커머스 통합 플랫폼

---

## 👥 팀 구성

| 역할 | 이름   |
| ---- | ------ |
| 팀장 | 임진우 |
| 팀원 | 임성후 |
| 팀원 | 최재혁 |
| 팀원 | 이승지 |
| 팀원 | 김상환 |

---

## 📄 산출물 링크

- **기획서(PDF)**  
  [최종*프로젝트*기획서\_2팀\_Care-up.pdf](https://github.com/user-attachments/files/22419965/_._._2._Care-up.pdf)

- **요구사항정의서·WBS (Google Sheets)**  
  https://docs.google.com/spreadsheets/d/1vdBJm-jEBpxN1ISfJjKrhP7lDmLZn2BtD2mFcSh8DDs/edit?gid=1298947418#gid=1298947418

- **ERD (ERDCloud)**  
  [https://www.erdcloud.com/d/BheLqjBhttiyWkdZj](https://www.erdcloud.com/d/SCWgToHZ4eQx4Y3Pg)

- **화면설계서 (Figma)**  
  https://www.figma.com/design/KFWHtTRfOvJ7kE1tsQruIg/Care-up?node-id=0-1&p=f&t=gtd3O7evry5yZZHQ-0

---

## 🛠️ 스택

<a href="https://ko.react.dev/" target="_blank"><img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="react"></a>
<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript" target="_blank"><img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript"></a>
<a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
<a href="https://www.npmjs.com/" target="_blank"><img src="https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white" alt="NPM"></a>
<a href="https://ko.vite.dev/" target="_blank"><img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
<a href="https://eslint.org/" target="_blank"><img src="https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint"></a>
<a href="https://prettier.io/" target="_blank"><img src="https://img.shields.io/badge/prettier-%23F7B93E.svg?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier"></a>
<a href="https://styled-components.com/" target="_blank"><img src="https://img.shields.io/badge/styled--components-DB7093?style=for-the-badge&logo=styled-components&logoColor=white" alt="Styled Components"></a>

---

## 🗂️ 프로젝트 디렉토리 구조

| 디렉토리명 | 설명                                                                 |
| ---------- | -------------------------------------------------------------------- |
| assets     | 이미지, 아이콘, 폰트 등 정적 리소스 파일들을 관리                    |
| components | 재사용 가능한 공통 UI 컴포넌트들을 관리 (Button, Modal, Input 등)    |
| config     | 앱 설정, 환경 변수, API 엔드포인트 등 설정 파일들을 관리             |
| data       | 정적 데이터, 모킹 데이터, 상수 데이터 등을 관리                      |
| features   | 기능별로 분리된 비즈니스 로직과 컴포넌트들을 관리 (도메인 중심 구조) |
| hooks      | 커스텀 React 훅들을 관리 (비즈니스 로직 재사용)                      |
| layout     | 페이지 레이아웃 컴포넌트들을 관리 (Header, Footer, Sidebar 등)       |
| pages      | 라우팅되는 페이지 컴포넌트들을 관리                                  |
| service    | API 호출, 외부 서비스 연동 등 서비스 레이어를 관리 (= 백엔드의 Controller와 유사) |
| stores     | 전역 상태 관리 (Redux 등)를 위한 스토어들을 관리                     |
| styles     | 전역 스타일, 테마, CSS 모듈 등 스타일 관련 파일들을 관리             |
| tests      | 테스트 파일들과 테스트 유틸리티들을 관리                             |
| types      | TypeScript 타입 정의 파일들을 관리                                   |
| utils      | 공통 유틸리티 함수들을 관리 (날짜 처리, 문자열 처리 등)              |

---
