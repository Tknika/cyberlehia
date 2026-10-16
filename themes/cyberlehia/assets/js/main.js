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

// Background video. The poster image is always shown; the video is only loaded after the page has
// finished loading, and never with reduced motion, Save-Data or a slow (2G) connection. It fades in
// once it is actually playing (hides black frames, blocked autoplay and player UI) and pauses while
// off-screen or in a background tab.
const bgVideo = document.querySelector("[data-bg-video]");
const connection = navigator.connection;
const canPlayBgVideo =
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || "")));

// Run fn after load, when the browser is idle, so the video never competes with the page itself.
const whenIdle = (fn) => {
  const run = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
};

// Call play/pause as the hero enters/leaves the viewport or the tab is hidden.
const playWhileVisible = (el, play, pause) => {
  let inView = true;
  const update = () => (inView && !document.hidden ? play() : pause());
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  }).observe(el);
  document.addEventListener("visibilitychange", update);
};

// Self-hosted loop (preferred): attach the <source> URLs, then play.
const setupFileVideo = (video) => {
  video.querySelectorAll("source[data-src]").forEach((s) => (s.src = s.dataset.src));
  video.addEventListener("playing", () => video.classList.remove("opacity-0"));
  video.load();
  playWhileVisible(
    video,
    () => video.play().catch(() => {}), // autoplay refused: the poster stays visible
    () => video.pause(),
  );
};

// YouTube fallback: create the iframe and drive it with the IFrame API.
const setupYouTube = (holder) => {
  const id = holder.dataset.youtubeId;
  const iframe = document.createElement("iframe");
  iframe.className = "opacity-0 transition-opacity duration-1000";
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&enablejsapi=1`;
  iframe.title = holder.dataset.title;
  iframe.allow = "autoplay; encrypted-media";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.tabIndex = -1;
  holder.replaceWith(iframe);

  const setup = () => {
    new window.YT.Player(iframe, {
      events: {
        onReady: (e) => {
          e.target.mute();
          playWhileVisible(
            iframe,
            () => e.target.playVideo(),
            () => e.target.pauseVideo(),
          );
        },
        onStateChange: (e) => {
          iframe.classList.toggle("opacity-0", e.data !== window.YT.PlayerState.PLAYING);
        },
      },
    });
  };

  if (window.YT && window.YT.Player) {
    setup();
  } else {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      setup();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
};

if (bgVideo && canPlayBgVideo) {
  if (bgVideo.dataset.bgVideo === "file") {
    whenIdle(() => setupFileVideo(bgVideo));
  } else if (window.matchMedia("(min-width: 768px)").matches) {
    // The YouTube player is ~0.5 MB of script plus a streamed video: on phones the poster is enough.
    whenIdle(() => setupYouTube(bgVideo));
  }
}
