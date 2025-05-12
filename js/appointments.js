// Owner Appointments JavaScript

// Wait for Firebase to be ready
document.addEventListener('firebaseReady', function () {
    console.log('Firebase is ready, initializing appointments');

    // Initialize Firestore
    const db = firebase.firestore();
    const bookingsRef = db.collection('bookings');
    const servicesRef = db.collection('services');

    // Global variables
    let currentPage = 1;
    const pageSize = 10;
    let totalBookings = 0;
    let filteredBookings = [];
    let currentFilters = {
        status: '',
        serviceId: '',
        dateFrom: null,
        dateTo: null,
        searchTerm: ''
    };

    // DOM Elements
    const appointmentsTable = document.getElementById('appointments-table');
    const filterCard = document.getElementById('filter-card');
    const filterStatus = document.getElementById('filter-status');
    const filterService = document.getElementById('filter-service');
    const filterDateFrom = document.getElementById('filter-date-from');
    const filterDateTo = document.getElementById('filter-date-to');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const searchInput = document.getElementById('appointment-search');
    const searchBtn = document.getElementById('search-btn');

    // Initialize Flatpickr
    if (typeof flatpickr !== 'undefined') {
        flatpickr(filterDateFrom, {
            dateFormat: 'Y-m-d',
            allowInput: true
        });
        flatpickr(filterDateTo, {
            dateFormat: 'Y-m-d',
            allowInput: true
        });
    }

    // Initialize date pickers
    const dateFromPicker = flatpickr('#filter-date-from', {
        dateFormat: "Y-m-d",
        onChange: function (selectedDates) {
            // Update date-to min date
            document.getElementById('filter-date-to')._flatpickr.set('minDate', selectedDates[0]);
        }
    });

    const dateToPicker = flatpickr('#filter-date-to', {
        dateFormat: "Y-m-d"
    });

    // Initialize filter functionality
    document.getElementById('filter-appointments').addEventListener('click', function () {
        const filterCard = document.getElementById('filter-card');
        if (filterCard.style.display === 'none') {
            filterCard.style.display = 'block';
        } else {
            filterCard.style.display = 'none';
        }
    });

    // Populate service filter dropdown
    function loadServices() {
        servicesRef.get()
            .then((snapshot) => {
                filterService.innerHTML = '<option value="">All Services</option>';
                snapshot.forEach((doc) => {
                    const service = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = service.name;
                    filterService.appendChild(option);
                });
            })
            .catch((error) => {
                console.error('Error loading services:', error);
            });
    }

    // Clear any existing listeners
    let unsubscribe = null;
    let isFirstLoad = true;

    // Load bookings
    function loadBookings(filters = {}) {
        if (!appointmentsTable) {
            console.error('Appointments table not found');
            return;
        }

        // Unsubscribe from any existing listeners
        if (unsubscribe) {
            unsubscribe();
        }

        appointmentsTable.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        let query = bookingsRef;

        // Apply filters
        if (filters.status) {
            query = query.where('status', '==', filters.status);
        }
        if (filters.serviceId) {
            query = query.where('serviceId', '==', filters.serviceId);
        }
        if (filters.dateFrom) {
            query = query.where('appointmentDate', '>=', new Date(filters.dateFrom));
        }
        if (filters.dateTo) {
            query = query.where('appointmentDate', '<=', new Date(filters.dateTo));
        }

        // First, get data from server
        query.orderBy('appointmentDate', 'desc')
            .get({ source: 'server' })
            .then((serverSnapshot) => {
                updateTableAndStats(serverSnapshot);

                // Then set up real-time listener
                unsubscribe = query.orderBy('appointmentDate', 'desc')
                    .onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
                        // Only update if it's not the first load or if data is from server
                        if (!isFirstLoad || !snapshot.metadata.fromCache) {
                            updateTableAndStats(snapshot);
                        }
                        isFirstLoad = false;
                    }, (error) => {
                        console.error('Error in real-time listener:', error);
                    });
            })
            .catch((error) => {
                console.error('Error loading bookings:', error);
                appointmentsTable.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-danger">
                            Error loading bookings. Please try again.
                        </td>
                    </tr>
                `;
            });
    }

    // Update table and stats
    function updateTableAndStats(snapshot) {
        if (snapshot.empty) {
            appointmentsTable.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No bookings found</td>
                </tr>
            `;
            updateDashboardStats(snapshot);
            return;
        }

        let bookings = [];
        snapshot.forEach((doc) => {
            const booking = doc.data();
            bookings.push({ id: doc.id, ...booking });
        });
        // Sort: pending first, then by appointmentDate descending
        bookings.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            // If both are pending or both are not, sort by date descending
            const dateA = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : null;
            const dateB = b.appointmentDate?.toDate ? b.appointmentDate.toDate() : null;
            if (dateA && dateB) return dateB - dateA;
            return 0;
        });

        let tableContent = '';
        bookings.forEach((booking) => {
            const row = createBookingRow(booking.id, booking);
            tableContent += row;
        });
        appointmentsTable.innerHTML = tableContent;

        // Update dashboard stats
        updateDashboardStats(snapshot);
    }

    // Update dashboard stats
    function updateDashboardStats(snapshot) {
        let totalBookings = 0;
        let totalRevenue = 0;
        let pendingBookings = 0;

        snapshot.forEach((doc) => {
            const booking = doc.data();
            // Only count non-cancelled bookings
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
    }

    // Create booking row
    function createBookingRow(id, booking) {
        const appointmentDate = booking.appointmentDate?.toDate();
        const formattedDate = appointmentDate ? moment(appointmentDate).format('MMM D, YYYY h:mm A') : 'N/A';

        return `
            <tr>
                <td>${id.substring(0, 8)}</td>
                <td>${booking.customerName || 'N/A'}</td>
                <td>${booking.customerPhone || 'N/A'}</td>
                <td>${booking.serviceName || 'N/A'}</td>
                <td>$${booking.servicePrice?.toFixed(2) || '0.00'}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="badge bg-${getStatusColor(booking.status)}">
                        ${booking.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewBooking('${id}')" aria-label="View booking">
                        <i class="bi bi-eye" aria-hidden="true"></i>
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-success me-1" onclick="confirmBooking('${id}')" aria-label="Confirm booking">
                            <i class="bi bi-check-lg" aria-hidden="true"></i>
                        </button>
                    ` : ''}
                    ${booking.status !== 'cancelled' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="cancelBooking('${id}')" aria-label="Cancel booking">
                            <i class="bi bi-x-lg" aria-hidden="true"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }

    // Get status color
    function getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'pending': return 'warning';
            case 'confirmed': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }

    // View booking
    window.viewBooking = function (id) {
        bookingsRef.doc(id).get()
            .then((doc) => {
                if (doc.exists) {
                    const booking = doc.data();
                    const modal = new bootstrap.Modal(document.getElementById('appointment-modal'));
                    document.getElementById('appointment-details').innerHTML = `
                        <div class="appointment-details">
                            <h4>Booking Details</h4>
                            <div class="detail-row">
                                <span class="detail-label">Customer:</span>
                                <span class="detail-value">${booking.customerName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Contact:</span>
                                <span class="detail-value">
                                    ${booking.customerEmail}<br>
                                    ${booking.customerPhone}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Service:</span>
                                <span class="detail-value">${booking.serviceName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date & Time:</span>
                                <span class="detail-value">
                                    ${booking.appointmentDate ? moment(booking.appointmentDate.toDate()).format('MMM D, YYYY h:mm A') : 'N/A'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">
                                    <span class="badge bg-${getStatusColor(booking.status)}">
                                        ${booking.status}
                                    </span>
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Price:</span>
                                <span class="detail-value">$${booking.servicePrice?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    `;
                    modal.show();
                }
            })
            .catch((error) => {
                console.error('Error loading booking:', error);
                alert('Error loading booking details. Please try again.');
            });
    };

    // Confirm booking
    window.confirmBooking = function (id) {
        if (confirm('Are you sure you want to confirm this booking?')) {
            bookingsRef.doc(id).get()
                .then((doc) => {
                    if (!doc.exists) {
                        throw new Error('Booking not found');
                    }

                    const booking = doc.data();
                    const batch = db.batch();

                    // First, check if customer already exists
                    return db.collection('customers')
                        .where('email', '==', booking.customerEmail)
                        .get()
                        .then((customerSnapshot) => {
                            let customerRef;

                            if (customerSnapshot.empty) {
                                // Create new customer
                                customerRef = db.collection('customers').doc();
                                const customerData = {
                                    name: booking.customerName,
                                    email: booking.customerEmail,
                                    phone: booking.customerPhone,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    bookings: [id],
                                    totalSpent: booking.servicePrice || 0,
                                    lastBooking: booking.appointmentDate
                                };
                                batch.set(customerRef, customerData);
                            } else {
                                // Update existing customer
                                customerRef = customerSnapshot.docs[0].ref;
                                const customerData = {
                                    bookings: firebase.firestore.FieldValue.arrayUnion(id),
                                    totalSpent: firebase.firestore.FieldValue.increment(booking.servicePrice || 0),
                                    lastBooking: booking.appointmentDate
                                };
                                batch.update(customerRef, customerData);
                            }

                            // Update booking status
                            batch.update(bookingsRef.doc(id), {
                                status: 'confirmed',
                                customerId: customerRef.id,
                                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            return batch.commit();
                        });
                })
                .then(() => {
                    loadBookings();
                })
                .catch((error) => {
                    console.error('Error confirming booking:', error);
                    alert('Error confirming booking. Please try again.');
                });
        }
    };

    // Cancel booking
    window.cancelBooking = function (id) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            bookingsRef.doc(id).update({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
                .then(() => {
                    loadBookings();
                })
                .catch((error) => {
                    console.error('Error cancelling booking:', error);
                    alert('Error cancelling booking. Please try again.');
                });
        }
    };

    // Event Listeners
    document.getElementById('filter-appointments').addEventListener('click', () => {
        filterCard.style.display = filterCard.style.display === 'none' ? 'block' : 'none';
    });

    resetFiltersBtn.addEventListener('click', () => {
        filterStatus.value = '';
        filterService.value = '';
        filterDateFrom.value = '';
        filterDateTo.value = '';
        loadBookings();
    });

    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            status: filterStatus.value,
            serviceId: filterService.value,
            dateFrom: filterDateFrom.value,
            dateTo: filterDateTo.value
        };
        loadBookings(filters);
    });

    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = appointmentsTable.getElementsByTagName('tr');

        Array.from(rows).forEach((row) => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Add page visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            isFirstLoad = true;
            loadBookings();
        }
    });

    // Add event listeners for refresh, export, and date scope buttons (match HTML)
    const refreshBtn = document.getElementById('refresh-data');
    const exportBtn = document.getElementById('export-data');
    const timeRangeDropdown = document.getElementById('timeRangeDropdown');
    const timeRangeMenu = document.querySelector('.dropdown-menu[aria-labelledby="timeRangeDropdown"]');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Reset filters
            filterStatus.value = '';
            filterService.value = '';
            filterDateFrom.value = '';
            filterDateTo.value = '';
            currentFilters.status = '';
            currentFilters.serviceId = '';
            currentFilters.dateFrom = null;
            currentFilters.dateTo = null;
            // Visually indicate refresh
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refresh';
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            }, 800);
            loadBookings(currentFilters);
        });
    }

    function setTimeRangeDropdownText(label) {
        if (timeRangeDropdown) {
            timeRangeDropdown.innerHTML = `<i class="bi bi-calendar3"></i> ${label}`;
        }
    }

    if (timeRangeMenu) {
        timeRangeMenu.addEventListener('click', (e) => {
            const target = e.target.closest('[data-range]');
            if (!target) return;
            const range = target.getAttribute('data-range');
            const today = new Date();
            if (range === 'today') {
                const dateStr = today.toISOString().slice(0, 10);
                filterDateFrom.value = dateStr;
                filterDateTo.value = dateStr;
                currentFilters.dateFrom = dateStr;
                currentFilters.dateTo = dateStr;
                setTimeRangeDropdownText('Today');
            } else if (range === 'week') {
                const first = today.getDate() - today.getDay() + 1; // Monday
                const last = first + 6; // Sunday
                const monday = new Date(today.setDate(first));
                const sunday = new Date(today.setDate(last));
                filterDateFrom.value = monday.toISOString().slice(0, 10);
                filterDateTo.value = sunday.toISOString().slice(0, 10);
                currentFilters.dateFrom = filterDateFrom.value;
                currentFilters.dateTo = filterDateTo.value;
                setTimeRangeDropdownText('This Week');
            } else if (range === 'month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                filterDateFrom.value = firstDay.toISOString().slice(0, 10);
                filterDateTo.value = lastDay.toISOString().slice(0, 10);
                currentFilters.dateFrom = filterDateFrom.value;
                currentFilters.dateTo = filterDateTo.value;
                setTimeRangeDropdownText('This Month');
            } else if (range === 'year') {
                const firstDay = new Date(today.getFullYear(), 0, 1);
                const lastDay = new Date(today.getFullYear(), 11, 31);
                filterDateFrom.value = firstDay.toISOString().slice(0, 10);
                filterDateTo.value = lastDay.toISOString().slice(0, 10);
                currentFilters.dateFrom = filterDateFrom.value;
                currentFilters.dateTo = filterDateTo.value;
                setTimeRangeDropdownText('This Year');
            }
            loadBookings(currentFilters);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof XLSX === 'undefined') {
                alert('Excel export library (SheetJS) is not loaded. Please check your internet connection or contact support.');
                return;
            }
            exportAppointmentsToExcel();
        });
    }

    // Improved Excel export
    function exportAppointmentsToExcel() {
        let bookings = [];
        const rows = appointmentsTable.querySelectorAll('tr');
        // Get headers
        const headers = [
            'Booking ID', 'Customer Name', 'Phone', 'Service', 'Price', 'Date', 'Status'
        ];
        // Collect bookings by status
        let pendingRows = [], confirmedRows = [], completedRows = [], cancelledRows = [];
        rows.forEach((row, idx) => {
            if (row.querySelector('td') && row.querySelector('td').colSpan >= 7) return; // skip loading/empty rows
            if (idx === 0 && row.querySelector('th')) return; // skip header row if present
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const rowData = [
                    cells[0].innerText,
                    cells[1].innerText,
                    cells[2].innerText,
                    cells[3].innerText,
                    cells[4].innerText,
                    cells[5].innerText,
                    cells[6].innerText
                ];
                const status = (cells[6].innerText || '').toLowerCase();
                if (status.includes('pending')) pendingRows.push(rowData);
                else if (status.includes('confirmed') || status.includes('approved')) confirmedRows.push(rowData);
                else if (status.includes('completed')) completedRows.push(rowData);
                else if (status.includes('cancelled')) cancelledRows.push(rowData);
                else bookings.push(rowData);
            }
        });
        if (
            pendingRows.length === 0 &&
            confirmedRows.length === 0 &&
            completedRows.length === 0 &&
            cancelledRows.length === 0 &&
            bookings.length === 0
        ) {
            alert('No appointments to export.');
            return;
        }
        // Build the export data with sections
        let exportData = [];
        exportData.push(['', '', 'Appointments Export', '', '', '', '']);
        // Pending section
        if (pendingRows.length) {
            exportData.push(['', '', 'Pending Requests', '', '', '', '']);
            exportData.push(headers);
            exportData = exportData.concat(pendingRows);
        }
        // Confirmed/Approved section
        if (confirmedRows.length) {
            exportData.push(['', '', 'Approved/Confirmed', '', '', '', '']);
            exportData.push(headers);
            exportData = exportData.concat(confirmedRows);
        }
        // Completed section
        if (completedRows.length) {
            exportData.push(['', '', 'Completed', '', '', '', '']);
            exportData.push(headers);
            exportData = exportData.concat(completedRows);
        }
        // Cancelled section
        if (cancelledRows.length) {
            exportData.push(['', '', 'Cancelled', '', '', '', '']);
            exportData.push(headers);
            exportData = exportData.concat(cancelledRows);
        }
        // Other section
        if (bookings.length) {
            exportData.push(['', '', 'Other', '', '', '', '']);
            exportData.push(headers);
            exportData = exportData.concat(bookings);
        }
        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        // Add beautiful formatting
        const range = XLSX.utils.decode_range(ws['!ref']);
        let sectionColor = {
            pending: 'FFF9C4', // light yellow
            confirmed: 'C6EFCE', // light green
            completed: 'B4C6E7', // light blue
            cancelled: 'F8CBAD', // light red
            other: 'E2EFDA'
        };
        let sectionHeaderRows = [];
        // Find section header rows
        for (let R = 0; R <= range.e.r; ++R) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: 2 })];
            if (cell && (
                cell.v === 'Pending Requests' ||
                cell.v === 'Approved/Confirmed' ||
                cell.v === 'Completed' ||
                cell.v === 'Cancelled' ||
                cell.v === 'Other')) {
                sectionHeaderRows.push({ row: R, label: cell.v });
            }
        }
        // Style title row
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, sz: 18, color: { rgb: '0070C0' }, italic: true },
                    alignment: { horizontal: 'center' }
                };
            }
        }
        // Style section headers
        sectionHeaderRows.forEach(({ row, label }) => {
            let fillColor = sectionColor.other;
            if (label === 'Pending Requests') fillColor = sectionColor.pending;
            else if (label === 'Approved/Confirmed') fillColor = sectionColor.confirmed;
            else if (label === 'Completed') fillColor = sectionColor.completed;
            else if (label === 'Cancelled') fillColor = sectionColor.cancelled;
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: row, c: C })];
                if (cell) {
                    cell.s = {
                        font: { bold: true, sz: 14, color: { rgb: '000000' }, italic: true },
                        fill: { fgColor: { rgb: fillColor } },
                        alignment: { horizontal: 'center' },
                        border: { top: { style: 'medium', color: { rgb: '000000' } }, bottom: { style: 'medium', color: { rgb: '000000' } } }
                    };
                }
            }
        });
        // Style headers and data rows
        let lastSectionHeader = 0;
        for (let i = 0; i < sectionHeaderRows.length; ++i) {
            const start = sectionHeaderRows[i].row + 1;
            const end = (sectionHeaderRows[i + 1] ? sectionHeaderRows[i + 1].row : range.e.r);
            // Style header row
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: start, c: C })];
                if (cell) {
                    cell.s = {
                        font: { bold: true, color: { rgb: 'FFFFFF' } },
                        fill: { fgColor: { rgb: '0070C0' } },
                        alignment: { horizontal: 'center' },
                        border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } } }
                    };
                }
            }
            // Style data rows
            for (let R = start + 1; R <= end; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (!cell.s) cell.s = {};
                    cell.s.alignment = { horizontal: 'center' };
                    cell.s.font = { name: 'Calibri', sz: 12 };
                    cell.s.border = { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } };
                    // Row color by section
                    let fillColor = null;
                    if (sectionHeaderRows[i].label === 'Pending Requests') fillColor = sectionColor.pending;
                    else if (sectionHeaderRows[i].label === 'Approved/Confirmed') fillColor = sectionColor.confirmed;
                    else if (sectionHeaderRows[i].label === 'Completed') fillColor = sectionColor.completed;
                    else if (sectionHeaderRows[i].label === 'Cancelled') fillColor = sectionColor.cancelled;
                    else fillColor = sectionColor.other;
                    if (fillColor && R % 2 === 0) {
                        cell.s.fill = { fgColor: { rgb: fillColor } };
                    }
                    // Status column special color
                    if (C === 6) {
                        if (cell.v && cell.v.toLowerCase().includes('pending')) cell.s.font = { bold: true, color: { rgb: 'B8860B' }, italic: true };
                        else if (cell.v && cell.v.toLowerCase().includes('confirmed')) cell.s.font = { bold: true, color: { rgb: '228B22' }, italic: true };
                        else if (cell.v && cell.v.toLowerCase().includes('completed')) cell.s.font = { bold: true, color: { rgb: '1E90FF' }, italic: true };
                        else if (cell.v && cell.v.toLowerCase().includes('cancelled')) cell.s.font = { bold: true, color: { rgb: 'B22222' }, italic: true };
                    }
                }
            }
        }
        // Auto-width columns
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
        XLSX.writeFile(wb, 'appointments.xlsx');
    }

    // Initial load
    loadServices();
    loadBookings();
});
