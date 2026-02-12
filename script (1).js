document.addEventListener('DOMContentLoaded', () => {
    // ========================================
    // SECTION NAVIGATION
    // ========================================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.page-section');
    const categoryItems = document.querySelectorAll('.cat-item');

    function showSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update nav active state (only for internal section links)
        navLinks.forEach(link => {
            if (link.dataset.section) {
                link.classList.remove('active');
                if (link.dataset.section === sectionId) {
                    link.classList.add('active');
                }
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Navigation click handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only prevent default and handle section navigation if link has data-section
            const sectionId = link.dataset.section;
            if (sectionId) {
                e.preventDefault();
                showSection(sectionId);
            }
            // Otherwise let the link navigate normally (for shop.html, login.html, etc.)
        });
    });

    // Category click handlers - go to shop
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // If we are on index.html, we might want to go to shop.html
            if (!window.location.pathname.includes('shop.html')) {
                window.location.href = 'shop.html';
            }
        });
    });

    // Cart icon click - go to cart page
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        cartIcon.style.cursor = 'pointer';
        cartIcon.addEventListener('click', () => {
            window.location.href = 'mycart.html';
        });
    }

    // Handle URL Hash on Load
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
        showSection(initialHash);
    } else {
        // If no hash, ensure home is active (if it exists)
        if (document.getElementById('home')) showSection('home');
    }


    // ========================================
    // SHOPPING CART LOGIC
    // ========================================
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function updateCartDisplay() {
        // Reload cart from storage to ensure sync
        cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Update Header Indicators
        const cartCount = document.getElementById('cartCount');
        if (cartCount) cartCount.textContent = cart.length;

        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
            cartTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    function addToCart(button) {
        const id = button.dataset.id;
        const title = button.dataset.title;
        const price = button.dataset.price;

        cart.push({ id, title, price });
        localStorage.setItem('cart', JSON.stringify(cart));

        updateCartDisplay();
        checkCheckoutStatus(); // Update checkout button state

        // Visual feedback
        const originalText = button.textContent;
        button.textContent = 'Added! ✓';
        button.style.background = '#4CAF50';
        button.style.color = 'white';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.style.color = '';
        }, 1500);
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        loadCartPage(); // Re-render the cart list
        checkCheckoutStatus(); // Update checkout button state
    }

    function loadCartPage() {
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        // Only run if we are on the cart page
        if (!cartItemsContainer) return;

        cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-cart-msg';
            emptyMsg.textContent = 'Your cart is empty.';
            cartItemsContainer.appendChild(emptyMsg);

            // Explicitly update total to 0.00
            const cartTotal = document.getElementById('cartTotal');
            if (cartTotal) cartTotal.textContent = '$0.00';

            checkCheckoutStatus();
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>Price: $${item.price}</p>
                </div>
                <div class="cart-item-actions">
                    <span class="t-price">$${item.price}</span>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Attach Remove Listeners
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                removeFromCart(index);
            });
        });

        updateCartDisplay();
        checkCheckoutStatus();
    }

    // Event Delegation for Add to Cart
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart') || e.target.closest('.add-cart-btn');
        if (button) {
            e.preventDefault();
            addToCart(button);
        }
    });

    // Initialize Cart Page if we are on it
    if (window.location.pathname.includes('mycart.html')) {
        loadCartPage();
    }


    // ========================================
    // CART & CHECKOUT SHARED HELPERS
    // ========================================
    // This function is defined here to be accessible by both cart and payment sections
    let paymentFile = null; // Declared here to be accessible by checkCheckoutStatus

    function checkCheckoutStatus() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            // Enable only if cart has items AND payment file is selected (if upload area exists)
            const hasItems = cart.length > 0;
            const hasPaymentFile = !document.getElementById('uploadArea') || paymentFile; // If no upload area, assume payment is not required or handled elsewhere

            checkoutBtn.disabled = !(hasItems && hasPaymentFile);
        }
    }


    // ========================================
    // PAYMENT UPLOAD
    // ========================================
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('paymentFile');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const removeUpload = document.getElementById('removeUpload');
    const checkoutBtn = document.getElementById('checkoutBtn'); // Re-get for local scope if needed, or use global

    if (uploadArea) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    function handleFileUpload(file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload an image (JPG, PNG) or PDF file');
            return;
        }

        paymentFile = file;

        // Show preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImage.src = ''; // Or a PDF icon
            previewImage.style.display = 'none';
        }

        fileName.textContent = file.name;
        uploadPreview.classList.add('show');
        uploadArea.style.display = 'none';
        checkCheckoutStatus();
    }

    if (removeUpload) {
        removeUpload.addEventListener('click', () => {
            paymentFile = null;
            uploadPreview.classList.remove('show');
            uploadArea.style.display = 'block';
            fileInput.value = '';
            checkCheckoutStatus();
        });
    }

    // Checkout button click
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0 && paymentFile) {
                alert(`Order placed successfully!\n\nItems: ${cart.length}\nTotal: ${document.getElementById('cartTotal').textContent}\nPayment proof: ${paymentFile.name}\n\nThank you for shopping with Book4U!`);

                // Reset cart and payment
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                paymentFile = null;
                uploadPreview.classList.remove('show');
                uploadArea.style.display = 'block';
                fileInput.value = '';

                // Update UI
                updateCartDisplay();
                loadCartPage(); // Clear the list
                checkCheckoutStatus();
            }
        });
    }


    // ========================================
    // SEARCH & CATEGORY FILTER
    // ========================================
    const searchInput = document.getElementById('searchInput');
    const categoryCards = document.querySelectorAll('.category-card');
    const homeCategoryItems = document.querySelectorAll('.cat-item');

    let currentCategory = 'all';
    let currentSearchTerm = '';

    // Function to get URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Initialize Shop Page from URL Params
    function initShopPage() {
        const urlCategory = getUrlParameter('category');
        const urlSearch = getUrlParameter('search');

        if (urlCategory) {
            currentCategory = urlCategory;
            // Update active state in UI
            if (categoryCards.length > 0) {
                categoryCards.forEach(c => c.classList.remove('active'));
                const activeCard = document.querySelector(`.category-card[data-category="${currentCategory}"]`);
                if (activeCard) activeCard.classList.add('active');
            }
        }

        if (urlSearch) {
            currentSearchTerm = urlSearch;
            if (searchInput) searchInput.value = currentSearchTerm;
        }

        filterBooks();
    }

    function filterBooks() {
        const query = currentSearchTerm.toLowerCase();

        // Filter Shop Cards (only runs if we are on the shop page)
        const shopCards = document.querySelectorAll('.shop-card');
        if (shopCards.length > 0) {
            shopCards.forEach(card => {
                const title = card.querySelector('.shop-card-title').textContent.toLowerCase();
                const author = card.querySelector('.shop-card-author').textContent.toLowerCase();
                const desc = card.querySelector('.shop-card-description') ? card.querySelector('.shop-card-description').textContent.toLowerCase() : '';
                const category = card.dataset.category;

                const matchesSearch = title.includes(query) || author.includes(query) || desc.includes(query);
                const matchesCategory = currentCategory === 'all' || category === currentCategory;

                if (matchesSearch && matchesCategory) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }

    // Search Function
    function performSearch() {
        if (!searchInput) return;

        const searchTerm = searchInput.value;
        if (!searchTerm.trim()) return;

        // If not on shop page, redirect
        if (!window.location.pathname.includes('shop.html')) {
            window.location.href = `shop.html?search=${encodeURIComponent(searchTerm)}`;
        } else {
            currentSearchTerm = searchTerm;
            filterBooks();
        }
    }

    // Search Input Listener
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performSearch();
            }
        });

        // Also handle real-time search on shop page
        if (window.location.pathname.includes('shop.html')) {
            searchInput.addEventListener('input', (event) => {
                currentSearchTerm = event.target.value;
                filterBooks();
            });
        }
    }

    // Search Button Listener
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }


    // Home Page Category Click Listener
    if (homeCategoryItems.length > 0) {
        homeCategoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                window.location.href = `shop.html?category=${encodeURIComponent(category)}`;
            });
        });
    }

    // Shop Page Category Click Listener
    if (categoryCards.length > 0) {
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                // Update UI
                categoryCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Update Filter
                currentCategory = card.dataset.category;
                filterBooks();
            });
        });
    }

    // Initialize with 'All' active if exists and no URL param override
    const allCategoryBtn = document.querySelector('.category-card[data-category="all"]');
    if (allCategoryBtn && !getUrlParameter('category')) {
        allCategoryBtn.classList.add('active');
    }

    // Run initialization if on shop page
    if (window.location.pathname.includes('shop.html')) {
        // Wait for DOM to be fully ready
        setTimeout(initShopPage, 100);
    }


    // ========================================
    // FORM HANDLERS
    // ========================================

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Check for remembered email
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            document.getElementById('email').value = rememberedEmail;
            const rememberMeCheckbox = document.getElementById('rememberMe');
            if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Handle Remember Me
                    if (rememberMe) {
                        localStorage.setItem('rememberedEmail', email);
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }

                    alert(`Welcome back, ${data.user.fullname}!\n\nEmail: ${data.user.email}`);
                    // Redirect to My Cart page as requested
                    window.location.href = 'mycart.html';
                } else {
                    alert(`Login failed: ${data.message}`);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                fullname: document.getElementById('fullname').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                address: document.getElementById('address').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    // Store welcome flag so shop page shows a styled popup
                    localStorage.setItem('newUser', data.user.fullname);
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    // Redirect to Shop page
                    window.location.href = 'shop.html';
                } else {
                    alert(`Registration failed: ${data.message}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            alert(`Thank you ${name}! Your message has been sent. We'll get back to you soon.`);
            contactForm.reset();
        });
    }


    // ========================================
    // WELCOME MODAL (Post-Registration)
    // ========================================
    const newUserName = localStorage.getItem('newUser');
    const welcomeModal = document.getElementById('welcomeModal');

    if (newUserName && welcomeModal && window.location.pathname.includes('shop.html')) {
        // Show the welcome modal
        const welcomeUserName = document.getElementById('welcomeUserName');
        if (welcomeUserName) {
            welcomeUserName.textContent = `Hello, ${newUserName}! 👋`;
        }
        welcomeModal.classList.add('active');

        // Close button
        const welcomeClose = document.getElementById('welcomeModalClose');
        if (welcomeClose) {
            welcomeClose.addEventListener('click', () => {
                welcomeModal.classList.remove('active');
                localStorage.removeItem('newUser');
            });
        }

        // Also close when clicking the overlay background
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                welcomeModal.classList.remove('active');
                localStorage.removeItem('newUser');
            }
        });
    }

    // Initial cart display update
    updateCartDisplay();
    // Also check checkout button status initially
    checkCheckoutStatus();
// ========================================
    // CHATBOT LOGIC
    // ========================================
    // NOTE: Ensure your HTML input tag has id="user-input"
    const chatInput = document.getElementById('user-input') || document.querySelector('#chat-widget input');
    const chatMessages = document.getElementById('chat-messages');
    // Select the arrow button next to the input
    const sendBtn = document.querySelector('#chat-widget button:not([onclick])');

    // Function to add messages to the screen
    function appendMessage(sender, text) {
        const isBot = sender === 'Bot';
        const align = isBot ? 'flex-start' : 'flex-end';
        const bg = isBot ? 'white' : '#667eea'; // Purple for User, White for Bot
        const color = isBot ? '#333' : 'white';
        const radius = isBot ? '0 15px 15px 15px' : '15px 15px 0 15px';
        const icon = isBot ? '<div style="font-size: 24px;">🤖</div>' : '';

        // Create the message HTML
        const msgHTML = `
            <div style="display: flex; gap: 10px; justify-content: ${align}; margin-bottom: 10px;">
                ${icon}
                <div style="background: ${bg}; padding: 12px 16px; border-radius: ${radius}; box-shadow: 0 2px 5px rgba(0,0,0,0.05); color: ${color}; font-size: 14px; line-height: 1.5; max-width: 80%;">
                    ${text}
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', msgHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    }

    // Main function to send the message
    async function handleChat() {
        const message = chatInput.value.trim();
        if (!message) return;

        // 1. Show User Message
        appendMessage('User', message);
        chatInput.value = '';

        // 2. Show "Thinking..."
        const loadingId = 'loading-' + Date.now();
        const loadingHTML = `<div id="${loadingId}" style="margin-left: 45px; font-style: italic; color: #888; font-size: 12px; margin-bottom: 10px;">Thinking...</div>`;
        chatMessages.insertAdjacentHTML('beforeend', loadingHTML);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // 3. Send to Server
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // 4. Remove "Thinking..." and Show Reply
            document.getElementById(loadingId).remove();
            appendMessage('Bot', data.reply);

        } catch (error) {
            console.error(error);
            if(document.getElementById(loadingId)) document.getElementById(loadingId).remove();
            appendMessage('Bot', "Sorry, I'm having trouble connecting right now.");
        }
    }

    // Listen for "Enter" key
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChat();
        });
    }

    // Listen for "Send Arrow" click
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop page reload
            handleChat();
        });
    }

});
