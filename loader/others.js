// --- Inject transition elements and styles early ---
(function injectTransitionElements() {
  const style = document.createElement("style");
  style.innerHTML = `
    html, body {
      background: white;
      margin: 0;
      padding: 0;
    }
    #page-transition {
      position: fixed;
      bottom: 0;
      left: 50%;
      width: 60px;
      height: 10px;
      background: white;
      border-radius: 50%;
      transform: translateX(-50%) translateY(0) scale(1);
      z-index: 10000;
      pointer-events: none;
      transition:
        bottom 1s ease-in-out,
        width 1s ease-in-out,
        height 1s ease-in-out,
        transform 1s ease-in-out;
      display: none;
    }
    #page-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0);
      pointer-events: none;
      z-index: 9999;
      transition: background 1s ease-in-out;
      display: none;
    }
  `;
  document.head.appendChild(style);

  const transitionDiv = document.createElement("div");
  transitionDiv.id = "page-transition";
  const overlayDiv = document.createElement("div");
  overlayDiv.id = "page-overlay";

  document.body.insertBefore(transitionDiv, document.body.firstChild);
  document.body.insertBefore(overlayDiv, document.body.firstChild);
})();

// --- Always run loader on every page load ---
const shouldRunLoader = true;

// **********************************************
// 1. GLOBAL CONTENT READY CONTROL
// **********************************************

// Global Promise that resolves when all critical dynamic content (like Firebase data) is loaded and rendered.
let resolveContentLoaded;
const contentLoadedPromise = new Promise(resolve => {
  resolveContentLoaded = resolve;
});

// The Firebase script must call resolveContentLoaded() when it's done.

// --- Text reveal with IntersectionObserver ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const textLine = entry.target.querySelector('.text-line');
      if (textLine) {
        const allContainers = Array.from(document.querySelectorAll('.text-container'));
        const index = allContainers.indexOf(entry.target);
        textLine.style.animationDelay = `${index * 0.2}s`;
        textLine.classList.add('animate');
        observer.unobserve(entry.target);
      }
    }
  });
}, { threshold: 1 });

function startObservingText() {
  document.querySelectorAll('.text-container').forEach(container => {
    observer.observe(container);
  });
}

function heroIn() {
  gsap.from(".hero", {
    y: 50,
    opacity: 0,
    duration: 1.2,
    ease: "power4.inOut"
  });
}

// --- Loader animation (ORIGINAL) ---
function runLoader() {
  const screen = document.createElement('div');
  Object.assign(screen.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100dvh',
    backgroundColor: 'white',
    zIndex: '999999999',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
    transform: 'scale(1)',
    transition: 'clip-path 1s cubic-bezier(.94,-0.01,0,.99), transform 1s cubic-bezier(.89,.04,0,.99)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'black',
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif'
  });
  document.documentElement.appendChild(screen);

  const shadowOverlay = document.createElement('div');
  Object.assign(shadowOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100dvh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: '999999998',
    opacity: '1',
    transition: 'opacity 1s ease-out'
  });
  document.documentElement.appendChild(shadowOverlay);

  const whiteOverlay = document.createElement('div');
  Object.assign(whiteOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100dvh',
    backgroundColor: 'white',
    zIndex: '999999997'
  });
  document.documentElement.appendChild(whiteOverlay);

  const counter = document.createElement('div');
  counter.textContent = '0%';
  counter.style.transform = 'scale(1)';
  counter.style.transition = 'transform 0.2s ease';
  screen.appendChild(counter);

  let fakeProgress = 0;
  let interval = setInterval(() => {
    if (fakeProgress < 90) {
      fakeProgress += Math.random() * 5;
      counter.textContent = `${Math.floor(fakeProgress)}%`;
      counter.style.transform = `scale(${1 + fakeProgress / 100})`;
    }
  }, 100);

  // ******************************************************************
  // 2. WAIT FOR BOTH window.load AND contentLoadedPromise to resolve
  // ******************************************************************
  const assetsLoaded = new Promise(resolve => window.addEventListener('load', resolve));

  Promise.all([assetsLoaded, contentLoadedPromise]).then(() => {
    clearInterval(interval);

    let finalProgress = fakeProgress;
    const completeInterval = setInterval(() => {
      finalProgress += 2;
      // Cap at 99% until content is fully confirmed ready to transition
      counter.textContent = `${Math.min(100, Math.floor(finalProgress))}%`;
      counter.style.transform = `scale(${1 + finalProgress / 100})`;

      if (finalProgress >= 100) {
        clearInterval(completeInterval);
        screen.style.clipPath = 'polygon(0 0, 100% 0, 100% 0, 0 0)';
        screen.style.transform = 'scale(0)';
        shadowOverlay.style.opacity = '0';

        setTimeout(() => {
          screen.remove();
          shadowOverlay.remove();
          whiteOverlay.remove();

          const wrapper = document.getElementById("main-content");
          if (wrapper) wrapper.style.display = "block";
          document.body.style.overflow = "auto";
          document.body.classList.remove("preload");

          heroIn();
          startObservingText();
          window.dispatchEvent(new Event("scroller:start"));
          window.dispatchEvent(new Event("page:ready"));
        }, 1000);
      }
    }, 20);
  });
}

// Global flag to control when transitions are allowed
let isPageReady = false;

// --- Page Transition Logic ---
function setupPageTransition() {
  const transitionEl = document.getElementById("page-transition");
  const overlayEl = document.getElementById("page-overlay");

  document.querySelectorAll('[data-transition]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!isPageReady) {
        return;
      }

      e.preventDefault();
      const href = link.getAttribute('href');

      transitionEl.style.display = "none";
      overlayEl.style.display = "none";

      transitionEl.style.transition = "none";
      transitionEl.style.bottom = "0";
      transitionEl.style.left = "50%";
      transitionEl.style.width = "10px";
      transitionEl.style.height = "10px";
      transitionEl.style.borderRadius = "50%";
      transitionEl.style.transform = "translateX(-50%) translateY(0) scale(1)";
      overlayEl.style.transition = "none";
      overlayEl.style.background = "rgba(0,0,0,0)";

      transitionEl.style.display = "block";
      overlayEl.style.display = "block";

      requestAnimationFrame(() => {
        transitionEl.style.transition = "bottom 1s ease-in-out, width 1s ease-in-out, height 1s ease-in-out, transform 1s ease-in-out";
        transitionEl.style.bottom = "50%";
        transitionEl.style.width = "100vw";
        transitionEl.style.height = "100vh";
        transitionEl.style.borderRadius = "0";
        transitionEl.style.transform = "translateX(-50%) translateY(50%) scale(1)";

        overlayEl.style.transition = "background 1s ease-in-out";
        overlayEl.style.background = "rgba(0,0,0,0.5)";
      });

      setTimeout(() => {
        window.location.href = href;
      }, 1000);
    });
  });
}

// --- Breakpoint reload ---
const BREAKPOINTS = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity }
};

function getBreakpoint() {
  const w = window.innerWidth;
  if (w <= BREAKPOINTS.mobile.max) return "mobile";
  if (w <= BREAKPOINTS.tablet.max) return "tablet";
  return "desktop";
}

let prevBreakpoint = getBreakpoint();

window.addEventListener("resize", () => {
  const bp = getBreakpoint();
  if (bp !== prevBreakpoint) {
    prevBreakpoint = bp;
    window.location.href = window.location.pathname +
      (window.location.search ? window.location.search + '&' : '?') +
      '_br=' + Date.now();
  }
});

/**
 * NEW FUNCTION: Skips the counter loader but runs the scroller intro animation.
 */
function skipLoaderButRunIntro() {
    // 1. Immediately create and destroy the loader screen elements quickly
    const screen = document.createElement('div');
    Object.assign(screen.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100dvh',
        backgroundColor: 'white',
        zIndex: '999999999'
    });
    document.documentElement.appendChild(screen);

    const shadowOverlay = document.createElement('div');
    Object.assign(shadowOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '999999998',
        opacity: '1' // Start visible
    });
    document.documentElement.appendChild(shadowOverlay);

    contentLoadedPromise.then(() => {
        // 2. Start a fast exit animation (0.5s transition)
        screen.style.transition = 'clip-path 0.5s cubic-bezier(.94,-0.01,0,.99), transform 0.5s cubic-bezier(.89,.04,0,.99), opacity 0.5s';
        screen.style.clipPath = 'polygon(0 0, 100% 0, 100% 0, 0 0)';
        screen.style.transform = 'scale(0)';
        shadowOverlay.style.transition = 'opacity 0.5s ease-out';
        shadowOverlay.style.opacity = '0';
        
        // 3. Complete the cleanup and content reveal
        setTimeout(() => {
            screen.remove();
            shadowOverlay.remove();

            const wrapper = document.getElementById("main-content");
            if (wrapper) wrapper.style.display = "block";
            document.body.style.overflow = "auto";
            document.body.classList.remove("preload");

            // *** CRITICAL FIX: Reset the saved position to force the scroller intro animation to run ***
            sessionStorage.removeItem('scrollerPosition'); 
            
            heroIn();
            startObservingText();
            window.dispatchEvent(new Event("scroller:start"));
            window.dispatchEvent(new Event("page:ready"));
        }, 500); // Match the 0.5s transition time
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const isFirstVisit = !sessionStorage.getItem("visited");
  // Set visited regardless of loader status
  sessionStorage.setItem("visited", "true");

  if (isFirstVisit && shouldRunLoader) {
    // Run full loader only on TRUE first visit (original behavior)
    runLoader();
  } else {
    // *** MODIFIED: Use the fast skip function that still runs the intro animation ***
    skipLoaderButRunIntro();
  }

  window.addEventListener('page:ready', () => {
    isPageReady = true;
  });

  setupPageTransition();
});


// --- Force reload on back/forward navigation ---
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

// ============================================
// SCROLLER SCRIPT - Runs after loader completes
// (Modified for position persistence and intro check)
// ============================================

window.addEventListener("scroller:start", () => {
  // Prevent duplicate initialization
  if (window.scrollerInitialized) return;
  window.scrollerInitialized = true;

  // Check if dependencies are ready
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded yet');
    return;
  }

  const scroller = document.getElementById("scroller");
  if (!scroller) {
    console.warn('Scroller element not found');
    return;
  }

  // --- Duplicate for seamless loop ---
  scroller.innerHTML += scroller.innerHTML;
  const scrollWidth = scroller.scrollWidth / 2;

  // --- Get initial offset from first card ---
  const firstCard = scroller.children[0];
  const cardStyle = window.getComputedStyle(firstCard);
  const marginRight = parseFloat(cardStyle.marginRight);
  const initialOffset = marginRight;

  // *** MODIFIED: Initialize position using saved value or default offset ***
  // NOTE: If 'scrollerPosition' was cleared in skipLoaderButRunIntro(), 
  // this defaults to initialOffset, which is desired to re-run the intro.
  const savedPosition = sessionStorage.getItem('scrollerPosition');
  let position = savedPosition !== null ? parseFloat(savedPosition) : initialOffset;
  // *********************************************************************
  
  let velocity = 0;
  let scrollAllowed = false;

  // --- Set initial scroll position ---
  gsap.set(scroller, { x: position });

  const cards = scroller.children;

  // --- Prevent scroller collapsing during animation ---
  const cardHeight = cards[0].offsetHeight;
  scroller.style.height = cardHeight + "px";
  scroller.style.overflow = "hidden";

  // --- GPU-optimized initial state for cards ---
  gsap.set(cards, {
    scaleY: 0,
    transformOrigin: "bottom right",
    willChange: "transform"
  });

  // --- SCROLL LOCK HELPERS ---
  const preventScroll = (e) => e.preventDefault();

  const keyScrollBlock = (e) => {
    const blocked = [32, 33, 34, 35, 36, 37, 38, 39, 40];
    if (blocked.includes(e.keyCode)) e.preventDefault();
  };

  const lockScroll = () => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', keyScrollBlock, { passive: false });
  };

  const unlockScroll = () => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.height = '';

    window.removeEventListener('wheel', preventScroll, { passive: false });
    window.removeEventListener('touchmove', preventScroll, { passive: false });
    window.removeEventListener('keydown', keyScrollBlock, { passive: false });
  };

  // Determine if the intro animation should run (i.e., if scrollerPosition is NOT set)
  const shouldRunIntroAnimation = sessionStorage.getItem("scrollerPosition") === null;

  if (shouldRunIntroAnimation) {
      lockScroll();
  } else {
      // If position was loaded from session storage, allow scroll immediately
      scrollAllowed = true;
  }
  
  // --- INTRO ANIMATION EXECUTION ---
  if (shouldRunIntroAnimation) {
      // The content has loaded, now run the visual scroller intro
      setTimeout(() => {
          const fastDuration = 2;
          const fastDistance = scrollWidth * 1.5;
  
          const tl = gsap.timeline({
              onComplete: () => {
                  position = parseFloat(gsap.getProperty(scroller, "x"));
                  
                  // *** FIX 1: Save the final position after the intro animation ***
                  sessionStorage.setItem('scrollerPosition', position);
                  // **************************************************************
  
                  scroller.style.height = "";
                  scroller.style.overflow = "";
  
                  unlockScroll();
                  scrollAllowed = true;
              }
          });
  
          tl.to(cards, {
              scaleY: 1,
              duration: 1,
              ease: "power4.out"
          }, 0);
  
          tl.to(scroller, {
              x: `-=${fastDistance}`,
              duration: fastDuration,
              ease: "power4.out",
              modifiers: {
                  x: gsap.utils.unitize(x => {
                      const raw = parseFloat(x);
                      const looped = raw % scrollWidth;
                      return looped;
                  })
              }
          }, 0);
      }, 2000); // 2-second delay to match the end of the original full loader/content-ready
  } else {
      // If skipping the animation, set final card state immediately
      gsap.set(cards, { scaleY: 1 });
      scroller.style.height = "";
      scroller.style.overflow = "";
  }


  // --- WHEEL INPUT ---
  window.addEventListener("wheel", (e) => {
    if (!scrollAllowed) return;
    velocity += e.deltaY * 0.05;
  }, { passive: true });

  // --- TOUCH INPUT ---
  const touchScrollMultiplier = 0.12;
  let startY;
  let isDraggingDown = false;

  window.addEventListener("touchstart", (e) => {
    if (!scrollAllowed) return;
    startY = e.touches[0].clientY;
    velocity = 0;
    isDraggingDown = false;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!scrollAllowed) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    if (deltaY > 0) isDraggingDown = true;

    velocity += -deltaY * touchScrollMultiplier;
    startY = currentY;

    if (window.scrollY === 0 && isDraggingDown) {
      e.preventDefault();
    }
  }, { passive: false });

  // --- GSAP Infinite Carousel Scroll Logic ---
  gsap.ticker.add(() => {
    if (Math.abs(velocity) > 0.001) {
      position -= velocity;
      velocity *= 0.94;

      if (position <= -scrollWidth) {
        position += scrollWidth;
      }
      if (position >= 0) {
        position -= scrollWidth;
      }

      gsap.set(scroller, { x: position });
    }
  });
});