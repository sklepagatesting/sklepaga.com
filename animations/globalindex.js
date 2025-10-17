// textAnimations.js
document.addEventListener('fontLoadedAndPageVisible', () => {
  console.log('Font loaded and page visible, initializing text animations.');

  // Combine both classes
  const textElements = document.querySelectorAll('.rise, .sliding-up');

  textElements.forEach(textElement => {
    // Avoid double-processing if innerHTML already contains spans
    if (textElement.querySelector('span')) return;

    const words = textElement.textContent.trim().split(' ');
    textElement.innerHTML = words.map((word, index) => {
      const separator = (index < words.length - 1) ? '&nbsp;' : '';
      return `<span style="animation-delay: ${index * 0.1}s">${word}${separator}</span>`;
    }).join('');

    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observerInstance.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    observer.observe(textElement);
  });
});





function startTextAnimations() {
  document.querySelectorAll('.text-container .text-line').forEach((line, i) => {
    line.classList.add('animate');
    line.style.animationDelay = `${i * 0.07}s`; // matches animation duration
  });
}




function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|Tablet|Touch/i.test(navigator.userAgent);
  }

  function setMobileViewportHeight() {
    if (!isMobileDevice()) return;

    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  window.addEventListener('DOMContentLoaded', setMobileViewportHeight);
  window.addEventListener('resize', setMobileViewportHeight);


  



    document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("playReel");
  const overlayBg = document.getElementById("videoOverlayBg");
  let expanded = false;
  let placeholder = null;

function toggleVideoOverlay() {
  if (!expanded) {
    // Create placeholder to keep layout
    placeholder = document.createElement("div");
    placeholder.style.width = `${video.offsetWidth}px`;
    placeholder.style.height = `${video.offsetHeight}px`;
    video.parentNode.insertBefore(placeholder, video);

    // Measure BEFORE moving
    const rect = video.getBoundingClientRect();

    // Move to body
    document.body.appendChild(video);

    // Instantly lock position BEFORE any frame paints
    gsap.set(video, {
      position: "fixed",
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 9999,
      margin: 0,
      xPercent: 0,
      yPercent: 0
    });

    // Show overlay
    overlayBg.style.pointerEvents = "auto";
    gsap.to(overlayBg, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });

    // Animate to full screen (whole body)
    gsap.to(video, {
      top: 0,
      left: 0,
      xPercent: 0,
      yPercent: 0,
      width: "100vw",
      height: "100vh",
      borderRadius: "0px",
      duration: 0.5,
      ease: "power2.out"
    });

    document.body.classList.add("overlay-active");

  } else {
    // Collapse back
    const rect = placeholder.getBoundingClientRect();

    gsap.to(video, {
      top: rect.top,
      left: rect.left,
      xPercent: 0,
      yPercent: 0,
      width: rect.width,
      height: rect.height,
      borderRadius: "0px",
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        video.style = "";
        placeholder.parentNode.insertBefore(video, placeholder);
        placeholder.remove();
        placeholder = null;
      }
    });

    gsap.to(overlayBg, {
      opacity: 0,
      pointerEvents: "none",
      duration: 0.8,
      ease: "power3.inOut"
    });

    document.body.classList.remove("overlay-active");
  }

  expanded = !expanded;
}


  // Event listeners
  video.addEventListener("click", toggleVideoOverlay);
  overlayBg.addEventListener("click", toggleVideoOverlay);

  // Handle resize while expanded
  window.addEventListener("resize", () => {
    if (expanded) {
      const target = window.innerWidth > 768
        ? { width: window.innerWidth, height: window.innerHeight }
        : (() => {
            const w = window.innerWidth * 0.9;
            return { width: w, height: w * (9 / 16) };
          })();
      gsap.set(video, target);
    }
  });
});