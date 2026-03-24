/**
 * gaaudim-tts.js — 搞掂粤语发音引擎 v1.0
 *
 * 功能：
 * 1. 检测浏览器是否有粤语语音包 (zh-HK / zh-TW / zh-*)
 * 2. 有粤语语音 → 使用 Web Speech API 播放（优化参数）
 * 3. 无粤语语音 → 显示友好提示，引导安装语音包
 * 4. 提供统一的 speak(text, btn) 接口，替换各页面内联实现
 * 5. 为发音按钮提供增强样式（hover 高亮、播放状态切换）
 *
 * 回退链：zh-HK → zh-TW → zh-* → 提示安装
 * 未来扩展：支持预生成音频 manifest + Audio API 播放
 */
(function () {
  'use strict';

  // ── 配置 ──
  var CONFIG = {
    rate: 0.82,
    pitch: 1.05,
    langPriority: ['zh-HK', 'zh-TW'],   // 首选语言
    langPrefix: 'zh',                     // 回退前缀
    iconDefault: '\uD83D\uDD0A',          // 🔊
    iconPlaying: '\u23F8',                // ⏸
    toastDuration: 4000
  };

  // ── 状态 ──
  var voice = null;
  var voiceReady = false;
  var cantonesAvailable = null; // null = 未检测, true/false

  // ── 语音检测与加载 ──
  function loadVoice() {
    var vs = speechSynthesis.getVoices();
    if (!vs || vs.length === 0) return;

    // 按优先级查找粤语声音
    for (var i = 0; i < CONFIG.langPriority.length; i++) {
      var found = vs.filter(function (v) { return v.lang === CONFIG.langPriority[i]; });
      if (found.length > 0) {
        voice = found[0];
        voiceReady = true;
        cantonesAvailable = true;
        return;
      }
    }

    // 回退到任意中文声音
    var zhVoice = vs.filter(function (v) { return v.lang.indexOf(CONFIG.langPrefix) === 0; });
    if (zhVoice.length > 0) {
      voice = zhVoice[0];
      voiceReady = true;
      cantonesAvailable = true;
      return;
    }

    // 无任何中文声音
    voiceReady = true;
    cantonesAvailable = false;
  }

  // 浏览器异步加载 voices
  if (typeof speechSynthesis !== 'undefined') {
    if (speechSynthesis.getVoices().length > 0) {
      loadVoice();
    }
    speechSynthesis.onvoiceschanged = loadVoice;
  }

  // ── Toast 提示 ──
  function showTtsToast(msg) {
    var existing = document.getElementById('gaaudim-tts-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'gaaudim-tts-toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(0);' +
      'background:#1C2333;color:#E2E8F0;padding:14px 24px;border-radius:12px;font-size:14px;' +
      'font-family:"Noto Sans SC",sans-serif;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.4);' +
      'border:1px solid #2D3748;max-width:90vw;text-align:center;transition:opacity .3s;opacity:1;';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, CONFIG.toastDuration);
  }

  // ── 检测提示 ──
  function getNoVoiceMessage() {
    var ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) {
      return '未检测到粤语语音包。请前往 Android 设置 → 语言和输入 → 文字转语音 → 安装「粤语(香港)」语音包。';
    } else if (/Windows/i.test(ua)) {
      return '未检测到粤语语音包。请前往 Windows 设置 → 时间和语言 → 语音 → 添加「中文(繁体，香港)」语音。';
    } else if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
      return '未检测到粤语语音包。请安装 espeak-ng 并添加 yue 语言包（sudo apt install espeak-ng）。';
    }
    // macOS/iOS 通常自带 Sin-Ji 粤语声音
    return '未检测到粤语语音包，请检查系统语言设置是否已安装中文(粤语)语音。';
  }

  // ── 核心发音函数 ──
  function speak(text, btn) {
    // 如果正在播放，则停止
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      if (btn) btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
      return;
    }

    // 懒加载 voice
    if (!voiceReady) loadVoice();

    // 无声音 → 提示安装
    if (cantonesAvailable === false) {
      showTtsToast(getNoVoiceMessage());
      return;
    }

    // 取消任何排队的语音
    speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice ? voice.lang : 'zh-HK';
    if (voice) utterance.voice = voice;
    utterance.rate = CONFIG.rate;
    utterance.pitch = CONFIG.pitch;

    // 按钮状态管理
    if (btn) {
      if (!btn.dataset.originalIcon) {
        btn.dataset.originalIcon = btn.innerHTML;
      }
      var originalIcon = btn.innerHTML;
      btn.innerHTML = CONFIG.iconPlaying;
      btn.classList.add('tts-playing');

      utterance.onend = function () {
        btn.innerHTML = originalIcon;
        btn.classList.remove('tts-playing');
      };
      utterance.onerror = function () {
        btn.innerHTML = originalIcon;
        btn.classList.remove('tts-playing');
      };
    }

    speechSynthesis.speak(utterance);
  }

  // ── 注入发音按钮 CSS ──
  function injectTtsStyles() {
    if (document.getElementById('gaaudim-tts-styles')) return;
    var style = document.createElement('style');
    style.id = 'gaaudim-tts-styles';
    style.textContent =
      /* 通用发音按钮 */
      '.gd-speak-btn{' +
        'display:inline-flex;align-items:center;justify-content:center;' +
        'width:30px;height:30px;border-radius:50%;border:1px solid rgba(0,210,190,.3);' +
        'background:rgba(0,210,190,.1);color:#00D2BE;cursor:pointer;' +
        'font-size:14px;transition:all .2s;vertical-align:middle;margin-left:4px;' +
        'line-height:1;padding:0;' +
      '}' +
      '.gd-speak-btn:hover{' +
        'background:rgba(0,210,190,.25);border-color:rgba(0,210,190,.6);' +
        'transform:scale(1.12);box-shadow:0 0 12px rgba(0,210,190,.3);' +
      '}' +
      '.gd-speak-btn:active{transform:scale(.95);}' +
      '.gd-speak-btn.tts-playing{' +
        'background:rgba(0,210,190,.3);border-color:#00D2BE;' +
        'animation:gd-tts-pulse 1s ease-in-out infinite;' +
      '}' +
      '@keyframes gd-tts-pulse{' +
        '0%,100%{box-shadow:0 0 0 0 rgba(0,210,190,.3)}' +
        '50%{box-shadow:0 0 0 6px rgba(0,210,190,0)}' +
      '}' +
      /* 兼容已有的 wcard-speak / ex-speak / usage-speak */
      '.wcard-speak:hover,.ex-speak:hover,.usage-speak:hover{' +
        'background:rgba(0,210,190,.25)!important;' +
        'transform:scale(1.12);box-shadow:0 0 12px rgba(0,210,190,.3);' +
      '}' +
      '.wcard-speak:active,.ex-speak:active,.usage-speak:active{transform:scale(.95);}' +
      '.wcard-speak.tts-playing,.ex-speak.tts-playing,.usage-speak.tts-playing{' +
        'animation:gd-tts-pulse 1s ease-in-out infinite;' +
      '}' +
      /* Toast */
      '#gaaudim-tts-toast{pointer-events:none;}';
    document.head.appendChild(style);
  }

  // ── 初始化 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTtsStyles);
  } else {
    injectTtsStyles();
  }

  // ── 公开 API ──
  window.gaaudimTTS = {
    speak: speak,
    isCantonesAvailable: function () { return cantonesAvailable; },
    getVoice: function () { return voice; },
    showToast: showTtsToast
  };

  // 覆盖全局 speak 函数（兼容现有 onclick="speak(...)" 调用）
  window.speak = speak;

})();
