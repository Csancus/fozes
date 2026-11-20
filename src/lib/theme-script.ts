// A <head>-ben, hidratálás előtt fut: villanás nélkül beállítja a <html>
// data-theme / data-mode attribútumait (Story 8.1, 8.2). A data-style="csempe"
// fixen a layout.tsx-ben van (Story 8.3).
// A logika megegyezik az appearance.ts htmlAttributes()-ével (teszt őrzi).
export const themeInitScript = `
try {
  var d = document.documentElement;
  var t = localStorage.getItem("theme");
  if (t === "green" || t === "turquoise" || t === "blue") d.setAttribute("data-theme", t);
  var m = localStorage.getItem("mode");
  if (m === "light" || m === "dark") d.setAttribute("data-mode", m);
  if (localStorage.getItem("sidebar") === "collapsed") d.setAttribute("data-sidebar", "collapsed");
} catch (e) {}
`;
