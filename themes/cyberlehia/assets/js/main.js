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

// Desktop submenus open on hover and focus (CSS). Escape closes the open one (WCAG 1.4.13) until the
// pointer or focus leaves it, and puts the focus back on its parent link.
document.querySelectorAll("[data-submenu]").forEach((submenu) => {
  const item = submenu.parentElement;
  const reset = () => (submenu.style.visibility = "");
  item.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    submenu.style.visibility = "hidden";
    item.querySelector("a").focus();
  });
  item.addEventListener("mouseleave", reset);
  item.addEventListener("focusout", (e) => {
    if (!item.contains(e.relatedTarget)) reset();
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll("[data-submenu]").forEach((s) => {
    if (s.parentElement.matches(":hover")) s.style.visibility = "hidden";
  });
});

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

// YouTube fallback. start() creates the youtube-nocookie iframe the first time only. The player is driven
// with postMessage instead of YouTube's IFrame API script: that script comes from www.youtube.com and sets
// YouTube cookies, while the bare youtube-nocookie player sets none.
const youTubeVideo = (holder) => {
  const ytOrigin = "https://www.youtube-nocookie.com";
  let iframe = null;
  let ready = false;
  let wantPlay = false;

  const command = (func) => {
    if (iframe && ready) iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: [] }), ytOrigin);
  };

  window.addEventListener("message", (e) => {
    if (!iframe || e.origin !== ytOrigin || e.source !== iframe.contentWindow) return;
    let data;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }
    if (data.event === "onReady" || (data.event === "infoDelivery" && !ready)) {
      ready = true;
      command(wantPlay ? "playVideo" : "pauseVideo"); // narrowed or scrolled away while the player was loading
    }
    const state = data.event === "onStateChange" ? data.info : data.info && data.info.playerState;
    if (typeof state === "number") iframe.classList.toggle("opacity-0", state !== 1); // 1 = playing
  });

  return {
    start() {
      if (iframe) return; // already started
      const id = holder.dataset.youtubeId;
      iframe = document.createElement("iframe");
      iframe.className = "opacity-0 transition-opacity duration-1000";
      iframe.src = `${ytOrigin}/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      iframe.title = holder.dataset.title;
      iframe.allow = "autoplay; encrypted-media";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.tabIndex = -1;
      // Ask the player to report its events (onReady, state changes) to this page.
      iframe.addEventListener("load", () => iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), ytOrigin));
      holder.replaceWith(iframe);
    },
    play() {
      wantPlay = true;
      command("playVideo");
    },
    pause() {
      wantPlay = false;
      command("pauseVideo");
    },
  };
};

if (bgVideo && canPlayBgVideo) {
  const video = bgVideo.dataset.bgVideo === "file" ? fileVideo(bgVideo) : youTubeVideo(bgVideo);
  const hero = bgVideo.closest(".video-bg") || bgVideo;
  const toggleBtn = document.querySelector("[data-bg-video-toggle]");
  let pageReady = false;
  let inView = false;
  let userPaused = false;

  const update = () => {
    const active = pageReady && wideScreen.matches;
    // The pause button is offered wherever the video can play (WCAG 2.2.2: moving content can be paused).
    if (toggleBtn) toggleBtn.hidden = !active;
    if (active && inView && !document.hidden && !userPaused) {
      video.start();
      video.play();
    } else {
      video.pause();
    }
  };

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      const label = userPaused ? toggleBtn.dataset.labelPlay : toggleBtn.dataset.labelPause;
      toggleBtn.querySelector("[data-label]").textContent = label;
      toggleBtn.querySelector("[data-icon-pause]").classList.toggle("hidden", userPaused);
      toggleBtn.querySelector("[data-icon-play]").classList.toggle("hidden", !userPaused);
      update();
    });
  }

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
