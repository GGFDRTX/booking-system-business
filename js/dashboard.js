// Dashboard JavaScript
let dashboardInitialized = false;
let updateTimeout = null;
let chartsInitialized = false;
let bookingsChart = null;
let servicesChart = null;

function initializeDashboard() {
    if (dashboardInitialized) {
        console.log('Dashboard already initialized');
        return;
    }

    console.log('Initializing dashboard module');

    // Check if Firebase is initialized
    if (!firebase.apps.length) {
        console.error('Firebase not initialized');
        return;
    }

    // Initialize Firestore
    const db = firebase.firestore();
    const bookingsRef = db.collection('bookings');
    const customersRef = db.collection('customers');
    const servicesRef = db.collection('services');

    // DOM Elements
    const totalBookingsElement = document.getElementById('total-bookings');
    const totalRevenueElement = document.getElementById('total-revenue');
    const pendingBookingsElement = document.getElementById('pending-bookings');
    const totalCustomersElement = document.getElementById('total-customers');
    const recentBookingsTable = document.getElementById('recent-bookings-table');
    const bookingsChartCanvas = document.getElementById('bookings-chart');
    const servicesChartCanvas = document.getElementById('services-chart');

    // Verify all required elements exist
    const requiredElements = {
        totalBookingsElement,
        totalRevenueElement,
        pendingBookingsElement,
        totalCustomersElement,
        recentBookingsTable,
        bookingsChartCanvas,
        servicesChartCanvas
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error('Required dashboard elements not found:', missingElements);
        return;
    }

    // Initialize charts first
    function initializeCharts() {
        if (chartsInitialized) {
            console.log('Charts already initialized');
            return;
        }

        console.log('Initializing dashboard charts');
        try {
            // Bookings over time chart
            const bookingsCtx = bookingsChartCanvas.getContext('2d');
            bookingsChart = new Chart(bookingsCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Bookings',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });

            // Services popularity chart
            const servicesCtx = servicesChartCanvas.getContext('2d');
            servicesChart = new Chart(servicesCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(255, 205, 86)',
                            'rgb(75, 192, 192)',
                            'rgb(153, 102, 255)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            chartsInitialized = true;
            console.log('Charts initialized successfully');
        } catch (error) {
            console.error('Error initializing charts:', error);
            showDashboardError('Failed to initialize charts');
        }
    }

    // Debounced update function
    function debouncedUpdate() {
        if (updateTimeout) {
            clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
            console.log('Updating dashboard data');
            updateDashboardStats();
            updateCharts();
        }, 500);
    }

    // Update dashboard stats
    async function updateDashboardStats() {
        console.log('Starting dashboard stats update');
        try {
            // Get all bookings
            const bookingsSnapshot = await bookingsRef.get();
            console.log(`Found ${bookingsSnapshot.size} total bookings`);

            // Initialize counters
            let totalBookings = 0;
            let totalRevenue = 0;
            let pendingBookings = 0;
            const uniqueCustomers = new Set();

            // Process each booking
            bookingsSnapshot.docs.forEach(doc => {
                const data = doc.data();

                // Only count non-cancelled bookings
                if (data.status !== 'cancelled') {
                    totalBookings++;

                    // Add customer to unique set if they have an email
                    if (data.customerEmail) {
                        uniqueCustomers.add(data.customerEmail);
                    }

                    // Count pending bookings
                    if (data.status === 'pending') {
                        pendingBookings++;
                    }

                    // Add to revenue if booking is confirmed or completed
                    if (data.status === 'confirmed' || data.status === 'completed') {
                        totalRevenue += data.servicePrice || 0;
                    }
                }
            });

            console.log(`Stats calculated:
                - Total active bookings: ${totalBookings}
                - Total revenue: $${totalRevenue}
                - Pending bookings: ${pendingBookings}
                - Unique customers: ${uniqueCustomers.size}
            `);

            // Update UI
            totalBookingsElement.textContent = totalBookings;
            pendingBookingsElement.textContent = pendingBookings;
            totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
            totalCustomersElement.textContent = uniqueCustomers.size;

            // Update recent bookings
            const recentBookings = bookingsSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().appointmentDate?.toDate()
                }))
                .filter(booking => booking.status !== 'cancelled')
                .sort((a, b) => b.date - a.date)
                .slice(0, 5);

            displayRecentBookings(recentBookings);

            console.log('Dashboard stats updated successfully');
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
            showDashboardError('Failed to load dashboard statistics. Please try refreshing the page.');
        }
    }

    // Display recent bookings
    function displayRecentBookings(bookings) {
        if (!recentBookingsTable) return;

        if (bookings.length === 0) {
            recentBookingsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No recent bookings</td>
                </tr>
            `;
            return;
        }

        recentBookingsTable.innerHTML = bookings.map(booking => `
            <tr>
                <td>${booking.id.slice(0, 8)}</td>
                <td>${booking.customerName || 'N/A'}</td>
                <td>${booking.serviceName || 'N/A'}</td>
                <td>${booking.date ? moment(booking.date).format('MMM D, YYYY h:mm A') : 'N/A'}</td>
                <td>
                    <span class="badge bg-${getStatusColor(booking.status)}">
                        ${booking.status || 'pending'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewBooking('${booking.id}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Get status color
    function getStatusColor(status) {
        switch (status) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            case 'completed': return 'info';
            default: return 'secondary';
        }
    }

    // Update charts with data
    async function updateCharts() {
        if (!chartsInitialized) {
            console.log('Charts not initialized, skipping update');
            return;
        }

        console.log('Starting dashboard charts update');
        try {
            // Get bookings for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const bookingsSnapshot = await bookingsRef
                .where('appointmentDate', '>=', thirtyDaysAgo)
                .get();

            console.log(`Found ${bookingsSnapshot.size} bookings in the last 30 days`);

            // Process bookings data for charts
            const bookingsByDate = {};
            const serviceCounts = {};

            bookingsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                // Only include non-cancelled bookings
                if (data.status !== 'cancelled') {
                    if (data.appointmentDate) {
                        const date = moment(data.appointmentDate.toDate()).format('MMM D');
                        bookingsByDate[date] = (bookingsByDate[date] || 0) + 1;
                    }
                    if (data.serviceName) {
                        serviceCounts[data.serviceName] = (serviceCounts[data.serviceName] || 0) + 1;
                    }
                }
            });

            // Update bookings chart
            if (bookingsChart) {
                const dates = Object.keys(bookingsByDate).sort((a, b) =>
                    moment(a, 'MMM D').diff(moment(b, 'MMM D'))
                );
                const counts = dates.map(date => bookingsByDate[date]);

                bookingsChart.data.labels = dates;
                bookingsChart.data.datasets[0].data = counts;
                bookingsChart.update('none'); // Update without animation
                console.log('Bookings chart updated successfully');
            }

            // Update services chart
            if (servicesChart) {
                servicesChart.data.labels = Object.keys(serviceCounts);
                servicesChart.data.datasets[0].data = Object.values(serviceCounts);
                servicesChart.update('none'); // Update without animation
                console.log('Services chart updated successfully');
            }

            console.log('Dashboard charts updated successfully');
        } catch (error) {
            console.error('Error updating dashboard charts:', error);
            showDashboardError('Failed to load dashboard charts. Please try refreshing the page.');
        }
    }

    // Initialize
    try {
        // Initialize charts first
        initializeCharts();

        // Initial data load
        updateDashboardStats();
        updateCharts();

        // Set up real-time updates with debouncing
        const unsubscribeBookings = bookingsRef.onSnapshot(() => {
            debouncedUpdate();
        }, (error) => {
            console.error('Error in bookings snapshot listener:', error);
            showDashboardError('Failed to receive real-time booking updates');
        });

        const unsubscribeCustomers = customersRef.onSnapshot(() => {
            debouncedUpdate();
        }, (error) => {
            console.error('Error in customers snapshot listener:', error);
            showDashboardError('Failed to receive real-time customer updates');
        });

        // Cleanup function
        window.addEventListener('beforeunload', () => {
            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            unsubscribeBookings();
            unsubscribeCustomers();
        });

        dashboardInitialized = true;
        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Error during dashboard initialization:', error);
        showDashboardError('Failed to initialize dashboard');
    }
}

// Wait for Firebase to be ready
document.addEventListener('firebaseReady', function () {
    console.log('Firebase is ready, initializing dashboard');
    initializeDashboard();
});

// Backup initialization in case firebaseReady event was missed
if (document.readyState === 'complete') {
    console.log('Document already complete, checking if dashboard needs initialization');
    if (firebase.apps.length && !dashboardInitialized) {
        initializeDashboard();
    }
}

function showDashboardError(message) {
    const dashboardSection = document.getElementById('dashboard-section');
    if (!dashboardSection) {
        console.error('Dashboard section not found');
        return;
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;

    // Remove any existing error messages
    const existingError = dashboardSection.querySelector('.alert-danger');
    if (existingError) {
        existingError.remove();
    }

    // Insert error message at the top of the dashboard
    dashboardSection.insertBefore(errorDiv, dashboardSection.firstChild);
}
