/**
 * change-marker.js — 搞掂粤语 改动标注系统
 *
 * 在demo页面注入橙色圆点+tooltip标记改动位置，
 * 右下角浮动按钮显示"本页N处改动"。
 *
 * 用法：
 *   1. 在HTML中引入此脚本：<script src="tools/change-marker/change-marker.js"></script>
 *   2. 在需要标记的元素上添加 data-changed 属性：
 *      <div data-changed="修复了三文治声调 zi3→zi6">...</div>
 *   3. 或通过 changelist.json 配置批量标注（见下方）
 *
 * changelist.json 格式：
 *   {
 *     "MayJie_EP01_ChaChaan.html": [
 *       { "selector": ".t-jyutping:nth-of-type(3)", "note": "修复 zi3→zi6", "date": "2026-03-26" }
 *     ]
 *   }
 */

(function () {
  'use strict';

  // === 配置 ===
  var MARKER_COLOR = '#F5A623';
  var MARKER_SIZE = 10;
  var TOOLTIP_BG = 'rgba(28,28,46,.95)';
  var TOOLTIP_COLOR = '#fff';
  var FAB_BG = MARKER_COLOR;
  var FAB_COLOR = '#1C1C2E';

  // === 注入样式 ===
  var style = document.createElement('style');
  style.textContent = [
    /* 标记圆点 */
    '.cm-dot{',
    '  display:inline-block;width:' + MARKER_SIZE + 'px;height:' + MARKER_SIZE + 'px;',
    '  background:' + MARKER_COLOR + ';border-radius:50%;',
    '  position:absolute;top:-4px;right:-4px;',
    '  cursor:pointer;z-index:10001;',
    '  box-shadow:0 0 6px ' + MARKER_COLOR + ';',
    '  animation:cm-pulse 2s infinite;',
    '}',
    '@keyframes cm-pulse{',
    '  0%,100%{box-shadow:0 0 4px ' + MARKER_COLOR + ';}',
    '  50%{box-shadow:0 0 12px ' + MARKER_COLOR + ';}',
    '}',
    /* 标记容器 */
    '.cm-wrap{position:relative;display:inline-block;}',
    '[data-changed]{position:relative;}',
    /* Tooltip */
    '.cm-tip{',
    '  display:none;position:absolute;bottom:calc(100% + 8px);right:0;',
    '  background:' + TOOLTIP_BG + ';color:' + TOOLTIP_COLOR + ';',
    '  padding:8px 12px;border-radius:8px;font-size:12px;',
    '  white-space:nowrap;z-index:10002;',
    '  border:1px solid rgba(245,166,35,.3);',
    '  box-shadow:0 4px 16px rgba(0,0,0,.4);',
    '  font-family:"Noto Sans SC",sans-serif;',
    '  max-width:280px;white-space:normal;',
    '}',
    '.cm-tip::after{',
    '  content:"";position:absolute;top:100%;right:12px;',
    '  border:6px solid transparent;border-top-color:' + TOOLTIP_BG + ';',
    '}',
    '.cm-dot:hover+.cm-tip,.cm-tip:hover{display:block;}',
    /* FAB 浮动按钮 */
    '.cm-fab{',
    '  position:fixed;bottom:72px;right:16px;z-index:10003;',
    '  background:' + FAB_BG + ';color:' + FAB_COLOR + ';',
    '  border:none;border-radius:24px;padding:10px 16px;',
    '  font-size:13px;font-weight:700;cursor:pointer;',
    '  font-family:"Noto Sans SC",sans-serif;',
    '  box-shadow:0 4px 16px rgba(245,166,35,.4);',
    '  transition:all .2s;',
    '}',
    '.cm-fab:hover{transform:scale(1.05);box-shadow:0 6px 24px rgba(245,166,35,.5);}',
    /* FAB 展开列表 */
    '.cm-list{',
    '  display:none;position:fixed;bottom:120px;right:16px;z-index:10003;',
    '  background:rgba(28,28,46,.97);border:1px solid rgba(245,166,35,.3);',
    '  border-radius:12px;padding:8px 0;max-height:60vh;overflow-y:auto;',
    '  box-shadow:0 8px 32px rgba(0,0,0,.5);min-width:240px;max-width:320px;',
    '  font-family:"Noto Sans SC",sans-serif;',
    '}',
    '.cm-list.open{display:block;}',
    '.cm-list-item{',
    '  display:block;padding:8px 14px;color:rgba(255,255,255,.8);',
    '  font-size:12px;cursor:pointer;transition:background .15s;',
    '  border:none;background:none;width:100%;text-align:left;',
    '}',
    '.cm-list-item:hover{background:rgba(245,166,35,.1);color:#F5A623;}',
    '.cm-list-item .cm-list-date{color:rgba(255,255,255,.4);font-size:10px;margin-left:8px;}',
  ].join('\n');
  document.head.appendChild(style);

  // === 收集改动 ===
  var changes = [];

  function addMarker(el, note, date) {
    // 确保元素可定位
    var pos = getComputedStyle(el).position;
    if (pos === 'static') {
      el.style.position = 'relative';
    }

    var dot = document.createElement('span');
    dot.className = 'cm-dot';
    dot.setAttribute('aria-label', '改动标注');

    var tip = document.createElement('span');
    tip.className = 'cm-tip';
    tip.textContent = note + (date ? ' (' + date + ')' : '');

    el.appendChild(dot);
    el.appendChild(tip);

    changes.push({ el: el, note: note, date: date || '' });
  }

  // === 扫描 data-changed 属性 ===
  function scanDataAttributes() {
    var els = document.querySelectorAll('[data-changed]');
    for (var i = 0; i < els.length; i++) {
      var note = els[i].getAttribute('data-changed');
      var date = els[i].getAttribute('data-changed-date') || '';
      addMarker(els[i], note, date);
    }
  }

  // === 加载 changelist.json ===
  function loadChangeList() {
    // 尝试从脚本同级目录加载
    var scripts = document.getElementsByTagName('script');
    var scriptDir = '';
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('change-marker.js') !== -1) {
        scriptDir = scripts[i].src.replace(/change-marker\.js.*$/, '');
        break;
      }
    }

    var url = scriptDir + 'changelist.json';
    var page = location.pathname.split('/').pop() || 'index.html';

    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data[page]) return;
        var items = data[page];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var el = document.querySelector(item.selector);
          if (el) {
            addMarker(el, item.note, item.date || '');
          }
        }
        updateFab();
      })
      .catch(function () { /* changelist.json 不存在，静默忽略 */ });
  }

  // === FAB 浮动按钮 ===
  var fab = null;
  var list = null;

  function createFab() {
    fab = document.createElement('button');
    fab.className = 'cm-fab';
    fab.textContent = '📍 本页 0 处改动';
    document.body.appendChild(fab);

    list = document.createElement('div');
    list.className = 'cm-list';
    document.body.appendChild(list);

    fab.addEventListener('click', function () {
      list.classList.toggle('open');
    });

    // 点击外部关闭
    document.addEventListener('click', function (e) {
      if (!fab.contains(e.target) && !list.contains(e.target)) {
        list.classList.remove('open');
      }
    });
  }

  function updateFab() {
    if (!fab) return;
    var n = changes.length;
    fab.textContent = '📍 本页 ' + n + ' 处改动';
    if (n === 0) {
      fab.style.display = 'none';
      return;
    }
    fab.style.display = '';

    // 更新列表
    list.innerHTML = '';
    for (var i = 0; i < changes.length; i++) {
      (function (c, idx) {
        var btn = document.createElement('button');
        btn.className = 'cm-list-item';
        btn.innerHTML = (idx + 1) + '. ' + c.note +
          (c.date ? '<span class="cm-list-date">' + c.date + '</span>' : '');
        btn.addEventListener('click', function () {
          c.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          list.classList.remove('open');
        });
        list.appendChild(btn);
      })(changes[i], i);
    }
  }

  // === 初始化 ===
  function init() {
    createFab();
    scanDataAttributes();
    loadChangeList();
    // 延迟更新，等 changelist.json 加载完
    setTimeout(updateFab, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
