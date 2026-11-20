// Belépés nélküli oldalak: nincs sidebar/alsó menü, és a tartalom sem kap helyet nekik.
export const AUTH_PREFIXES = ["/belepes", "/jelszo-csere"];

export function isAuthRoute(pathname: string) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
