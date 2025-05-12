// Script to add test data to the database

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('Add test data script loaded');

    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized in add test data script');
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
        console.log('Owner authenticated, adding test data...');
        addTestData();
    });

    // Add test data
    function addTestData() {
        console.log('Adding test data...');
        const db = firebase.firestore();

        // Add test service
        const testService = {
            name: 'Test Service',
            description: 'This is a test service',
            duration: 60,
            price: 100,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('services').add(testService)
            .then((docRef) => {
                console.log('Test service added with ID:', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding test service:', error);
            });

        // Add test booking
        const testBooking = {
            customerName: 'Test Customer',
            customerEmail: 'test@example.com',
            serviceName: 'Test Service',
            date: new Date(),
            time: '10:00',
            status: 'pending',
            price: 100,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('bookings').add(testBooking)
            .then((docRef) => {
                console.log('Test booking added with ID:', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding test booking:', error);
            });

        // Add test customer
        const testCustomer = {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+1234567890',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('customers').add(testCustomer)
            .then((docRef) => {
                console.log('Test customer added with ID:', docRef.id);
            })
            .catch((error) => {
                console.error('Error adding test customer:', error);
            });
    }
}); 