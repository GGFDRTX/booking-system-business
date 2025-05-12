// Script to check users collection

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Check users script loaded');

    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized in check users script');
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
        console.log('Owner authenticated, checking users...');
        checkUsers();
    });

    // Check users
    function checkUsers() {
        console.log('Checking users...');
        const db = firebase.firestore();

        // Check users collection
        db.collection('users').get()
            .then((querySnapshot) => {
                console.log('Users found:', querySnapshot.size);
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log('User:', {
                        id: doc.id,
                        ...data
                    });
                });
            })
            .catch((error) => {
                console.error('Error checking users:', error);
            });
    }
}); 