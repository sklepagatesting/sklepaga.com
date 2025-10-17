// page-transition.js

// --- 1. Inject transition elements and styles early ---
(function injectTransitionElements() {
    // Inject CSS styles for the transition elements
    const style = document.createElement("style");
    style.innerHTML = `
        html, body {
            /* Added to ensure background color is set for transition */
            background: white; 
            margin: 0;
            padding: 0;
        }
        #page-transition {
            position: fixed;
            bottom: 0;
            left: 50%;
            width: 10px; /* Start small */
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: translateX(-50%) translateY(0) scale(1);
            z-index: 10000;
            pointer-events: none;
            /* Using a simple ease-in-out for consistency, but a custom curve looks better */
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

    // Inject the necessary DOM elements
    const transitionDiv = document.createElement("div");
    transitionDiv.id = "page-transition";
    const overlayDiv = document.createElement("div");
    overlayDiv.id = "page-overlay";

    // Insert at the beginning of the body
    // Using requestAnimationFrame to ensure insertion happens after style application
    requestAnimationFrame(() => {
        document.body.insertBefore(transitionDiv, document.body.firstChild);
        document.body.insertBefore(overlayDiv, document.body.firstChild);
    });
})();

// --- 2. Cleanup function for when the page loads/restores ---
function cleanupTransitionElements() {
    const transitionEl = document.getElementById("page-transition");
    const overlayEl = document.getElementById("page-overlay");
    if (transitionEl) transitionEl.style.display = 'none';
    if (overlayEl) overlayEl.style.display = 'none';
}

// --- 3. Main Transition Setup Function (Globally Accessible for dynamic content) ---
// We expose this function on the window object so it can be called 
// from your Firestore module script after content is rendered.
window.setupPageTransition = function() {
    const transitionEl = document.getElementById("page-transition");
    const overlayEl = document.getElementById("page-overlay");

    if (!transitionEl || !overlayEl) {
        console.error("Page transition elements not found in DOM.");
        return;
    }

    // Select ALL elements with the data-transition attribute
    document.querySelectorAll('[data-transition]').forEach(link => {
        // Use a custom attribute to prevent adding multiple listeners
        if (link.hasAttribute('data-transition-listener-attached')) {
            return; 
        }
        
        link.setAttribute('data-transition-listener-attached', 'true'); // Mark as handled

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');

            // --- Reset and Prepare for Animation ---
            
            // Temporarily disable transitions for instant reset
            transitionEl.style.transition = "none";
            overlayEl.style.transition = "none";
            
            // Reset to starting state (small dot at the bottom)
            transitionEl.style.bottom = "0";
            transitionEl.style.left = "50%";
            transitionEl.style.width = "10px";
            transitionEl.style.height = "10px";
            transitionEl.style.borderRadius = "50%";
            transitionEl.style.transform = "translateX(-50%) translateY(0) scale(1)";
            overlayEl.style.background = "rgba(0,0,0,0)";
            
            // Show the elements
            transitionEl.style.display = "block";
            overlayEl.style.display = "block";

            // --- Start Animation using requestAnimationFrame for smooth transition ---
            requestAnimationFrame(() => {
                // Re-enable transitions
                transitionEl.style.transition =
                    "bottom 1s ease-in-out, width 1s ease-in-out, height 1s ease-in-out, transform 1s ease-in-out";
                overlayEl.style.transition = "background 1s ease-in-out";

                // Animate to full screen
                transitionEl.style.bottom = "50%";
                transitionEl.style.width = "100vw";
                transitionEl.style.height = "100vh";
                transitionEl.style.borderRadius = "0";
                // Moves it up by half its height to perfectly center it before scaling
                transitionEl.style.transform = "translateX(-50%) translateY(50%) scale(1)"; 
                overlayEl.style.background = "rgba(0,0,0,0.5)";
            });

            // Navigate after the transition time (1000ms)
            setTimeout(() => {
                window.location.href = href;
            }, 1000);
        });
    });
};

// --- 4. Attach Setup and Cleanup Hooks ---

// 1. Initial Setup: Attach the main setup on first DOM load
document.addEventListener('DOMContentLoaded', window.setupPageTransition);
document.addEventListener('DOMContentLoaded', cleanupTransitionElements);

// 2. Cleanup on Restore: Handle back/forward cache (bfcache) restore
window.addEventListener('pageshow', (event) => {
    // Check if the page was restored from bfcache
    if (event.persisted) { 
        cleanupTransitionElements();
    }
});
