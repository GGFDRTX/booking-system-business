# Owner Dashboard User Guide

This guide explains how to use the Service Appointment Management Dashboard to manage your business appointments, customers, and services.

## Accessing the Dashboard

1. **Login**
   - Navigate to the owner website
   - Enter your email and password
   - Click "Login" to access the dashboard

2. **Dashboard Navigation**
   - The main dashboard displays key metrics and recent bookings
   - Use the sidebar or top navigation to access different sections:
     - Dashboard: Overview and analytics
     - Appointments: Detailed appointment management
     - Customers: Customer information and history
     - Services: Service management

## Dashboard Features

The main dashboard provides a quick overview of your business performance:

- **Summary Cards**: Total bookings, revenue, pending appointments, and customer count
- **Booking Chart**: Visual representation of bookings over time
- **Services Chart**: Popularity of different services
- **Recent Bookings**: List of the most recent appointments
- **Time Range Filter**: Filter data by today, this week, this month, or this year
- **Export**: Download dashboard data as a CSV file

## Managing Appointments

1. **Viewing Appointments**
   - All appointments are listed in a table with key information
   - Use search and filters to find specific appointments
   - Pagination controls help navigate through multiple pages

2. **Appointment Actions**
   - View: See detailed information about an appointment
   - Confirm: Change an appointment's status to "confirmed"
   - Cancel: Change an appointment's status to "cancelled"

3. **Filtering Appointments**
   - Click the "Filter" button to show filtering options
   - Filter by status, service, date range, or search term
   - Click "Apply Filters" to update the list

## Managing Customers

1. **Viewing Customers**
   - All customers are listed with their contact information and booking history
   - Search for specific customers using the search box
   - Click on a customer to view their detailed profile

2. **Customer Details**
   - View customer statistics (total bookings, total spent, etc.)
   - See service preferences and booking status breakdown
   - Review complete booking history
   - Access contact information for direct communication

3. **Exporting Customer Data**
   - Click "Export" to download customer data as a CSV file

## Managing Services

1. **Viewing Services**
   - All services are displayed as cards with key information
   - Each card shows booking count and revenue statistics

2. **Adding a Service**
   - Click "Add Service" to open the service form
   - Fill in the required information:
     - Service name
     - Description (optional)
     - Price
     - Duration (in minutes)
     - Image URL (optional)
   - Click "Save" to add the service

3. **Editing a Service**
   - Click "Edit" on any service card
   - Update the information as needed
   - Click "Save" to apply changes

4. **Deleting a Service**
   - Click "Delete" on any service card
   - Confirm the deletion when prompted

## System Configuration

To configure the system, edit the `shared/js/config.js` file:

1. **Firebase Configuration**
   - Update the Firebase credentials with your project details

2. **EmailJS Configuration**
   - Set up your EmailJS account and update the configuration

3. **Business Information**
   - Update your business details (name, contact information, etc.)

4. **Business Hours**
   - Configure your operating hours for each day of the week

5. **Booking Settings**
   - Adjust time slot duration and maximum advance booking days

## Troubleshooting

**Q: I can't log in to the dashboard**  
A: Ensure you're using the correct email and password. If you've forgotten your password, use the "Forgot Password" link.

**Q: Appointment notifications aren't being sent**  
A: Check your EmailJS configuration in the config.js file and ensure your account is active.

**Q: The dashboard isn't showing any data**  
A: Verify your Firebase configuration and check that your database has the correct permissions.

## Contact Support

If you encounter any issues or need assistance with the system, please contact:

- **Email:** support@example.com
- **Phone:** +1234567890
