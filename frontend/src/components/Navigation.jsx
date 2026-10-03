import { Link, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fullName, initials, capitalizeWords } from '../utils';

export default function Navigation() {
    const { user, logout, isAdmin, canManage } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="navigationContainer">
            <div className="navBar">
                <div className="brand"><Link to="/marketplace">Cart & Clover</Link></div>

                {user && (
                    <nav className="navLinks">
                        <Link to="/marketplace">
                            <i className="fa-solid fa-shop"></i>
                            Marketplace
                        </Link>

                        {canManage && <Link to="/products">
                            <i className="fa-solid fa-bag-shopping"></i>
                            My Products
                        </Link>}

                        {!canManage && <Link to="/products/add-to-cart">
                            <i className="fa-solid fa-cart-shopping"></i>
                            Cart
                        </Link>}

                        <Link to="/products/orders">
                            <i className="fa-solid fa-receipt"></i>
                            Orders
                        </Link>

                        {isAdmin && <Link to="/users">
                            <i className="fa-solid fa-user"></i>
                            Users
                        </Link>}
                    </nav>
                )}

                <div className="userLogContainer">
                    {user ? (
                        <>
                            <span className="userAvatar" aria-hidden="true">{initials(user)}</span>
                            
                            <span className="userProfile">
                                {fullName(user)}
                                <span className="role">{capitalizeWords(user?.role)}</span>
                            </span>

                            <button className="logoutBtn" onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i>
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="authNavLinks">
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </div>
                    )}
                </div>
            </div>
            
            <main>
                <Outlet />
            </main>
        </div>
    );
}