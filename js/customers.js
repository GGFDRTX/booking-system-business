// Owner Customers JavaScript

// Wait for Firebase to be ready
document.addEventListener('firebaseReady', function () {
    console.log('Firebase is ready, initializing customers');

    // Initialize Firestore
    const db = firebase.firestore();
    const customersRef = db.collection('customers');
    const bookingsRef = db.collection('bookings');

    // DOM Elements
    const customersTable = document.getElementById('customers-table');
    const searchInput = document.getElementById('customer-search');
    const searchBtn = document.getElementById('customer-search-btn');
    const addCustomerModal = document.getElementById('customer-modal');
    const customerForm = document.getElementById('customer-form');

    // Initialize Bootstrap modal if available
    let customerModal;
    if (typeof bootstrap !== 'undefined' && addCustomerModal) {
        customerModal = new bootstrap.Modal(addCustomerModal);
    }

    // Update all dashboard statistics
    function updateDashboardStats() {
        // Get total customers
        customersRef.get().then((customerSnapshot) => {
            const totalCustomers = customerSnapshot.size;
            const totalCustomersElement = document.getElementById('total-customers');
            if (totalCustomersElement) {
                totalCustomersElement.textContent = totalCustomers;
            }
        });

        // Get total bookings and revenue
        bookingsRef.get().then((bookingSnapshot) => {
            let totalBookings = 0;
            let totalRevenue = 0;
            let pendingBookings = 0;

            bookingSnapshot.forEach((doc) => {
                const booking = doc.data();
                if (booking.status !== 'cancelled') {
                    totalBookings++;
                    if (booking.status === 'confirmed' || booking.status === 'completed') {
                        totalRevenue += booking.servicePrice || 0;
                    }
                    if (booking.status === 'pending') {
                        pendingBookings++;
                    }
                }
            });

            // Update dashboard elements
            const totalBookingsElement = document.getElementById('total-bookings');
            const totalRevenueElement = document.getElementById('total-revenue');
            const pendingBookingsElement = document.getElementById('pending-bookings');

            if (totalBookingsElement) totalBookingsElement.textContent = totalBookings;
            if (totalRevenueElement) totalRevenueElement.textContent = `$${totalRevenue.toFixed(2)}`;
            if (pendingBookingsElement) pendingBookingsElement.textContent = pendingBookings;
        });
    }

    // Load customers
    function loadCustomers() {
        if (!customersTable) {
            console.error('Customers table not found');
            return;
        }

        // Show loading state
        customersTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        // Get customers from Firestore
        customersRef.orderBy('createdAt', 'desc')
            .get()
            .then((snapshot) => {
                if (snapshot.empty) {
                    customersTable.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center">No customers found</td>
                        </tr>
                    `;
                    updateDashboardStats(); // Update stats even if no customers
                    return;
                }

                let tableContent = '';
                snapshot.forEach((doc) => {
                    const customer = doc.data();
                    const row = createCustomerRow(doc.id, customer);
                    tableContent += row;
                });
                customersTable.innerHTML = tableContent;

                // Update all dashboard statistics
                updateDashboardStats();
            })
            .catch((error) => {
                console.error('Error loading customers:', error);
                customersTable.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            Error loading customers. Please try again.
                        </td>
                    </tr>
                `;
            });
    }

    // Create customer row
    function createCustomerRow(id, customer) {
        const createdAt = customer.createdAt?.toDate();
        const formattedDate = createdAt ? moment(createdAt).format('MMM D, YYYY') : 'N/A';
        const lastBooking = customer.lastBooking?.toDate();
        const formattedLastBooking = lastBooking ? moment(lastBooking).format('MMM D, YYYY') : 'N/A';

        return `
            <tr>
                <td>${id.substring(0, 8)}</td>
                <td>${customer.name || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.bookings?.length || 0}</td>
                <td>$${customer.totalSpent?.toFixed(2) || '0.00'}</td>
                <td>${formattedLastBooking}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewCustomer('${id}')" aria-label="View customer">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${id}')" aria-label="Delete customer">
                        <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // View customer
    window.viewCustomer = function (id) {
        customersRef.doc(id).get()
            .then((doc) => {
                if (doc.exists) {
                    const customer = doc.data();
                    const modal = new bootstrap.Modal(document.getElementById('customer-modal'));
                    document.getElementById('customer-details').innerHTML = `
                        <div class="customer-details">
                            <h4>Customer Details</h4>
                            <div class="detail-row">
                                <span class="detail-label">Name:</span>
                                <span class="detail-value">${customer.name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${customer.email}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${customer.phone}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Bookings:</span>
                                <span class="detail-value">${customer.bookings?.length || 0}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Spent:</span>
                                <span class="detail-value">$${customer.totalSpent?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Last Booking:</span>
                                <span class="detail-value">${moment(customer.lastBooking?.toDate()).format('MMM D, YYYY') || 'N/A'}</span>
                            </div>
                        </div>
                    `;
                    modal.show();
                }
            })
            .catch((error) => {
                console.error('Error loading customer:', error);
                alert('Error loading customer details. Please try again.');
            });
    };

    // Delete customer
    window.deleteCustomer = function (id) {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            customersRef.doc(id).delete()
                .then(() => {
                    loadCustomers();
                    updateDashboardStats(); // Update stats after deletion
                })
                .catch((error) => {
                    console.error('Error deleting customer:', error);
                    alert('Error deleting customer. Please try again.');
                });
        }
    };

    // Add new customer
    if (customerForm) {
        customerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);
            const customerData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                bookings: [],
                totalSpent: 0
            };

            customersRef.add(customerData)
                .then(() => {
                    if (customerModal) {
                        customerModal.hide();
                    }
                    this.reset();
                    loadCustomers();
                    updateDashboardStats(); // Update stats after adding
                })
                .catch((error) => {
                    console.error('Error adding customer:', error);
                    alert('Error adding customer. Please try again.');
                });
        });
    }

    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = customersTable.getElementsByTagName('tr');

            Array.from(rows).forEach((row) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Add page visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateDashboardStats();
        }
    });

    // Initial load
    loadCustomers();
});
