const API_URL = 'http://localhost:5000/api';

// State management
const state = {
    currentView: 'dashboard',
    menuItems: [],
    orders: [],
    customers: [],
    reservations: [],
    bills: [],
    currentOrder: {
        customer_id: null,
        items: []
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDashboard();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            switchView(view);
        });
    });

    // Menu events
    document.getElementById('add-menu-btn').addEventListener('click', () => {
        toggleForm('add-menu-form');
    });
    document.getElementById('cancel-menu').addEventListener('click', () => {
        toggleForm('add-menu-form');
        document.getElementById('menu-form').reset();
    });
    document.getElementById('menu-form').addEventListener('submit', saveMenuItem);

    // Order events
    document.getElementById('new-order-btn').addEventListener('click', () => {
        resetOrderForm();
        toggleForm('new-order-form');
    });
    document.getElementById('cancel-order').addEventListener('click', () => {
        toggleForm('new-order-form');
    });
    document.getElementById('order-form').addEventListener('submit', createOrder);
    document.getElementById('new-customer-btn').addEventListener('click', () => {
        toggleElement('new-customer-form');
    });
    document.getElementById('save-customer-btn').addEventListener('click', addNewCustomer);

    // Customer events
    document.getElementById('add-customer-btn').addEventListener('click', () => {
        toggleForm('add-customer-form');
        document.getElementById('customer-form').reset();
    });
    document.getElementById('cancel-customer').addEventListener('click', () => {
        toggleForm('add-customer-form');
    });
    document.getElementById('customer-form').addEventListener('submit', saveCustomer);

    // Reservation events
    document.getElementById('add-reservation-btn').addEventListener('click', () => {
        toggleForm('add-reservation-form');
        document.getElementById('reservation-form').reset();
    });
    document.getElementById('cancel-reservation').addEventListener('click', () => {
        toggleForm('add-reservation-form');
    });
    document.getElementById('reservation-form').addEventListener('submit', saveReservation);

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });

    document.getElementById('close-bill-btn').addEventListener('click', () => {
        document.getElementById('bill-modal').classList.add('hidden');
    });

    document.getElementById('print-bill-btn').addEventListener('click', printBill);

    document.getElementById('close-order-btn').addEventListener('click', () => {
        document.getElementById('order-details-modal').classList.add('hidden');
    });

    document.getElementById('create-bill-btn').addEventListener('click', createBillFromOrder);
}

// View switching
function switchView(view) {
    state.currentView = view;
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Show selected view
    document.getElementById(view).classList.add('active');
    event.target.classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        menu: 'Menu Management',
        orders: 'Orders',
        customers: 'Customers',
        billing: 'Billing',
        reservations: 'Reservations',
        reports: 'Reports & Analytics'
    };
    document.getElementById('page-title').textContent = titles[view] || view;
    
    // Load data for the view
    switch(view) {
        case 'menu':
            loadMenuItems();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'billing':
            loadBills();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'reports':
            loadReports();
            break;
        case 'dashboard':
            loadDashboard();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [orders, customers, bills] = await Promise.all([
            fetch(`${API_URL}/orders`).then(r => r.json()),
            fetch(`${API_URL}/customers`).then(r => r.json()),
            fetch(`${API_URL}/billing`).then(r => r.json())
        ]);

        state.orders = orders;
        state.customers = customers;
        state.bills = bills;

        // Calculate statistics
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.order_date).toDateString() === today);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        document.getElementById('today-orders').textContent = todayOrders.length;
        document.getElementById('today-revenue').textContent = '₹' + todayRevenue.toFixed(2);
        document.getElementById('total-customers').textContent = customers.length;
        document.getElementById('pending-orders').textContent = pendingOrders;

        // Recent orders table
        const recentOrdersTable = document.querySelector('#recent-orders-table tbody');
        recentOrdersTable.innerHTML = '';
        orders.slice(0, 5).reverse().forEach(order => {
            const row = document.createElement('tr');
            const customer = customers.find(c => c.id === order.customer_id);
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${customer ? customer.name : 'Walk-in'}</td>
                <td>₹${order.total ? order.total.toFixed(2) : '0'}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>${formatDate(order.order_date)}</td>
            `;
            recentOrdersTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Menu Management
async function loadMenuItems() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        state.menuItems = await response.json();
        
        const container = document.getElementById('menu-items-container');
        container.innerHTML = '';
        
        state.menuItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="menu-card-body">
                    <h4>${item.name}</h4>
                    <span class="category">${item.category}</span>
                    <div class="price">₹${item.price.toFixed(2)}</div>
                    <p class="description">${item.description || ''}</p>
                    <div class="menu-card-actions">
                        <button class="edit-btn" onclick="editMenuItem(${item.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deleteMenuItem(${item.id})">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
        alert('Error loading menu items');
    }
}

async function saveMenuItem(e) {
    e.preventDefault();
    
    const menuItem = {
        name: document.getElementById('menu-name').value,
        category: document.getElementById('menu-category').value,
        price: parseFloat(document.getElementById('menu-price').value),
        description: document.getElementById('menu-description').value
    };
    
    try {
        const response = await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(menuItem)
        });
        
        if (response.ok) {
            alert('Menu item added successfully!');
            document.getElementById('menu-form').reset();
            toggleForm('add-menu-form');
            loadMenuItems();
        } else {
            alert('Error adding menu item');
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        alert('Error saving menu item');
    }
}

async function deleteMenuItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
        loadMenuItems();
    } catch (error) {
        console.error('Error deleting menu item:', error);
    }
}

function editMenuItem(id) {
    const item = state.menuItems.find(m => m.id === id);
    if (!item) return;
    
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-description').value = item.description || '';
    
    // Would need to implement update logic
    alert('Edit functionality - Please delete and re-add with new values');
}

// Orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        state.orders = await response.json();
        
        const tbody = document.querySelector('.orders-table tbody');
        tbody.innerHTML = '';
        
        state.orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.customer_name || 'Walk-in'}</td>
                <td>₹${order.total ? order.total.toFixed(2) : '0'}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>${formatDate(order.order_date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="view-btn" onclick="viewOrderDetails(${order.id})">View</button>
                        <button class="delete-btn" onclick="deleteOrder(${order.id})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Load menu items for order form
        await loadMenuItemsForOrder();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function loadMenuItemsForOrder() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        state.menuItems = await response.json();
        
        const selector = document.getElementById('order-items-selector');
        selector.innerHTML = '';
        
        state.menuItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <h5>${item.name}</h5>
                <div class="price">₹${item.price.toFixed(2)}</div>
                <input type="number" class="qty-input" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" min="0" placeholder="Qty">
            `;
            selector.appendChild(card);
        });
        
        // Load customers for order form
        await loadCustomersForOrder();
    } catch (error) {
        console.error('Error loading menu items for order:', error);
    }
}

async function loadCustomersForOrder() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        const customers = await response.json();
        
        const select = document.getElementById('order-customer');
        select.innerHTML = '<option value="">Select or Create Customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
        
        state.customers = customers;
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function addNewCustomer() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    
    if (!name) {
        alert('Please enter customer name');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });
        
        const customer = await response.json();
        
        // Add to select
        const select = document.getElementById('order-customer');
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        option.selected = true;
        select.appendChild(option);
        
        // Reset form
        document.getElementById('cust-name').value = '';
        document.getElementById('cust-phone').value = '';
        toggleElement('new-customer-form');
        
        alert('Customer added successfully!');
    } catch (error) {
        console.error('Error adding customer:', error);
    }
}

function resetOrderForm() {
    state.currentOrder = { customer_id: null, items: [] };
    document.getElementById('order-form').reset();
    document.getElementById('order-items-table').innerHTML = '';
    document.getElementById('order-total').textContent = '₹0';
    toggleElement('new-customer-form', true);
}

// Track order items
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('qty-input')) {
        const qty = parseInt(e.target.value) || 0;
        if (qty > 0) {
            const id = parseInt(e.target.dataset.id);
            const name = e.target.dataset.name;
            const price = parseFloat(e.target.dataset.price);
            
            addItemToOrder(id, name, price, qty);
        } else {
            removeItemFromOrder(parseInt(e.target.dataset.id));
        }
    }
});

function addItemToOrder(id, name, price, qty) {
    const existingItem = state.currentOrder.items.find(i => i.menu_item_id === id);
    
    if (existingItem) {
        existingItem.quantity = qty;
    } else {
        state.currentOrder.items.push({
            menu_item_id: id,
            name,
            price,
            quantity: qty
        });
    }
    
    updateOrderSummary();
}

function removeItemFromOrder(id) {
    state.currentOrder.items = state.currentOrder.items.filter(i => i.menu_item_id !== id);
    updateOrderSummary();
}

function updateOrderSummary() {
    const tbody = document.getElementById('order-items-table');
    tbody.innerHTML = '';
    
    let total = 0;
    state.currentOrder.items.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${subtotal.toFixed(2)}</td>
            <td><button class="btn btn-danger" onclick="removeItemFromOrder(${item.menu_item_id})">Remove</button></td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('order-total').textContent = '₹' + total.toFixed(2);
}

async function createOrder(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('order-customer').value;
    if (!customerId) {
        alert('Please select a customer');
        return;
    }
    
    if (state.currentOrder.items.length === 0) {
        alert('Please add items to the order');
        return;
    }
    
    const order = {
        customer_id: parseInt(customerId),
        items: state.currentOrder.items,
        notes: document.getElementById('order-notes').value
    };
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (response.ok) {
            alert('Order created successfully!');
            resetOrderForm();
            toggleForm('new-order-form');
            loadOrders();
        } else {
            alert('Error creating order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Error creating order');
    }
}

async function deleteOrder(id) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
        loadOrders();
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await response.json();
        
        let itemsHtml = '';
        if (order.items) {
            order.items.forEach(item => {
                itemsHtml += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${item.subtotal.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
        
        const content = document.getElementById('order-details-content');
        content.innerHTML = `
            <h3>Order #${order.id}</h3>
            <div class="order-details">
                <p><strong>Customer:</strong> ${order.customer_name || 'Walk-in'}</p>
                <p><strong>Date:</strong> ${formatDate(order.order_date)}</p>
                <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                <h4>Items:</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <p style="margin-top: 20px;"><strong>Total: ₹${order.total ? order.total.toFixed(2) : '0'}</strong></p>
                <p><strong>Notes:</strong> ${order.notes || 'N/A'}</p>
            </div>
        `;
        
        document.getElementById('order-details-modal').classList.remove('hidden');
        document.getElementById('create-bill-btn').dataset.orderId = orderId;
    } catch (error) {
        console.error('Error loading order details:', error);
    }
}

// Customers
async function loadCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers`);
        state.customers = await response.json();
        
        const tbody = document.querySelector('.customers-table tbody');
        tbody.innerHTML = '';
        
        state.customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="delete-btn" onclick="deleteCustomer(${customer.id})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function saveCustomer(e) {
    e.preventDefault();
    
    const customer = {
        name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        email: document.getElementById('customer-email').value,
        address: document.getElementById('customer-address').value
    };
    
    try {
        const response = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });
        
        if (response.ok) {
            alert('Customer added successfully!');
            document.getElementById('customer-form').reset();
            toggleForm('add-customer-form');
            loadCustomers();
        } else {
            alert('Error adding customer');
        }
    } catch (error) {
        console.error('Error saving customer:', error);
    }
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
        await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
        loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
    }
}

// Billing
async function loadBills() {
    try {
        const response = await fetch(`${API_URL}/billing`);
        state.bills = await response.json();
        
        const tbody = document.querySelector('.billing-table tbody');
        tbody.innerHTML = '';
        
        state.bills.forEach(bill => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bill.bill_number}</td>
                <td>${bill.customer_name || 'Walk-in'}</td>
                <td>₹${bill.subtotal.toFixed(2)}</td>
                <td>₹${bill.tax.toFixed(2)}</td>
                <td>₹${bill.total.toFixed(2)}</td>
                <td><span class="status-badge ${bill.payment_status}">${bill.payment_status}</span></td>
                <td>${formatDate(bill.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="view-btn" onclick="viewBill(${bill.id})">View</button>
                        ${bill.payment_status === 'unpaid' ? `<button class="pay-btn" onclick="markAsPaid(${bill.id})">Mark Paid</button>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading bills:', error);
    }
}

async function createBillFromOrder() {
    const orderId = document.getElementById('create-bill-btn').dataset.orderId;
    
    try {
        const response = await fetch(`${API_URL}/billing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: parseInt(orderId) })
        });
        
        if (response.ok) {
            const bill = await response.json();
            alert('Bill created successfully!');
            document.getElementById('order-details-modal').classList.add('hidden');
            viewBill(bill.id);
        } else {
            alert('Error creating bill');
        }
    } catch (error) {
        console.error('Error creating bill:', error);
    }
}

async function viewBill(billId) {
    try {
        const response = await fetch(`${API_URL}/billing/${billId}`);
        const bill = await response.json();
        
        let itemsHtml = '';
        bill.items.forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        const billContent = document.getElementById('bill-content');
        billContent.innerHTML = `
            <div class="bill-header">
                <h2>INVOICE</h2>
                <p>Bill #: ${bill.bill_number}</p>
            </div>
            
            <div class="bill-info">
                <div class="bill-section">
                    <h4>From</h4>
                    <p><strong>Restaurant Name</strong></p>
                    <p>Your Restaurant<br>Address<br>Phone</p>
                </div>
                <div class="bill-section">
                    <h4>To</h4>
                    <p><strong>${bill.customer_name || 'Walk-in Customer'}</strong></p>
                    <p>${bill.phone || ''}</p>
                </div>
            </div>
            
            <div class="bill-items">
                <h4>Items</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            
            <div class="bill-summary">
                <div class="bill-summary-row">
                    <span>Subtotal:</span>
                    <span>₹${bill.subtotal.toFixed(2)}</span>
                </div>
                <div class="bill-summary-row">
                    <span>Tax (10%):</span>
                    <span>₹${bill.tax.toFixed(2)}</span>
                </div>
                <div class="bill-summary-row">
                    <span>Discount:</span>
                    <span>-₹${bill.discount.toFixed(2)}</span>
                </div>
                <div class="bill-summary-row bill-total">
                    <span>Total:</span>
                    <span>₹${bill.total.toFixed(2)}</span>
                </div>
                <p style="margin-top: 20px; font-size: 12px;">
                    Payment Status: <strong>${bill.payment_status}</strong>
                </p>
                <p style="font-size: 12px;">Date: ${formatDate(bill.created_at)}</p>
            </div>
        `;
        
        document.getElementById('bill-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading bill:', error);
    }
}

async function markAsPaid(billId) {
    try {
        const response = await fetch(`${API_URL}/billing/${billId}/payment`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_method: 'cash' })
        });
        
        if (response.ok) {
            alert('Bill marked as paid!');
            loadBills();
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
    }
}

function printBill() {
    window.print();
}

// Reservations
async function loadReservations() {
    try {
        const [reservations, customers] = await Promise.all([
            fetch(`${API_URL}/reservations`).then(r => r.json()),
            fetch(`${API_URL}/customers`).then(r => r.json())
        ]);
        
        state.reservations = reservations;
        
        const tbody = document.querySelector('.reservations-table tbody');
        tbody.innerHTML = '';
        
        reservations.forEach(res => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${res.id}</td>
                <td>${res.customer_name}</td>
                <td>${formatDate(res.reservation_date)}</td>
                <td>${res.guest_count}</td>
                <td><span class="status-badge ${res.status}">${res.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="delete-btn" onclick="deleteReservation(${res.id})">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Load customers for reservation form
        const select = document.getElementById('reservation-customer');
        select.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
        
        state.customers = customers;
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}

async function saveReservation(e) {
    e.preventDefault();
    
    const reservation = {
        customer_id: parseInt(document.getElementById('reservation-customer').value),
        reservation_date: document.getElementById('reservation-date').value,
        guest_count: parseInt(document.getElementById('reservation-guests').value),
        notes: document.getElementById('reservation-notes').value
    };
    
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservation)
        });
        
        if (response.ok) {
            alert('Reservation created successfully!');
            document.getElementById('reservation-form').reset();
            toggleForm('add-reservation-form');
            loadReservations();
        } else {
            alert('Error creating reservation');
        }
    } catch (error) {
        console.error('Error saving reservation:', error);
    }
}

async function deleteReservation(id) {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
    
    try {
        await fetch(`${API_URL}/reservations/${id}`, { method: 'DELETE' });
        loadReservations();
    } catch (error) {
        console.error('Error deleting reservation:', error);
    }
}

// Reports
async function loadReports() {
    try {
        const [orders, bills, customers] = await Promise.all([
            fetch(`${API_URL}/orders`).then(r => r.json()),
            fetch(`${API_URL}/billing`).then(r => r.json()),
            fetch(`${API_URL}/customers`).then(r => r.json())
        ]);
        
        // Calculate metrics
        const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
        const totalOrders = orders.length;
        const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalCustomers = customers.length;
        
        document.getElementById('report-total-revenue').textContent = '₹' + totalRevenue.toFixed(2);
        document.getElementById('report-total-orders').textContent = totalOrders;
        document.getElementById('report-avg-order').textContent = '₹' + avgOrder.toFixed(2);
        document.getElementById('report-total-customers').textContent = totalCustomers;
        
        // Payment status
        const paidCount = bills.filter(b => b.payment_status === 'paid').length;
        const unpaidCount = bills.filter(b => b.payment_status === 'unpaid').length;
        document.getElementById('paid-count').textContent = paidCount;
        document.getElementById('unpaid-count').textContent = unpaidCount;
        
        // Top items
        const itemCounts = {};
        orders.forEach(order => {
            // This would need item data from the backend
        });
        
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Utility functions
function toggleForm(formId) {
    document.getElementById(formId).classList.toggle('hidden');
}

function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (show === undefined) {
        element.classList.toggle('hidden');
    } else {
        show ? element.classList.remove('hidden') : element.classList.add('hidden');
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

// Add some styling for status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }
    .status-badge.pending {
        background: #fff3cd;
        color: #856404;
    }
    .status-badge.completed {
        background: #d4edda;
        color: #155724;
    }
    .status-badge.paid {
        background: #d4edda;
        color: #155724;
    }
    .status-badge.unpaid {
        background: #f8d7da;
        color: #721c24;
    }
    .status-badge.confirmed {
        background: #d4edda;
        color: #155724;
    }
`;
document.head.appendChild(style);
