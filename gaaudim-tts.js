/**
 * gaaudim-tts.js — 搞掂粤语发音引擎 v2.0
 *
 * 变更 v2.0:
 * - 优先加载预生成MP3 (/audio/{ep_id}/{line_id}.mp3)
 * - MP3加载失败时 fallback 到 Web Speech API
 * - 加载中显示 loading 状态
 * - 保留原有 Web Speech API 全部功能
 *
 * 回退链：预生成MP3 → zh-HK → zh-TW → zh-* → 提示安装
 */
(function () {
  'use strict';

  // ── 配置 ──
  var CONFIG = {
    rate: 0.82,
    pitch: 1.05,
    langPriority: ['zh-HK', 'zh-TW'],
    langPrefix: 'zh',
    iconDefault: '\uD83D\uDD0A',   // 🔊
    iconPlaying: '\u23F8',          // ⏸
    iconLoading: '\u23F3',          // ⏳
    toastDuration: 4000,
    audioBasePath: (window.location.hostname.includes('github.io') ? '/gaaudim' : '') + '/audio/'
  };

  // ── 状态 ──
  var voice = null;
  var voiceReady = false;
  var cantonesAvailable = null;
  var currentAudio = null;  // 当前播放的 Audio 对象

  // ── 从页面URL推断 episode ID ──
  function getEpisodeId() {
    var path = window.location.pathname;
    var filename = path.split('/').pop().replace('.html', '').toLowerCase();

    // MayJie_EP01_ChaChaan -> ep01
    var epMatch = filename.match(/mayjie_ep(\d+)/i);
    if (epMatch) return 'ep' + epMatch[1].padStart(2, '0');

    // MayJie_JP01 -> jp01
    var jpMatch = filename.match(/mayjie_jp(\d+)/i);
    if (jpMatch) return 'jp' + jpMatch[1].padStart(2, '0');

    // MayJie_VW01 -> vw01
    var vwMatch = filename.match(/mayjie_vw(\d+)/i);
    if (vwMatch) return 'vw' + vwMatch[1].padStart(2, '0');

    // MayJie_SZ01 -> sz01
    var szMatch = filename.match(/mayjie_sz(\d+)/i);
    if (szMatch) return 'sz' + szMatch[1].padStart(2, '0');

    // MayJie_HKSongs_EP01 -> hksongs_ep01
    var hkMatch = filename.match(/mayjie_hksongs_ep(\d+)/i);
    if (hkMatch) return 'hksongs_ep' + hkMatch[1].padStart(2, '0');

    // JP/VW Extra
    if (filename.match(/mayjie_jp_extra/i)) return 'jp_extra';
    if (filename.match(/mayjie_vw_extra/i)) return 'vw_extra';

    return null;
  }

  // ── 构建音频manifest（页面加载时扫描所有speak按钮）──
  var audioManifest = {};  // text -> line_number mapping

  function buildManifest() {
    // 扫描页面中所有 onclick="speak('...')" 的按钮
    var buttons = document.querySelectorAll('[onclick*="speak("]');
    var lineNum = 1;
    buttons.forEach(function (btn) {
      var match = btn.getAttribute('onclick').match(/speak\s*\(\s*['"]([^'"]+)['"]/);
      if (match) {
        var text = match[1];
        if (!audioManifest[text]) {
          audioManifest[text] = String(lineNum).padStart(2, '0');
          lineNum++;
        }
      }
    });
  }

  // ── 尝试播放预生成MP3 ──
  function tryPlayMP3(text, btn, onFail) {
    var epId = getEpisodeId();
    var lineId = audioManifest[text];

    if (!epId || !lineId) {
      onFail();
      return;
    }

    var mp3Url = CONFIG.audioBasePath + epId + '/' + epId + '_' + lineId + '.mp3';

    // 设置loading状态
    if (btn) {
      if (!btn.dataset.originalIcon) btn.dataset.originalIcon = btn.innerHTML;
      btn.innerHTML = CONFIG.iconLoading;
      btn.classList.add('tts-loading');
    }

    var audio = new Audio(mp3Url);
    currentAudio = audio;

    audio.oncanplaythrough = function () {
      // MP3可以播放
      console.log('🎵 Playing MP3:', mp3Url);
      if (btn) {
        btn.innerHTML = CONFIG.iconPlaying;
        btn.classList.remove('tts-loading');
        btn.classList.add('tts-playing');
      }
      audio.play();
    };

    audio.onended = function () {
      currentAudio = null;
      if (btn) {
        btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
        btn.classList.remove('tts-playing');
      }
    };

    audio.onerror = function () {
      // MP3不存在或加载失败，fallback到Web Speech API
      console.log('⚠️ MP3 load failed, fallback to Web Speech API:', mp3Url);
      currentAudio = null;
      if (btn) {
        btn.classList.remove('tts-loading');
        btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
      }
      onFail();
    };

    // 设置超时（3秒内加载不了就fallback）
    setTimeout(function () {
      if (audio.readyState < 3 && currentAudio === audio) {
        console.log('⚠️ MP3 load timeout, fallback to Web Speech API:', mp3Url);
        audio.src = '';
        currentAudio = null;
        if (btn) {
          btn.classList.remove('tts-loading');
          btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
        }
        onFail();
      }
    }, 3000);
  }

  // ── 语音检测与加载 ──
  function loadVoice() {
    var vs = speechSynthesis.getVoices();
    if (!vs || vs.length === 0) return;

    for (var i = 0; i < CONFIG.langPriority.length; i++) {
      var found = vs.filter(function (v) { return v.lang === CONFIG.langPriority[i]; });
      if (found.length > 0) {
        voice = found[0];
        voiceReady = true;
        cantonesAvailable = true;
        return;
      }
    }

    var zhVoice = vs.filter(function (v) { return v.lang.indexOf(CONFIG.langPrefix) === 0; });
    if (zhVoice.length > 0) {
      voice = zhVoice[0];
      voiceReady = true;
      cantonesAvailable = true;
      return;
    }

    voiceReady = true;
    cantonesAvailable = false;
  }

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
    return '未检测到粤语语音包，请检查系统语言设置是否已安装中文(粤语)语音。';
  }

  // ── Web Speech API fallback ──
  function speakWithWebSpeech(text, btn) {
    if (!voiceReady) loadVoice();

    if (cantonesAvailable === false) {
      showTtsToast(getNoVoiceMessage());
      return;
    }

    speechSynthesis.cancel();

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice ? voice.lang : 'zh-HK';
    if (voice) utterance.voice = voice;
    utterance.rate = CONFIG.rate;
    utterance.pitch = CONFIG.pitch;

    if (btn) {
      if (!btn.dataset.originalIcon) btn.dataset.originalIcon = btn.innerHTML;
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

  // ── 核心发音函数（MP3优先 + Web Speech API fallback）──
  function speak(text, btn) {
    // 如果正在播放Audio，停止
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
      if (btn) {
        btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
        btn.classList.remove('tts-playing', 'tts-loading');
      }
      return;
    }

    // 如果正在播放Web Speech，停止
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      if (btn) {
        btn.innerHTML = btn.dataset.originalIcon || CONFIG.iconDefault;
        btn.classList.remove('tts-playing');
      }
      return;
    }

    // 尝试MP3，失败则fallback
    tryPlayMP3(text, btn, function () {
      speakWithWebSpeech(text, btn);
    });
  }

  // ── 注入发音按钮 CSS ──
  function injectTtsStyles() {
    if (document.getElementById('gaaudim-tts-styles')) return;
    var style = document.createElement('style');
    style.id = 'gaaudim-tts-styles';
    style.textContent =
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
      '.gd-speak-btn.tts-loading{' +
        'background:rgba(0,210,190,.15);border-color:rgba(0,210,190,.4);' +
        'animation:gd-tts-spin 1s linear infinite;' +
      '}' +
      '@keyframes gd-tts-pulse{' +
        '0%,100%{box-shadow:0 0 0 0 rgba(0,210,190,.3)}' +
        '50%{box-shadow:0 0 0 6px rgba(0,210,190,0)}' +
      '}' +
      '@keyframes gd-tts-spin{' +
        '0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}' +
      '}' +
      '.wcard-speak:hover,.ex-speak:hover,.usage-speak:hover{' +
        'background:rgba(0,210,190,.25)!important;' +
        'transform:scale(1.12);box-shadow:0 0 12px rgba(0,210,190,.3);' +
      '}' +
      '.wcard-speak:active,.ex-speak:active,.usage-speak:active{transform:scale(.95);}' +
      '.wcard-speak.tts-playing,.ex-speak.tts-playing,.usage-speak.tts-playing{' +
        'animation:gd-tts-pulse 1s ease-in-out infinite;' +
      '}' +
      '#gaaudim-tts-toast{pointer-events:none;}';
    document.head.appendChild(style);
  }

  // ── 替换内联TTS状态提示 ──
  function updateTtsBadge() {
    var badge = document.getElementById('tts-badge');
    if (badge) {
      badge.textContent = '🎧 高清粤语发音已就绪';
      badge.style.background = '#2DC653';
    }
  }

  // ── 初始化 ──
  function init() {
    injectTtsStyles();
    buildManifest();
    updateTtsBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── 公开 API ──
  window.gaaudimTTS = {
    speak: speak,
    isCantonesAvailable: function () { return cantonesAvailable; },
    getVoice: function () { return voice; },
    showToast: showTtsToast,
    getManifest: function () { return audioManifest; },
    getEpisodeId: getEpisodeId
  };

  // 覆盖全局 speak 函数（兼容现有 onclick="speak(...)" 调用）
  window.speak = speak;

})();
