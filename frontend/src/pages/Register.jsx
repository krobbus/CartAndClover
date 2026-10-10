import { useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';
import Loading from '../components/Loading';

export default function Register() {
    const { register, user, loading } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'shopper'
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    if (loading) return <Loading label="Checking session..." />;
    if (user) {
        return <Navigate to={location.state?.from?.pathname || '/marketplace'} replace />;
    }

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setSubmitting(true);

        try {
            const { confirmPassword, ...payload } = formData;

            await register(payload);
            const destination = location.state?.from?.pathname || '/marketplace';
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err?.message || 'Registration failed. Please try again.');
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
                <h2 className="span">Create an Account</h2>
                
                <div className="span">
                    <ErrorNote error={error} />
                </div>

                <div className="inputWrapper">
                    <label htmlFor="roleSelect">Select role <span className="requiredMarker">*</span></label>
                    <select id="roleSelect" name="role" value={formData.role} onChange={handleChange}>
                        <option value="shopper">Shopper</option>
                        <option value="seller">Seller</option>
                    </select>
                </div>
                
                <div className="inputWrapper">
                    <label htmlFor="firstName">First Name <span className="requiredMarker">*</span></label>
                    <input
                        id="firstName"
                        name="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="inputWrapper">
                    <label htmlFor="middleName">Middle Name (Optional)</label>
                    <input
                        id="middleName"
                        name="middleName"
                        placeholder="Enter your middle name"
                        value={formData.middleName}
                        onChange={handleChange}
                    />
                </div>

                <div className="inputWrapper">
                    <label htmlFor-="lastName">Last Name <span className="requiredMarker">*</span></label>
                    <input
                        id="lastName"
                        name="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="inputWrapper span">
                    <label htmlFor="email">Email <span className="requiredMarker">*</span></label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="e.g. example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="inputWrapper">
                    <label htmlFor="newPassword">New Password <span className="requiredMarker">*</span></label>
                    <input
                        id="newPassword"
                        name="password"
                        type="password"
                        placeholder="Minimum of 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <div className="inputWrapper">
                    <label htmlFor="confirmPassword">Confirm Password <span className="requiredMarker">*</span></label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <button type="submit" className="registerBtn span" disabled={submitting}>
                    {submitting ? 'Creating account...' : 'Register'}
                </button>

                <p className="switchLink span">Already have an account? <Link to="/login">Login here</Link></p>
            </form>
        </div>
    );
}