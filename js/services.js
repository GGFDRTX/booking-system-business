// Owner Services JavaScript

let servicesInitialized = false;

function initializeServices() {
    if (servicesInitialized) return;

    console.log('Initializing services module');

    // Initialize Firestore
    const db = firebase.firestore();
    const servicesRef = db.collection('config').doc('services');

    // DOM Elements
    const servicesContainer = document.getElementById('services-container');
    const addServiceBtn = document.getElementById('add-service-btn');
    const serviceModal = document.getElementById('service-modal');
    const serviceForm = document.getElementById('service-form');
    const saveServiceBtn = document.getElementById('save-service');

    if (!servicesContainer || !addServiceBtn || !serviceModal || !serviceForm || !saveServiceBtn) {
        console.error('Required DOM elements not found');
        return;
    }

    // Initialize Bootstrap modal
    const modal = new bootstrap.Modal(serviceModal);

    // Load services
    function loadServices() {
        servicesContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        servicesRef.get()
            .then((doc) => {
                if (!doc.exists || !doc.data().services || doc.data().services.length === 0) {
                    servicesContainer.innerHTML = `
                        <div class="col-12 text-center">
                            <p>No services found. Add your first service!</p>
                        </div>
                    `;
                    return;
                }

                const services = doc.data().services;
                servicesContainer.innerHTML = '';
                services.forEach((service) => {
                    const card = createServiceCard(service.id, service);
                    servicesContainer.appendChild(card);
                });
            })
            .catch((error) => {
                console.error('Error loading services:', error);
                servicesContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-danger">Error loading services. Please try again.</p>
                    </div>
                `;
            });
    }

    // Create service card
    function createServiceCard(id, service) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card service-card h-100">
                <img src="${service.image || 'https://placehold.co/300x200'}" 
                     class="card-img-top" 
                     alt="${service.name}"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='">
                <div class="card-body">
                    <h5 class="card-title">${service.name}</h5>
                    <p class="card-text">${service.description || 'No description available'}</p>
                    <div class="service-stats">
                        <span><i class="bi bi-currency-dollar"></i> ${service.price.toFixed(2)}</span>
                        <span><i class="bi bi-clock"></i> ${service.duration} min</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editService('${id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteService('${id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        return col;
    }

    // Add service
    function addService(serviceData) {
        return servicesRef.get()
            .then((doc) => {
                let services = [];
                if (doc.exists) {
                    services = doc.data().services || [];
                }

                // Generate new service ID
                const newService = {
                    ...serviceData,
                    id: 'service_' + Math.random().toString(36).substring(2, 10)
                };

                services.push(newService);

                return servicesRef.set({ services });
            });
    }

    // Update service
    function updateService(id, serviceData) {
        return servicesRef.get()
            .then((doc) => {
                if (!doc.exists) {
                    throw new Error('Services document not found');
                }

                let services = doc.data().services || [];
                const index = services.findIndex(s => s.id === id);

                if (index === -1) {
                    throw new Error('Service not found');
                }

                services[index] = {
                    ...services[index],
                    ...serviceData,
                    id: id
                };

                return servicesRef.set({ services });
            });
    }

    // Delete service
    function deleteService(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            servicesRef.get()
                .then((doc) => {
                    if (!doc.exists) {
                        throw new Error('Services document not found');
                    }

                    let services = doc.data().services || [];
                    services = services.filter(s => s.id !== id);

                    return servicesRef.set({ services });
                })
                .then(() => {
                    console.log('Service deleted successfully');
                    loadServices();
                })
                .catch((error) => {
                    console.error('Error deleting service:', error);
                    alert('Error deleting service. Please try again.');
                });
        }
    }

    // Edit service
    window.editService = function (id) {
        servicesRef.get()
            .then((doc) => {
                if (!doc.exists) {
                    throw new Error('Services document not found');
                }

                const services = doc.data().services || [];
                const service = services.find(s => s.id === id);

                if (!service) {
                    throw new Error('Service not found');
                }

                document.getElementById('service-id').value = id;
                document.getElementById('service-name').value = service.name;
                document.getElementById('service-description').value = service.description || '';
                document.getElementById('service-price').value = service.price;
                document.getElementById('service-duration').value = service.duration;
                document.getElementById('service-image').value = service.image || '';
                document.getElementById('service-modal-title').textContent = 'Edit Service';
                modal.show();
            })
            .catch((error) => {
                console.error('Error loading service:', error);
                alert('Error loading service. Please try again.');
            });
    };

    // Delete service (global function)
    window.deleteService = deleteService;

    // Event Listeners
    addServiceBtn.addEventListener('click', () => {
        serviceForm.reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-modal-title').textContent = 'Add Service';
        modal.show();
    });

    saveServiceBtn.addEventListener('click', () => {
        const serviceId = document.getElementById('service-id').value;
        const serviceData = {
            name: document.getElementById('service-name').value,
            description: document.getElementById('service-description').value,
            price: parseFloat(document.getElementById('service-price').value),
            duration: parseInt(document.getElementById('service-duration').value),
            image: document.getElementById('service-image').value
        };

        if (!serviceData.name || !serviceData.price || !serviceData.duration) {
            alert('Please fill in all required fields');
            return;
        }

        const savePromise = serviceId ?
            updateService(serviceId, serviceData) :
            addService(serviceData);

        savePromise
            .then(() => {
                modal.hide();
                loadServices();
            })
            .catch((error) => {
                console.error('Error saving service:', error);
                alert('Error saving service. Please try again.');
            });
    });

    // Ensure default services exist and are correct
    function ensureDefaultServices() {
        const defaultServices = [
            {
                id: 'service_1',
                name: 'Basic Service',
                description: 'Standard service package with essential features.',
                price: 49.99,
                duration: 60,
                image: 'images/basic.png'
            },
            {
                id: 'service_2',
                name: 'Premium Service',
                description: 'Enhanced service with additional features and priority handling.',
                price: 79.99,
                duration: 90,
                image: 'images/premium.png'
            },
            {
                id: 'service_3',
                name: 'Deluxe Service',
                description: 'Comprehensive service package with all premium features and VIP treatment.',
                price: 129.99,
                duration: 120,
                image: 'images/deluxe.png'
            }
        ];

        servicesRef.get()
            .then((doc) => {
                let needsUpdate = false;
                if (!doc.exists) {
                    needsUpdate = true;
                } else {
                    const current = doc.data().services || [];
                    if (current.length !== 3) {
                        needsUpdate = true;
                    } else {
                        // Check if all default services are present by id
                        const ids = current.map(s => s.id).sort();
                        const defaultIds = defaultServices.map(s => s.id).sort();
                        for (let i = 0; i < 3; i++) {
                            if (ids[i] !== defaultIds[i]) {
                                needsUpdate = true;
                                break;
                            }
                        }
                    }
                }
                if (needsUpdate) {
                    return servicesRef.set({ services: defaultServices })
                        .then(() => {
                            console.log('Default services ensured/created.');
                        });
                }
            })
            .catch((error) => {
                console.error('Error ensuring default services:', error);
            });
    }

    // Initial load
    ensureDefaultServices();
    loadServices();
    servicesInitialized = true;
}

// Wait for Firebase to be ready
document.addEventListener('firebaseReady', initializeServices);

// Backup initialization in case firebaseReady event was missed
if (document.readyState === 'complete') {
    if (firebase.apps.length && !servicesInitialized) {
        console.log('Firebase already initialized, initializing services');
        initializeServices();
    }
} 