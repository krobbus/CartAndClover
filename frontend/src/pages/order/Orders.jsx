import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import { formatDate, capitalizeWords } from '../../utils.js';

export default function Orders() {
    const { user, canManage, isAdmin, isSeller } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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

        // startsWith so the "Cancel" filter also matches "cancelled"
        const orderStatus = (order.status || 'pending').toLowerCase();
        const matchesStat = statFilter === 'All' || orderStatus.startsWith(statFilter.toLowerCase());

        const orderPayment = typeof order.isPaid === 'boolean'
            ? (order.isPaid ? 'paid' : 'unpaid')
            : (order.payment || order.paymentStatus || 'unpaid').toLowerCase();

        const matchesPayment = paymentFilter === 'All' || orderPayment === paymentFilter.toLowerCase();

        return matchesSearch && matchesStat && matchesPayment;
    });

    if (loading) return <Loading label="Loading orders..." />;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <header className="flex flex-col pb-8">
                <h1 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    {canManage ? 'System Orders Directory' : 'Your Orders'}
                </h1>
                <p className="pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                    {isAdmin ? 'Track and manage all platform customer orders' :
                        isSeller ? 'Track and manage all order of your customers' :
                        'Track and review your past purchases'}
                </p>
            </header>

            <ErrorNote error={error} onRetry={loadOrders} />

            <div className="mb-8 flex flex-col gap-4 md:gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-2.5 font-[family-name:var(--body-font)] text-sm md:px-8 md:py-3 md:text-base"
                    placeholder="Search by Order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                    {status.map((stat) => (
                        <button
                            key={stat}
                            type="button"
                            className={`cursor-pointer rounded-[10px] border-2 border-[color:var(--secondary-color)] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)] md:px-4 md:py-2 md:text-sm ${
                                statFilter === stat
                                    ? 'bg-[color:var(--secondary-color)] text-[color:var(--light-color)]'
                                    : 'bg-transparent text-[color:var(--secondary-color)]'
                            }`}
                            onClick={() => setStatFilter(stat)}
                        >
                            {capitalizeWords(stat)}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                    {payment.map((pay) => (
                        <button
                            key={pay}
                            type="button"
                            className={`cursor-pointer rounded-[10px] border-2 border-[color:var(--secondary-color)] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)] md:px-4 md:py-2 md:text-sm ${
                                paymentFilter === pay
                                    ? 'bg-[color:var(--secondary-color)] text-[color:var(--light-color)]'
                                    : 'bg-transparent text-[color:var(--secondary-color)]'
                            }`}
                            onClick={() => setPaymentFilter(pay)}
                        >
                            {capitalizeWords(pay)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <EmptyState
                    title={orders.length === 0 ? 'No orders found.' : 'No matching orders found.'}
                    action={<Link to="/marketplace">Browse Marketplace</Link>}
                />
            ) : (
                <div className="min-h-0 w-full overflow-auto rounded-[10px] border border-[color:var(--secondary-color)] bg-[color:var(--main-color)]">
                    <table className="w-full border-collapse font-[family-name:var(--body-font)]">
                        <thead className="bg-[color:var(--light-color)]">
                            <tr>
                                <th className="border-b border-[#ddd] p-3 text-left text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Order ID</th>
                                <th className="border-b border-[#ddd] p-3 text-left text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Date</th>
                                <th className="border-b border-[#ddd] p-3 text-left text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Status</th>
                                <th className="border-b border-[#ddd] p-3 text-left text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Payment</th>
                                <th className="border-b border-[#ddd] p-3 text-left text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Total</th>
                                <th className="border-b border-[#ddd] p-3 text-center text-xs font-bold uppercase tracking-[1px] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.map((order) => {
                                const orderId = order._id || order.id;
                                const orderStatus = (order.status || 'pending').toLowerCase();

                                return (
                                    <tr
                                        key={orderId}
                                        className="transition-colors duration-200 ease-in-out hover:bg-[rgba(0,0,0,0.02)] [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-[#ddd]"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs font-bold text-[color:var(--tertiary-color)] md:px-6 md:py-4 md:text-base">
                                            #{orderId}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            {formatDate(order.createdAt || order.date)}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            <span
                                                data-status={orderStatus}
                                                className="inline-block rounded-full bg-[#ddd] px-3 py-1 text-xs font-bold text-[color:var(--dark-color)] md:px-4 md:py-1.5 data-[status=pending]:bg-[#fef3c7] data-[status=pending]:text-[#92400e] data-[status=processing]:bg-[#e0f2fe] data-[status=processing]:text-[#075985] data-[status=shipped]:bg-[#dcfce7] data-[status=shipped]:text-[#166534] data-[status=delivered]:bg-[#dcfce7] data-[status=delivered]:text-[#166534] data-[status=completed]:bg-[#dcfce7] data-[status=completed]:text-[#166534] data-[status=cancelled]:bg-[#fee2e2] data-[status=cancelled]:text-[#991b1b] data-[status=canceled]:bg-[#fee2e2] data-[status=canceled]:text-[#991b1b]"
                                            >
                                                {capitalizeWords(order.status || 'Pending')}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            {capitalizeWords(order.isPaid ? 'Paid' : 'Unpaid')}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            PHP {order.totalAmount?.toFixed(2)}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-center align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-lg bg-[color:var(--light-color)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)]"
                                                onClick={() => navigate(`/products/orders/${orderId}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}