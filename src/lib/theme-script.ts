export const themeInitScript = `
try {
  var t = localStorage.getItem("theme");
  if (t && t !== "default") document.documentElement.setAttribute("data-theme", t);
  if (localStorage.getItem("style") === "csempe") document.documentElement.setAttribute("data-style", "csempe");
} catch (e) {}
`;
