(function initAiRPayTheme() {
  const THEME_KEY = "airpay-theme";
  const darkClass = "theme-dark";

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle(darkClass, isDark);
    document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
      toggle.checked = isDark;
    });
  }

  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const nextTheme = toggle.checked ? "dark" : "light";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  });
})();
