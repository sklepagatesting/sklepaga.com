
// --- Get only images with data-transition ---
const currentImage = document.querySelector("[data-transition]#image-current");
const nextImage = document.querySelector("[data-transition]#image-next");
const titles = document.querySelectorAll(".article-title");

let lastSrc = null;
let lastHovered = null;
let lastMoveTime = performance.now();
let lastX = 0;
let lastY = 0;
let currentLink = null; // Track the link of the hovered title

// --- Main function to show new image ---
function showImage(target, e) {
  const newSrc = target.dataset.img;
  if (!newSrc || newSrc === lastSrc) return;

  lastSrc = newSrc;

  // --- Update current link ---
  if (target.tagName.toLowerCase() === "a") {
    currentLink = target.href;
  } else {
    const link = target.closest("a");
    currentLink = link ? link.href : null;
  }

  // --- Remove highlight from old title ---
  if (lastHovered && lastHovered !== target) {
    lastHovered.classList.remove("bg-gray-100", "dark:bg-gray-700");
  }

  // --- Highlight current title ---
  target.classList.add("bg-gray-100", "dark:bg-gray-700");
  lastHovered = target;

  // --- Calculate mouse speed for dynamic duration ---
  const now = performance.now();
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  const dt = now - lastMoveTime;
  const distance = dt > 0 ? Math.sqrt(dx * dx + dy * dy) : 0;
  const speed = dt > 0 ? distance / dt : 0;

  const fastThreshold = 0.5;
  const duration = speed > fastThreshold ? 0.2 : 0.4;

  // --- Stop ongoing animations ---
  gsap.killTweensOf([currentImage, nextImage]);

  // --- Prepare next image ---
  nextImage.src = newSrc;
  gsap.set(nextImage, { scale: 1.1, opacity: 0, zIndex: 2 });
  gsap.set(currentImage, { zIndex: 1 });

  // --- Animate transition ---
  gsap.to(nextImage, {
    opacity: 1,
    scale: 1,
    duration,
    ease: "power2.out",
    onComplete: () => {
      currentImage.src = newSrc;
      gsap.set(currentImage, { opacity: 1 });
      gsap.set(nextImage, { opacity: 0 });
    }
  });
}

// --- Mouse move listener ---
document.addEventListener("mousemove", (e) => {
  lastX = e.clientX;
  lastY = e.clientY;
  lastMoveTime = performance.now();

  const hoveredTitle = [...titles].find(title => title.contains(e.target));
  if (hoveredTitle && hoveredTitle !== lastHovered) {
    showImage(hoveredTitle, e);
  }
});

// --- Click listener for images ---
function handleImageClick() {
  if (currentLink) {
    // Try to find a matching [data-transition] link first
    const linkEl = document.querySelector(`[data-transition][href="${currentLink}"]`);
    if (linkEl) {
      linkEl.click(); // Let transition animation handle navigation
    } else {
      window.location.href = currentLink; // Fallback if no match
    }
  }
}

[currentImage, nextImage].forEach(img => {
  if (img) {
    img.addEventListener("click", handleImageClick);
  }
});

// --- Initial GSAP setup ---
gsap.set(currentImage, { opacity: 0, zIndex: 1 });
gsap.set(nextImage, { opacity: 0, zIndex: 2 });
