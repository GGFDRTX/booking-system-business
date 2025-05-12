// Debug script to check Firestore database

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Debug script loaded');

    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized in debug script');
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
        console.log('Owner authenticated, checking database...');
        checkDatabase();
    });

    // Check database
    function checkDatabase() {
        console.log('Checking database...');
        const db = firebase.firestore();

        // Check bookings collection
        db.collection('bookings').get()
            .then((querySnapshot) => {
                console.log('Bookings found:', querySnapshot.size);
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log('Booking:', {
                        id: doc.id,
                        ...data,
                        date: data.date ? (data.date.toDate ? data.date.toDate() : data.date) : 'N/A'
                    });
                });
            })
            .catch((error) => {
                console.error('Error checking bookings:', error);
            });

        // Check services collection
        db.collection('services').get()
            .then((querySnapshot) => {
                console.log('Services found:', querySnapshot.size);
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    console.log('Service:', {
                        id: doc.id,
                        ...data
                    });
                });
            })
            .catch((error) => {
                console.error('Error checking services:', error);
            });

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