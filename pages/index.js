



let isAnimating = false;

// Core hover logic — used for both desktop and mobile
function handleTitleHover(title, speed = 0.5) {
  const newSrc = title.dataset.img;
  if (!newSrc || currentImage.src === newSrc || isAnimating) return;

  isAnimating = true;
  nextImage.src = newSrc;
  nextImage.style.opacity = 1;
  nextImage.style.transform = "scale(1.1)";
  currentImage.style.transform = "scale(1)";

  gsap.to(currentImage, {
    opacity: 0,
    scale: 1.05,
    duration: speed,
    ease: "power4.out"
  });

  gsap.to(nextImage, {
    opacity: 1,
    scale: 1,
    duration: speed,
    ease: "power4.out",
    onComplete: () => {
      currentImage.src = newSrc;
      currentImage.style.opacity = 1;
      nextImage.style.opacity = 0;
      isAnimating = false;
    }
  });

  lastSrc = newSrc;
}

// Desktop hover
titles.forEach(title => {
  title.addEventListener("mouseenter", () => {
    handleTitleHover(title); // normal speed
  });
});

// Mobile scroll/select support
if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  window.addEventListener("scroll", () => {
    const viewportHeight = window.innerHeight;
    let activeTitle = null;

    titles.forEach(title => {
      const rect = title.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;

      if (midPoint > 0 && midPoint < viewportHeight) {
        activeTitle = title;
      }
    });

    if (activeTitle) {
      handleTitleHover(activeTitle, 0.2); // faster speed for fast scroll
    }
  }, { passive: true });
}








