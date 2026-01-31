/**
 * TipTap 에디터 컴포넌트
 *
 * 한글 입력을 지원하는 리치 텍스트 에디터입니다.
 * - 자동 저장 (2초 디바운스)
 * - 기본 텍스트 포맷팅
 * - 단축키 지원
 */

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEditorStore, useDocumentStore } from '@/stores';

interface TipTapEditorProps {
  sceneId: string;
}

export function TipTapEditor({ sceneId }: TipTapEditorProps) {
  const { setEditor, onContentChange, saveManually, loadScene } = useEditorStore();
  const { scenes } = useDocumentStore();
  const isComposingRef = useRef(false);
  const initialLoadRef = useRef(false);

  const scene = scenes.find((s) => s.id === sceneId);

  // TipTap 에디터 초기화
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: '여기에 글을 작성하세요...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-0 py-4',
      },
      // 한글 조합 처리
      handleDOMEvents: {
        compositionstart: () => {
          isComposingRef.current = true;
          return false;
        },
        compositionend: () => {
          isComposingRef.current = false;
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      // 한글 조합 중에는 저장하지 않음
      if (isComposingRef.current) return;

      const json = JSON.stringify(editor.getJSON());
      onContentChange(json);
    },
  });

  // 에디터 인스턴스 등록
  useEffect(() => {
    if (editor) {
      setEditor(editor);
    }

    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  // 씬 변경 시 컨텐츠 로드
  useEffect(() => {
    if (editor && scene && !initialLoadRef.current) {
      initialLoadRef.current = true;

      if (scene.content) {
        try {
          const json = JSON.parse(scene.content);
          editor.commands.setContent(json);
        } catch {
          editor.commands.setContent({ type: 'doc', content: [] });
        }
      } else {
        editor.commands.setContent({ type: 'doc', content: [] });
      }
    }
  }, [editor, scene]);

  // 씬 ID 변경 시 리셋 및 EditorStore 동기화
  useEffect(() => {
    initialLoadRef.current = false;
    // EditorStore에 씬 로드 (버전 히스토리 등을 위해)
    loadScene(sceneId);
  }, [sceneId, loadScene]);

  // 단축키: Ctrl+S 수동 저장
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveManually();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveManually]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        에디터 로딩 중...
      </div>
    );
  }

  return (
    <div className="tiptap-editor">
      {/* 툴바 */}
      <EditorToolbar editor={editor} />

      {/* 에디터 컨텐츠 */}
      <EditorContent editor={editor} className="editor-content" />

      {/* 하단 정보 */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {editor.storage.characterCount.characters()}자
          {' · '}
          {editor.storage.characterCount.words()}단어
        </span>
        <span className="text-muted-foreground/50">
          Ctrl+S: 저장 | Ctrl+Z: 실행취소 | Ctrl+Shift+Z: 다시실행
        </span>
      </div>
    </div>
  );
}

// 에디터 툴바 컴포넌트
interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border pb-3">
      {/* 텍스트 스타일 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게 (Ctrl+B)"
      >
        <BoldIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임 (Ctrl+I)"
      >
        <ItalicIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선 (Ctrl+Shift+S)"
      >
        <StrikeIcon />
      </ToolbarButton>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* 제목 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        <span className="text-xs font-bold">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* 리스트 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="글머리 기호"
      >
        <ListIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 매기기"
      >
        <OrderedListIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="인용"
      >
        <QuoteIcon />
      </ToolbarButton>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* 실행취소/다시실행 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행취소 (Ctrl+Z)"
      >
        <UndoIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시실행 (Ctrl+Shift+Z)"
      >
        <RedoIcon />
      </ToolbarButton>
    </div>
  );
}

// 아이콘 컴포넌트들
const BoldIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
  </svg>
);

const ItalicIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 4h4m-2 0l-4 16m0 0h4" />
  </svg>
);

const StrikeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M9 4h6v4M9 20h6v-4" />
  </svg>
);

const ListIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    <circle cx="2" cy="6" r="1" fill="currentColor" />
    <circle cx="2" cy="12" r="1" fill="currentColor" />
    <circle cx="2" cy="18" r="1" fill="currentColor" />
  </svg>
);

const OrderedListIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13" />
    <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
    <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
    <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
  </svg>
);

const QuoteIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const UndoIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const RedoIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
  </svg>
);
