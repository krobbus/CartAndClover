import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';
import Loading from '../components/Loading';

export default function Login() {
    const { login, user, loading } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    if (loading) return <Loading label="Checking session..." />;
    if (user) return <Navigate to="/marketplace" />;

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await login(form.email, form.password);
            navigate("/marketplace");
        } catch (err) {
            setError(err?.message || 'Login failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="authCard">
            <Link to="/marketplace" className="backLink">
                <i className="fa-solid fa-chevron-left"></i>Back to Marketplace
            </Link>

            <form onSubmit={handleSubmit}>
                <h2>Login to Cart & Clover</h2>

                <ErrorNote error={error} />
                
                <div className="inputWrapper">
                    <label className="span">
                        Email
                        <input
                            type="email"
                            name="email"
                            className="span"
                            placeholder="Enter your email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="span">
                        Password
                        <input
                            type="password"
                            name="password"
                            className="span"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>

                <button className="loginBtn" type="submit" disabled={submitting}>
                    {submitting ? 'Logging in...' : 'Login'}
                </button>

                <p className="switchLink">Don't have an account? <Link to="/register">Register here</Link></p>
            </form>
        </div>
    );
}