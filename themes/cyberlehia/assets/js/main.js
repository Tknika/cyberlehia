// Mobile menu toggle
const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.getElementById("mobile-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    menu.classList.toggle("hidden", open);
    toggle.querySelector("[data-icon-open]").classList.toggle("hidden", !open);
    toggle.querySelector("[data-icon-close]").classList.toggle("hidden", open);
  });
}

// Background video. The poster image is the hero and is always shown first. The video is created only
// once the page has finished loading (and the browser is idle), while the hero is on screen, on screens
// >= 768px, and never with reduced motion, Save-Data or a slow (2G) connection. It fades in once it is
// actually playing (hides black frames, blocked autoplay and player UI); it is paused and hidden again
// when it scrolls off-screen, the tab is hidden or the window is narrowed below 768px.
const bgVideo = document.querySelector("[data-bg-video]");
const connection = navigator.connection;
const canPlayBgVideo =
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")));
const wideScreen = window.matchMedia("(min-width: 768px)");

// Run fn after load, when the browser is idle, so the video never competes with the page itself.
const whenIdle = (fn) => {
  const run = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
};

// Self-hosted loop (preferred). start() attaches the <source> URLs the first time only.
const fileVideo = (video) => {
  let started = false;
  video.addEventListener("playing", () => video.classList.remove("opacity-0"));
  video.addEventListener("pause", () => video.classList.add("opacity-0"));
  return {
    start() {
      if (started) return;
      started = true;
      video.querySelectorAll("source[data-src]").forEach((s) => (s.src = s.dataset.src));
      video.load();
    },
    play: () => video.play().catch(() => {}), // autoplay refused: the poster stays visible
    pause: () => video.pause(),
  };
};

// YouTube fallback. start() creates the iframe and loads the IFrame API the first time only.
const youTubeVideo = (holder) => {
  let player = null;
  let wantPlay = false;

  const createPlayer = (iframe) => {
    new window.YT.Player(iframe, {
      events: {
        onReady: (e) => {
          player = e.target;
          player.mute();
          if (wantPlay) player.playVideo();
          else player.pauseVideo(); // narrowed or scrolled away while the player was loading
        },
        onStateChange: (e) => {
          iframe.classList.toggle("opacity-0", e.data !== window.YT.PlayerState.PLAYING);
        },
      },
    });
  };

  return {
    start() {
      if (!holder.isConnected) return; // already started
      const id = holder.dataset.youtubeId;
      const iframe = document.createElement("iframe");
      iframe.className = "opacity-0 transition-opacity duration-1000";
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&enablejsapi=1`;
      iframe.title = holder.dataset.title;
      iframe.allow = "autoplay; encrypted-media";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.tabIndex = -1;
      holder.replaceWith(iframe);

      if (window.YT && window.YT.Player) {
        createPlayer(iframe);
      } else {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (previous) previous();
          createPlayer(iframe);
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    },
    play() {
      wantPlay = true;
      if (player) player.playVideo();
    },
    pause() {
      wantPlay = false;
      if (player) player.pauseVideo();
    },
  };
};

if (bgVideo && canPlayBgVideo) {
  const video = bgVideo.dataset.bgVideo === "file" ? fileVideo(bgVideo) : youTubeVideo(bgVideo);
  const hero = bgVideo.closest(".video-bg") || bgVideo;
  let pageReady = false;
  let inView = false;

  const update = () => {
    if (pageReady && inView && wideScreen.matches && !document.hidden) {
      video.start();
      video.play();
    } else {
      video.pause();
    }
  };

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  }).observe(hero);
  document.addEventListener("visibilitychange", update);
  wideScreen.addEventListener("change", update);
  whenIdle(() => {
    pageReady = true;
    update();
  });
}

// Video lists ({{< videos >}}): nothing is loaded from YouTube until a tile is clicked, then the tile
// becomes a youtube-nocookie player. Ctrl/Cmd/middle click keeps the normal link to YouTube.
document.addEventListener("click", (e) => {
  const tile = e.target.closest("a[data-yt]");
  if (!tile || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${tile.dataset.yt}?autoplay=1&rel=0`;
  iframe.title = tile.dataset.ytTitle || "YouTube";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  iframe.className = "aspect-video w-full";
  tile.replaceWith(iframe);
});
