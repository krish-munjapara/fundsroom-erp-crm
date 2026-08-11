/** Expanded sidebar width — sync with `--sidebar-width-expanded` in index.css */
export const SIDEBAR_WIDTH_EXPANDED = '256px';
/** Collapsed sidebar width — sync with `--sidebar-width-collapsed` in index.css */
export const SIDEBAR_WIDTH_COLLAPSED = '64px';
export const SIDEBAR_STORAGE_KEY = 'fundsroom-sidebar-collapsed';

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // ignore storage errors
  }
}
