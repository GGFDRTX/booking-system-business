// Script to add test user

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Add test user script loaded');

    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized in add test user script');
        } else {
            console.log('Firebase already initialized');
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return;
    }

    // Check authentication state
    firebase.auth().onAuthStateChanged(function (user) {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');

        if (!user) {
            console.log('No user found');
            return;
        }

        console.log('User email:', user.email);
        console.log('Owner email:', window.appConfig.ownerEmail);

        if (user.email !== window.appConfig.ownerEmail) {
            console.log('Unauthorized user');
            return;
        }

        // If we get here, we have a valid owner user
        console.log('Owner authenticated, adding test user...');
        addTestUser();
    });

    // Add test user
    function addTestUser() {
        console.log('Adding test user...');
        const db = firebase.firestore();

        // Add test user
        const testUser = {
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('users').add(testUser)
            .then((docRef) => {
                console.log('Test user added with ID:', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding test user:', error);
            });
    }
}); 