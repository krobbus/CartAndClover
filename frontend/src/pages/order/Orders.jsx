import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import { formatDate, capitalizeWords } from '../../utils.js';

export default function Orders() {
    const { user, canManage } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadOrders = useCallback(async () => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        setLoading(true);
        setError(null);
        try {
            const endpoint = canManage ? '/orders/seller' : '/orders';
            const data = await api.get(endpoint);
            setOrders(data);
        } catch (err) {
            setError(err?.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }, [user, canManage, navigate, location]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const filteredOrders = orders.filter((order) => {
        if (!searchTerm.trim()) return true;
        const cleanSearch = searchTerm.trim().replace(/^#/, '').toLowerCase();
        const orderId = (order._id || order.id || '').toLowerCase();
        return orderId.includes(cleanSearch);
    })

    if (loading) return <Loading label="Loading orders..." />;

    return (
        <div className="ordersContainer">
            <header>
                <h1>{canManage ? 'System Orders Directory' : 'Your Orders'}</h1>
                <p>{canManage ? 'Track and manage all platform customer orders' : 'Track and review your past purchases'}</p>
            </header>

            <ErrorNote error={error} onRetry={loadOrders} />
            
            <input
                type="text"
                className="searchInput"
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {orders.length === 0 ? (
                <EmptyState
                    title={searchTerm ? "No matching orders found." : "No orders found."}
                    action={
                        <Link to="/marketplace" className="actionBtn">
                            Browse Marketplace
                        </Link>
                    }
                />
            ) : (
                <div className="tableWrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order._id || order.id}>
                                    <td className="orderIdCell">#{order._id || order.id}</td>
                                    <td>{formatDate(order.createdAt || order.date)}</td>

                                    <td>
                                        <span className={`statusBadge ${order.status?.toLowerCase()}`}>
                                            {capitalizeWords(order.status || 'Pending')}
                                        </span>
                                    </td>

                                    <td>PHP {order.totalAmount?.toFixed(2)}</td>
                                    
                                    <td>
                                        <button
                                            type="button"
                                            className="viewOrderBtn"
                                            onClick={() => navigate(`/products/orders/${order._id || order.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}