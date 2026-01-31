# Storyforge Task Plan - AI 개발자용 상세 작업 명세서

> **문서 버전**: 1.0
> **작성일**: 2026-01-30
> **참조 문서**: `Storyforge-PRD-v2.md`
> **목적**: AI 또는 개발자가 각 Task를 독립적으로, 맥락을 이해하며 안정적으로 구현할 수 있는 상세 명세

---

## 문서 사용 가이드

### Task 구조 설명

각 Task는 다음 형식으로 구성됩니다:

```
### TASK-XX: [Task 이름]

**전체 맥락에서의 목적**: 이 Task가 프로젝트 전체에서 왜 필요한지, 어떤 역할을 하는지
**의존성**: 이 Task 시작 전 완료되어야 하는 Task 목록
**산출물**: 이 Task 완료 시 생성되는 파일/기능 목록

#### 구현 요구사항
- 상세한 구현 내용

#### 완료 조건
- [ ] 체크리스트 형태의 완료 기준

#### 테스트 시나리오
- 동작 검증 방법
```

### 의존성 다이어그램

```
TASK-01 (프로젝트 초기화)
    │
    ├── TASK-02 (타입 정의) ──┬── TASK-04 (DB 스키마)
    │                         │
    ├── TASK-03 (유틸리티) ───┤
    │                         │
    └─────────────────────────┴── TASK-05 (Zustand 스토어)
                                      │
                              ┌───────┴───────┐
                              │               │
                        TASK-06 (레이아웃)    │
                              │               │
                        ┌─────┴─────┐         │
                        │           │         │
                  TASK-07      TASK-08    TASK-09
                (좌측 패널)   (에디터)   (우측 패널)
                        │           │
                  ┌─────┴────┐      │
                  │          │      │
            TASK-10    TASK-11  TASK-12
           (트리뷰)   (설정탭)  (자동저장)
                  │
            ┌─────┴─────┐
            │           │
      TASK-13      TASK-14
     (D&D)       (컨텍스트메뉴)
                        │
                  TASK-15 (세계관 카드)
                        │
                  TASK-16 (이미지 업로드)
                        │
                  TASK-17 (프로젝트 관리)
                        │
                  ┌─────┴─────┐
                  │           │
            TASK-18      TASK-19
           (버전관리)    (내보내기)
                        │
                  TASK-20 (인증)
                        │
                  TASK-21 (동기화)
                        │
                  TASK-22 (단축키)
                        │
                  TASK-23 (QA/최적화)
```

---

## Phase 1: Week 1 - 기반 구축

---

### TASK-01: 프로젝트 초기화 및 개발 환경 설정

**전체 맥락에서의 목적**:
Storyforge는 React + TypeScript 기반의 웹 애플리케이션입니다. 이 Task는 프로젝트의 기반이 되는 개발 환경을 구성합니다. Vite를 빌드 도구로 사용하고, Tailwind CSS + shadcn/ui로 일관된 디자인 시스템을 구축합니다. 이 Task가 올바르게 완료되어야 이후 모든 개발이 원활하게 진행됩니다.

**의존성**: 없음 (시작 Task)

**산출물**:
- 프로젝트 루트 디렉토리 구조
- `package.json` (모든 의존성 포함)
- `vite.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `.eslintrc.cjs`, `.prettierrc`
- `src/` 기본 폴더 구조

#### 구현 요구사항

**1. Vite 프로젝트 생성**
```bash
pnpm create vite . --template react-ts
```

**2. 필수 의존성 설치**
```bash
# 핵심 라이브러리
pnpm add zustand dexie
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-typography
pnpm add @supabase/supabase-js
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add jszip date-fns uuid
pnpm add lucide-react

# UI 관련
pnpm add tailwindcss postcss autoprefixer -D
pnpm add class-variance-authority clsx tailwind-merge

# 개발 도구
pnpm add -D @types/node @types/uuid eslint prettier
pnpm add -D husky lint-staged
```

**3. Tailwind CSS 설정**

`tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        // 상태 색상
        status: {
          draft: 'hsl(var(--status-draft))',
          writing: 'hsl(var(--status-writing))',
          complete: 'hsl(var(--status-complete))',
          published: 'hsl(var(--status-published))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
```

**4. 글로벌 CSS 변수 설정**

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --radius: 0.5rem;

    /* 상태 색상 */
    --status-draft: 217.2 32.6% 50%;
    --status-writing: 47.9 95.8% 53.1%;
    --status-complete: 142.1 76.2% 36.3%;
    --status-published: 199.4 95.5% 47.9%;
  }

  .light {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

**5. Vite 설정**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
```

**6. TypeScript 경로 별칭 설정**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**7. 폴더 구조 생성**

PRD v2 섹션 3에 명시된 구조대로 빈 폴더 생성:
```
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tree/
│   ├── editor/
│   ├── worldbuilding/
│   ├── settings/
│   ├── project/
│   └── common/
├── features/
│   ├── project/
│   ├── document/
│   ├── worldbuilding/
│   ├── export/
│   └── sync/
├── stores/
├── db/
├── lib/
├── hooks/
├── types/
└── styles/
```

**8. 환경 변수 파일**

`.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 완료 조건

- [ ] `pnpm install` 오류 없이 완료
- [ ] `pnpm dev` 실행 시 http://localhost:3000 에서 앱 로딩
- [ ] TypeScript 컴파일 오류 없음
- [ ] Tailwind CSS 스타일 적용 확인 (다크 모드 배경색)
- [ ] `@/` 경로 별칭 동작 확인
- [ ] 모든 폴더 구조 생성 완료

#### 테스트 시나리오

1. 터미널에서 `pnpm dev` 실행
2. 브라우저에서 http://localhost:3000 접속
3. 개발자 도구 Console에 오류 없음 확인
4. 배경색이 다크 모드 (어두운 배경) 인지 확인

---

### TASK-02: TypeScript 타입 정의

**전체 맥락에서의 목적**:
Storyforge의 모든 데이터 구조에 대한 TypeScript 타입을 정의합니다. 이 타입들은 프로젝트, 문서(권/화/씬), 세계관 카드, UI 상태 등 앱 전체에서 사용됩니다. 타입 안정성을 확보하여 런타임 오류를 방지하고, IDE의 자동완성 기능을 활용할 수 있게 합니다.

**의존성**: TASK-01

**산출물**:
- `src/types/project.ts`
- `src/types/document.ts`
- `src/types/worldbuilding.ts`
- `src/types/common.ts`
- `src/types/index.ts`

#### 구현 요구사항

**1. 프로젝트 타입** (`src/types/project.ts`)

PRD v2 섹션 4.2의 타입 정의를 그대로 구현합니다:

```typescript
/**
 * 프로젝트 템플릿 타입
 * 각 템플릿은 서로 다른 기본 구조와 명칭을 가집니다.
 */
export type ProjectTemplate =
  | 'web-novel'      // 웹소설: 권-화-씬, 목표 5000자/화
  | 'novel'          // 장편소설: 부-장-절, 목표 10000자
  | 'short-story'    // 단편소설: 파트-섹션-씬, 목표 15000자
  | 'screenplay';    // 시나리오: 에피소드-씬-비트

/**
 * 문서 상태
 * 트리 뷰에서 아이콘으로 표시됩니다.
 */
export type DocumentStatus =
  | 'draft'        // ○ 구상 중
  | 'writing'      // ✍ 집필 중
  | 'complete'     // ✔ 탈고
  | 'published';   // ↑ 업로드 완료

/**
 * 프로젝트 (작품)
 * 하나의 작품을 나타내며, 여러 Volume을 포함합니다.
 */
export interface Project {
  id: string;                    // UUID v4
  title: string;                 // 작품 제목
  description: string;           // 작품 설명 (선택)
  template: ProjectTemplate;     // 템플릿 타입

  // 트리 구조 명칭 커스터마이징
  // 사용자가 원하는 대로 "권/화/씬" 대신 다른 명칭 사용 가능
  terminology: {
    volume: string;              // 기본값: "권"
    chapter: string;             // 기본값: "화"
    scene: string;               // 기본값: "씬"
  };

  // 메타데이터
  genre: string[];               // 장르 태그 (예: ["판타지", "로맨스"])
  targetPlatform?: string;       // 목표 플랫폼
  targetLength?: number;         // 목표 글자수/화

  // 통계 (자동 계산)
  stats: {
    totalCharCount: number;      // 전체 글자수 (공백 제외)
    totalCharCountWithSpaces: number;
    volumeCount: number;
    chapterCount: number;
    sceneCount: number;
  };

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;

  // 동기화 설정
  syncEnabled: boolean;
  lastSyncedAt?: Date;
  userId?: string;               // Supabase user ID
}

/**
 * 템플릿 설정
 * 새 프로젝트 생성 시 사용됩니다.
 */
export interface TemplateConfig {
  name: string;                  // 표시 이름
  description: string;           // 설명
  terminology: Project['terminology'];
  targetLength: number;
  initialStructure: {
    volumes: Array<{
      title: string;
      chapters: Array<{
        title: string;
        scenes: Array<{ title: string }>;
      }>;
    }>;
  };
}
```

**2. 문서 타입** (`src/types/document.ts`)

```typescript
import type { DocumentStatus } from './project';

/**
 * 권 (Volume) - 트리 1단계
 * 여러 Chapter를 포함합니다.
 */
export interface Volume {
  id: string;
  projectId: string;
  title: string;
  order: number;                 // 0부터 시작, 정렬용
  status: DocumentStatus;

  stats: {
    charCount: number;
    charCountWithSpaces: number;
    chapterCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 화 (Chapter) - 트리 2단계
 * 여러 Scene을 포함합니다.
 */
export interface Chapter {
  id: string;
  volumeId: string;
  projectId: string;             // 빠른 쿼리용 역참조
  title: string;
  order: number;
  status: DocumentStatus;

  stats: {
    charCount: number;
    charCountWithSpaces: number;
    sceneCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 씬 (Scene) - 트리 3단계
 * 실제 글 내용을 포함하는 최소 단위입니다.
 */
export interface Scene {
  id: string;
  chapterId: string;
  volumeId: string;              // 빠른 쿼리용 역참조
  projectId: string;             // 빠른 쿼리용 역참조
  title: string;
  order: number;
  status: DocumentStatus;

  // 내용
  content: string;               // TipTap JSON (문자열화)
  plainText: string;             // 순수 텍스트 (검색 및 글자수 계산용)

  stats: {
    charCount: number;           // 공백 제외
    charCountWithSpaces: number; // 공백 포함
  };

  note?: string;                 // 작가 메모

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 버전 히스토리
 * Scene의 변경 이력을 저장합니다.
 */
export interface DocumentVersion {
  id: string;
  sceneId: string;
  content: string;               // TipTap JSON
  plainText: string;

  stats: {
    charCount: number;
    charCountWithSpaces: number;
  };

  createdAt: Date;
  reason: VersionReason;
}

export type VersionReason =
  | 'auto-save'       // 자동 저장
  | 'manual-save'     // 수동 저장 (Ctrl+S)
  | 'before-revert';  // 복원 전 백업

/**
 * 트리 노드 (UI 렌더링용)
 */
export interface TreeNode {
  id: string;
  title: string;
  type: 'volume' | 'chapter' | 'scene';
  status: DocumentStatus;
  order: number;
  children?: TreeNode[];
  parentId?: string;
}
```

**3. 세계관 타입** (`src/types/worldbuilding.ts`)

PRD v2 섹션 4.2의 worldbuilding 타입을 그대로 구현합니다.

```typescript
export type CardType = 'character' | 'location' | 'item';

export type CharacterRole =
  | 'protagonist'    // 주인공
  | 'antagonist'     // 악역
  | 'supporting'     // 조연
  | 'minor';         // 단역

/**
 * 세계관 카드 기본 타입
 */
export interface WorldCardBase {
  id: string;
  projectId: string;
  type: CardType;
  name: string;
  description: string;
  imageUrl?: string;             // Base64 데이터 URL
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 인물 카드
 */
export interface CharacterCard extends WorldCardBase {
  type: 'character';

  basicInfo: {
    age?: string;
    gender?: string;
    occupation?: string;
    nickname?: string[];
  };

  appearance: {
    height?: string;
    bodyType?: string;
    hairColor?: string;
    eyeColor?: string;
    distinguishingFeatures?: string;
  };

  personality: string;
  background: string;
  motivation: string;

  abilities?: Array<{
    name: string;
    description: string;
    level?: string;
  }>;

  relationships: Array<{
    targetId: string;
    targetName: string;
    relationType: string;
    description?: string;
  }>;

  arc?: Array<{
    phase: string;
    change: string;
  }>;

  role: CharacterRole;
  firstAppearance?: string;
}

/**
 * 장소 카드
 */
export interface LocationCard extends WorldCardBase {
  type: 'location';

  locationType: string;
  region?: string;
  features: string;
  atmosphere: string;
  significance: string;
  relatedCharacters?: string[];
  relatedEvents?: string;
}

/**
 * 아이템 카드
 */
export interface ItemCard extends WorldCardBase {
  type: 'item';

  itemType: string;
  rarity?: string;
  properties: string;
  origin: string;
  currentOwner?: string;
  significance: string;
}

export type WorldCard = CharacterCard | LocationCard | ItemCard;
```

**4. 공통 타입** (`src/types/common.ts`)

```typescript
/**
 * 저장 상태 (UI 표시용)
 */
export type SaveStatus =
  | 'saved'      // 저장 완료
  | 'saving'     // 저장 중
  | 'unsaved'    // 변경사항 있음
  | 'error';     // 저장 실패

/**
 * 동기화 상태
 */
export type SyncStatus =
  | 'synced'     // 동기화 완료
  | 'syncing'    // 동기화 중
  | 'offline'    // 오프라인
  | 'conflict'   // 충돌 발생
  | 'error';     // 오류

/**
 * 모달 타입
 */
export type ModalType =
  | 'new-project'
  | 'project-list'
  | 'project-settings'
  | 'export'
  | 'card-editor'
  | 'version-history'
  | 'confirm-delete'
  | null;

/**
 * 좌측 패널 탭
 */
export type LeftPanelTab = 'structure' | 'settings';

/**
 * 테마
 */
export type Theme = 'dark' | 'light' | 'system';

/**
 * 글자수 결과
 */
export interface CharCountResult {
  withoutSpaces: number;
  withSpaces: number;
}

/**
 * 사용자 (인증)
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}
```

**5. 인덱스 파일** (`src/types/index.ts`)

```typescript
// 모든 타입을 한 곳에서 export
export * from './project';
export * from './document';
export * from './worldbuilding';
export * from './common';
```

#### 완료 조건

- [ ] 모든 타입 파일 생성 완료
- [ ] TypeScript 컴파일 오류 없음
- [ ] `import type { Project } from '@/types'` 형태로 import 가능
- [ ] PRD v2 섹션 4.2의 모든 필드가 포함됨

#### 테스트 시나리오

1. `src/app/App.tsx`에서 타입 import 테스트:
```typescript
import type { Project, Scene, CharacterCard } from '@/types';

// 타입 사용 테스트
const testProject: Project = {
  // ... IDE 자동완성이 동작하는지 확인
};
```
2. 필수 필드 누락 시 TypeScript 오류 발생 확인

---

### TASK-03: 유틸리티 함수 및 헬퍼

**전체 맥락에서의 목적**:
프로젝트 전반에서 재사용되는 유틸리티 함수들을 구현합니다. 글자수 카운팅(공백 포함/제외), UUID 생성, className 병합, 날짜 포맷팅 등 기본적이지만 중요한 함수들입니다. 이 함수들은 컴포넌트와 서비스에서 광범위하게 사용됩니다.

**의존성**: TASK-01

**산출물**:
- `src/lib/utils.ts`
- `src/lib/cn.ts`
- `src/lib/charCount.ts`
- `src/lib/dateUtils.ts`
- `src/lib/id.ts`

#### 구현 요구사항

**1. className 유틸리티** (`src/lib/cn.ts`)

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스를 병합합니다.
 * 중복되는 클래스는 마지막 것으로 대체됩니다.
 *
 * @example
 * cn('px-2 py-1', condition && 'bg-red-500', 'px-4')
 * // 결과: 'py-1 px-4 bg-red-500' (px-2가 px-4로 대체됨)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**2. 글자수 카운팅** (`src/lib/charCount.ts`)

```typescript
import type { CharCountResult } from '@/types';

/**
 * 텍스트의 글자수를 계산합니다.
 *
 * - withoutSpaces: 모든 공백 문자 제거 후 카운트 (문피아/카카오페이지 기준)
 * - withSpaces: 전체 문자 카운트 (네이버시리즈 기준)
 *
 * 공백 문자 정의: 스페이스, 탭, 줄바꿈, 기타 유니코드 공백
 *
 * @param text - 카운트할 텍스트
 * @returns 공백 제외/포함 글자수
 */
export function countCharacters(text: string): CharCountResult {
  if (!text) {
    return { withoutSpaces: 0, withSpaces: 0 };
  }

  // 공백 제외: 모든 공백 문자(\s)를 제거
  // \s는 [ \t\n\r\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff] 포함
  const withoutSpaces = text.replace(/\s/g, '').length;

  // 공백 포함: 전체 길이
  const withSpaces = text.length;

  return { withoutSpaces, withSpaces };
}

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환합니다.
 *
 * @example
 * formatCharCount(12345) // "12,345"
 */
export function formatCharCount(count: number): string {
  return count.toLocaleString('ko-KR');
}
```

**3. 날짜 유틸리티** (`src/lib/dateUtils.ts`)

```typescript
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 "YYYY-MM-DD HH:mm" 형식으로 포맷합니다.
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
}

/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷합니다.
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd', { locale: ko });
}

/**
 * 상대적 시간 표시 (예: "3분 전", "2시간 전")
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}

/**
 * 파일명용 타임스탬프 생성 (예: "20260130_143052")
 */
export function getTimestamp(): string {
  return format(new Date(), 'yyyyMMdd_HHmmss');
}
```

**4. ID 생성** (`src/lib/id.ts`)

```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * UUID v4를 생성합니다.
 * 모든 엔티티의 고유 ID로 사용됩니다.
 */
export function generateId(): string {
  return uuidv4();
}
```

**5. 공통 유틸리티** (`src/lib/utils.ts`)

```typescript
/**
 * 딜레이 함수 (테스트/디버깅용)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 객체가 비어있는지 확인
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 파일 크기 포맷 (bytes → KB/MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 문자열 truncate
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
```

#### 완료 조건

- [ ] 모든 유틸리티 파일 생성 완료
- [ ] TypeScript 컴파일 오류 없음
- [ ] 각 함수에 JSDoc 주석 포함
- [ ] `import { cn } from '@/lib/cn'` 형태로 import 가능

#### 테스트 시나리오

```typescript
// charCount 테스트
import { countCharacters, formatCharCount } from '@/lib/charCount';

console.log(countCharacters('안녕하세요'));
// { withoutSpaces: 5, withSpaces: 5 }

console.log(countCharacters('안녕 하세요'));
// { withoutSpaces: 5, withSpaces: 6 }

console.log(countCharacters('안녕\n하세요'));
// { withoutSpaces: 5, withSpaces: 6 }

console.log(formatCharCount(12345));
// "12,345"
```

---

### TASK-04: IndexedDB 스키마 및 Dexie 설정

**전체 맥락에서의 목적**:
Storyforge는 오프라인 우선 앱입니다. 모든 데이터는 먼저 브라우저의 IndexedDB에 저장되고, 선택적으로 클라우드와 동기화됩니다. Dexie.js를 사용하여 IndexedDB를 쉽게 다룰 수 있게 합니다. 이 Task에서 정의한 스키마는 프로젝트, 문서, 세계관 카드, 버전 히스토리 등 모든 데이터의 저장 구조를 결정합니다.

**의존성**: TASK-01, TASK-02

**산출물**:
- `src/db/schema.ts`
- `src/db/index.ts`
- `src/db/migrations.ts`

#### 구현 요구사항

**1. Dexie 스키마 정의** (`src/db/schema.ts`)

```typescript
import Dexie, { type Table } from 'dexie';
import type {
  Project,
  Volume,
  Chapter,
  Scene,
  DocumentVersion,
  CharacterCard,
  LocationCard,
  ItemCard,
} from '@/types';

/**
 * Storyforge IndexedDB 스키마
 *
 * 인덱스 설명:
 * - 기본 키: id
 * - 복합 인덱스: [필드1+필드2] - 두 필드 조합으로 검색
 * - 멀티 인덱스: *필드 - 배열 내 각 요소로 검색 가능
 *
 * 쿼리 패턴:
 * - projects: ID로 조회, userId로 필터, lastOpenedAt으로 정렬
 * - volumes: projectId로 필터, order로 정렬
 * - chapters: volumeId로 필터, order로 정렬
 * - scenes: chapterId로 필터, order로 정렬
 * - versions: sceneId로 필터, createdAt으로 정렬 (최근 50개)
 * - worldbuilding: projectId로 필터, tags로 검색
 */
export class StoryforgeDB extends Dexie {
  // 테이블 선언 (타입 안전성)
  projects!: Table<Project>;
  volumes!: Table<Volume>;
  chapters!: Table<Chapter>;
  scenes!: Table<Scene>;
  versions!: Table<DocumentVersion>;
  characters!: Table<CharacterCard>;
  locations!: Table<LocationCard>;
  items!: Table<ItemCard>;

  constructor() {
    super('storyforge');

    // 버전 1: 초기 스키마
    this.version(1).stores({
      // 프로젝트
      // 인덱스: id(PK), title(검색), updatedAt(정렬), lastOpenedAt(최근 열어본 순), userId(사용자별 필터)
      projects: 'id, title, updatedAt, lastOpenedAt, userId',

      // 트리 구조
      // volumes: projectId로 필터 후 order로 정렬
      volumes: 'id, projectId, order, [projectId+order]',

      // chapters: volumeId로 필터 후 order로 정렬, projectId는 빠른 삭제용
      chapters: 'id, volumeId, projectId, order, [volumeId+order]',

      // scenes: chapterId로 필터 후 order로 정렬
      scenes: 'id, chapterId, volumeId, projectId, order, [chapterId+order]',

      // 버전 히스토리
      // sceneId로 필터 후 createdAt으로 정렬 (최신순)
      versions: 'id, sceneId, createdAt, [sceneId+createdAt]',

      // 세계관 카드
      // *tags: 멀티 인덱스 - 태그 배열의 각 요소로 검색 가능
      characters: 'id, projectId, name, role, *tags',
      locations: 'id, projectId, name, locationType, *tags',
      items: 'id, projectId, name, itemType, *tags',
    });
  }
}
```

**2. DB 인스턴스 내보내기** (`src/db/index.ts`)

```typescript
import { StoryforgeDB } from './schema';

/**
 * 전역 Dexie 인스턴스
 *
 * 사용 예시:
 * import { db } from '@/db';
 *
 * // 프로젝트 조회
 * const projects = await db.projects.toArray();
 *
 * // 특정 프로젝트의 volumes
 * const volumes = await db.volumes
 *   .where('projectId')
 *   .equals(projectId)
 *   .sortBy('order');
 */
export const db = new StoryforgeDB();

// 타입 재export
export { StoryforgeDB } from './schema';

/**
 * DB 초기화 (앱 시작 시 호출)
 * 필요한 경우 마이그레이션 실행
 */
export async function initializeDB(): Promise<void> {
  try {
    // DB 열기 (스키마 버전 확인 및 마이그레이션)
    await db.open();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * 프로젝트 삭제 시 관련 데이터 모두 삭제
 */
export async function deleteProjectCascade(projectId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.projects, db.volumes, db.chapters, db.scenes, db.versions, db.characters, db.locations, db.items],
    async () => {
      // 프로젝트 삭제
      await db.projects.delete(projectId);

      // Volumes 삭제
      const volumes = await db.volumes.where('projectId').equals(projectId).toArray();
      await db.volumes.where('projectId').equals(projectId).delete();

      // Chapters 삭제
      await db.chapters.where('projectId').equals(projectId).delete();

      // Scenes 및 Versions 삭제
      const scenes = await db.scenes.where('projectId').equals(projectId).toArray();
      for (const scene of scenes) {
        await db.versions.where('sceneId').equals(scene.id).delete();
      }
      await db.scenes.where('projectId').equals(projectId).delete();

      // 세계관 카드 삭제
      await db.characters.where('projectId').equals(projectId).delete();
      await db.locations.where('projectId').equals(projectId).delete();
      await db.items.where('projectId').equals(projectId).delete();
    }
  );
}
```

**3. 마이그레이션 헬퍼** (`src/db/migrations.ts`)

```typescript
import { db } from './index';

/**
 * 향후 스키마 변경 시 마이그레이션 로직
 *
 * Dexie는 version().stores()에서 스키마 변경을 자동 처리하지만,
 * 데이터 변환이 필요한 경우 upgrade() 콜백을 사용합니다.
 *
 * 예시 (버전 2로 업그레이드 시):
 *
 * this.version(2).stores({
 *   // 새 스키마
 * }).upgrade(tx => {
 *   // 데이터 변환 로직
 *   return tx.projects.toCollection().modify(project => {
 *     project.newField = 'default value';
 *   });
 * });
 */

/**
 * DB 상태 확인
 */
export async function checkDBStatus(): Promise<{
  isOpen: boolean;
  version: number;
  tables: string[];
}> {
  return {
    isOpen: db.isOpen(),
    version: db.verno,
    tables: db.tables.map(t => t.name),
  };
}

/**
 * DB 완전 초기화 (개발/테스트용)
 * 주의: 모든 데이터가 삭제됩니다
 */
export async function resetDB(): Promise<void> {
  await db.delete();
  await db.open();
}
```

#### 완료 조건

- [ ] 모든 DB 파일 생성 완료
- [ ] `pnpm dev` 실행 후 브라우저 개발자 도구 > Application > IndexedDB에서 'storyforge' DB 확인
- [ ] 모든 테이블 (projects, volumes, chapters, scenes, versions, characters, locations, items) 존재 확인
- [ ] TypeScript 컴파일 오류 없음

#### 테스트 시나리오

```typescript
// App.tsx 또는 테스트 파일에서
import { db, initializeDB } from '@/db';

async function testDB() {
  await initializeDB();

  // 테스트 데이터 삽입
  const testProject = {
    id: 'test-123',
    title: '테스트 프로젝트',
    description: '',
    template: 'web-novel' as const,
    terminology: { volume: '권', chapter: '화', scene: '씬' },
    genre: [],
    stats: {
      totalCharCount: 0,
      totalCharCountWithSpaces: 0,
      volumeCount: 0,
      chapterCount: 0,
      sceneCount: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    lastOpenedAt: new Date(),
    syncEnabled: false,
  };

  await db.projects.add(testProject);

  // 조회 확인
  const projects = await db.projects.toArray();
  console.log('Projects:', projects);

  // 정리
  await db.projects.delete('test-123');
}
```

---

### TASK-05: Zustand 스토어 구현

**전체 맥락에서의 목적**:
Zustand를 사용하여 앱의 전역 상태를 관리합니다. 6개의 스토어(Project, Document, Editor, World, UI, Auth)가 각각 특정 도메인의 상태와 액션을 담당합니다. 스토어는 IndexedDB와 연동하여 데이터를 영속화하고, 컴포넌트에 반응형 상태를 제공합니다.

**의존성**: TASK-01, TASK-02, TASK-04

**산출물**:
- `src/stores/useProjectStore.ts`
- `src/stores/useDocumentStore.ts`
- `src/stores/useEditorStore.ts`
- `src/stores/useWorldStore.ts`
- `src/stores/useUIStore.ts`
- `src/stores/useAuthStore.ts`
- `src/stores/index.ts`

#### 구현 요구사항

**1. Project 스토어** (`src/stores/useProjectStore.ts`)

```typescript
import { create } from 'zustand';
import { db } from '@/db';
import { generateId } from '@/lib/id';
import type { Project, ProjectTemplate, TemplateConfig } from '@/types';

/**
 * 템플릿 설정
 */
const templates: Record<ProjectTemplate, TemplateConfig> = {
  'web-novel': {
    name: '웹소설',
    description: '연재용 웹소설 (권-화-씬 구조)',
    terminology: { volume: '권', chapter: '화', scene: '씬' },
    targetLength: 5000,
    initialStructure: {
      volumes: [{ title: '1권', chapters: [{ title: '1화', scenes: [{ title: '씬 1' }] }] }],
    },
  },
  'novel': {
    name: '장편소설',
    description: '출판용 장편소설 (부-장-절 구조)',
    terminology: { volume: '부', chapter: '장', scene: '절' },
    targetLength: 10000,
    initialStructure: {
      volumes: [{ title: '제1부', chapters: [{ title: '제1장', scenes: [{ title: '1' }] }] }],
    },
  },
  'short-story': {
    name: '단편소설',
    description: '공모전/단편용 (씬 위주)',
    terminology: { volume: '파트', chapter: '섹션', scene: '씬' },
    targetLength: 15000,
    initialStructure: {
      volumes: [{ title: '본문', chapters: [{ title: '도입', scenes: [{ title: '씬 1' }] }] }],
    },
  },
  'screenplay': {
    name: '시나리오',
    description: '영상/드라마 시나리오',
    terminology: { volume: '에피소드', chapter: '씬', scene: '비트' },
    targetLength: 0,
    initialStructure: {
      volumes: [{ title: 'EP01', chapters: [{ title: 'S#1', scenes: [{ title: '비트 1' }] }] }],
    },
  },
};

interface ProjectState {
  // 상태
  currentProjectId: string | null;
  projects: Map<string, Project>;
  isLoading: boolean;
  error: string | null;

  // 액션
  loadProjects: () => Promise<void>;
  createProject: (template: ProjectTemplate, title: string) => Promise<string>;
  openProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  closeProject: () => void;

  // 셀렉터
  getCurrentProject: () => Project | null;
  getRecentProjects: (limit?: number) => Project[];
  getTemplates: () => Record<ProjectTemplate, TemplateConfig>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProjectId: null,
  projects: new Map(),
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projectList = await db.projects.toArray();
      const projectMap = new Map(projectList.map(p => [p.id, p]));
      set({ projects: projectMap, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (template, title) => {
    const config = templates[template];
    const now = new Date();
    const projectId = generateId();

    const project: Project = {
      id: projectId,
      title,
      description: '',
      template,
      terminology: config.terminology,
      genre: [],
      targetLength: config.targetLength,
      stats: {
        totalCharCount: 0,
        totalCharCountWithSpaces: 0,
        volumeCount: 0,
        chapterCount: 0,
        sceneCount: 0,
      },
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      syncEnabled: false,
    };

    await db.projects.add(project);

    // 초기 구조 생성 (Volume, Chapter, Scene)
    // 이 로직은 DocumentStore에서 처리하거나 별도 서비스로 분리 가능
    // 여기서는 기본 구조만 생성
    for (const volumeData of config.initialStructure.volumes) {
      const volumeId = generateId();
      await db.volumes.add({
        id: volumeId,
        projectId,
        title: volumeData.title,
        order: 0,
        status: 'draft',
        stats: { charCount: 0, charCountWithSpaces: 0, chapterCount: 0 },
        createdAt: now,
        updatedAt: now,
      });

      for (let ci = 0; ci < volumeData.chapters.length; ci++) {
        const chapterData = volumeData.chapters[ci];
        const chapterId = generateId();
        await db.chapters.add({
          id: chapterId,
          volumeId,
          projectId,
          title: chapterData.title,
          order: ci,
          status: 'draft',
          stats: { charCount: 0, charCountWithSpaces: 0, sceneCount: 0 },
          createdAt: now,
          updatedAt: now,
        });

        for (let si = 0; si < chapterData.scenes.length; si++) {
          const sceneData = chapterData.scenes[si];
          await db.scenes.add({
            id: generateId(),
            chapterId,
            volumeId,
            projectId,
            title: sceneData.title,
            order: si,
            status: 'draft',
            content: '',
            plainText: '',
            stats: { charCount: 0, charCountWithSpaces: 0 },
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // 통계 업데이트
    const volumeCount = config.initialStructure.volumes.length;
    const chapterCount = config.initialStructure.volumes.reduce(
      (sum, v) => sum + v.chapters.length,
      0
    );
    const sceneCount = config.initialStructure.volumes.reduce(
      (sum, v) => sum + v.chapters.reduce((cSum, c) => cSum + c.scenes.length, 0),
      0
    );

    await db.projects.update(projectId, {
      stats: {
        ...project.stats,
        volumeCount,
        chapterCount,
        sceneCount,
      },
    });

    set(state => ({
      projects: new Map(state.projects).set(projectId, {
        ...project,
        stats: { ...project.stats, volumeCount, chapterCount, sceneCount },
      }),
    }));

    return projectId;
  },

  openProject: async (id) => {
    const now = new Date();
    await db.projects.update(id, { lastOpenedAt: now });
    set(state => {
      const project = state.projects.get(id);
      if (project) {
        return {
          currentProjectId: id,
          projects: new Map(state.projects).set(id, { ...project, lastOpenedAt: now }),
        };
      }
      return { currentProjectId: id };
    });
  },

  updateProject: async (id, updates) => {
    const now = new Date();
    await db.projects.update(id, { ...updates, updatedAt: now });
    set(state => {
      const project = state.projects.get(id);
      if (project) {
        return {
          projects: new Map(state.projects).set(id, { ...project, ...updates, updatedAt: now }),
        };
      }
      return {};
    });
  },

  deleteProject: async (id) => {
    // Cascade delete는 db/index.ts의 deleteProjectCascade 사용
    const { deleteProjectCascade } = await import('@/db');
    await deleteProjectCascade(id);
    set(state => {
      const newProjects = new Map(state.projects);
      newProjects.delete(id);
      return {
        projects: newProjects,
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      };
    });
  },

  closeProject: () => {
    set({ currentProjectId: null });
  },

  getCurrentProject: () => {
    const { currentProjectId, projects } = get();
    return currentProjectId ? projects.get(currentProjectId) ?? null : null;
  },

  getRecentProjects: (limit = 10) => {
    const { projects } = get();
    return Array.from(projects.values())
      .sort((a, b) => b.lastOpenedAt.getTime() - a.lastOpenedAt.getTime())
      .slice(0, limit);
  },

  getTemplates: () => templates,
}));
```

**2. Document 스토어** (`src/stores/useDocumentStore.ts`)

```typescript
import { create } from 'zustand';
import { db } from '@/db';
import { generateId } from '@/lib/id';
import type { Volume, Chapter, Scene, TreeNode, DocumentStatus } from '@/types';

interface DocumentState {
  // 구조 데이터
  volumes: Map<string, Volume>;
  chapters: Map<string, Chapter>;
  scenes: Map<string, Scene>;

  // 현재 선택
  selectedId: string | null;
  selectedType: 'volume' | 'chapter' | 'scene' | null;

  // 트리 상태
  expandedIds: Set<string>;

  // 로딩
  isLoading: boolean;

  // 액션
  loadDocuments: (projectId: string) => Promise<void>;
  clearDocuments: () => void;

  // Volume CRUD
  createVolume: (projectId: string, title: string) => Promise<string>;
  updateVolume: (id: string, updates: Partial<Volume>) => Promise<void>;
  deleteVolume: (id: string) => Promise<void>;
  reorderVolumes: (projectId: string, orderedIds: string[]) => Promise<void>;

  // Chapter CRUD
  createChapter: (volumeId: string, title: string) => Promise<string>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (volumeId: string, orderedIds: string[]) => Promise<void>;

  // Scene CRUD
  createScene: (chapterId: string, title: string) => Promise<string>;
  updateScene: (id: string, updates: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  reorderScenes: (chapterId: string, orderedIds: string[]) => Promise<void>;

  // 트리 조작
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (id: string | null, type: 'volume' | 'chapter' | 'scene' | null) => void;

  // 셀렉터
  getTreeData: () => TreeNode[];
  getScene: (id: string) => Scene | undefined;
  getVolumeChapters: (volumeId: string) => Chapter[];
  getChapterScenes: (chapterId: string) => Scene[];
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  volumes: new Map(),
  chapters: new Map(),
  scenes: new Map(),
  selectedId: null,
  selectedType: null,
  expandedIds: new Set(),
  isLoading: false,

  loadDocuments: async (projectId) => {
    set({ isLoading: true });

    const [volumeList, chapterList, sceneList] = await Promise.all([
      db.volumes.where('projectId').equals(projectId).sortBy('order'),
      db.chapters.where('projectId').equals(projectId).sortBy('order'),
      db.scenes.where('projectId').equals(projectId).sortBy('order'),
    ]);

    // 첫 번째 Volume은 기본 펼침
    const initialExpanded = new Set<string>();
    if (volumeList.length > 0) {
      initialExpanded.add(volumeList[0].id);
    }

    set({
      volumes: new Map(volumeList.map(v => [v.id, v])),
      chapters: new Map(chapterList.map(c => [c.id, c])),
      scenes: new Map(sceneList.map(s => [s.id, s])),
      expandedIds: initialExpanded,
      isLoading: false,
    });
  },

  clearDocuments: () => {
    set({
      volumes: new Map(),
      chapters: new Map(),
      scenes: new Map(),
      selectedId: null,
      selectedType: null,
      expandedIds: new Set(),
    });
  },

  // Volume CRUD
  createVolume: async (projectId, title) => {
    const { volumes } = get();
    const maxOrder = Math.max(...Array.from(volumes.values()).map(v => v.order), -1);
    const now = new Date();
    const id = generateId();

    const volume: Volume = {
      id,
      projectId,
      title,
      order: maxOrder + 1,
      status: 'draft',
      stats: { charCount: 0, charCountWithSpaces: 0, chapterCount: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await db.volumes.add(volume);
    set(state => ({
      volumes: new Map(state.volumes).set(id, volume),
    }));

    return id;
  },

  updateVolume: async (id, updates) => {
    const now = new Date();
    await db.volumes.update(id, { ...updates, updatedAt: now });
    set(state => {
      const volume = state.volumes.get(id);
      if (volume) {
        return {
          volumes: new Map(state.volumes).set(id, { ...volume, ...updates, updatedAt: now }),
        };
      }
      return {};
    });
  },

  deleteVolume: async (id) => {
    // 하위 Chapters, Scenes, Versions 삭제
    const chapters = await db.chapters.where('volumeId').equals(id).toArray();
    for (const chapter of chapters) {
      const scenes = await db.scenes.where('chapterId').equals(chapter.id).toArray();
      for (const scene of scenes) {
        await db.versions.where('sceneId').equals(scene.id).delete();
      }
      await db.scenes.where('chapterId').equals(chapter.id).delete();
    }
    await db.chapters.where('volumeId').equals(id).delete();
    await db.volumes.delete(id);

    set(state => {
      const newVolumes = new Map(state.volumes);
      const newChapters = new Map(state.chapters);
      const newScenes = new Map(state.scenes);

      newVolumes.delete(id);
      chapters.forEach(c => newChapters.delete(c.id));

      return {
        volumes: newVolumes,
        chapters: newChapters,
        scenes: newScenes,
      };
    });
  },

  reorderVolumes: async (projectId, orderedIds) => {
    await db.transaction('rw', db.volumes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.volumes.update(orderedIds[i], { order: i });
      }
    });

    set(state => {
      const newVolumes = new Map(state.volumes);
      orderedIds.forEach((id, index) => {
        const volume = newVolumes.get(id);
        if (volume) {
          newVolumes.set(id, { ...volume, order: index });
        }
      });
      return { volumes: newVolumes };
    });
  },

  // Chapter CRUD (Volume과 유사한 패턴)
  createChapter: async (volumeId, title) => {
    const volume = get().volumes.get(volumeId);
    if (!volume) throw new Error('Volume not found');

    const { chapters } = get();
    const volumeChapters = Array.from(chapters.values()).filter(c => c.volumeId === volumeId);
    const maxOrder = Math.max(...volumeChapters.map(c => c.order), -1);
    const now = new Date();
    const id = generateId();

    const chapter: Chapter = {
      id,
      volumeId,
      projectId: volume.projectId,
      title,
      order: maxOrder + 1,
      status: 'draft',
      stats: { charCount: 0, charCountWithSpaces: 0, sceneCount: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await db.chapters.add(chapter);
    set(state => ({
      chapters: new Map(state.chapters).set(id, chapter),
    }));

    return id;
  },

  updateChapter: async (id, updates) => {
    const now = new Date();
    await db.chapters.update(id, { ...updates, updatedAt: now });
    set(state => {
      const chapter = state.chapters.get(id);
      if (chapter) {
        return {
          chapters: new Map(state.chapters).set(id, { ...chapter, ...updates, updatedAt: now }),
        };
      }
      return {};
    });
  },

  deleteChapter: async (id) => {
    const scenes = await db.scenes.where('chapterId').equals(id).toArray();
    for (const scene of scenes) {
      await db.versions.where('sceneId').equals(scene.id).delete();
    }
    await db.scenes.where('chapterId').equals(id).delete();
    await db.chapters.delete(id);

    set(state => {
      const newChapters = new Map(state.chapters);
      const newScenes = new Map(state.scenes);
      newChapters.delete(id);
      scenes.forEach(s => newScenes.delete(s.id));
      return { chapters: newChapters, scenes: newScenes };
    });
  },

  reorderChapters: async (volumeId, orderedIds) => {
    await db.transaction('rw', db.chapters, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.chapters.update(orderedIds[i], { order: i });
      }
    });

    set(state => {
      const newChapters = new Map(state.chapters);
      orderedIds.forEach((id, index) => {
        const chapter = newChapters.get(id);
        if (chapter) {
          newChapters.set(id, { ...chapter, order: index });
        }
      });
      return { chapters: newChapters };
    });
  },

  // Scene CRUD
  createScene: async (chapterId, title) => {
    const chapter = get().chapters.get(chapterId);
    if (!chapter) throw new Error('Chapter not found');

    const { scenes } = get();
    const chapterScenes = Array.from(scenes.values()).filter(s => s.chapterId === chapterId);
    const maxOrder = Math.max(...chapterScenes.map(s => s.order), -1);
    const now = new Date();
    const id = generateId();

    const scene: Scene = {
      id,
      chapterId,
      volumeId: chapter.volumeId,
      projectId: chapter.projectId,
      title,
      order: maxOrder + 1,
      status: 'draft',
      content: '',
      plainText: '',
      stats: { charCount: 0, charCountWithSpaces: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await db.scenes.add(scene);
    set(state => ({
      scenes: new Map(state.scenes).set(id, scene),
    }));

    return id;
  },

  updateScene: async (id, updates) => {
    const now = new Date();
    await db.scenes.update(id, { ...updates, updatedAt: now });
    set(state => {
      const scene = state.scenes.get(id);
      if (scene) {
        return {
          scenes: new Map(state.scenes).set(id, { ...scene, ...updates, updatedAt: now }),
        };
      }
      return {};
    });
  },

  deleteScene: async (id) => {
    await db.versions.where('sceneId').equals(id).delete();
    await db.scenes.delete(id);

    set(state => {
      const newScenes = new Map(state.scenes);
      newScenes.delete(id);
      return { scenes: newScenes };
    });
  },

  reorderScenes: async (chapterId, orderedIds) => {
    await db.transaction('rw', db.scenes, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.scenes.update(orderedIds[i], { order: i });
      }
    });

    set(state => {
      const newScenes = new Map(state.scenes);
      orderedIds.forEach((id, index) => {
        const scene = newScenes.get(id);
        if (scene) {
          newScenes.set(id, { ...scene, order: index });
        }
      });
      return { scenes: newScenes };
    });
  },

  // 트리 조작
  toggleExpand: (id) => {
    set(state => {
      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedIds: newExpanded };
    });
  },

  expandAll: () => {
    const { volumes, chapters } = get();
    const allIds = new Set([
      ...Array.from(volumes.keys()),
      ...Array.from(chapters.keys()),
    ]);
    set({ expandedIds: allIds });
  },

  collapseAll: () => {
    set({ expandedIds: new Set() });
  },

  select: (id, type) => {
    set({ selectedId: id, selectedType: type });
  },

  // 셀렉터
  getTreeData: () => {
    const { volumes, chapters, scenes, expandedIds } = get();

    const sortedVolumes = Array.from(volumes.values()).sort((a, b) => a.order - b.order);

    return sortedVolumes.map(volume => {
      const volumeChapters = Array.from(chapters.values())
        .filter(c => c.volumeId === volume.id)
        .sort((a, b) => a.order - b.order);

      return {
        id: volume.id,
        title: volume.title,
        type: 'volume' as const,
        status: volume.status,
        order: volume.order,
        children: volumeChapters.map(chapter => {
          const chapterScenes = Array.from(scenes.values())
            .filter(s => s.chapterId === chapter.id)
            .sort((a, b) => a.order - b.order);

          return {
            id: chapter.id,
            title: chapter.title,
            type: 'chapter' as const,
            status: chapter.status,
            order: chapter.order,
            parentId: volume.id,
            children: chapterScenes.map(scene => ({
              id: scene.id,
              title: scene.title,
              type: 'scene' as const,
              status: scene.status,
              order: scene.order,
              parentId: chapter.id,
            })),
          };
        }),
      };
    });
  },

  getScene: (id) => get().scenes.get(id),

  getVolumeChapters: (volumeId) => {
    return Array.from(get().chapters.values())
      .filter(c => c.volumeId === volumeId)
      .sort((a, b) => a.order - b.order);
  },

  getChapterScenes: (chapterId) => {
    return Array.from(get().scenes.values())
      .filter(s => s.chapterId === chapterId)
      .sort((a, b) => a.order - b.order);
  },
}));
```

**3. Editor 스토어** (`src/stores/useEditorStore.ts`)

```typescript
import { create } from 'zustand';
import { db } from '@/db';
import { generateId } from '@/lib/id';
import { countCharacters } from '@/lib/charCount';
import type { SaveStatus, DocumentVersion, VersionReason } from '@/types';

interface EditorState {
  // 현재 편집 중인 씬
  currentSceneId: string | null;
  content: string;                // TipTap JSON 문자열

  // 저장 상태
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;

  // 글자수
  charCount: number;
  charCountWithSpaces: number;

  // 에디터 설정
  focusMode: boolean;

  // 한글 조합 상태 (저장 트리거 제어용)
  isComposing: boolean;

  // 액션
  openScene: (sceneId: string) => Promise<void>;
  closeScene: () => void;
  updateContent: (content: string, plainText: string) => void;
  saveContent: (reason?: VersionReason) => Promise<void>;
  setComposing: (isComposing: boolean) => void;
  toggleFocusMode: () => void;

  // 버전 관리
  getVersions: (limit?: number) => Promise<DocumentVersion[]>;
  revertToVersion: (versionId: string) => Promise<void>;

  // 셀렉터
  getSaveStatus: () => SaveStatus;
}

const MAX_VERSIONS = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  currentSceneId: null,
  content: '',
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  saveError: null,
  charCount: 0,
  charCountWithSpaces: 0,
  focusMode: false,
  isComposing: false,

  openScene: async (sceneId) => {
    // 현재 씬이 있고 변경사항이 있으면 저장
    const { currentSceneId, isDirty, saveContent } = get();
    if (currentSceneId && isDirty) {
      await saveContent('auto-save');
    }

    const scene = await db.scenes.get(sceneId);
    if (scene) {
      set({
        currentSceneId: sceneId,
        content: scene.content,
        charCount: scene.stats.charCount,
        charCountWithSpaces: scene.stats.charCountWithSpaces,
        isDirty: false,
        saveError: null,
      });
    }
  },

  closeScene: () => {
    set({
      currentSceneId: null,
      content: '',
      charCount: 0,
      charCountWithSpaces: 0,
      isDirty: false,
    });
  },

  updateContent: (content, plainText) => {
    const counts = countCharacters(plainText);
    set({
      content,
      charCount: counts.withoutSpaces,
      charCountWithSpaces: counts.withSpaces,
      isDirty: true,
    });
  },

  saveContent: async (reason = 'auto-save') => {
    const { currentSceneId, content, charCount, charCountWithSpaces, isComposing } = get();

    // 한글 조합 중이면 저장하지 않음
    if (isComposing) return;
    if (!currentSceneId) return;

    set({ isSaving: true, saveError: null });

    try {
      const scene = await db.scenes.get(currentSceneId);
      if (!scene) throw new Error('Scene not found');

      // TipTap JSON에서 plainText 추출
      let plainText = '';
      try {
        const json = JSON.parse(content);
        plainText = extractPlainText(json);
      } catch {
        plainText = content; // fallback
      }

      const now = new Date();

      // Scene 업데이트
      await db.scenes.update(currentSceneId, {
        content,
        plainText,
        stats: { charCount, charCountWithSpaces },
        updatedAt: now,
      });

      // 버전 생성
      const version: DocumentVersion = {
        id: generateId(),
        sceneId: currentSceneId,
        content,
        plainText,
        stats: { charCount, charCountWithSpaces },
        createdAt: now,
        reason,
      };
      await db.versions.add(version);

      // 오래된 버전 정리 (최대 50개 유지)
      const versions = await db.versions
        .where('sceneId')
        .equals(currentSceneId)
        .reverse()
        .sortBy('createdAt');

      if (versions.length > MAX_VERSIONS) {
        const toDelete = versions.slice(MAX_VERSIONS);
        await db.versions.bulkDelete(toDelete.map(v => v.id));
      }

      set({
        isSaving: false,
        isDirty: false,
        lastSavedAt: now,
      });
    } catch (error) {
      set({
        isSaving: false,
        saveError: (error as Error).message,
      });
    }
  },

  setComposing: (isComposing) => {
    set({ isComposing });
  },

  toggleFocusMode: () => {
    set(state => ({ focusMode: !state.focusMode }));
  },

  getVersions: async (limit = 50) => {
    const { currentSceneId } = get();
    if (!currentSceneId) return [];

    return db.versions
      .where('sceneId')
      .equals(currentSceneId)
      .reverse()
      .sortBy('createdAt')
      .then(versions => versions.slice(0, limit));
  },

  revertToVersion: async (versionId) => {
    const { currentSceneId, saveContent } = get();
    if (!currentSceneId) return;

    // 현재 상태 백업
    await saveContent('before-revert');

    const version = await db.versions.get(versionId);
    if (version) {
      set({
        content: version.content,
        charCount: version.stats.charCount,
        charCountWithSpaces: version.stats.charCountWithSpaces,
        isDirty: true,
      });
    }
  },

  getSaveStatus: () => {
    const { isSaving, isDirty, saveError } = get();
    if (saveError) return 'error';
    if (isSaving) return 'saving';
    if (isDirty) return 'unsaved';
    return 'saved';
  },
}));

// TipTap JSON에서 순수 텍스트 추출 헬퍼
function extractPlainText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (json.type === 'text') return json.text || '';
  if (json.content && Array.isArray(json.content)) {
    return json.content.map(extractPlainText).join('');
  }
  return '';
}
```

**4. World 스토어** (`src/stores/useWorldStore.ts`)

```typescript
import { create } from 'zustand';
import { db } from '@/db';
import { generateId } from '@/lib/id';
import type {
  WorldCard,
  CharacterCard,
  LocationCard,
  ItemCard,
  CardType,
} from '@/types';

interface WorldState {
  characters: Map<string, CharacterCard>;
  locations: Map<string, LocationCard>;
  items: Map<string, ItemCard>;

  // 필터/검색
  searchQuery: string;
  filterType: CardType | 'all';

  // 로딩
  isLoading: boolean;

  // 액션
  loadCards: (projectId: string) => Promise<void>;
  clearCards: () => void;

  createCard: <T extends WorldCard>(card: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCard: (id: string, type: CardType, updates: Partial<WorldCard>) => Promise<void>;
  deleteCard: (id: string, type: CardType) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setFilterType: (type: CardType | 'all') => void;

  // 셀렉터
  getFilteredCards: () => WorldCard[];
  getCharacterById: (id: string) => CharacterCard | undefined;
  getCharactersByRole: (role: CharacterCard['role']) => CharacterCard[];
}

export const useWorldStore = create<WorldState>((set, get) => ({
  characters: new Map(),
  locations: new Map(),
  items: new Map(),
  searchQuery: '',
  filterType: 'all',
  isLoading: false,

  loadCards: async (projectId) => {
    set({ isLoading: true });

    const [characterList, locationList, itemList] = await Promise.all([
      db.characters.where('projectId').equals(projectId).toArray(),
      db.locations.where('projectId').equals(projectId).toArray(),
      db.items.where('projectId').equals(projectId).toArray(),
    ]);

    set({
      characters: new Map(characterList.map(c => [c.id, c])),
      locations: new Map(locationList.map(l => [l.id, l])),
      items: new Map(itemList.map(i => [i.id, i])),
      isLoading: false,
    });
  },

  clearCards: () => {
    set({
      characters: new Map(),
      locations: new Map(),
      items: new Map(),
      searchQuery: '',
      filterType: 'all',
    });
  },

  createCard: async (cardData) => {
    const now = new Date();
    const id = generateId();
    const card = {
      ...cardData,
      id,
      createdAt: now,
      updatedAt: now,
    } as WorldCard;

    switch (card.type) {
      case 'character':
        await db.characters.add(card as CharacterCard);
        set(state => ({
          characters: new Map(state.characters).set(id, card as CharacterCard),
        }));
        break;
      case 'location':
        await db.locations.add(card as LocationCard);
        set(state => ({
          locations: new Map(state.locations).set(id, card as LocationCard),
        }));
        break;
      case 'item':
        await db.items.add(card as ItemCard);
        set(state => ({
          items: new Map(state.items).set(id, card as ItemCard),
        }));
        break;
    }

    return id;
  },

  updateCard: async (id, type, updates) => {
    const now = new Date();
    const updateData = { ...updates, updatedAt: now };

    switch (type) {
      case 'character':
        await db.characters.update(id, updateData);
        set(state => {
          const card = state.characters.get(id);
          if (card) {
            return {
              characters: new Map(state.characters).set(id, { ...card, ...updateData } as CharacterCard),
            };
          }
          return {};
        });
        break;
      case 'location':
        await db.locations.update(id, updateData);
        set(state => {
          const card = state.locations.get(id);
          if (card) {
            return {
              locations: new Map(state.locations).set(id, { ...card, ...updateData } as LocationCard),
            };
          }
          return {};
        });
        break;
      case 'item':
        await db.items.update(id, updateData);
        set(state => {
          const card = state.items.get(id);
          if (card) {
            return {
              items: new Map(state.items).set(id, { ...card, ...updateData } as ItemCard),
            };
          }
          return {};
        });
        break;
    }
  },

  deleteCard: async (id, type) => {
    switch (type) {
      case 'character':
        await db.characters.delete(id);
        set(state => {
          const newCharacters = new Map(state.characters);
          newCharacters.delete(id);
          return { characters: newCharacters };
        });
        break;
      case 'location':
        await db.locations.delete(id);
        set(state => {
          const newLocations = new Map(state.locations);
          newLocations.delete(id);
          return { locations: newLocations };
        });
        break;
      case 'item':
        await db.items.delete(id);
        set(state => {
          const newItems = new Map(state.items);
          newItems.delete(id);
          return { items: newItems };
        });
        break;
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),

  getFilteredCards: () => {
    const { characters, locations, items, searchQuery, filterType } = get();
    const query = searchQuery.toLowerCase();

    let allCards: WorldCard[] = [];

    if (filterType === 'all' || filterType === 'character') {
      allCards = [...allCards, ...Array.from(characters.values())];
    }
    if (filterType === 'all' || filterType === 'location') {
      allCards = [...allCards, ...Array.from(locations.values())];
    }
    if (filterType === 'all' || filterType === 'item') {
      allCards = [...allCards, ...Array.from(items.values())];
    }

    if (query) {
      allCards = allCards.filter(
        card =>
          card.name.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query) ||
          card.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return allCards.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  },

  getCharacterById: (id) => get().characters.get(id),

  getCharactersByRole: (role) => {
    return Array.from(get().characters.values()).filter(c => c.role === role);
  },
}));
```

**5. UI 스토어** (`src/stores/useUIStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModalType, LeftPanelTab, Theme } from '@/types';

interface UIState {
  // 패널 상태
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // 좌측 패널 탭
  leftPanelTab: LeftPanelTab;

  // 테마
  theme: Theme;

  // 모달
  activeModal: ModalType;
  modalProps: Record<string, unknown>;

  // 액션
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setTheme: (theme: Theme) => void;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 기본값 (PRD v2 섹션 5.2 참조)
      leftPanelWidth: 280,
      rightPanelWidth: 280,
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      leftPanelTab: 'structure',
      theme: 'dark',
      activeModal: null,
      modalProps: {},

      setLeftPanelWidth: (width) => {
        // 최소 200px, 최대 400px
        const clampedWidth = Math.min(Math.max(width, 200), 400);
        set({ leftPanelWidth: clampedWidth });
      },

      setRightPanelWidth: (width) => {
        const clampedWidth = Math.min(Math.max(width, 200), 400);
        set({ rightPanelWidth: clampedWidth });
      },

      toggleLeftPanel: () => {
        set(state => ({ leftPanelCollapsed: !state.leftPanelCollapsed }));
      },

      toggleRightPanel: () => {
        set(state => ({ rightPanelCollapsed: !state.rightPanelCollapsed }));
      },

      setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

      setTheme: (theme) => {
        set({ theme });
        // DOM에 클래스 적용
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          root.classList.add(theme);
        }
      },

      openModal: (type, props = {}) => {
        set({ activeModal: type, modalProps: props });
      },

      closeModal: () => {
        set({ activeModal: null, modalProps: {} });
      },
    }),
    {
      name: 'storyforge-ui',
      // 모달 상태는 persist하지 않음
      partialize: (state) => ({
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        leftPanelCollapsed: state.leftPanelCollapsed,
        rightPanelCollapsed: state.rightPanelCollapsed,
        leftPanelTab: state.leftPanelTab,
        theme: state.theme,
      }),
    }
  )
);
```

**6. Auth 스토어** (`src/stores/useAuthStore.ts`)

```typescript
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // 액션 (실제 Supabase 연동은 TASK-20에서)
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // 초기 세션 확인 중
  error: null,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  signOut: () => set({ user: null }),
}));
```

**7. 인덱스 파일** (`src/stores/index.ts`)

```typescript
export { useProjectStore } from './useProjectStore';
export { useDocumentStore } from './useDocumentStore';
export { useEditorStore } from './useEditorStore';
export { useWorldStore } from './useWorldStore';
export { useUIStore } from './useUIStore';
export { useAuthStore } from './useAuthStore';
```

#### 완료 조건

- [ ] 모든 스토어 파일 생성 완료
- [ ] TypeScript 컴파일 오류 없음
- [ ] `import { useProjectStore } from '@/stores'` 형태로 import 가능
- [ ] useUIStore의 persist 기능 동작 (localStorage에 저장)
- [ ] 각 스토어의 기본값이 PRD v2와 일치

#### 테스트 시나리오

```typescript
// App.tsx에서 테스트
import { useProjectStore, useUIStore } from '@/stores';

function App() {
  const theme = useUIStore(state => state.theme);
  const loadProjects = useProjectStore(state => state.loadProjects);

  useEffect(() => {
    loadProjects();
  }, []);

  return <div>Theme: {theme}</div>;
}
```

---

## 이후 Task 요약 (Week 1 이후)

> 지면 관계상 Week 1의 5개 Task만 상세히 기술했습니다.
> 나머지 Task는 동일한 형식으로 필요시 확장합니다.

### Week 2: 핵심 기능 1

| Task ID | 이름 | 의존성 | 주요 내용 |
|---------|------|--------|-----------|
| TASK-06 | AppLayout 구현 | 01,05 | 3열 레이아웃, Header, StatusBar |
| TASK-07 | LeftPanel 구현 | 06 | 탭 전환 (구조/설정) |
| TASK-08 | CenterPanel/Editor 기본 | 06 | TipTap 에디터 초기 설정 |
| TASK-09 | RightPanel 구현 | 06 | Coming Soon 플레이스홀더 |
| TASK-10 | TreeView 기본 구현 | 07 | 트리 렌더링, 클릭 선택 |
| TASK-11 | SettingsTab 구현 | 07 | 진행상황, 인물목록 |
| TASK-12 | 자동 저장 시스템 | 08 | 2초 debounce, 버전 생성 |

### Week 3: 핵심 기능 2

| Task ID | 이름 | 의존성 | 주요 내용 |
|---------|------|--------|-----------|
| TASK-13 | 트리 D&D 구현 | 10 | @dnd-kit 연동, 순서 변경 |
| TASK-14 | 트리 컨텍스트 메뉴 | 10 | 우클릭 메뉴, CRUD 액션 |
| TASK-15 | 세계관 카드 UI | 11 | CardList, CardEditor 모달 |
| TASK-16 | 이미지 업로드 | 15 | 드래그앤드롭, 리사이즈, Base64 |
| TASK-17 | 프로젝트 관리 UI | 06 | 생성 모달, 템플릿 선택 |

### Week 4: 마무리

| Task ID | 이름 | 의존성 | 주요 내용 |
|---------|------|--------|-----------|
| TASK-18 | 버전 히스토리 UI | 12 | 버전 목록 모달, 미리보기, 복원 |
| TASK-19 | 내보내기 기능 | 17 | JSON, ZIP 내보내기 |
| TASK-20 | Supabase 인증 | 05 | 로그인/로그아웃, 세션 관리 |
| TASK-21 | 클라우드 동기화 | 20 | 프로젝트 동기화, 충돌 해결 |
| TASK-22 | 키보드 단축키 | 06,08 | 전역 단축키 바인딩 |
| TASK-23 | QA 및 최적화 | 전체 | 버그 수정, 성능 최적화 |

---

## 부록: Task 실행 가이드

### AI 개발자를 위한 가이드라인

1. **Task 시작 전 확인사항**
   - 의존성 Task가 모두 완료되었는지 확인
   - PRD v2 문서의 해당 섹션을 반드시 참조
   - 기존 코드와의 일관성 유지

2. **코드 작성 원칙**
   - TypeScript strict 모드 준수
   - 모든 export에 JSDoc 주석 포함
   - 에러 핸들링 필수
   - 콘솔 로그는 개발용만 사용

3. **완료 시 검증**
   - 완료 조건 체크리스트 모두 확인
   - 테스트 시나리오 실행
   - TypeScript 컴파일 오류 없음 확인

### 참조 문서

- `docs/Storyforge-PRD-v2.md` - 상세 명세
- `docs/Storyforge-PRD.md` - 원본 기획

---

*문서 끝*
