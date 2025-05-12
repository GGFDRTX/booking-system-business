// Navigation JavaScript
let navigationInitialized = false;

function initializeNavigation() {
    if (navigationInitialized) {
        console.log('Navigation already initialized');
        return;
    }

    console.log('Initializing navigation module');

    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section-content');

    if (!navLinks.length || !sections.length) {
        console.error('Navigation elements not found:', {
            navLinks: navLinks.length,
            sections: sections.length
        });
        return;
    }

    // Hide all sections except dashboard initially
    function hideAllSections() {
        sections.forEach(section => {
            section.classList.remove('active');
            console.log('Hiding section:', section.id);
        });
    }

    // Show specific section
    function showSection(sectionId) {
        console.log(`Attempting to show section: ${sectionId}`);

        // Hide all sections first
        const sections = document.querySelectorAll('.section-content');
        sections.forEach(section => {
            if (section.id !== sectionId) {
                console.log(`Hiding section: ${section.id}`);
                section.classList.remove('active');
                section.style.display = 'none';
            }
        });

        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            console.log(`Successfully showed section: ${sectionId}`);

            // Update active state in navigation
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.getAttribute('data-section') === sectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Dispatch section change event
            const event = new CustomEvent('sectionChanged', { detail: { sectionId } });
            document.dispatchEvent(event);
        } else {
            console.error(`Section not found: ${sectionId}`);
            showNavigationError(`Failed to show section: ${sectionId}`);
        }
    }

    function showNavigationError(message) {
        const mainContent = document.querySelector('main');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;

        // Remove any existing error messages
        const existingError = mainContent.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }

        // Insert error message at the top of the main content
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
    }

    // Handle navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Navigation link clicked:', this.getAttribute('data-section'));

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Get the target section from data-section attribute
            const targetSection = this.getAttribute('data-section');
            if (targetSection) {
                showSection(targetSection);

                // Update URL hash without scrolling
                history.pushState(null, null, `#${targetSection}`);
            } else {
                console.error('No data-section attribute found on clicked link');
            }
        });
    });

    // Handle initial page load
    function handleInitialLoad() {
        console.log('Handling initial page load');
        const hash = window.location.hash.substring(1);
        if (hash) {
            console.log('Found hash in URL:', hash);
            const targetLink = document.querySelector(`[data-section="${hash}"]`);
            if (targetLink) {
                targetLink.click();
            } else {
                console.log('No matching link found for hash, showing dashboard');
                showSection('dashboard-section');
            }
        } else {
            console.log('No hash found, showing dashboard');
            showSection('dashboard-section');
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function () {
        console.log('Handling popstate event');
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetLink = document.querySelector(`[data-section="${hash}"]`);
            if (targetLink) {
                targetLink.click();
            } else {
                showSection('dashboard-section');
            }
        } else {
            showSection('dashboard-section');
        }
    });

    // Initialize navigation
    handleInitialLoad();
    navigationInitialized = true;
    console.log('Navigation initialization complete');
}

// Initialize navigation when Firebase is ready
document.addEventListener('firebaseReady', function () {
    console.log('Firebase ready event received, initializing navigation');
    initializeNavigation();
});

// Backup initialization in case firebaseReady event was missed
if (document.readyState === 'complete') {
    console.log('Document already complete, checking if navigation needs initialization');
    if (!navigationInitialized) {
        initializeNavigation();
    }
} 