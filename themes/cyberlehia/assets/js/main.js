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

// Background video: keep the poster visible and only reveal the YouTube iframe
// while it is actually playing (hides black frames, blocked autoplay and player UI).
const bgVideo = document.querySelector("[data-bg-video]");

if (bgVideo && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const setup = () => {
    new window.YT.Player(bgVideo, {
      events: {
        onReady: (e) => {
          e.target.mute();
          e.target.playVideo();
        },
        onStateChange: (e) => {
          bgVideo.classList.toggle("opacity-0", e.data !== window.YT.PlayerState.PLAYING);
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
}
