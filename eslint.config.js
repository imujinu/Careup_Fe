import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import { defineConfig } from 'vite'

export default defineConfig(
  { ignores: ['dist'] }, // 빌드 결과물 폴더 무시
  {
    files: ['**/*.{ts,tsx}'], // ts, tsx 파일만 린팅 대상 지정
    languageOptions: {
      parser: tseslint.parser, // ts 파서 사용
      ecmaVersion: 'latest', // 최신 ECMA 지원
      sourceType: 'module', // ES 모듈 시스템 사용
      globals: {
        ...globals.browser, // 브라우저 전역 변수 허용
        React: 'readonly', // React 전역 변수로 설정 (읽기 전용)
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true // jsx 문법 활성화 
        }
      }
    },
    settings: {
      react: { // React 설정
        version: '19.1.1', // react 버전 자동 감지
        runtime: 'automatic' // 새로운 jsx 변환 사용 
      },
      // import 경로 해석 설정 
      'import/resolver': {
        node: {
          // 자동 확장자 처리 
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.css']
        }
      }
    },
    // 사용할 플러그인 설정 
    plugins: {
      'react-hooks': reactHooks, // react hooks 규칙
      'react-refresh': reactRefresh, // fast refresh 규칙
      'prettier': prettier, // 코드 포맷팅
      'react': react, // react 규칙
      'jsx-a11y': jsxA11y, // 접근성 검사
      'import': importPlugin, // import 순서 및 규칙 
    },
    // 상세 린팅 규칙 
    rules: {
      ...js.configs.recommended.rules, // js 추천 규칙 적용
      ...reactHooks.configs.recommended.rules, // react hooks 추천 규칙 적용
      'react/react-in-jsx-scope': 'off', // react 17+ 이상 react import 불필요
      'prettier/prettier': 'error', // prettier 규칙 위반시 에러 표시
      // 화살표 함수 스타일 제한 해제 
      'arrow-body-style': 'off', 
      'prefer-arrow-callback': 'off',
      'react/jsx-no-target-blank': 'off', // target="_blank" 사용 시 보안 경고 비활성화
      // fast refresh 관련 설정
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'no-unused-vars': 'off', // ts 기본 미사용 변수 규칙 비활성화 

      // ts 미사용 변수 규칙 설정
      '@typescript-eslint/no-unused-vars': ['warn', {
      'varsIgnorePattern': '^_', // '_'로 시작하는 변수 무시
      'argsIgnorePattern': '^_', // '_'로 시작하는 매개변수 무시
      'ignoreRestSiblings': true // 구조분해할당 나머지 변수 무시 
      }],
      'eqeqeq': ['error', 'always'], // 일치 연산자 강제 (===, ==!  사용)
    }
  }
)