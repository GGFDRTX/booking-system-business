// Owner Services Manager JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const db = firebase.firestore();
    
    // Add service button
    document.getElementById('add-service-btn').addEventListener('click', function() {
        // Reset form
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-modal-title').textContent = 'Add Service';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('service-modal'));
        modal.show();
    });
    
    // Save service
    document.getElementById('save-service').addEventListener('click', function() {
        const serviceId = document.getElementById('service-id').value;
        const serviceName = document.getElementById('service-name').value;
        const serviceDescription = document.getElementById('service-description').value;
        const servicePrice = parseFloat(document.getElementById('service-price').value);
        const serviceDuration = parseInt(document.getElementById('service-duration').value);
        const serviceImage = document.getElementById('service-image').value || 'https://via.placeholder.com/300x200?text=Service';
        
        if (!serviceName || isNaN(servicePrice) || isNaN(serviceDuration)) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Create service object
        const service = {
            name: serviceName,
            description: serviceDescription,
            price: servicePrice,
            duration: serviceDuration,
            image: serviceImage
        };
        
        // Save to Firestore
        saveService(serviceId, service);
        
        // Close modal
        document.querySelector('#service-modal .btn-close').click();
    });
    
    // Save service to Firestore
    function saveService(serviceId, service) {
        // Get existing services
        db.collection('config').doc('services').get()
            .then(doc => {
                let services = [];
                
                if (doc.exists) {
                    services = doc.data().services || [];
                }
                
                if (serviceId) {
                    // Update existing service
                    const index = services.findIndex(s => s.id === serviceId);
                    if (index !== -1) {
                        service.id = serviceId;
                        services[index] = service;
                    }
                } else {
                    // Add new service
                    service.id = generateServiceId();
                    services.push(service);
                }
                
                // Save to Firestore
                return db.collection('config').doc('services').set({
                    services: services
                });
            })
            .then(() => {
                console.log('Service saved successfully!');
                
                // Update services in shared.js
                updateSharedServices();
                
                // Reload services
                loadServices();
            })
            .catch(error => {
                console.error('Error saving service:', error);
                alert('Error saving service. Please try again.');
            });
    }
    
    // Generate service ID
    function generateServiceId() {
        return 'service_' + Math.random().toString(36).substring(2, 10);
    }
    
    // Update shared services
    function updateSharedServices() {
        db.collection('config').doc('services').get()
            .then(doc => {
                if (doc.exists) {
                    const services = doc.data().services || [];
                    window.services = services;
                }
            })
            .catch(error => {
                console.error('Error updating shared services:', error);
            });
    }
    
    // Load services
    function loadServices() {
        const servicesContainer = document.getElementById('services-container');
        servicesContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        
        // Get services from Firestore
        db.collection('config').doc('services').get()
            .then(doc => {
                let services = [];
                
                if (doc.exists) {
                    services = doc.data().services || [];
                }
                
                // Update shared services
                window.services = services;
                
                // Display services
                displayServices(services);
            })
            .catch(error => {
                console.error('Error loading services:', error);
                servicesContainer.innerHTML = `
                    <div class="col-12 text-center text-danger">
                        <p>Error loading services. Please try again.</p>
                    </div>
                `;
            });
    }
    
    // Display services
    function displayServices(services) {
        const servicesContainer = document.getElementById('services-container');
        
        if (services.length === 0) {
            servicesContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>No services found. Click "Add Service" to create your first service.</p>
                </div>
            `;
            return;
        }
        
        // Clear container
        servicesContainer.innerHTML = '';
        
        // Add services
        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'col-md-4 mb-4';
            serviceCard.innerHTML = `
                <div class="card service-card h-100">
                    <img class="card-img-top" src="${service.image}" alt="${service.name}">
                    <div class="card-body">
                        <h5 class="card-title">${service.name}</h5>
                        <p class="card-text">${service.description || 'No description available.'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary fw-bold">$${service.price.toFixed(2)}</span>
                            <span class="text-muted">${service.duration} min</span>
                        </div>
                        <div class="service-stats mt-3">
                            <span><i class="bi bi-calendar-check"></i> <span id="booking-count-${service.id}">...</span> bookings</span>
                            <span><i class="bi bi-currency-dollar"></i> <span id="revenue-${service.id}">...</span> revenue</span>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-primary edit-service-btn" data-service-id="${service.id}">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger delete-service-btn" data-service-id="${service.id}">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            servicesContainer.appendChild(serviceCard);
            
            // Load service statistics
            loadServiceStatistics(service.id);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-service-btn').forEach(button => {
            button.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service-id');
                editService(serviceId);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-service-btn').forEach(button => {
            button.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service-id');
                deleteService(serviceId);
            });
        });
    }
    
    // Load service statistics
    function loadServiceStatistics(serviceId) {
        // Get bookings for this service
        db.collection('bookings')
            .get()
            .then(snapshot => {
                let bookingCount = 0;
                let revenue = 0;
                
                snapshot.forEach(doc => {
                    const booking = doc.data();
                    
                    // Check if this booking is for the current service
                    if (booking.serviceId && booking.serviceId.toString() === serviceId.toString()) {
                        bookingCount++;
                        revenue += booking.servicePrice || 0;
                    }
                });
                
                // Update statistics
                const bookingCountElement = document.getElementById(`booking-count-${serviceId}`);
                const revenueElement = document.getElementById(`revenue-${serviceId}`);
                
                if (bookingCountElement) {
                    bookingCountElement.textContent = bookingCount;
                }
                
                if (revenueElement) {
                    revenueElement.textContent = `$${revenue.toFixed(2)}`;
                }
            })
            .catch(error => {
                console.error('Error loading service statistics:', error);
            });
    }
    
    // Edit service
    function editService(serviceId) {
        // Find service
        const service = window.services.find(s => s.id === serviceId);
        
        if (!service) {
            alert('Service not found.');
            return;
        }
        
        // Populate form
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-description').value = service.description || '';
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-duration').value = service.duration;
        document.getElementById('service-image').value = service.image;
        
        // Update modal title
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('service-modal'));
        modal.show();
    }
    
    // Delete service
    function deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }
        
        // Get existing services
        db.collection('config').doc('services').get()
            .then(doc => {
                let services = [];
                
                if (doc.exists) {
                    services = doc.data().services || [];
                }
                
                // Remove service
                services = services.filter(s => s.id !== serviceId);
                
                // Save to Firestore
                return db.collection('config').doc('services').set({
                    services: services
                });
            })
            .then(() => {
                console.log('Service deleted successfully!');
                
                // Update services in shared.js
                updateSharedServices();
                
                // Reload services
                loadServices();
            })
            .catch(error => {
                console.error('Error deleting service:', error);
                alert('Error deleting service. Please try again.');
            });
    }
    
    // Load services on page load
    loadServices();
});
