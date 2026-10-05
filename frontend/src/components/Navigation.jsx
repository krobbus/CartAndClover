import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
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

    return (
        <div className="navigationContainer">
            <div className="navBar">
                <Link className="brand" to="/marketplace">Cart & Clover</Link>                    

                {user && (
                    <nav className={`navLinks ${isMenuOpen ? 'open' : ''}`}>
                        <Link to="/marketplace" onClick={closeMenu}>
                            <i className="fa-solid fa-shop"></i>
                            Marketplace
                        </Link>

                        {canManage && (
                            <Link to="/products" onClick={closeMenu}>
                                <i className="fa-solid fa-bag-shopping"></i>
                                My Products
                            </Link>
                        )}

                        {!canManage && (
                            <Link to="/products/add-to-cart" onClick={closeMenu}>
                                <i className="fa-solid fa-cart-shopping"></i>
                                Cart
                            </Link>
                        )}

                        <Link to="/products/orders" onClick={closeMenu}>
                            <i className="fa-solid fa-receipt"></i>
                            Orders
                        </Link>

                        {isAdmin && (
                            <Link to="/users" onClick={closeMenu}>
                                <i className="fa-solid fa-user"></i>
                                Users
                            </Link>
                        )}
                    </nav>
                )}

                {user ? (
                    <div className="userLogContainer">
                        <div className="userProfile">
                            <span className="userAvatar" aria-hidden="true">{initials(user)}</span>
                            
                            <div className="userDetails">
                                {fullName(user)}
                                <span className="role">{capitalizeWords(user?.role)}</span>
                            </div>
                        </div>

                        <button type="button" className="logoutBtn" onClick={handleLogout}>
                            <i className="fa-solid fa-right-from-bracket"></i>
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="authNavLinks">
                        <Link to="/login" onClick={closeMenu}>Login</Link>
                        <Link to="/register" onClick={closeMenu}>Register</Link>
                    </div>
                )}

                {user && (
                    <button 
                        type="button" 
                        className="menuToggleBtn" 
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation menu"
                    >
                        <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                    </button>   
                )}
            </div>
            
            <main>
                <Outlet />
            </main>
        </div>
    );
}