import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fullName, initials, capitalizeWords } from '../utils.js';

export default function Navigation() {
    const { user, logout, isAdmin, canManage } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    function handleLogout() {
        closeMenu();
        logout();
        navigate('/login', { replace: true });
    }

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handleChange = (e) => { if (e.matches) setIsMenuOpen(false); };
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    return (
        <div className="relative w-full">
            <div className="sticky top-0 z-[99] flex items-center justify-between gap-4 bg-[linear-gradient(to_right,var(--main-color),var(--secondary-color))] px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] md:px-8 md:py-4">
                <Link
                    className="cursor-pointer whitespace-nowrap font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--dark-color)] transition-colors duration-200 ease-in-out hover:text-[color:var(--light-color)] lg:text-2xl"
                    to="/marketplace"
                    onClick={closeMenu}
                >
                    Cart & Clover
                </Link>

                {user && (
                    <nav
                        className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-2 bg-[color:var(--main-color)] px-8 pb-8 pt-20 transition-[opacity,transform] duration-300 ease-in-out lg:static lg:z-auto lg:flex-1 lg:flex-row lg:justify-center lg:gap-3 lg:bg-transparent lg:p-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100 ${
                            isMenuOpen
                                ? 'pointer-events-auto translate-y-0 opacity-100'
                                : 'pointer-events-none -translate-y-2.5 opacity-0'
                        }`}
                    >
                        <div className="mb-4 flex w-full max-w-xs flex-col items-center gap-2 border-b border-[rgba(84,146,125,0.4)] pb-6 lg:hidden">
                            <span
                                className="grid h-14 w-14 select-none place-items-center rounded-full bg-[color:var(--tertiary-color)] text-lg font-bold tracking-[1px] text-[color:var(--light-color)]"
                                aria-hidden="true"
                            >
                                {initials(user)}
                            </span>

                            <div className="flex flex-col items-center gap-1 text-center font-[family-name:var(--body-font)]">
                                <span className="text-lg font-bold text-[color:var(--dark-color)]">{fullName(user)}</span>
                                <span className="rounded-full bg-[rgba(255,255,255,0.5)] px-3 py-0.5 text-xs font-bold text-[color:var(--tertiary-color)]">
                                    {capitalizeWords(user?.role)}
                                </span>
                            </div>
                        </div>

                        <NavLink
                            to="/marketplace"
                            end
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex w-full max-w-xs cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-[family-name:var(--body-font)] text-lg font-bold transition-colors duration-200 ease-in-out lg:w-auto lg:max-w-none lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-base ${
                                    isActive
                                        ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                        : 'text-[color:var(--dark-color)] hover:bg-[rgba(255,255,255,0.4)]'
                                }`
                            }
                        >
                            <i className="fa-solid fa-shop fa-fw"></i>
                            Marketplace
                        </NavLink>

                        {canManage && (
                            <NavLink
                                to="/products"
                                end
                                onClick={closeMenu}
                                className={({ isActive }) =>
                                    `flex w-full max-w-xs cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-[family-name:var(--body-font)] text-lg font-bold transition-colors duration-200 ease-in-out lg:w-auto lg:max-w-none lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-base ${
                                        isActive
                                            ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                            : 'text-[color:var(--dark-color)] hover:bg-[rgba(255,255,255,0.4)]'
                                    }`
                                }
                            >
                                <i className="fa-solid fa-bag-shopping fa-fw"></i>
                                My Products
                            </NavLink>
                        )}

                        {!canManage && (
                            <NavLink
                                to="/products/add-to-cart"
                                end
                                onClick={closeMenu}
                                className={({ isActive }) =>
                                    `flex w-full max-w-xs cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-[family-name:var(--body-font)] text-lg font-bold transition-colors duration-200 ease-in-out lg:w-auto lg:max-w-none lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-base ${
                                        isActive
                                            ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                            : 'text-[color:var(--dark-color)] hover:bg-[rgba(255,255,255,0.4)]'
                                    }`
                                }
                            >
                                <i className="fa-solid fa-cart-shopping fa-fw"></i>
                                Cart
                            </NavLink>
                        )}

                        <NavLink
                            to="/products/orders"
                            end
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex w-full max-w-xs cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-[family-name:var(--body-font)] text-lg font-bold transition-colors duration-200 ease-in-out lg:w-auto lg:max-w-none lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-base ${
                                    isActive
                                        ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                        : 'text-[color:var(--dark-color)] hover:bg-[rgba(255,255,255,0.4)]'
                                }`
                            }
                        >
                            <i className="fa-solid fa-receipt fa-fw"></i>
                            Orders
                        </NavLink>

                        {isAdmin && (
                            <NavLink
                                to="/users"
                                end
                                onClick={closeMenu}
                                className={({ isActive }) =>
                                    `flex w-full max-w-xs cursor-pointer items-center justify-center gap-3 rounded-xl px-6 py-3 font-[family-name:var(--body-font)] text-lg font-bold transition-colors duration-200 ease-in-out lg:w-auto lg:max-w-none lg:gap-2 lg:rounded-lg lg:px-3 lg:py-2 lg:text-base ${
                                        isActive
                                            ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                            : 'text-[color:var(--dark-color)] hover:bg-[rgba(255,255,255,0.4)]'
                                    }`
                                }
                            >
                                <i className="fa-solid fa-user fa-fw"></i>
                                Users
                            </NavLink>
                        )}
                    </nav>
                )}

                <div className="flex items-center gap-2 md:gap-4">
                    {user ? (
                        <>
                            <div className="hidden items-center gap-3 lg:flex">
                                <span
                                    className="grid h-10 w-10 select-none place-items-center rounded-full bg-[color:var(--tertiary-color)] text-sm font-bold tracking-[1px] text-[color:var(--light-color)]"
                                    aria-hidden="true"
                                >
                                    {initials(user)}
                                </span>

                                <div className="flex flex-col whitespace-nowrap font-[family-name:var(--body-font)] leading-tight">
                                    <span className="text-sm font-bold text-[color:var(--dark-color)]">{fullName(user)}</span>
                                    <span className="text-xs text-[#444]">{capitalizeWords(user?.role)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[color:var(--tertiary-color)] px-3 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:bg-[color:var(--light-color)] hover:text-[color:var(--tertiary-color)] md:px-4 md:text-sm"
                                onClick={handleLogout}
                            >
                                <i className="fa-solid fa-right-from-bracket"></i>
                                Logout
                            </button>

                            <button
                                type="button"
                                className="z-[1001] grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-transparent text-xl text-[color:var(--dark-color)] transition-colors duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.4)] lg:hidden"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                aria-label="Toggle navigation menu"
                                aria-expanded={isMenuOpen}
                            >
                                <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                onClick={closeMenu}
                                className="cursor-pointer rounded-lg px-3 py-2 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] transition-colors duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.4)] md:text-base"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={closeMenu}
                                className="cursor-pointer rounded-lg bg-[color:var(--tertiary-color)] px-3 py-2 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:bg-[color:var(--light-color)] hover:text-[color:var(--tertiary-color)] md:px-4 md:text-base"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <main>
                <Outlet />
            </main>
        </div>
    );
}