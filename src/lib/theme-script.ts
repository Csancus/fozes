export const themeInitScript = `
try {
  var t = localStorage.getItem("theme");
  if (t && t !== "default") document.documentElement.setAttribute("data-theme", t);
} catch (e) {}
`;
