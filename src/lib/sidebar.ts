// Story 8.3 – a bal oldalsáv becsukható; az állapot a localStorage-ban marad,
// és a <html data-sidebar="collapsed"> attribútum hajtja (a head-script villanás nélkül állítja be).

export const SIDEBAR_KEY = "sidebar";
export const SIDEBAR_ATTR = "data-sidebar";

export function isSidebarCollapsed(root: HTMLElement = document.documentElement): boolean {
  return root.getAttribute(SIDEBAR_ATTR) === "collapsed";
}

export function setSidebarCollapsed(collapsed: boolean, root: HTMLElement = document.documentElement) {
  if (collapsed) root.setAttribute(SIDEBAR_ATTR, "collapsed");
  else root.removeAttribute(SIDEBAR_ATTR);
  try {
    if (collapsed) localStorage.setItem(SIDEBAR_KEY, "collapsed");
    else localStorage.removeItem(SIDEBAR_KEY);
  } catch {}
}
