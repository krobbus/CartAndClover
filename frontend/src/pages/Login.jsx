import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ErrorNote from '../components/ErrorNote';
import Loading from '../components/Loading';
import headerBanner from '../assets/headerBanner.png';

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
                className="grid w-full max-w-lg grid-cols-1 gap-4 self-center rounded-[20px] bg-[linear-gradient(to_top,var(--tertiary-color),var(--main-color))] p-6 sm:p-10 md:p-16 md:pb-8"
            >
                <h2 className="col-span-full text-center font-[family-name:var(--heading-font)] text-2xl font-bold md:text-3xl">
                    Login to Cart & Clover
                </h2>

                <div className="col-span-full">
                    <ErrorNote error={error} />
                </div>

                <div className="col-span-full flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="email"
                        className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="col-span-full flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="password"
                        className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="w-full rounded-xl bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] md:px-6 md:py-4 md:text-base"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    className="col-span-full mx-auto mt-4 min-w-[10rem] cursor-pointer rounded-[20px] border-4 border-[color:var(--main-color)] bg-[color:var(--secondary-color)] px-8 py-2.5 font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[color:var(--main-color)] hover:text-[color:var(--dark-color)] disabled:cursor-not-allowed disabled:opacity-60 md:mt-8 md:py-3 md:text-base"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? 'Logging in...' : 'Login'}
                </button>

                <p className="col-span-full mx-auto flex flex-wrap justify-center gap-2 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] md:text-base">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-[color:var(--dark-color)] underline transition-colors duration-200 hover:text-[color:var(--light-color)]"
                    >
                        Register here
                    </Link>
                </p>
            </form>
        </div>
    );
}