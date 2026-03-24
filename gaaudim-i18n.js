/**
 * gaaudim.com i18n Language Switch
 * Zero-dependency, pure vanilla JS
 * Toggles between Chinese (zh) and English (en) content
 * User preference persisted via localStorage
 */
(function () {
  var KEY = 'gaaudim-lang';
  var saved = localStorage.getItem(KEY) || 'zh';

  // Apply saved language on page load (before paint if possible)
  if (saved === 'en') {
    document.body.classList.add('en');
  }

  // Global toggle function called by the nav button
  window.toggleLang = function () {
    var isEn = document.body.classList.toggle('en');
    localStorage.setItem(KEY, isEn ? 'en' : 'zh');
  };
})();
