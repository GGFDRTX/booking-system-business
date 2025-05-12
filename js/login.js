// Owner Login JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Firebase
    try {
        const firebaseConfig = window.appConfig.firebase;
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
        }
    } catch (error) {
        showError('Error initializing the application. Please refresh the page.');
        return;
    }

    // Get form elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const forgotPassword = document.getElementById('forgot-password');

    if (!loginForm || !emailInput || !passwordInput || !errorMessage || !forgotPassword) {
        return;
    }

    // Handle login form submission
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        // Clear previous error messages
        errorMessage.textContent = '';
        errorMessage.classList.add('d-none');

        try {
            // Sign in with email and password
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

            // Check if the user is authorized
            if (email === window.appConfig.ownerEmail) {
                window.location.replace('index.html');
            } else {
                await firebase.auth().signOut();
                showError('You are not authorized to access the owner dashboard.');
            }
        } catch (error) {
            let errorMsg = 'An error occurred during login. Please try again.';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMsg = 'Invalid email address format.';
                    break;
                case 'auth/user-disabled':
                    errorMsg = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMsg = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMsg = 'Incorrect password. Please try again.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error. Please check your internet connection.';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = 'Too many failed attempts. Please try again later.';
                    break;
            }

            showError(errorMsg);
        }
    });

    // Handle forgot password
    forgotPassword.addEventListener('click', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (!email) {
            showError('Please enter your email address to reset your password.');
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            showError('Password reset email sent. Please check your inbox.', 'alert-success');
        } catch (error) {
            let errorMsg = 'An error occurred. Please try again.';

            if (error.code === 'auth/invalid-email') {
                errorMsg = 'Invalid email address format.';
            } else if (error.code === 'auth/user-not-found') {
                errorMsg = 'No account found with this email.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'Network error. Please check your internet connection.';
            }

            showError(errorMsg);
        }
    });

    // Function to show error message
    function showError(message, className = 'alert-danger') {
        errorMessage.textContent = message;
        errorMessage.className = `alert mt-3 ${className}`;
        errorMessage.classList.remove('d-none');
    }

    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            if (user.email === window.appConfig.ownerEmail) {
                window.location.replace('index.html');
            } else {
                firebase.auth().signOut().then(() => {
                    showError('You are not authorized to access the owner dashboard.');
                }).catch(error => {
                });
            }
        }
    });
});
