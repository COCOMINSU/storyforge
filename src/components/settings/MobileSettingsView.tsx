/**
 * 모바일 설정 화면
 *
 * 모바일에서 설정 탭을 눌렀을 때 표시되는 전체 화면 설정 뷰입니다.
 * ThemeSelector를 재사용합니다.
 */

import { ThemeSelector } from './ThemeSelector';

export function MobileSettingsView() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="mb-4 text-lg font-semibold text-foreground">설정</h2>
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">테마</h3>
        <ThemeSelector />
      </section>
    </div>
  );
}
