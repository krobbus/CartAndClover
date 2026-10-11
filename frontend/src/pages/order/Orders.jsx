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

    const currentUserId = user?._id || user?.id;
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

    const myOrders = orders.filter((order) => {
        if (isAdmin) return true;

        if (isSeller || canManage) {
            const hasSellerItem = order.orderItems?.some((item) => {
                const p = item.product;
                const productSellerId =
                    p?.seller?._id ||
                    p?.seller ||
                    p?.sellerId ||
                    p?.userId ||
                    p?.createdBy ||
                    p?.user?._id ||
                    p?.user;
                return String(productSellerId) === String(currentUserId);
            });

            const orderSellerId = order.sellerId || order.seller?._id || order.seller;
            return hasSellerItem || String(orderSellerId) === String(currentUserId);
        }

        const shopperId =
            order.user?._id ||
            order.user ||
            order.userId ||
            order.shopperId ||
            order.createdBy;

        return String(shopperId) === String(currentUserId);
    });

    const filteredOrders = myOrders.filter((order) => {
        const cleanSearch = searchTerm.trim().replace(/^#/, '').toLowerCase();
        const orderId = (order._id || order.id || '').toLowerCase();
        const matchesSearch = !cleanSearch || orderId.includes(cleanSearch);

        const orderStatus = (order.status || 'pending').toLowerCase();
        const matchesStat = statFilter === 'All' || orderStatus.startsWith(statFilter.toLowerCase());

        const orderPayment = typeof order.isPaid === 'boolean'
            ? (order.isPaid ? 'paid' : 'unpaid')
            : (order.payment || order.paymentStatus || 'unpaid').toLowerCase();

        const matchesPayment = paymentFilter === 'All' || orderPayment === paymentFilter.toLowerCase();

        return matchesSearch && matchesStat && matchesPayment;
    });

    const statusCount = (stat) => {
        return stat === 'All'
            ? myOrders.length
            : myOrders.filter((order) => (order.status || 'pending').toLowerCase().startsWith(stat.toLowerCase())).length;
    };

    if (loading) return <Loading label="Loading orders..." />;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-6 p-5 sm:p-8 md:p-16">
            <header className="flex flex-col gap-1">
                <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--tertiary-color)] md:text-4xl">
                    {canManage ? 'System Orders Directory' : 'Your Orders'}
                </h1>
                <p className="font-[family-name:var(--body-font)] text-sm tracking-[0.5px] text-[color:var(--dark-color)] md:text-base">
                    {isAdmin ? 'Track and manage all platform customer orders' :
                        isSeller ? 'Track and manage all order of your customers' :
                        'Track and review your past purchases'}
                </p>
            </header>

            <ErrorNote error={error} onRetry={loadOrders} />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[color:var(--secondary-color)] md:left-5"></i>
                        <input
                            type="text"
                            className="w-full rounded-full border-2 border-[color:var(--main-color)] bg-white py-2.5 pl-11 pr-4 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out placeholder:text-[#8a8a8a] focus:border-[color:var(--tertiary-color)] focus:ring-4 focus:ring-[rgba(164,223,204,0.5)] md:py-3 md:pl-12 md:pr-6 md:text-base"
                            placeholder="Search by Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div
                        role="group"
                        aria-label="Payment status"
                        className="flex w-full rounded-full border-2 border-[color:var(--main-color)] bg-white p-1 md:w-auto"
                    >
                        {payment.map((pay) => (
                            <button
                                key={pay}
                                type="button"
                                aria-pressed={paymentFilter === pay}
                                className={`flex-1 cursor-pointer rounded-full px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] md:flex-none md:px-5 md:text-sm ${
                                    paymentFilter === pay
                                        ? 'bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                        : 'bg-transparent text-[color:var(--tertiary-color)] hover:bg-[rgba(164,223,204,0.35)]'
                                }`}
                                onClick={() => setPaymentFilter(pay)}
                            >
                                {capitalizeWords(pay)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                    {status.map((stat) => {
                        const isActive = statFilter === stat;

                        return (
                            <button
                                key={stat}
                                type="button"
                                aria-pressed={isActive}
                                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] md:py-2 md:text-sm ${
                                    isActive
                                        ? 'border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                        : 'border-[color:var(--main-color)] bg-white text-[color:var(--tertiary-color)] hover:border-[color:var(--secondary-color)] hover:bg-[rgba(164,223,204,0.35)]'
                                }`}
                                onClick={() => setStatFilter(stat)}
                            >
                                {stat === 'Cancel' ? 'Cancelled' : capitalizeWords(stat)}
                                <span
                                    className={`rounded-full px-1.5 text-[10px] font-bold leading-4 md:text-xs ${
                                        isActive
                                            ? 'bg-[rgba(255,255,255,0.25)] text-[color:var(--light-color)]'
                                            : 'bg-[color:var(--light-color)] text-[color:var(--tertiary-color)]'
                                    }`}
                                >
                                    {statusCount(stat)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <EmptyState
                    title={orders.length === 0 ? 'No orders found.' : 'No matching orders found.'}
                    action={<Link to="/marketplace">Browse Marketplace</Link>}
                />
            ) : (
                <div className="flex flex-col gap-3">
                    <p className="font-[family-name:var(--body-font)] text-xs text-[#555] md:text-sm">
                        Showing {filteredOrders.length} of {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'}
                    </p>

                    <div className="hidden overflow-hidden rounded-[16px] border border-[color:var(--main-color)] bg-white md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse font-[family-name:var(--body-font)]">
                                <thead className="bg-[color:var(--light-color)]">
                                    <tr>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-left text-sm font-bold text-[color:var(--tertiary-color)]">Order ID</th>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-left text-sm font-bold text-[color:var(--tertiary-color)]">Date</th>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-left text-sm font-bold text-[color:var(--tertiary-color)]">Status</th>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-left text-sm font-bold text-[color:var(--tertiary-color)]">Payment</th>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-right text-sm font-bold text-[color:var(--tertiary-color)]">Total</th>
                                        <th className="border-b border-[#dcebe6] px-3 py-3.5 lg:px-5 text-right text-sm font-bold text-[color:var(--tertiary-color)]">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const orderId = order._id || order.id;
                                        const orderStatus = (order.status || 'pending').toLowerCase();

                                        return (
                                            <tr
                                                key={orderId}
                                                className="transition-colors duration-200 ease-in-out hover:bg-[color:var(--light-color)] [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-[#e6f0ec]"
                                            >
                                                <td
                                                    className="whitespace-nowrap px-3 py-4 lg:px-5 align-middle font-mono text-sm font-bold text-[color:var(--tertiary-color)]"
                                                    title={orderId}
                                                >
                                                    <span className="xl:hidden">#{String(orderId).slice(-8)}</span>
                                                    <span className="hidden xl:inline">#{orderId}</span>
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-4 lg:px-5 align-middle text-sm text-[color:var(--dark-color)]">
                                                    {formatDate(order.createdAt || order.date)}
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-4 lg:px-5 align-middle">
                                                    <span
                                                        data-status={orderStatus}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-[#eee] px-3 py-1 text-xs font-bold text-[color:var(--dark-color)] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] data-[status=pending]:bg-[#fef3c7] data-[status=pending]:text-[#92400e] data-[status=processing]:bg-[#e0f2fe] data-[status=processing]:text-[#075985] data-[status=shipped]:bg-[#dcfce7] data-[status=shipped]:text-[#166534] data-[status=delivered]:bg-[#dcfce7] data-[status=delivered]:text-[#166534] data-[status=completed]:bg-[#dcfce7] data-[status=completed]:text-[#166534] data-[status=cancelled]:bg-[#fee2e2] data-[status=cancelled]:text-[#991b1b] data-[status=canceled]:bg-[#fee2e2] data-[status=canceled]:text-[#991b1b]"
                                                    >
                                                        {capitalizeWords(order.status || 'Pending')}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-4 lg:px-5 align-middle">
                                                    <span
                                                        data-paid={order.isPaid ? 'true' : 'false'}
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-bold text-[#92400e] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] data-[paid=true]:bg-[#dcfce7] data-[paid=true]:text-[#166534]"
                                                    >
                                                        {capitalizeWords(order.isPaid ? 'Paid' : 'Unpaid')}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-4 lg:px-5 text-right align-middle text-sm font-bold tabular-nums text-[color:var(--dark-color)]">
                                                    PHP {order.totalAmount?.toFixed(2)}
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-4 lg:px-5 text-right align-middle">
                                                    <button
                                                        type="button"
                                                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-[color:var(--tertiary-color)] bg-transparent px-3 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out lg:px-4 hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
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
                    </div>

                    <ul className="flex flex-col gap-3 md:hidden">
                        {filteredOrders.map((order) => {
                            const orderId = order._id || order.id;
                            const orderStatus = (order.status || 'pending').toLowerCase();

                            return (
                                <li
                                    key={orderId}
                                    className="flex flex-col gap-3 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-col gap-0.5">
                                            <p
                                                className="font-mono text-sm font-bold text-[color:var(--tertiary-color)]"
                                                title={orderId}
                                            >
                                                #{String(orderId).slice(-8)}
                                            </p>
                                            <p className="font-[family-name:var(--body-font)] text-xs text-[#555]">
                                                {formatDate(order.createdAt || order.date)}
                                            </p>
                                        </div>

                                        <span
                                            data-status={orderStatus}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eee] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] data-[status=pending]:bg-[#fef3c7] data-[status=pending]:text-[#92400e] data-[status=processing]:bg-[#e0f2fe] data-[status=processing]:text-[#075985] data-[status=shipped]:bg-[#dcfce7] data-[status=shipped]:text-[#166534] data-[status=delivered]:bg-[#dcfce7] data-[status=delivered]:text-[#166534] data-[status=completed]:bg-[#dcfce7] data-[status=completed]:text-[#166534] data-[status=cancelled]:bg-[#fee2e2] data-[status=cancelled]:text-[#991b1b] data-[status=canceled]:bg-[#fee2e2] data-[status=canceled]:text-[#991b1b]"
                                        >
                                            {capitalizeWords(order.status || 'Pending')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-[#dcebe6] pt-3">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-[family-name:var(--body-font)] text-xs text-[#555]">Total</p>
                                            <p className="font-[family-name:var(--body-font)] text-base font-bold tabular-nums text-[color:var(--dark-color)]">
                                                PHP {order.totalAmount?.toFixed(2)}
                                            </p>
                                        </div>

                                        <span
                                            data-paid={order.isPaid ? 'true' : 'false'}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold text-[#92400e] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] data-[paid=true]:bg-[#dcfce7] data-[paid=true]:text-[#166534]"
                                        >
                                            {capitalizeWords(order.isPaid ? 'Paid' : 'Unpaid')}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="w-full cursor-pointer rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-4 py-2.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                                        onClick={() => navigate(`/products/orders/${orderId}`)}
                                    >
                                        View Details
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}