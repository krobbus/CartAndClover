import { useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';
import Loading from '../components/Loading';
import headerBanner from '../assets/headerBanner.png';

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
        <div
            className="flex min-h-[100dvh] flex-col items-start gap-6 bg-cover bg-bottom bg-no-repeat p-4 sm:gap-8 sm:p-8 md:p-16"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${headerBanner})`,
            }}
        >
            <Link
                to="/marketplace"
                className="flex items-center gap-2 font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] transition-colors duration-200 hover:text-[color:var(--secondary-color)] md:text-base"
            >
                <i className="fa-solid fa-chevron-left"></i>Back to Marketplace
            </Link>

            <form
                onSubmit={handleSubmit}
                className="grid w-full max-w-3xl grid-cols-1 gap-4 self-center rounded-[20px] bg-[linear-gradient(to_top,var(--tertiary-color),var(--main-color))] p-6 sm:p-10 md:grid-cols-2 md:p-16 md:pb-8"
            >
                <h2 className="col-span-full text-center font-[family-name:var(--heading-font)] text-2xl font-bold md:text-3xl">
                    Create an Account
                </h2>

                <div className="col-span-full">
                    <ErrorNote error={error} />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="roleSelect"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Select role <span className="text-[#ff7171]">*</span>
                    </label>
                    <select
                        id="roleSelect"
                        name="role"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="shopper">Shopper</option>
                        <option value="seller">Seller</option>
                    </select>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="firstName"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        First Name <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="firstName"
                        name="firstName"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="middleName"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Middle Name (Optional)
                    </label>
                    <input
                        id="middleName"
                        name="middleName"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Enter your middle name"
                        value={formData.middleName}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="lastName"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Last Name <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="lastName"
                        name="lastName"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="col-span-full flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="email"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Email <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="e.g. example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="newPassword"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        New Password <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="newPassword"
                        name="password"
                        type="password"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Minimum of 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="confirmPassword"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Confirm Password <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Repeat your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="col-span-full mx-auto mt-4 min-w-[10rem] cursor-pointer rounded-[20px] border-4 border-[color:var(--main-color)] bg-[color:var(--secondary-color)] px-8 py-2.5 font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[color:var(--main-color)] hover:text-[color:var(--dark-color)] disabled:cursor-not-allowed disabled:opacity-60 md:mt-8 md:py-3 md:text-base"
                    disabled={submitting}
                >
                    {submitting ? 'Creating account...' : 'Register'}
                </button>

                <p className="col-span-full mx-auto flex flex-wrap justify-center gap-2 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] md:text-base">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-[color:var(--dark-color)] underline transition-colors duration-200 hover:text-[color:var(--light-color)]"
                    >
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
}