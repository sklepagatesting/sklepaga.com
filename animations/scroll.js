// --- Optimized Inertia Scroll ---
(function() {
  let y = 0, v = 0, animating = false;
  const friction = 0.92, threshold = 0.1, maxV = 80, scale = 0.6;
  
  function animate() {
    v *= friction;
    if (Math.abs(v) < threshold) {
      v = 0;
      animating = false;
      return;
    }
    y = Math.max(0, Math.min(y + v, document.documentElement.scrollHeight - window.innerHeight));
    window.scrollTo(0, y);
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('wheel', function(e) {
    e.preventDefault();
    y = window.pageYOffset;
    v = Math.max(-maxV, Math.min(maxV, v + Math.max(-8, Math.min(8, e.deltaY * scale))));
    if (!animating && Math.abs(v) >= threshold) {
      animating = true;
      requestAnimationFrame(animate);
    }
  }, { passive: false });
  
  window.addEventListener('load', function() {
    y = window.pageYOffset;
  });
})();
