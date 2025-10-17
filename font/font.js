// fontLoader.js

document.addEventListener('DOMContentLoaded', () => {
    const contentElement = document.body;
    let fontLoaded = false;

    // Apply the 'preload' class to your <body> in HTML: <body class="preload">
    // And in your CSS:
    // body.preload { visibility: hidden; opacity: 0; }
    // body { transition: opacity 0.5s ease-in; }

    document.fonts.ready.then(() => {
        // Check for common Inter weights (adjust if you use others)
        if (document.fonts.check('400 1em Inter') || document.fonts.check('700 1em Inter')) {
            console.log('Inter font(s) loaded via FontFaceSet API!');
            fontLoaded = true;
            // Add a very slight delay before showing, just in case of a repaint issue
            setTimeout(() => {
                contentElement.style.visibility = 'visible';
                contentElement.style.opacity = '1';
                contentElement.classList.remove('preload'); // Remove if using class-based hiding
                // Dispatch custom event once font is loaded and page is visible
                document.dispatchEvent(new CustomEvent('fontLoadedAndPageVisible'));
            }, 50); // Small delay, e.g., 50ms
        } else {
            console.warn('Inter font not explicitly detected by document.fonts.check. Showing content with fallback.');
            contentElement.style.visibility = 'visible';
            contentElement.style.opacity = '1';
            contentElement.classList.remove('preload');
            document.dispatchEvent(new CustomEvent('fontLoadedAndPageVisible'));
        }
    }).catch(error => {
        console.error('Error while waiting for fonts:', error);
        contentElement.style.visibility = 'visible';
        contentElement.style.opacity = '1';
        contentElement.classList.remove('preload');
        document.dispatchEvent(new CustomEvent('fontLoadedAndPageVisible'));
    });

    // Robust Timeout Fallback: Always show content after a reasonable delay
    setTimeout(() => {
        if (!fontLoaded) { // Only force show if font wasn't already confirmed
            console.warn('Timeout reached. Forcibly displaying page content.');
            contentElement.style.visibility = 'visible';
            contentElement.style.opacity = '1';
            contentElement.classList.remove('preload');
            document.dispatchEvent(new CustomEvent('fontLoadedAndPageVisible'));
        }
    }, 3000); // Max 3 seconds wait
});

