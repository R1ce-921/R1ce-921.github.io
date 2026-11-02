(function() {
  var MusicPlayer = {
    init: function() {
      // MetingJS auto-initializes via <meting-js> custom element
      // Handle APlayer instance if present
      this.waitForAPlayer();
      this.initLocalPlaylist();
    },

    // 本地音乐模式：主题只输出 window.__LOCAL_PLAYLIST，需要在这里实例化 APlayer
    initLocalPlaylist: function() {
      if (!window.__LOCAL_PLAYLIST || !window.__LOCAL_PLAYLIST.length) return;

      var containers = Array.prototype.slice.call(
        document.querySelectorAll('.music-widget .aplayer, [id="aplayer-local"]')
      );
      if (!containers.length) return;

      var self = this;
      var tries = 0;
      var timer = setInterval(function() {
        tries++;
        if (typeof window.APlayer !== 'function') {
          if (tries > 40) clearInterval(timer);
          return;
        }
        clearInterval(timer);
        var hasLrc = window.__LOCAL_PLAYLIST.some(function(s) { return s && s.lrc; });
        containers.forEach(function(el) {
          if (el.dataset.localInit === '1') return;
          el.dataset.localInit = '1';
          try {
            new window.APlayer({
              container: el,
              audio: window.__LOCAL_PLAYLIST,
              listFolded: true,
              listMaxHeight: '220px',
              preload: 'auto',
              lrcType: hasLrc ? 3 : 0,
              theme: '#10b981'
            });
          } catch (e) {
            console.warn('[firefly] local music init failed', e);
          }
          self.onAPlayerReady(el.aplayer || (window.aplayers && window.aplayers[0]));
        });
      }, 250);
    },

    waitForAPlayer: function() {
      var self = this;

      // APlayer is loaded via CDN and creates window.APlayer
      // The <meting-js> element handles initialization
      var checkInterval = setInterval(function() {
        var metingEl = document.querySelector('meting-js');
        if (metingEl && metingEl.aplayer) {
          clearInterval(checkInterval);
          self.onAPlayerReady(metingEl.aplayer);
        }
      }, 500);

      // Timeout after 10 seconds
      setTimeout(function() {
        clearInterval(checkInterval);
      }, 10000);
    },

    onAPlayerReady: function(ap) {
      if (!ap) return;
      // Store reference
      window.__aplayer = ap;

      // Force playlist and lyrics to fold/close on startup
      // Use a small delay to ensure APlayer has fully initialized DOM
      var self = this;
      setTimeout(function() {
        if (ap.lrc) {
          ap.lrc.hide();
        }
        if (ap.list) {
          ap.list.close();
        }
      }, 200);

      // Handle volume from settings
      var savedVolume = localStorage.getItem('musicVolume');
      if (savedVolume !== null) {
        ap.volume(parseFloat(savedVolume));
      }

      ap.on('volumechange', function() {
        localStorage.setItem('musicVolume', ap.audio.volume);
      });
    }
  };

  window.MusicPlayer = MusicPlayer;
  document.addEventListener('DOMContentLoaded', function() {
    MusicPlayer.init();
  });
  document.addEventListener('pjax:complete', function() {
    MusicPlayer.initLocalPlaylist();
  });
})();
