# Storyforge PRD v2.0 - 개발 명세서

> **문서 버전**: 2.0
> **작성일**: 2026-01-30
> **목적**: 개발자가 처음부터 끝까지 실수 없이 구현할 수 있는 상세 명세

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [데이터 모델](#4-데이터-모델)
5. [화면 설계](#5-화면-설계)
6. [컴포넌트 명세](#6-컴포넌트-명세)
7. [기능 명세](#7-기능-명세)
8. [상태 관리](#8-상태-관리)
9. [API 명세](#9-api-명세)
10. [개발 로드맵](#10-개발-로드맵)

---

## 1. 프로젝트 개요

### 1.1 제품 정의

| 항목 | 내용 |
|------|------|
| 제품명 | **Storyforge** |
| 한줄 설명 | 창작자를 위한 통합 스토리텔링 IDE |
| 핵심 가치 | 구상 → 설정 → 집필을 하나의 화면에서 해결 |
| 타겟 사용자 | 웹소설 작가, 시나리오 작가, 웹툰 스토리 작가 |

### 1.2 핵심 철학

> **"문학 작품을 위한 IDE"**

| IDE 개념 | Storyforge 대응 |
|----------|-----------------|
| 코드 파일 | 소설 회차/씬 |
| 폴더/파일 트리 | 권-화-씬 트리 뷰 |
| 클래스/함수 정의 | 인물/장소/아이템 카드 |
| 코드 에디터 | 원고 에디터 |
| Git 버전 관리 | 버전 히스토리 |
| GitHub Copilot | AI 보조작가 (Phase 2) |

### 1.3 MVP 범위 (Phase 1)

**포함되는 기능:**
- ✅ 트리 뷰 구조 관리 (권-화-씬)
- ✅ TipTap 기반 원고 에디터
- ✅ 자동 저장 (2초 debounce)
- ✅ 세계관 카드 DB (인물/장소/아이템)
- ✅ 좌측 패널 탭 전환
- ✅ 버전 히스토리 (회차별 50개)
- ✅ 내보내기 (JSON, ZIP)
- ✅ 선택적 인증 + 클라우드 동기화

**Phase 2로 연기:**
- ❌ AI 대화창 및 AI 보조 기능
- ❌ 실시간 요약 패널
- ❌ 설정 오류 감지

---

## 2. 기술 스택

### 2.1 확정 기술 스택

| 분류 | 기술 | 버전 | 선택 이유 |
|------|------|------|-----------|
| **프레임워크** | React | 18.x | 생태계, 커뮤니티 |
| **언어** | TypeScript | 5.x | 타입 안정성 |
| **빌드 도구** | Vite | 5.x | 빠른 HMR, ESM 기반 |
| **상태 관리** | Zustand | 4.x | 간결함, 보일러플레이트 최소 |
| **에디터** | TipTap | 2.x | ProseMirror 기반, 한글 안정 |
| **로컬 DB** | Dexie.js | 4.x | IndexedDB 래퍼, Promise 기반 |
| **클라우드** | Supabase | - | PostgreSQL, 인증 통합 |
| **스타일링** | Tailwind CSS | 3.x | 유틸리티 기반, 다크모드 |
| **UI 컴포넌트** | shadcn/ui | - | 커스터마이징 용이 |
| **아이콘** | Lucide React | - | 일관된 아이콘 세트 |
| **드래그앤드롭** | @dnd-kit | 6.x | 접근성, 성능 |
| **날짜** | date-fns | 3.x | 트리쉐이킹 지원 |
| **압축** | JSZip | 3.x | ZIP 내보내기용 |

### 2.2 개발 환경

```bash
Node.js: 20.x LTS
패키지 매니저: pnpm
코드 포맷: Prettier + ESLint
Git 훅: Husky + lint-staged
```

### 2.3 브라우저 지원

| 브라우저 | 최소 버전 |
|----------|-----------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

**최소 해상도**: 1280 x 720px

---

## 3. 프로젝트 구조

```
storyforge/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── app/                      # 앱 진입점
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx
│   │
│   ├── components/               # UI 컴포넌트
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/               # 레이아웃 컴포넌트
│   │   │   ├── AppLayout.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── CenterPanel.tsx
│   │   │   ├── RightPanel.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ResizeHandle.tsx
│   │   │
│   │   ├── tree/                 # 트리 뷰 컴포넌트
│   │   │   ├── TreeView.tsx
│   │   │   ├── TreeNode.tsx
│   │   │   ├── TreeContextMenu.tsx
│   │   │   └── TreeDragOverlay.tsx
│   │   │
│   │   ├── editor/               # 에디터 컴포넌트
│   │   │   ├── Editor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── EditorStatusBar.tsx
│   │   │   └── extensions/
│   │   │       ├── CharacterCount.ts
│   │   │       └── AutoSave.ts
│   │   │
│   │   ├── worldbuilding/        # 세계관 컴포넌트
│   │   │   ├── CardList.tsx
│   │   │   ├── CardDetail.tsx
│   │   │   ├── CardEditor.tsx
│   │   │   ├── CharacterCard.tsx
│   │   │   ├── LocationCard.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   └── ImageUploader.tsx
│   │   │
│   │   ├── settings/             # 설정 탭 컴포넌트
│   │   │   ├── SettingsTab.tsx
│   │   │   ├── ProgressSection.tsx
│   │   │   ├── CharacterListSection.tsx
│   │   │   └── SummarySection.tsx
│   │   │
│   │   ├── project/              # 프로젝트 관련
│   │   │   ├── ProjectSelector.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── ProjectSettings.tsx
│   │   │   └── ExportDialog.tsx
│   │   │
│   │   └── common/               # 공통 컴포넌트
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── SearchInput.tsx
│   │
│   ├── features/                 # 기능별 비즈니스 로직
│   │   ├── project/
│   │   │   ├── projectService.ts
│   │   │   └── templateService.ts
│   │   │
│   │   ├── document/
│   │   │   ├── documentService.ts
│   │   │   └── versionService.ts
│   │   │
│   │   ├── worldbuilding/
│   │   │   └── cardService.ts
│   │   │
│   │   ├── export/
│   │   │   ├── exportService.ts
│   │   │   ├── jsonExporter.ts
│   │   │   └── zipExporter.ts
│   │   │
│   │   └── sync/
│   │       ├── syncService.ts
│   │       └── conflictResolver.ts
│   │
│   ├── stores/                   # Zustand 스토어
│   │   ├── useProjectStore.ts
│   │   ├── useDocumentStore.ts
│   │   ├── useEditorStore.ts
│   │   ├── useWorldStore.ts
│   │   ├── useUIStore.ts
│   │   └── useAuthStore.ts
│   │
│   ├── db/                       # 데이터베이스
│   │   ├── index.ts              # Dexie 인스턴스
│   │   ├── schema.ts             # 스키마 정의
│   │   └── migrations.ts         # 마이그레이션
│   │
│   ├── lib/                      # 유틸리티
│   │   ├── supabase.ts           # Supabase 클라이언트
│   │   ├── utils.ts              # 공통 유틸
│   │   ├── cn.ts                 # className 유틸
│   │   ├── charCount.ts          # 글자수 계산
│   │   └── shortcuts.ts          # 단축키 정의
│   │
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useAutoSave.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useResizePanel.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useDebounce.ts
│   │
│   ├── types/                    # TypeScript 타입
│   │   ├── project.ts
│   │   ├── document.ts
│   │   ├── worldbuilding.ts
│   │   └── common.ts
│   │
│   └── styles/                   # 전역 스타일
│       ├── globals.css
│       └── editor.css
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 4. 데이터 모델

### 4.1 핵심 엔티티 관계도

```
Project (1) ─────────────── (N) Volume
                                  │
                                  │ (1:N)
                                  ▼
                              Chapter
                                  │
                                  │ (1:N)
                                  ▼
                               Scene
                                  │
                                  │ (1:N)
                                  ▼
                         DocumentVersion

Project (1) ─────────────── (N) WorldCard
                                  │
                                  ├─── CharacterCard
                                  ├─── LocationCard
                                  └─── ItemCard
```

### 4.2 TypeScript 타입 정의

```typescript
// types/project.ts

/**
 * 프로젝트 (작품)
 */
export interface Project {
  id: string;                    // UUID v4
  title: string;                 // 작품 제목
  description: string;           // 작품 설명
  template: ProjectTemplate;     // 템플릿 타입

  // 트리 구조 명칭 커스터마이징
  terminology: {
    volume: string;              // 기본값: "권" (예: "부", "시즌")
    chapter: string;             // 기본값: "화" (예: "장", "에피소드")
    scene: string;               // 기본값: "씬" (예: "장면", "시퀀스")
  };

  // 메타데이터
  genre: string[];               // 장르 태그
  targetPlatform?: string;       // 목표 플랫폼 (문피아, 카카오페이지 등)
  targetLength?: number;         // 목표 글자수/화

  // 통계
  stats: {
    totalCharCount: number;      // 전체 글자수 (공백 제외)
    totalCharCountWithSpaces: number; // 전체 글자수 (공백 포함)
    volumeCount: number;         // 권 수
    chapterCount: number;        // 화 수
    sceneCount: number;          // 씬 수
  };

  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt: Date;

  // 동기화
  syncEnabled: boolean;          // 클라우드 동기화 활성화
  lastSyncedAt?: Date;
  userId?: string;               // Supabase user ID (로그인시)
}

export type ProjectTemplate =
  | 'web-novel'      // 웹소설 (권-화 구조, 5000자/화)
  | 'novel'          // 장편소설 (부-장 구조)
  | 'short-story'    // 단편소설 (씬 위주)
  | 'screenplay';    // 시나리오 (씬-비트 구조)

/**
 * 권 (Volume) - 1단계
 */
export interface Volume {
  id: string;
  projectId: string;
  title: string;                 // 예: "1권", "프롤로그"
  order: number;                 // 정렬 순서 (0부터)
  status: DocumentStatus;

  // 통계
  stats: {
    charCount: number;
    charCountWithSpaces: number;
    chapterCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 화 (Chapter) - 2단계
 */
export interface Chapter {
  id: string;
  volumeId: string;
  projectId: string;             // 역참조용
  title: string;                 // 예: "1화 - 시작"
  order: number;
  status: DocumentStatus;

  // 통계
  stats: {
    charCount: number;
    charCountWithSpaces: number;
    sceneCount: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 씬 (Scene) - 3단계, 실제 내용 포함
 */
export interface Scene {
  id: string;
  chapterId: string;
  volumeId: string;              // 역참조용
  projectId: string;             // 역참조용
  title: string;                 // 예: "씬 1", "카페 장면"
  order: number;
  status: DocumentStatus;

  // 내용
  content: string;               // TipTap JSON string
  plainText: string;             // 순수 텍스트 (검색용)

  // 통계
  stats: {
    charCount: number;           // 공백 제외
    charCountWithSpaces: number; // 공백 포함
  };

  // 메모
  note?: string;                 // 작가 메모

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 문서 상태
 */
export type DocumentStatus =
  | 'draft'        // 구상 중 (○)
  | 'writing'      // 집필 중 (✍)
  | 'complete'     // 탈고 (✔)
  | 'published';   // 업로드 완료 (↑)

/**
 * 버전 히스토리
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
  reason?: string;               // 저장 사유 (자동저장, 수동저장 등)
}
```

```typescript
// types/worldbuilding.ts

/**
 * 세계관 카드 기본 타입
 */
export interface WorldCardBase {
  id: string;
  projectId: string;
  type: CardType;
  name: string;                  // 이름
  description: string;           // 설명
  imageUrl?: string;             // 이미지 (Base64 또는 URL)
  tags: string[];                // 태그

  createdAt: Date;
  updatedAt: Date;
}

export type CardType = 'character' | 'location' | 'item';

/**
 * 인물 카드
 */
export interface CharacterCard extends WorldCardBase {
  type: 'character';

  // 기본 정보
  basicInfo: {
    age?: string;                // 나이 (문자열: "20대 초반" 가능)
    gender?: string;
    occupation?: string;         // 직업/역할
    nickname?: string[];         // 별명
  };

  // 외모
  appearance: {
    height?: string;
    bodyType?: string;
    hairColor?: string;
    eyeColor?: string;
    distinguishingFeatures?: string; // 특징
  };

  // 성격 및 배경
  personality: string;           // 성격 설명
  background: string;            // 배경 스토리
  motivation: string;            // 동기/목표

  // 능력 (판타지/무협용)
  abilities?: {
    name: string;
    description: string;
    level?: string;
  }[];

  // 관계
  relationships: {
    targetId: string;            // 다른 캐릭터 ID
    targetName: string;          // 캐릭터 이름 (역참조용)
    relationType: string;        // 관계 유형 (친구, 적, 연인 등)
    description?: string;
  }[];

  // 성장/변화 (스포일러)
  arc?: {
    phase: string;               // 시점 (1권, 중반부 등)
    change: string;              // 변화 내용
  }[];

  // 메타
  role: CharacterRole;
  firstAppearance?: string;      // 첫 등장 (예: "1권 3화")
}

export type CharacterRole =
  | 'protagonist'    // 주인공
  | 'antagonist'     // 악역
  | 'supporting'     // 조연
  | 'minor';         // 단역

/**
 * 장소 카드
 */
export interface LocationCard extends WorldCardBase {
  type: 'location';

  locationType: string;          // 유형 (도시, 던전, 학교 등)
  region?: string;               // 지역/국가

  features: string;              // 특징
  atmosphere: string;            // 분위기
  significance: string;          // 스토리상 의미

  relatedCharacters?: string[];  // 관련 인물 ID
  relatedEvents?: string;        // 관련 사건
}

/**
 * 아이템 카드
 */
export interface ItemCard extends WorldCardBase {
  type: 'item';

  itemType: string;              // 유형 (무기, 방어구, 소비품 등)
  rarity?: string;               // 희귀도

  properties: string;            // 특성/능력
  origin: string;                // 출처/역사
  currentOwner?: string;         // 현재 소유자 ID

  significance: string;          // 스토리상 의미
}

export type WorldCard = CharacterCard | LocationCard | ItemCard;
```

### 4.3 IndexedDB 스키마 (Dexie)

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';
import type {
  Project, Volume, Chapter, Scene, DocumentVersion,
  CharacterCard, LocationCard, ItemCard
} from '@/types';

export class StoryforgeDB extends Dexie {
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

    this.version(1).stores({
      // 프로젝트
      projects: 'id, title, updatedAt, lastOpenedAt, userId',

      // 구조 (트리)
      volumes: 'id, projectId, order, [projectId+order]',
      chapters: 'id, volumeId, projectId, order, [volumeId+order]',
      scenes: 'id, chapterId, volumeId, projectId, order, [chapterId+order]',

      // 버전
      versions: 'id, sceneId, createdAt, [sceneId+createdAt]',

      // 세계관
      characters: 'id, projectId, name, role, *tags',
      locations: 'id, projectId, name, locationType, *tags',
      items: 'id, projectId, name, itemType, *tags'
    });
  }
}

export const db = new StoryforgeDB();
```

### 4.4 Supabase 스키마 (클라우드 동기화용)

```sql
-- 사용자 프로젝트 (동기화 활성화된 것만)
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,  -- 전체 프로젝트 데이터
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, id)
);

-- RLS 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- 동기화 충돌 로그
CREATE TABLE sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  local_data JSONB,
  remote_data JSONB,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,  -- 'local' | 'remote' | 'merged'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 화면 설계

### 5.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [로고] Storyforge          [프로젝트명 ▼]        [👤 로그인] [⚙️]     │  <- Header (48px)
├─────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌────────────────────────────────┐ ┌─────────────────┐ │
│ │ [구조][설정]  │ │                                │ │                 │ │
│ ├──────────────┤ │                                │ │   AI 보조작가   │ │
│ │              │ │                                │ │                 │ │
│ │  좌측 패널   │ │        에디터 영역              │ │   (Coming      │ │
│ │              │ │                                │ │    Soon)       │ │
│ │  (280px      │ │                                │ │                 │ │
│ │   기본)      │ │                                │ │   (280px       │ │
│ │              │ │                                │ │    기본)       │ │
│ │              │ │                                │ │                 │ │
│ └──────────────┘ └────────────────────────────────┘ └─────────────────┘ │
│    Resizable          Flexible (min 600px)            Resizable        │
└─────────────────────────────────────────────────────────────────────────┘

Footer/StatusBar: 글자수 | 저장 상태 | 온라인 상태 (24px)
```

### 5.2 패널 크기 규격

| 패널 | 기본 너비 | 최소 너비 | 최대 너비 |
|------|-----------|-----------|-----------|
| 좌측 패널 | 280px | 200px | 400px |
| 에디터 (중앙) | 유동적 | 600px | 제한 없음 |
| 우측 패널 | 280px | 200px | 400px |

**패널 토글**: 좌/우 패널은 완전히 숨길 수 있음 (단축키 지원)

### 5.3 좌측 패널 - 구조 탭

```
┌────────────────────────────┐
│ [구조] [설정]              │  <- 탭 헤더
├────────────────────────────┤
│ 🔍 검색...                 │  <- 검색 입력
├────────────────────────────┤
│ ▼ 📁 1권                   │  <- Volume (펼침)
│   ├─ 📄 1화 - 시작   ✔    │  <- Chapter + 상태
│   │  ├─ 씬 1              │  <- Scene
│   │  └─ 씬 2              │
│   ├─ 📄 2화 - 만남   ✍    │
│   └─ 📄 3화 - 갈등   ○    │
│ ▶ 📁 2권                   │  <- Volume (접힘)
│ ▶ 📁 3권                   │
├────────────────────────────┤
│ [+ 새 권 추가]             │  <- 추가 버튼
└────────────────────────────┘

상태 아이콘:
○ draft (구상중)
✍ writing (집필중)
✔ complete (탈고)
↑ published (업로드완료)
```

### 5.4 좌측 패널 - 설정 탭

```
┌────────────────────────────┐
│ [구조] [설정]              │
├────────────────────────────┤
│ ▼ 진행 상황                │
│   현재: 1권 3화            │
│   글자수: 15,234자         │
│   진행률: ████░░ 35%       │
├────────────────────────────┤
│ ▼ 등장인물 (5)             │
│   [+] 새 인물              │
│   ┌─────┐ 홍길동 (주인공)  │
│   │ 🖼️  │ 20대, 검사       │
│   └─────┘                  │
│   ┌─────┐ 김영희 (조연)    │
│   │ 🖼️  │ 20대, 마법사     │
│   └─────┘                  │
├────────────────────────────┤
│ ▼ 빠른 접근                │
│   [📝 줄거리]              │  <- 모달 열기
│   [🔗 관계도]              │
│   [💡 복선관리]            │
│   [🌍 세계관]              │
└────────────────────────────┘
```

### 5.5 에디터 영역

```
┌──────────────────────────────────────────────────────────────┐
│  📄 1권 > 1화 - 시작 > 씬 1                    [≡] [🔍] [⛶] │  <- 브레드크럼 + 툴바
├──────────────────────────────────────────────────────────────┤
│  [B] [I] [U] [H1] [H2] [H3] [━] ["] [•] [1.] [↩]            │  <- 포맷 툴바
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  "그래, 네가 옳아."                                          │
│                                                              │
│  남자가 고개를 끄덕였다. 창밖으로 비가 내리고 있었다.         │
│  빗소리가 유리창을 두드리는 소리만이 고요한 방 안을           │
│  채우고 있었다.                                              │
│                                                              │
│  |  <- 커서                                                  │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  1,234자 (공백 제외) | 1,456자 (공백 포함) | 자동 저장됨 ✓   │  <- 상태바
└──────────────────────────────────────────────────────────────┘
```

### 5.6 우측 패널 - Coming Soon (MVP)

```
┌────────────────────────────┐
│      🤖 AI 보조작가        │
├────────────────────────────┤
│                            │
│     ┌──────────────┐       │
│     │   🚀         │       │
│     │              │       │
│     │  Coming      │       │
│     │  Soon        │       │
│     │              │       │
│     └──────────────┘       │
│                            │
│   AI 보조작가 기능이       │
│   곧 추가됩니다.           │
│                            │
│   • 줄거리 생성            │
│   • 인물 설정 도우미       │
│   • 실시간 제안            │
│                            │
│   [알림 받기]              │
│                            │
└────────────────────────────┘
```

### 5.7 컬러 시스템 (다크 모드 기본)

```css
:root {
  /* 다크 모드 (기본) */
  --background: 222.2 84% 4.9%;       /* 메인 배경 */
  --foreground: 210 40% 98%;          /* 메인 텍스트 */

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

  /* 상태 색상 */
  --status-draft: 217.2 32.6% 50%;      /* 회색 */
  --status-writing: 47.9 95.8% 53.1%;    /* 노란색 */
  --status-complete: 142.1 76.2% 36.3%;  /* 초록색 */
  --status-published: 199.4 95.5% 47.9%; /* 파란색 */
}

.light {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... 라이트 모드 색상 */
}
```

---

## 6. 컴포넌트 명세

### 6.1 Layout 컴포넌트

#### AppLayout

```typescript
// components/layout/AppLayout.tsx

interface AppLayoutProps {
  children?: React.ReactNode;
}

/**
 * 앱의 최상위 레이아웃
 *
 * 구조:
 * - Header (고정 48px)
 * - Main (3열 레이아웃)
 *   - LeftPanel (리사이즈 가능)
 *   - CenterPanel (유동)
 *   - RightPanel (리사이즈 가능)
 * - StatusBar (고정 24px)
 *
 * 책임:
 * - 패널 너비 상태 관리
 * - 리사이즈 핸들 연동
 * - 패널 토글 처리
 */
```

#### LeftPanel

```typescript
// components/layout/LeftPanel.tsx

interface LeftPanelProps {
  width: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * 좌측 패널 - 탭 기반 네비게이션
 *
 * 탭:
 * - 구조 탭 (TreeView)
 * - 설정 탭 (SettingsTab)
 *
 * 기능:
 * - 탭 전환 상태 유지
 * - 접기/펼치기 애니메이션
 */
```

### 6.2 Tree 컴포넌트

#### TreeView

```typescript
// components/tree/TreeView.tsx

interface TreeViewProps {
  projectId: string;
}

/**
 * 트리 뷰 컴포넌트
 *
 * 기능:
 * 1. 3단계 계층 렌더링 (Volume > Chapter > Scene)
 * 2. 드래그 앤 드롭 (같은 레벨 내 순서 변경)
 * 3. 컨텍스트 메뉴 (우클릭)
 * 4. 더블클릭으로 에디터 열기
 * 5. 키보드 네비게이션 (↑↓ 이동, Enter 열기)
 *
 * 상태:
 * - expandedIds: Set<string> - 펼쳐진 노드들
 * - selectedId: string | null - 선택된 노드
 * - dragState: DragState - 드래그 상태
 *
 * 이벤트:
 * - onSelect(id, type) - 노드 선택시
 * - onOpen(id, type) - 노드 열기시 (더블클릭/Enter)
 * - onReorder(items, type) - 순서 변경시
 */

interface TreeNode {
  id: string;
  title: string;
  type: 'volume' | 'chapter' | 'scene';
  status: DocumentStatus;
  children?: TreeNode[];
  parentId?: string;
}
```

#### TreeContextMenu

```typescript
// components/tree/TreeContextMenu.tsx

/**
 * 트리 노드 우클릭 메뉴
 *
 * Volume 메뉴:
 * - 새 화 추가
 * - 이름 변경
 * - 삭제
 * - 상태 변경 →
 *
 * Chapter 메뉴:
 * - 새 씬 추가
 * - 이름 변경
 * - 복제
 * - 삭제
 * - 상태 변경 →
 *
 * Scene 메뉴:
 * - 이름 변경
 * - 복제
 * - 삭제
 * - 상태 변경 →
 * - 버전 히스토리
 */
```

### 6.3 Editor 컴포넌트

#### Editor

```typescript
// components/editor/Editor.tsx

interface EditorProps {
  sceneId: string;
}

/**
 * TipTap 기반 원고 에디터
 *
 * 확장(Extensions):
 * - StarterKit (기본)
 * - Placeholder
 * - CharacterCount
 * - History
 * - Typography (따옴표 자동 변환)
 *
 * 기능:
 * 1. 자동 저장 (2초 debounce)
 * 2. 실시간 글자수 카운팅
 * 3. 포맷팅 툴바
 * 4. 집중 모드 (F11 또는 Ctrl+Shift+F)
 *
 * 주의사항:
 * - content는 TipTap JSON 형식으로 저장
 * - plainText는 별도로 추출하여 저장 (검색용)
 * - 한글 조합 중에는 저장하지 않음 (compositionend 대기)
 */

// TipTap 설정
const extensions = [
  StarterKit.configure({
    history: {
      depth: 100,
    },
  }),
  Placeholder.configure({
    placeholder: '이야기를 시작하세요...',
  }),
  CharacterCount,
  Typography.configure({
    // 한국어 따옴표 설정
    openDoubleQuote: '"',
    closeDoubleQuote: '"',
    openSingleQuote: ''',
    closeSingleQuote: ''',
  }),
];
```

#### EditorStatusBar

```typescript
// components/editor/EditorStatusBar.tsx

interface EditorStatusBarProps {
  charCount: number;              // 공백 제외
  charCountWithSpaces: number;    // 공백 포함
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt?: Date;
}

/**
 * 에디터 하단 상태바
 *
 * 표시 정보:
 * - 글자수 (공백 제외/포함 둘 다)
 * - 저장 상태 아이콘 + 텍스트
 * - 마지막 저장 시간 (hover시 상세)
 *
 * 예시:
 * "1,234자 (공백 제외) | 1,456자 (공백 포함) | ✓ 자동 저장됨"
 */
```

### 6.4 Worldbuilding 컴포넌트

#### CardEditor

```typescript
// components/worldbuilding/CardEditor.tsx

interface CardEditorProps {
  cardId?: string;                 // 편집시
  type: CardType;                  // 신규 생성시 타입
  onSave: (card: WorldCard) => void;
  onCancel: () => void;
}

/**
 * 세계관 카드 편집기 (모달)
 *
 * 공통 필드:
 * - 이름 (필수)
 * - 이미지 업로드
 * - 설명
 * - 태그
 *
 * 타입별 필드:
 * - character: 기본정보, 외모, 성격, 관계 등
 * - location: 유형, 특징, 분위기 등
 * - item: 유형, 희귀도, 능력 등
 *
 * 이미지 처리:
 * - 최대 2MB
 * - 리사이즈: 400x400px (썸네일용)
 * - Base64로 IndexedDB 저장
 */
```

#### ImageUploader

```typescript
// components/worldbuilding/ImageUploader.tsx

interface ImageUploaderProps {
  value?: string;                  // Base64 또는 URL
  onChange: (value: string) => void;
  maxSize?: number;                // bytes, 기본 2MB
}

/**
 * 이미지 업로더
 *
 * 기능:
 * 1. 드래그 앤 드롭
 * 2. 클릭하여 파일 선택
 * 3. 붙여넣기 (Ctrl+V)
 * 4. 미리보기
 * 5. 삭제
 *
 * 처리:
 * - 2MB 초과시 경고
 * - 자동 리사이즈 (canvas)
 * - EXIF 회전 보정
 */
```

---

## 7. 기능 명세

### 7.1 프로젝트 관리

#### 새 프로젝트 생성

```typescript
/**
 * 새 프로젝트 생성 플로우
 *
 * 1. 템플릿 선택 다이얼로그 표시
 * 2. 템플릿 선택 (웹소설/장편/단편/시나리오)
 * 3. 프로젝트 이름 입력
 * 4. 초기 구조 자동 생성
 * 5. 프로젝트 저장 및 열기
 */

// 템플릿별 초기 구조
const templates: Record<ProjectTemplate, TemplateConfig> = {
  'web-novel': {
    name: '웹소설',
    description: '연재용 웹소설 (권-화-씬 구조)',
    terminology: { volume: '권', chapter: '화', scene: '씬' },
    targetLength: 5000,
    initialStructure: {
      volumes: [
        {
          title: '1권',
          chapters: [
            { title: '1화', scenes: [{ title: '씬 1' }] }
          ]
        }
      ]
    }
  },
  'novel': {
    name: '장편소설',
    description: '출판용 장편소설 (부-장-절 구조)',
    terminology: { volume: '부', chapter: '장', scene: '절' },
    targetLength: 10000,
    initialStructure: {
      volumes: [
        {
          title: '제1부',
          chapters: [
            { title: '제1장', scenes: [{ title: '1' }] }
          ]
        }
      ]
    }
  },
  'short-story': {
    name: '단편소설',
    description: '공모전/단편용 (씬 위주)',
    terminology: { volume: '파트', chapter: '섹션', scene: '씬' },
    targetLength: 15000,
    initialStructure: {
      volumes: [
        {
          title: '본문',
          chapters: [
            { title: '도입', scenes: [{ title: '씬 1' }] }
          ]
        }
      ]
    }
  },
  'screenplay': {
    name: '시나리오',
    description: '영상/드라마 시나리오 (에피소드-씬-비트)',
    terminology: { volume: '에피소드', chapter: '씬', scene: '비트' },
    targetLength: 0,
    initialStructure: {
      volumes: [
        {
          title: 'EP01',
          chapters: [
            { title: 'S#1', scenes: [{ title: '비트 1' }] }
          ]
        }
      ]
    }
  }
};
```

#### 프로젝트 열기/전환

```typescript
/**
 * 프로젝트 전환 플로우
 *
 * 1. 현재 작업 자동 저장
 * 2. 프로젝트 목록 다이얼로그 표시
 *    - 최근 열어본 순 정렬
 *    - 검색 기능
 *    - 삭제 옵션
 * 3. 선택한 프로젝트 로드
 * 4. 마지막 편집 위치로 이동
 */
```

### 7.2 자동 저장 시스템

```typescript
// features/document/documentService.ts

/**
 * 자동 저장 시스템
 *
 * 트리거:
 * 1. 에디터 변경 후 2초 debounce
 * 2. 탭/창 전환시 (visibilitychange)
 * 3. 앱 종료 전 (beforeunload)
 * 4. 다른 씬으로 이동시
 *
 * 저장 내용:
 * - scene.content (TipTap JSON)
 * - scene.plainText (순수 텍스트)
 * - scene.stats (글자수)
 * - scene.updatedAt
 *
 * 버전 히스토리:
 * - 저장시마다 DocumentVersion 생성
 * - 씬당 최대 50개 유지
 * - 50개 초과시 가장 오래된 것 삭제
 *
 * 한글 입력 처리:
 * - compositionstart → 저장 비활성화
 * - compositionend → 저장 활성화
 */

interface AutoSaveConfig {
  debounceMs: 2000;
  maxVersions: 50;
  enabledEvents: ['input', 'visibilitychange', 'beforeunload'];
}
```

### 7.3 글자수 카운팅

```typescript
// lib/charCount.ts

/**
 * 글자수 카운팅 유틸리티
 *
 * 규칙:
 * 1. 공백 제외: 모든 공백 문자 제거 후 카운트
 * 2. 공백 포함: 줄바꿈 포함 전체 카운트
 *
 * 공백 문자 정의:
 * - 스페이스 (0x20)
 * - 탭 (0x09)
 * - 줄바꿈 (0x0A, 0x0D)
 * - 기타 유니코드 공백
 */

export function countCharacters(text: string): CharCountResult {
  // 공백 제외 카운트
  const withoutSpaces = text.replace(/\s/g, '').length;

  // 공백 포함 카운트
  const withSpaces = text.length;

  return {
    withoutSpaces,
    withSpaces,
  };
}

interface CharCountResult {
  withoutSpaces: number;
  withSpaces: number;
}
```

### 7.4 드래그 앤 드롭

```typescript
// components/tree/TreeView.tsx (드래그 로직)

/**
 * 드래그 앤 드롭 규칙
 *
 * 허용:
 * - Volume 간 순서 변경
 * - 같은 Volume 내 Chapter 순서 변경
 * - 같은 Chapter 내 Scene 순서 변경
 *
 * 불가:
 * - Volume을 Chapter/Scene 안으로
 * - Chapter를 다른 Volume으로 이동
 * - Scene을 다른 Chapter로 이동
 * - 서로 다른 레벨 간 이동
 *
 * 시각적 피드백:
 * - 드래그 중: 원본 노드 반투명
 * - 드롭 가능 위치: 파란색 라인 표시
 * - 드롭 불가 위치: 빨간색 표시
 */

type DragConstraint = {
  allowedTargets: 'same-level-only';
  visualFeedback: {
    dragging: 'opacity-50';
    validDrop: 'border-primary';
    invalidDrop: 'border-destructive';
  };
};
```

### 7.5 버전 히스토리

```typescript
// features/document/versionService.ts

/**
 * 버전 히스토리 기능
 *
 * 버전 생성:
 * - 자동 저장시마다 생성
 * - reason 필드로 구분: 'auto-save', 'manual-save', 'before-revert'
 *
 * 버전 관리:
 * - 씬당 최대 50개 유지
 * - 오래된 순 자동 삭제
 * - 수동 삭제 불가 (데이터 보호)
 *
 * 버전 복원:
 * 1. 복원 전 현재 상태 백업 (before-revert)
 * 2. 선택한 버전으로 content 교체
 * 3. 에디터 갱신
 *
 * UI:
 * - 버전 목록 (다이얼로그)
 * - 각 버전: 시간, 글자수, 변경사항 요약
 * - 미리보기 (읽기 전용)
 * - 복원 버튼
 */

interface VersionListItem {
  id: string;
  createdAt: Date;
  charCount: number;
  charCountDiff: number;         // 이전 버전 대비 변화
  reason: 'auto-save' | 'manual-save' | 'before-revert';
}
```

### 7.6 내보내기

```typescript
// features/export/exportService.ts

/**
 * 내보내기 기능
 *
 * 1. JSON 내보내기
 *    - 전체 프로젝트 데이터
 *    - 포맷: 들여쓰기 포함 readable JSON
 *    - 파일명: {프로젝트명}_{날짜}.json
 *
 * 2. ZIP 내보내기
 *    - 폴더 구조:
 *      project.json           (메타데이터)
 *      volumes/
 *        1권/
 *          metadata.json
 *          1화/
 *            metadata.json
 *            씬1.txt
 *            씬2.txt
 *      worldbuilding/
 *        characters.json
 *        locations.json
 *        items.json
 *        images/
 *          {id}.png
 *
 * 3. 스마트 복사 (Plain)
 *    - 선택한 범위의 순수 텍스트
 *    - 모든 서식 제거
 *
 * 4. 스마트 복사 (Structure)
 *    - HWP 호환 형식
 *    - 씬 구분: "* * *"
 *    - 대사: 앞에 줄바꿈 추가
 */
```

### 7.7 키보드 단축키

```typescript
// lib/shortcuts.ts

/**
 * MVP 키보드 단축키
 */
export const shortcuts = {
  // 파일 조작
  save: 'Ctrl+S',               // 수동 저장

  // 편집
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Shift+Z',

  // 서식
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  underline: 'Ctrl+U',

  // 패널
  toggleLeftPanel: 'Ctrl+\\',
  toggleRightPanel: 'Ctrl+Shift+\\',

  // 모드
  focusMode: 'F11',             // 또는 Ctrl+Shift+F

  // 검색
  search: 'Ctrl+F',             // 에디터 내 검색
  searchProject: 'Ctrl+Shift+F', // 프로젝트 전체 검색
} as const;
```

### 7.8 인증 및 동기화

```typescript
// features/sync/syncService.ts

/**
 * 선택적 인증 시스템
 *
 * 비로그인 모드:
 * - 모든 데이터 로컬 저장
 * - 프로젝트 파일 내보내기/가져오기로 백업
 * - 다른 기기 이용 불가
 *
 * 로그인 모드:
 * - Supabase Auth (이메일/Google/GitHub)
 * - 프로젝트별 동기화 ON/OFF 선택
 * - 동기화 활성화시 실시간 클라우드 백업
 *
 * 충돌 해결:
 * - 동시 수정 감지시 다이얼로그 표시
 * - 옵션: 로컬 유지 / 서버 유지 / 병합 시도
 * - 병합 실패시 둘 다 보존 (별도 버전)
 */

interface SyncStatus {
  enabled: boolean;
  lastSyncedAt?: Date;
  pendingChanges: number;
  status: 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
}
```

---

## 8. 상태 관리

### 8.1 Zustand 스토어 구조

```typescript
// stores/useProjectStore.ts

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

  // 셀렉터
  getCurrentProject: () => Project | null;
  getRecentProjects: (limit?: number) => Project[];
}
```

```typescript
// stores/useDocumentStore.ts

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

  // 액션
  loadDocuments: (projectId: string) => Promise<void>;

  // Volume
  createVolume: (title: string) => Promise<string>;
  updateVolume: (id: string, updates: Partial<Volume>) => Promise<void>;
  deleteVolume: (id: string) => Promise<void>;
  reorderVolumes: (orderedIds: string[]) => Promise<void>;

  // Chapter
  createChapter: (volumeId: string, title: string) => Promise<string>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (volumeId: string, orderedIds: string[]) => Promise<void>;

  // Scene
  createScene: (chapterId: string, title: string) => Promise<string>;
  updateScene: (id: string, updates: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  reorderScenes: (chapterId: string, orderedIds: string[]) => Promise<void>;

  // 트리 조작
  toggleExpand: (id: string) => void;
  select: (id: string, type: 'volume' | 'chapter' | 'scene') => void;

  // 셀렉터
  getTreeData: () => TreeNode[];
  getScene: (id: string) => Scene | undefined;
}
```

```typescript
// stores/useEditorStore.ts

interface EditorState {
  // 현재 편집 중인 씬
  currentSceneId: string | null;
  content: string;                // TipTap JSON

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

  // 액션
  openScene: (sceneId: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveContent: () => Promise<void>;
  toggleFocusMode: () => void;

  // 버전
  getVersions: () => Promise<VersionListItem[]>;
  revertToVersion: (versionId: string) => Promise<void>;
}
```

```typescript
// stores/useWorldStore.ts

interface WorldState {
  characters: Map<string, CharacterCard>;
  locations: Map<string, LocationCard>;
  items: Map<string, ItemCard>;

  // 필터/검색
  searchQuery: string;
  filterType: CardType | 'all';

  // 액션
  loadCards: (projectId: string) => Promise<void>;

  createCard: (card: Omit<WorldCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCard: (id: string, updates: Partial<WorldCard>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  // 관계
  addRelationship: (characterId: string, relationship: Relationship) => Promise<void>;
  removeRelationship: (characterId: string, targetId: string) => Promise<void>;

  // 셀렉터
  getFilteredCards: () => WorldCard[];
  getCharacterById: (id: string) => CharacterCard | undefined;
}
```

```typescript
// stores/useUIStore.ts

interface UIState {
  // 패널 상태
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // 좌측 패널 탭
  leftPanelTab: 'structure' | 'settings';

  // 테마
  theme: 'dark' | 'light' | 'system';

  // 모달
  activeModal: ModalType | null;
  modalProps: Record<string, unknown>;

  // 액션
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: 'structure' | 'settings') => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  openModal: (type: ModalType, props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

type ModalType =
  | 'new-project'
  | 'project-list'
  | 'project-settings'
  | 'export'
  | 'card-editor'
  | 'version-history'
  | 'confirm-delete';
```

```typescript
// stores/useAuthStore.ts

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  signIn: (provider: 'email' | 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}
```

### 8.2 스토어 사용 예시

```typescript
// 컴포넌트에서 사용
import { useProjectStore } from '@/stores/useProjectStore';
import { useDocumentStore } from '@/stores/useDocumentStore';

function TreeView() {
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const treeData = useDocumentStore(state => state.getTreeData());
  const select = useDocumentStore(state => state.select);

  // ...
}
```

---

## 9. API 명세

### 9.1 Supabase API (클라우드 동기화)

```typescript
// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// 인증
supabase.auth.signInWithOAuth({ provider: 'google' });
supabase.auth.signOut();
supabase.auth.getUser();

// 프로젝트 CRUD
supabase.from('projects').select('*').eq('user_id', userId);
supabase.from('projects').insert({ id, user_id, data, updated_at });
supabase.from('projects').update({ data, updated_at }).eq('id', projectId);
supabase.from('projects').delete().eq('id', projectId);
```

### 9.2 내부 서비스 API

```typescript
// features/project/projectService.ts

export const projectService = {
  // 프로젝트 CRUD
  async getAll(): Promise<Project[]>,
  async getById(id: string): Promise<Project | null>,
  async create(template: ProjectTemplate, title: string): Promise<Project>,
  async update(id: string, updates: Partial<Project>): Promise<Project>,
  async delete(id: string): Promise<void>,

  // 통계 업데이트
  async recalculateStats(id: string): Promise<void>,
};

// features/document/documentService.ts

export const documentService = {
  // Scene 저장
  async saveScene(scene: Scene): Promise<void>,
  async createVersion(sceneId: string, content: string): Promise<void>,
  async getVersions(sceneId: string, limit?: number): Promise<DocumentVersion[]>,
  async revertToVersion(sceneId: string, versionId: string): Promise<void>,

  // 트리 조작
  async reorder(type: 'volume' | 'chapter' | 'scene', ids: string[]): Promise<void>,
};

// features/export/exportService.ts

export const exportService = {
  async exportToJson(projectId: string): Promise<Blob>,
  async exportToZip(projectId: string): Promise<Blob>,
  async importFromJson(file: File): Promise<string>, // returns projectId
};

// features/sync/syncService.ts

export const syncService = {
  async syncProject(projectId: string): Promise<SyncResult>,
  async enableSync(projectId: string): Promise<void>,
  async disableSync(projectId: string): Promise<void>,
  async resolveConflict(projectId: string, resolution: 'local' | 'remote'): Promise<void>,
};
```

---

## 10. 개발 로드맵

### 10.1 Phase 1: MVP (4주)

#### Week 1: 기반 구축

| 일차 | 작업 | 상세 |
|------|------|------|
| 1-2 | 프로젝트 셋업 | Vite + React + TS + Tailwind + shadcn/ui 초기화 |
| 3-4 | DB 스키마 | Dexie.js 스키마 정의, 마이그레이션 |
| 5-7 | 레이아웃 | AppLayout, 3열 구조, 리사이즈 핸들 |

#### Week 2: 핵심 기능 1

| 일차 | 작업 | 상세 |
|------|------|------|
| 8-10 | 트리 뷰 | TreeView, 드래그앤드롭, 컨텍스트 메뉴 |
| 11-12 | 에디터 기본 | TipTap 설정, 툴바, 상태바 |
| 13-14 | 자동 저장 | debounce, 버전 생성 |

#### Week 3: 핵심 기능 2

| 일차 | 작업 | 상세 |
|------|------|------|
| 15-16 | 세계관 카드 | CardList, CardEditor, 이미지 업로드 |
| 17-18 | 프로젝트 관리 | 생성, 열기, 템플릿 |
| 19-21 | 설정 탭 | 진행상황, 인물목록, 빠른접근 버튼 |

#### Week 4: 마무리

| 일차 | 작업 | 상세 |
|------|------|------|
| 22-23 | 내보내기 | JSON, ZIP 내보내기 |
| 24-25 | 선택적 인증 | Supabase Auth, 동기화 기본 |
| 26-28 | QA 및 버그 수정 | 테스트, 버그 수정, 성능 최적화 |

### 10.2 Phase 1 완료 기준

- [ ] 프로젝트 CRUD 가능
- [ ] 4가지 템플릿으로 프로젝트 생성
- [ ] 트리 뷰에서 권/화/씬 관리
- [ ] 드래그 앤 드롭으로 순서 변경
- [ ] TipTap 에디터로 글쓰기
- [ ] 자동 저장 (2초 debounce)
- [ ] 글자수 실시간 표시 (공백 포함/제외)
- [ ] 버전 히스토리 (50개)
- [ ] 세계관 카드 CRUD (인물/장소/아이템)
- [ ] 이미지 첨부
- [ ] JSON/ZIP 내보내기
- [ ] 선택적 로그인 + 클라우드 동기화
- [ ] 다크 모드 기본
- [ ] 필수 단축키 동작

### 10.3 Phase 2 미리보기 (AI 통합)

> Phase 1 완료 후 진행

- AI 대화창 UI
- OpenAI GPT API 연동
- 줄거리 설정 기능
- 인물 설정 도우미
- 실시간 요약 패널

---

## 부록

### A. 환경 변수

```bash
# .env.example

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# OpenAI (Phase 2)
VITE_OPENAI_API_KEY=sk-xxx
```

### B. 설치 명령어

```bash
# 프로젝트 생성
pnpm create vite storyforge --template react-ts
cd storyforge

# 핵심 의존성
pnpm add zustand dexie @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count
pnpm add @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add jszip date-fns lucide-react

# UI
pnpm add tailwindcss postcss autoprefixer
pnpm add class-variance-authority clsx tailwind-merge
pnpm dlx shadcn-ui@latest init

# 개발 의존성
pnpm add -D @types/node eslint prettier husky lint-staged
```

### C. 참고 링크

- [TipTap 문서](https://tiptap.dev/docs)
- [Dexie.js 문서](https://dexie.org/docs)
- [Zustand 문서](https://docs.pmnd.rs/zustand)
- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [dnd-kit 문서](https://docs.dndkit.com)

---

*문서 끝*
