// Firebase initialization
let firebaseInitialized = false;
let authStateChecked = false;

function initializeFirebase() {
    if (firebaseInitialized) {
        console.log('Firebase already initialized');
        return;
    }

    try {
        console.log('Starting Firebase initialization');

        // Check if config exists
        if (!window.appConfig || !window.appConfig.firebase) {
            throw new Error('Firebase configuration not found');
        }

        // Initialize Firebase with config
        if (!firebase.apps.length) {
            firebase.initializeApp(window.appConfig.firebase);
            console.log('Firebase initialized successfully');
        } else {
            console.log('Firebase already has an initialized app');
        }

        // Configure Firestore settings
        const db = firebase.firestore();
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
            merge: true
        });
        console.log('Firestore settings configured');

        // Enable offline persistence
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log('Offline persistence enabled');
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('The current browser does not support persistence.');
                } else {
                    console.error('Error enabling persistence:', err);
                }
            });

        firebaseInitialized = true;
        console.log('Firebase initialization complete');
        checkAuthState();
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        showError('Error initializing the application. Please refresh the page.');
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

function checkAuthState() {
    if (!firebaseInitialized || authStateChecked) {
        console.log('Auth state check skipped:', {
            firebaseInitialized,
            authStateChecked
        });
        return;
    }

    console.log('Checking authentication state');
    firebase.auth().onAuthStateChanged(function (user) {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');

        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.replace('login.html');
            return;
        }

        if (user.email !== window.appConfig.ownerEmail) {
            console.log('Unauthorized user, signing out');
            firebase.auth().signOut().then(() => {
                window.location.replace('login.html');
            }).catch(error => {
                console.error('Error signing out:', error);
                showError('Error signing out unauthorized user');
            });
            return;
        }

        // If we get here, we have a valid owner user
        console.log('Owner authenticated, initializing application');

        // Set owner name in UI
        const ownerName = document.getElementById('owner-name');
        if (ownerName) {
            ownerName.textContent = window.appConfig.ownerName || 'Owner';
        }

        authStateChecked = true;

        // Dispatch a custom event to notify other scripts that Firebase is ready
        console.log('Dispatching firebaseReady event');
        document.dispatchEvent(new CustomEvent('firebaseReady'));
    }, (error) => {
        console.error('Error in auth state observer:', error);
        showError('Error checking authentication state');
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    console.log('Document already loaded, initializing Firebase');
    initializeFirebase();
}

// Backup initialization in case DOMContentLoaded already fired
window.addEventListener('load', function () {
    if (!firebaseInitialized) {
        console.log('Firebase not initialized, attempting initialization on window load');
        initializeFirebase();
    }
}); 