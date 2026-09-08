import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const loginUrl = (import.meta.env && import.meta.env.VITE_API_URL)
                ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/auth/login`
                : `http://${window.location.hostname}:8000/api/v1/auth/login`;

            const response = await axios.post(loginUrl, {
                email,
                password
            });
            const { user, token } = response.data;
            if (user && token) {
                localStorage.setItem('adminUser', JSON.stringify(user));
                localStorage.setItem('adminToken', token);
                // Also store session tokens for invoice compatibility
                localStorage.setItem('token', token);
                localStorage.setItem('username', user.name || user.email);
                
                navigate('/');
            } else {
                throw new Error("Invalid response from server.");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="logo-icon">🛡️</div>
                    <h2>Enterprise Platform</h2>
                    <p>Sign in to access your modules</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
                    <div className="input-group">
                        <span className="input-icon">👤</span>
                        <input 
                            type="text" 
                            placeholder="Employee ID or Email Address" 
                            required
                            autoComplete="new-password"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <span className="input-icon">🔒</span>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    {error && <div className="login-error-text">{error}</div>}

                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.85rem', textAlign: 'left', color: '#94a3b8' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🔑 Available Access Accounts</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                            <div style={{ color: '#38bdf8', fontWeight: '600' }}>1. Admin Account (Unlimited)</div>
                            <div>ID: <code>ADMIN01</code> | Email: <code>admin@hrms.com</code> | Pass: <code>password123</code></div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '8px' }}>
                            <div style={{ color: '#f59e0b', fontWeight: '600' }}>2. Demo Account (3 Uploads / 24h)</div>
                            <div>ID: <code>DEMO01</code> | Email: <code>demo@hrms.com</code> | Pass: <code>demopassword123</code></div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
