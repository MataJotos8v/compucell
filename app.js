class TiendaApp {
    constructor() {
        this.products = [];
        this.currentUser = null;
        this.editingProductId = null;

        this.initializeApp();
        this.setupEventListeners();
        // Cargar productos desde el backend (productos.json vía API)
        this.fetchProductsFromServer();

        // Header hide/show on scroll (animación)
        let lastScrollY = window.scrollY;
        const header = document.querySelector('.header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > lastScrollY && window.scrollY > 60) {
                header.style.transform = 'translateY(-100%)';
                header.style.transition = 'transform 0.3s';
            } else {
                header.style.transform = 'translateY(0)';
                header.style.transition = 'transform 0.3s';
            }
            lastScrollY = window.scrollY;
        });
    }

    // Inicializa datos por defecto si está vacío
    initializeApp() {
        // Ya no inicializamos productos aquí, se cargan desde el servidor
    }

    // Cargar productos desde el backend (Node.js/Express)
    fetchProductsFromServer() {
        fetch('http://localhost:3000/api/productos')
            .then(res => res.json())
            .then(productos => {
                this.products = productos;
                this.renderProducts();
                this.renderAdminProducts();
            })
            .catch(() => {
                // Si falla, intenta cargar del localStorage
                this.products = this.loadProducts();
                this.renderProducts();
                this.renderAdminProducts();
            });
    }

    // Guardar productos en el backend (Node.js/Express)
    saveProductsToServer() {
        fetch('http://localhost:3000/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.products)
        })
        .then(() => {
            this.saveProductsLocal();
        })
        .catch(() => {
            this.saveProductsLocal();
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('homeBtn').addEventListener('click', () => this.showSection('customer'));
        document.getElementById('adminBtn').addEventListener('click', () => this.showSection('admin'));

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Admin login
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Admin logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Product modal
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.openProductModal();
        });

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeProductModal();
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeProductModal();
                this.closeProductDetailModal();
            });
        });

        // Product detail modal
        document.getElementById('productDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'productDetailModal') {
                this.closeProductDetailModal();
            }
        });

        // Close modals when clicking outside
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                this.closeProductModal();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
                this.closeProductDetailModal();
            }
        });
    }

    // Show specific section
    showSection(section) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        if (section === 'customer') {
            document.getElementById('homeBtn').classList.add('active');
            document.getElementById('customerSection').classList.add('active');
        } else if (section === 'admin') {
            document.getElementById('adminBtn').classList.add('active');
            document.getElementById('adminSection').classList.add('active');
        }
    }

    // Filter products based on search
    filterProducts(searchTerm) {
        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderProducts(filteredProducts);
    }

    // Open product detail modal
    openProductDetailModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('productDetailModal');
        document.getElementById('detailProductImage').src = product.image;
        document.getElementById('detailProductImage').alt = product.name;
        document.getElementById('detailProductName').textContent = product.name;
        document.getElementById('detailProductPrice').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('detailProductDescription').textContent = product.description;
        document.getElementById('detailProductMaterials').textContent = product.materials || 'Información no disponible';
        document.getElementById('detailProductSpecifications').textContent = product.specifications || 'Información no disponible';

        // WhatsApp button
        const whatsappBtn = document.getElementById('detailWhatsappBtn');
        whatsappBtn.onclick = () => window.open(product.whatsappUrl, '_blank');

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close product detail modal
    closeProductDetailModal() {
        const modal = document.getElementById('productDetailModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Render products for customers
    renderProducts(productsToRender = this.products) {
        const grid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');

        if (productsToRender.length === 0) {
            grid.style.display = 'none';
            noProducts.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        noProducts.style.display = 'none';

        grid.innerHTML = productsToRender.map(product => `
            <div class="product-card" onclick="tiendaApp.openProductDetailModal(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <p class="product-description">${product.description.substring(0, 120)}...</p>
                    <div class="product-preview-footer">
                        <span class="view-details">Ver detalles</span>
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Handle admin login
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'kyugo' && password === 'HugoViejo.12') {
            this.currentUser = username;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            this.showNotification('Inicio de sesión exitoso', 'success');
            this.renderAdminProducts();
        } else {
            this.showNotification('Credenciales incorrectas', 'error');
        }
    }

    // Handle admin logout
    handleLogout() {
        this.currentUser = null;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showNotification('Sesión cerrada', 'success');
    }

    // Render products for admin
    renderAdminProducts() {
        const container = document.getElementById('adminProductsList');

        if (this.products.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No hay productos registrados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="admin-product-item">
                <img src="${product.image}" alt="${product.name}" class="admin-product-image"
                     onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500'">
                <div class="admin-product-info">
                    <h4>${product.name}</h4>
                    <div class="price">$${product.price.toFixed(2)}</div>
                    <div class="description">${product.description.substring(0, 100)}...</div>
                </div>
                <div class="admin-product-actions">
                    <button class="btn btn-warning btn-small" onclick="tiendaApp.editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="tiendaApp.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Open product modal for adding/editing
    openProductModal(product = null) {
        this.editingProductId = product ? product.id : null;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');

        title.textContent = product ? 'Editar Producto' : 'Agregar Producto';

        if (product) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productMaterials').value = product.materials || '';
            document.getElementById('productSpecifications').value = product.specifications || '';
            document.getElementById('whatsappUrl').value = product.whatsappUrl;
            // No se puede precargar la imagen por seguridad
        } else {
            document.getElementById('productForm').reset();
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close product modal
    closeProductModal() {
        const modal = document.getElementById('productModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.editingProductId = null;
        document.getElementById('productForm').reset();
    }

    // Handle product form submission
    handleProductSubmit() {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const description = document.getElementById('productDescription').value.trim();
        const materials = document.getElementById('productMaterials').value.trim();
        const specifications = document.getElementById('productSpecifications').value.trim();
        const whatsappUrl = document.getElementById('whatsappUrl').value.trim();
        const fileInput = document.getElementById('productImage');
        const file = fileInput.files[0];

        if (!name || !price || !description || !whatsappUrl) {
            this.showNotification('Por favor, completa los campos obligatorios', 'error');
            return;
        }
        if (price <= 0) {
            this.showNotification('El precio debe ser mayor a 0', 'error');
            return;
        }

        const saveProduct = (imageBase64) => {
            if (this.editingProductId) {
                // Editar producto existente
                const idx = this.products.findIndex(p => p.id === this.editingProductId);
                if (idx !== -1) {
                    this.products[idx] = {
                        ...this.products[idx],
                        name,
                        price,
                        description,
                        materials,
                        specifications,
                        whatsappUrl,
                        image: imageBase64 || this.products[idx].image
                    };
                    this.showNotification('Producto actualizado exitosamente', 'success');
                }
            } else {
                // Nuevo producto
                const newProduct = {
                    id: Date.now(),
                    name,
                    price,
                    description,
                    materials,
                    specifications,
                    image: imageBase64,
                    whatsappUrl
                };
                this.products.push(newProduct);
                this.showNotification('Producto agregado exitosamente', 'success');
            }
            this.saveProductsToServer();
            this.renderProducts();
            this.renderAdminProducts();
            this.closeProductModal();
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => saveProduct(e.target.result);
            reader.readAsDataURL(file);
        } else {
            // Si no se seleccionó nueva imagen, usar la anterior (solo en edición)
            if (this.editingProductId) {
                saveProduct();
            } else {
                this.showNotification('Debes seleccionar una imagen', 'error');
            }
        }
    }

    // Edit product
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            this.openProductModal(product);
        }
    }

    // Delete product
    deleteProduct(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveProductsToServer();
            this.renderProducts();
            this.renderAdminProducts();
            this.showNotification('Producto eliminado exitosamente', 'success');
        }
    }

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        const iconEl = notification.querySelector('.notification-icon');

        messageEl.textContent = message;

        // Reset classes
        notification.className = 'notification';
        notification.classList.add(type);

        // Set appropriate icon
        switch (type) {
            case 'success':
                iconEl.className = 'notification-icon fas fa-check-circle';
                break;
            case 'error':
                iconEl.className = 'notification-icon fas fa-exclamation-circle';
                break;
            case 'warning':
                iconEl.className = 'notification-icon fas fa-exclamation-triangle';
                break;
            default:
                iconEl.className = 'notification-icon fas fa-info-circle';
        }

        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Local storage fallback
    saveProductsLocal() {
        localStorage.setItem('tienda_productos', JSON.stringify(this.products));
    }

    loadProducts() {
        const saved = localStorage.getItem('tienda_productos');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tiendaApp = new TiendaApp();
});

// Handle image loading errors
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500';
    }
}, true);