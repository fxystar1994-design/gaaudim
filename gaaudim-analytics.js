// gaaudim-analytics.js v3.3 — 2026-03-29
// 全站GA4自定义事件统一管理
(function(){
  if(typeof gtag !== 'function') return;

  // ========== 5A: 全局事件（所有页面） ==========

  // 滚动深度追踪 — 25%/50%/75%/100%
  var scrollThresholds = [25, 50, 75, 100];
  var scrollFired = {};
  window.addEventListener('scroll', function(){
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if(docHeight <= 0) return;
    var pct = Math.round((window.scrollY / docHeight) * 100);
    scrollThresholds.forEach(function(t){
      if(pct >= t && !scrollFired[t]){
        scrollFired[t] = true;
        gtag('event', 'scroll_depth', { percent: t, page: location.pathname });
      }
    });
  });

  // 停留时长追踪 — 每60秒触发一次，最多5次(300秒)
  var timeOnPage = 0;
  setInterval(function(){
    timeOnPage += 60;
    if(timeOnPage <= 300){
      gtag('event', 'time_on_page', { seconds: timeOnPage, page: location.pathname });
    }
  }, 60000);

  // ========== 5B: 课程页面专属事件 ==========

  // 检测是否为课程页面
  var path = location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1).toUpperCase();
  var isLesson = /^MAYJIE_/.test(filename);

  if(isLesson){
    // 提取lesson_id: MayJie_EP01_ChaChaan.html → ep01
    var lessonMatch = filename.match(/(EP\d+|JP\d+|VW\d+|SZ\d+|HKSONGS_EP\d+)/);
    var lessonId = lessonMatch ? lessonMatch[1].toLowerCase() : filename.replace(/^MAYJIE_/,'').replace(/\.HTML$/,'').toLowerCase();

    // audio_play事件 — 监听TTS按钮点击
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[onclick*="speak"],.tts-btn,.gd-speak-btn');
      if(btn){
        var lineId = btn.getAttribute('data-line') || btn.closest('[data-line]')?.getAttribute('data-line') || 'unknown';
        gtag('event', 'audio_play', { lesson_id: lessonId, line_id: lineId });
      }
    });

    // drill_expand事件 — 监听展开分析按钮
    document.addEventListener('click', function(e){
      var btn = e.target.closest('[onclick*="toggle"],.drill-toggle,.gd-expand');
      if(btn){
        var drillId = btn.getAttribute('data-drill') || 'unknown';
        gtag('event', 'drill_expand', { lesson_id: lessonId, drill_id: drillId });
      }
    });

    // lesson_complete事件 — 滚动到80%
    var lessonCompleted = false;
    window.addEventListener('scroll', function(){
      if(lessonCompleted) return;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if(docHeight <= 0) return;
      var pct = Math.round((window.scrollY / docHeight) * 100);
      if(pct >= 80){
        lessonCompleted = true;
        gtag('event', 'lesson_complete', { lesson_id: lessonId });
        // 同步更新学习进度到localStorage
        try {
          var progress = JSON.parse(localStorage.getItem('gd_progress') || '{}');
          if(!progress.completed) progress.completed = [];
          if(progress.completed.indexOf(lessonId) === -1) progress.completed.push(lessonId);
          progress.current = lessonId;
          progress.last_visit = new Date().toISOString();
          progress.total_time_min = (progress.total_time_min || 0) + Math.round(timeOnPage / 60);
          // 连续学习天数
          var today = new Date().toDateString();
          if(progress.last_day !== today){
            var yesterday = new Date(Date.now() - 86400000).toDateString();
            progress.streak_days = (progress.last_day === yesterday) ? (progress.streak_days || 0) + 1 : 1;
            progress.last_day = today;
          }
          localStorage.setItem('gd_progress', JSON.stringify(progress));
        } catch(e){}
      }
    });
  }

  // ========== 5D: 付费相关事件 ==========
  // paywall_view 和 payment_redirect_mianbaoduo 已在 index.html 和 paywall-check.js 中内联实现
  // unlock_attempt 和 unlock_success 已在 tryUnlock() 和 pwUnlock() 中内联实现

})();
