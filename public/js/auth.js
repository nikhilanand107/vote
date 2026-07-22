document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = '/dashboard.html';
    }

    // Toggle forms
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        signupSection.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        
        const aadharCardNumber = document.getElementById('login-aadhar').value;
        const password = document.getElementById('login-password').value;
        const role = document.querySelector('input[name="loginRole"]:checked').value;
        const endpoint = role === 'candidate' ? '/candidate/login' : '/user/login';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadharCardNumber, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard.html';
            } else {
                loginError.textContent = data.error || 'Login failed';
                loginError.style.display = 'block';
            }
        } catch (err) {
            loginError.textContent = 'Network error. Please try again later.';
            loginError.style.display = 'block';
        }
    });

    // Handle Signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.style.display = 'none';
        
        const name = document.getElementById('signup-name').value;
        const age = document.getElementById('signup-age').value;
        const aadharCardNumber = document.getElementById('signup-aadhar').value;
        const address = document.getElementById('signup-address').value;
        const password = document.getElementById('signup-password').value;

        try {
            const res = await fetch('/user/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, age, aadharCardNumber, address, password })
            });
            const data = await res.json();

            if (res.ok) {
                // If backend signup doesn't auto login/return token, we might need to show message and redirect to login
                // Wait, userRoutes.js signup returns the user but it also generates and logs token? Let's check userRoutes.js
                // It does NOT return the token to the client in the JSON response! Ah.
                // Let's redirect to login for them to log in.
                alert('Signup successful! Please log in.');
                signupSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            } else {
                signupError.textContent = data.error || 'Signup failed';
                signupError.style.display = 'block';
            }
        } catch (err) {
            signupError.textContent = 'Network error. Please try again later.';
            signupError.style.display = 'block';
        }
    });
});
