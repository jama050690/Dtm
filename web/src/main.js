// DTM Test Platform - Main JavaScript

const API_URL = import.meta.env.VITE_API_URL || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

document.addEventListener('DOMContentLoaded', () => {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    initGoogleAuth();
});

async function initGoogleAuth() {
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.endsWith('/login.html') || path.endsWith('/signup.html');
    if (!isAuthPage) return;

    const loginContainer = document.getElementById('googleLoginButton');
    const signupContainer = document.getElementById('googleSignupButton');
    if (!loginContainer && !signupContainer) return;

    if (!GOOGLE_CLIENT_ID) {
        [loginContainer, signupContainer]
            .filter(Boolean)
            .forEach(renderGooglePlaceholderButton);
        return;
    }

    try {
        await loadGoogleScript();

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential
        });

        if (loginContainer) {
            window.google.accounts.id.renderButton(loginContainer, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                width: 320
            });
        }

        if (signupContainer) {
            window.google.accounts.id.renderButton(signupContainer, {
                theme: 'outline',
                size: 'large',
                text: 'signup_with',
                shape: 'pill',
                width: 320
            });
        }

    } catch (error) {
        console.error('Google script load error:', error);
    }
}

function renderGooglePlaceholderButton(container) {
    container.innerHTML = `
        <button type="button" class="btn-secondary" style="width:320px;background:#fff;color:#111827;border:1px solid #d1d5db;"
            id="googleFallbackBtn">
            <span style="font-weight:700;color:#4285F4;">G</span>
            Google bilan kirish
        </button>
    `;

    const btn = container.querySelector('#googleFallbackBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            alert('Google login uchun VITE_GOOGLE_CLIENT_ID sozlanmagan');
        });
    }
}

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function handleGoogleCredential(response) {
    if (!response?.credential) {
        alert('Google token olinmadi');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || data.message || 'Google orqali kirishda xatolik');
            return;
        }

        localStorage.setItem('token', data.token || data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/home.html';
    } catch (error) {
        console.error('Google auth error:', error);
        alert('Google orqali kirishda xatolik');
    }
}

// Login handler
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Muvaffaqiyatli kirish!');
            window.location.href = '/home.html';
        } else {
            alert(data.error || data.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Serverga ulanishda xatolik. API ishlamayapti bo\'lishi mumkin.');
    }
}

// Signup handler
async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Password validation
    if (password !== confirmPassword) {
        alert('Parollar mos kelmadi!');
        return;
    }

    if (password.length < 6) {
        alert('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
            window.location.href = '/home.html';
        } else {
            alert(data.error || data.message || 'Xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Serverga ulanishda xatolik. API ishlamayapti bo\'lishi mumkin.');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Protect routes
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// API helper functions
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    return response;
}

// Get subjects
async function getSubjects() {
    try {
        const response = await fetch(`${API_URL}/api/subjects`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
    }
}

// Get tests by subject
async function getTests(subjectId) {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/tests/${subjectId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching tests:', error);
        return [];
    }
}

// Save result
async function saveResult(subjectId, score, total, answers) {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/results`, {
            method: 'POST',
            body: JSON.stringify({ subjectId, score, total, answers })
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving result:', error);
        return null;
    }
}

// Get results
async function getResults() {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/results`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching results:', error);
        return [];
    }
}

// Get stats
async function getStats() {
    try {
        const response = await fetchWithAuth(`${API_URL}/api/stats`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

// Export functions for use in other modules
window.DTM = {
    logout,
    isLoggedIn,
    getCurrentUser,
    getToken,
    requireAuth,
    getSubjects,
    getTests,
    saveResult,
    getResults,
    getStats
};
