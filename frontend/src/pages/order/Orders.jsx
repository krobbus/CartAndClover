import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import { formatDate, capitalizeWords } from '../../utils.js';

export default function Orders() {
    const { user, canManage, isAdmin, isSeller } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statFilter, setStatFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const status = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancel'];
    const payment = ['All', 'Paid', 'Unpaid'];

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
        const cleanSearch = searchTerm.trim().replace(/^#/, '').toLowerCase();
        const orderId = (order._id || order.id || '').toLowerCase();
        const matchesSearch = !cleanSearch || orderId.includes(cleanSearch);

        const orderStatus = (order.status || 'pending').toLowerCase();
        const matchesStat = statFilter === 'All' || orderStatus === statFilter.toLowerCase();

        const orderPayment = typeof order.isPaid === 'boolean'
            ? (order.isPaid ? 'paid' : 'unpaid')
            : (order.payment || order.paymentStatus || 'unpaid').toLowerCase();

        const matchesPayment = paymentFilter === 'All' || orderPayment === paymentFilter.toLowerCase();

        return matchesSearch && matchesStat && matchesPayment;
    })

    if (loading) return <Loading label="Loading orders..." />;

    return (
        <div className="ordersContainer">
            <header>
                <h1>{canManage ? 'System Orders Directory' : 'Your Orders'}</h1>
                <p>{isAdmin ? 'Track and manage all platform customer orders' : 
                    isSeller ? 'Track and manage all order of your customers' :
                    'Track and review your past purchases'}
                </p>
            </header>

            <ErrorNote error={error} onRetry={loadOrders} />
            
            <div className="filterBar">
                <input
                    type="text"
                    className="searchInput"
                    placeholder="Search by Order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="categoryPills">
                    {status.map((stat) => (
                        <button
                            key={stat}
                            type="button"
                            className={`pill ${statFilter === stat ? 'active' : ''}`}
                            onClick={() => setStatFilter(stat)}
                        >
                            {capitalizeWords(stat)}
                        </button>
                    ))}
                </div>

                <div className="categoryPills">
                    {payment.map((pay) => (
                        <button
                            key={pay}
                            type="button"
                            className={`pill ${paymentFilter === pay ? 'active' : ''}`}
                            onClick={() => setPaymentFilter(pay)}
                        >
                            {capitalizeWords(pay)}
                        </button>
                    ))}
                </div>
            </div>
            
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
                                <th>Payment</th>
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

                                    <td>{capitalizeWords(order.isPaid ? 'Paid' : 'Unpaid')}</td>
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