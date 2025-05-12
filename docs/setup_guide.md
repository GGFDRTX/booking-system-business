# Appointment Scheduling System Setup Guide

This guide will walk you through the process of setting up and deploying your appointment scheduling system.

## Prerequisites

Before you begin, make sure you have:

1. **Firebase Account**
   - Create a Firebase account at [firebase.google.com](https://firebase.google.com)
   - Create a new Firebase project

2. **EmailJS Account**
   - Sign up for EmailJS at [emailjs.com](https://www.emailjs.com)
   - Create an email service and templates

3. **GitHub Account** (for hosting)
   - Create a GitHub account if you don't have one
   - Set up GitHub Pages for hosting

## Firebase Setup

1. **Create Firestore Database**
   - Go to Firebase Console > Your Project > Firestore Database
   - Click "Create database"
   - Start in test mode (you can adjust security rules later)

2. **Set Up Authentication**
   - Go to Firebase Console > Your Project > Authentication
   - Enable Email/Password authentication
   - Add the owner's email as a user

3. **Get Firebase Configuration**
   - Go to Firebase Console > Your Project > Project Settings
   - Scroll down to "Your apps" section
   - Click the web app icon (</>) to register a web app
   - Copy the Firebase configuration object

## EmailJS Setup

1. **Create Email Service**
   - Go to EmailJS Dashboard > Email Services
   - Add a new service (Gmail, Outlook, or custom SMTP)
   - Follow the instructions to connect your email account

2. **Create Email Templates**
   - Go to EmailJS Dashboard > Email Templates
   - Create the following templates:
     - Booking Confirmation (for customers)
     - New Booking Notification (for owner)
     - Status Update (for appointment status changes)
   - Use template variables like {{booking_id}}, {{customer_name}}, etc.

3. **Get EmailJS Configuration**
   - Go to EmailJS Dashboard > Account
   - Copy your User ID
   - Note your service ID and template IDs

## Configuration

1. **Update Config File**
   - Open `shared/js/config.js`
   - Replace the placeholder values with your actual configuration:
     ```javascript
     window.appConfig = {
         // Firebase configuration
         firebase: {
             apiKey: "YOUR_FIREBASE_API_KEY",
             authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
             projectId: "YOUR_FIREBASE_PROJECT_ID",
             storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
             messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
             appId: "YOUR_FIREBASE_APP_ID"
         },
         
         // EmailJS configuration
         emailjs: {
             userId: "YOUR_EMAILJS_USER_ID",
             serviceId: "YOUR_EMAILJS_SERVICE_ID",
             templateId: "YOUR_EMAILJS_TEMPLATE_ID",
             statusTemplateId: "YOUR_EMAILJS_STATUS_TEMPLATE_ID"
         },
         
         // Business information
         businessName: "YOUR_BUSINESS_NAME",
         businessPhone: "YOUR_BUSINESS_PHONE",
         businessEmail: "YOUR_BUSINESS_EMAIL",
         businessAddress: "YOUR_BUSINESS_ADDRESS",
         
         // Owner email (for authentication)
         ownerEmail: "OWNER_EMAIL_ADDRESS",
         
         // Business hours and other settings...
     };
     ```

2. **Customize Services**
   - The system comes with default services
   - You can modify them through the owner dashboard after setup
   - Or edit the initial services in `shared/js/services.js`

3. **Customize Appearance**
   - Update the CSS files in `customer/css/styles.css` and `owner/css/styles.css`
   - Replace the placeholder logo with your business logo
   - Update colors and styles to match your brand

## Local Testing

1. **Run a Local Server**
   - Use a simple HTTP server to test locally
   - With Python: `python -m http.server`
   - With Node.js: `npx serve`
   - Access the customer site at `http://localhost:8000/customer/`
   - Access the owner site at `http://localhost:8000/owner/`

2. **Test Functionality**
   - Create test bookings through the customer website
   - Log in to the owner dashboard to view and manage bookings
   - Verify that email notifications are working correctly

## Deployment

### Option 1: GitHub Pages

1. **Create a GitHub Repository**
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select the branch to deploy (usually `main`)
   - Save the settings
   - Your site will be available at `https://yourusername.github.io/repository-name/`

### Option 2: Firebase Hosting

1. **Install Firebase CLI**
   - Install Node.js if not already installed
   - Run `npm install -g firebase-tools`

2. **Initialize Firebase Hosting**
   - Run `firebase login`
   - Run `firebase init hosting`
   - Select your Firebase project
   - Set the public directory to the root of your project
   - Configure as a single-page app: No
   - Set up automatic builds and deploys: No

3. **Deploy to Firebase Hosting**
   - Run `firebase deploy --only hosting`
   - Your site will be available at `https://your-project-id.web.app/`

## Post-Deployment Steps

1. **Create Owner Account**
   - Go to Firebase Console > Authentication
   - Add a user with the owner's email
   - Set a secure password

2. **Secure Your Database**
   - Go to Firebase Console > Firestore Database > Rules
   - Update the security rules to restrict access:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         // Allow public read access to services
         match /config/services {
           allow read: if true;
           allow write: if request.auth != null && request.auth.email == 'OWNER_EMAIL_ADDRESS';
         }
         
         // Allow customers to create bookings
         match /bookings/{booking} {
           allow create: if true;
           allow read, update, delete: if request.auth != null && request.auth.email == 'OWNER_EMAIL_ADDRESS';
         }
       }
     }
     ```

3. **Test the Live System**
   - Make a test booking through the customer website
   - Log in to the owner dashboard
   - Verify all functionality works as expected

## Maintenance and Updates

1. **Regular Backups**
   - Periodically export your Firestore data
   - Go to Firebase Console > Firestore Database > Export

2. **Monitor Usage**
   - Keep an eye on your Firebase and EmailJS usage
   - Both services have free tiers with limits

3. **Updates**
   - Regularly update dependencies for security
   - Test thoroughly after any updates

## Troubleshooting

- **Firebase Authentication Issues**: Check your Firebase configuration and security rules
- **Email Notification Problems**: Verify your EmailJS configuration and template setup
- **Database Connection Errors**: Ensure your Firebase project is active and properly configured
- **CORS Issues**: If deploying to a different domain, you may need to configure CORS settings in Firebase

## Support and Resources

- Firebase Documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
- EmailJS Documentation: [emailjs.com/docs](https://www.emailjs.com/docs/)
- GitHub Pages Documentation: [docs.github.com/pages](https://docs.github.com/en/pages)
