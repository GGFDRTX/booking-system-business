// Script to check customers collection

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Check customers script loaded');

    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized in check customers script');
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
        console.log('Owner authenticated, checking customers...');
        checkCustomers();
    });

    // Check customers
    function checkCustomers() {
        console.log('Checking customers...');
        const db = firebase.firestore();

        // Check customers collection
        db.collection('customers').get()
            .then((querySnapshot) => {
                console.log('Customers found:', querySnapshot.size);
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log('Customer:', {
                        id: doc.id,
                        ...data
                    });
                });
            })
            .catch((error) => {
                console.error('Error checking customers:', error);
            });
    }
}); 