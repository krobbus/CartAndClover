import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import OrderSummary from '../../components/OrderSummary';
import { formatDate, capitalizeWords } from '../../utils.js';

export default function OrderView() {
    const { orderId } = useParams();
    const { canManage } = useAuth();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const loadOrder = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/orders/${orderId}`);
            setOrder(data);
        } catch (err) {
            setError(err?.message || 'Failed to fetch order details.');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        setError(null);

        try {
            const updated = await api.put(`/orders/${orderId}`, { status: newStatus });
            setOrder(updated);
        } catch (err) {
            setError(err?.message || 'Failed to update order status.');
        } finally {
            setUpdating(false);
        }
    };

    const handlePaymentStatusUpdate = async (isPaidValue) => {
        if (order?.isPaid) {
            setError('Payment status cannot be changed back to "Unpaid" once marked as Paid.');
            return;
        }

        if (isPaidValue && !window.confirm('Are you sure? Once marked as Paid, this action CANNOT be undone.')) return;

        setUpdating(true);
        setError(null);
        try {
            const updated = await api.put(`/orders/${orderId}`, { isPaid: isPaidValue });
            setOrder(updated);
        } catch (err) {
            setError(err?.message || 'Failed to update payment status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditOrder = () => {
        navigate(`/products/orders/edit/${orderId}`, { state: { orderToEdit: order } });
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        setUpdating(true);
        setError(null);
        try {
            await api.delete(`/orders/${orderId}`);
            navigate('/products/orders', { replace: true });
        } catch (err) {
            setError(err?.message || 'Failed to cancel order.');
            setUpdating(false);
        }
    };

    if (loading) return <Loading label="Fetching order details..." />;

    if (!order && !error) {
        return (
            <div className="p-5 sm:p-8 md:p-16">
                <EmptyState
                    title="Order not found."
                    action={<Link to="/products/orders">Back to Orders</Link>}
                />
            </div>
        );
    }

    const { shippingAddress } = order || {};
    const itemsList = order?.orderItems || order?.items || [];
    const grandTotal = Number(order?.totalAmount ?? order?.totalPrice ?? 0) || 0;
    const isPending = (order?.status || 'Pending').toLowerCase() === 'pending';

    const progressSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentStatus = (order?.status || 'Pending').toLowerCase();
    const isCancelled = currentStatus === 'cancelled' || currentStatus === 'canceled';
    const currentStep = currentStatus === 'completed'
        ? progressSteps.length - 1
        : progressSteps.findIndex((step) => step.toLowerCase() === currentStatus);

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-6 bg-[color:var(--tertiary-color)] p-5 sm:p-8 md:p-16">
            <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--main-color)] md:text-sm"
                onClick={() => navigate('/products/orders')}
            >
                <i className="fa-solid fa-chevron-left"></i>Back to Orders
            </button>

            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className="break-all font-mono text-xl font-bold text-[color:var(--light-color)] md:text-2xl xl:text-3xl">
                        Order #{order?._id || order?.id}
                    </h1>
                    <p className="font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] opacity-80 md:text-base">
                        Placed on {formatDate(order?.createdAt || order?.date)}
                    </p>
                </div>

                {order && (
                    <div className="flex flex-wrap gap-2 md:justify-end">
                        <span
                            data-status={order.status?.toLowerCase() || 'pending'}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#ddd] px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] md:px-5 md:py-2 md:text-sm data-[status=pending]:bg-[#fef3c7] data-[status=pending]:text-[#92400e] data-[status=processing]:bg-[#e0f2fe] data-[status=processing]:text-[#075985] data-[status=shipped]:bg-[#dcfce7] data-[status=shipped]:text-[#166534] data-[status=delivered]:bg-[#dcfce7] data-[status=delivered]:text-[#166534] data-[status=completed]:bg-[#dcfce7] data-[status=completed]:text-[#166534] data-[status=cancelled]:bg-[#fee2e2] data-[status=cancelled]:text-[#991b1b] data-[status=canceled]:bg-[#fee2e2] data-[status=canceled]:text-[#991b1b]"
                        >
                            {capitalizeWords(order.status || 'Pending')}
                        </span>

                        <span
                            data-status={order.isPaid ? 'paid' : 'unpaid'}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#ddd] px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] md:px-5 md:py-2 md:text-sm data-[status=paid]:bg-[#dcfce7] data-[status=paid]:text-[#166534] data-[status=unpaid]:bg-[#fef3c7] data-[status=unpaid]:text-[#92400e]"
                        >
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                    </div>
                )}
            </header>

            <ErrorNote error={error} onRetry={loadOrder} />

            {order && (
                <div className="flex flex-col gap-4 rounded-[24px] bg-[color:var(--secondary-color)] p-3 text-[color:var(--dark-color)] shadow-[0_10px_25px_rgba(0,0,0,0.15)] sm:p-6 md:gap-6 md:p-8">
                    {canManage ? (
                        <section className="flex flex-col gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                                    Manage order
                                </h3>
                                <p className="font-[family-name:var(--body-font)] text-xs text-[#555] md:text-sm">
                                    Update the order and payment status
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                                    <label
                                        htmlFor="statusSelect"
                                        className="font-[family-name:var(--body-font)] text-xs font-bold text-[#555]"
                                    >
                                        Order status
                                    </label>
                                    <select
                                        id="statusSelect"
                                        className="cursor-pointer rounded-[10px] border-2 border-[color:var(--main-color)] bg-white px-3 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] focus:ring-4 focus:ring-[rgba(164,223,204,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                                        value={order.status}
                                        disabled={updating}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                                    <label
                                        htmlFor="paymentStatusSelect"
                                        className="font-[family-name:var(--body-font)] text-xs font-bold text-[#555]"
                                    >
                                        Payment status
                                    </label>
                                    <select
                                        id="paymentStatusSelect"
                                        className="cursor-pointer rounded-[10px] border-2 border-[color:var(--main-color)] bg-white px-3 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] focus:ring-4 focus:ring-[rgba(164,223,204,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
                                        value={Boolean(order.isPaid)}
                                        disabled={updating}
                                        onChange={(e) => handlePaymentStatusUpdate(e.target.value === 'true')}
                                    >
                                        <option value="false">Unpaid</option>
                                        <option value="true">Paid</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    ) : isPending && (
                        <section className="flex flex-col gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-6">
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                                    Need to change something?
                                </h3>
                                <p className="font-[family-name:var(--body-font)] text-xs text-[#555] md:text-sm">
                                    You can edit or cancel this order while it is still pending.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-5 py-2.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--secondary-color)] hover:enabled:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                    onClick={handleEditOrder}
                                    disabled={updating}
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>Edit Order
                                </button>

                                <button
                                    type="button"
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-[#ecc9c9] bg-transparent px-5 py-2.5 font-[family-name:var(--body-font)] text-xs font-bold text-[#a24a4a] transition duration-200 ease-in-out hover:enabled:border-[rgb(200,100,100)] hover:enabled:bg-[rgb(200,100,100)] hover:enabled:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(200,100,100)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                    onClick={handleCancelOrder}
                                    disabled={updating}
                                >
                                    <i className="fa-solid fa-trash"></i>Cancel Order
                                </button>
                            </div>
                        </section>
                    )}

                    <section className="rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 md:p-6">
                        {isCancelled ? (
                            <p className="rounded-[12px] bg-[#fee2e2] px-4 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[#991b1b]">
                                This order was cancelled.
                            </p>
                        ) : (
                            <ol className="flex items-start" aria-label="Order progress">
                                {progressSteps.map((step, index) => {
                                    const isDone = index < currentStep;
                                    const isCurrent = index === currentStep;

                                    return (
                                        <li
                                            key={step}
                                            aria-current={isCurrent ? 'step' : undefined}
                                            className={`relative flex flex-1 flex-col items-center gap-2 text-center ${
                                                index > 0
                                                    ? `before:absolute before:left-[-50%] before:top-4 before:h-0.5 before:w-full before:content-[''] ${
                                                        index <= currentStep
                                                            ? 'before:bg-[color:var(--tertiary-color)]'
                                                            : 'before:bg-[color:var(--main-color)]'
                                                    }`
                                                    : ''
                                            }`}
                                        >
                                            <span
                                                className={`relative z-[1] grid h-8 w-8 place-items-center rounded-full border-2 font-[family-name:var(--body-font)] text-xs font-bold ${
                                                    isDone
                                                        ? 'border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                                        : isCurrent
                                                            ? 'border-[color:var(--tertiary-color)] bg-white text-[color:var(--tertiary-color)] ring-4 ring-[rgba(164,223,204,0.6)]'
                                                            : 'border-[color:var(--main-color)] bg-white text-[#8a8a8a]'
                                                }`}
                                            >
                                                {isDone ? '✓' : index + 1}
                                            </span>

                                            <span
                                                className={`font-[family-name:var(--body-font)] text-[11px] font-bold md:text-sm ${
                                                    isCurrent
                                                        ? 'text-[color:var(--dark-color)]'
                                                        : isDone
                                                            ? 'text-[color:var(--tertiary-color)]'
                                                            : 'text-[#8a8a8a]'
                                                }`}
                                            >
                                                {step}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </section>

                    <section className="flex flex-col gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 md:p-6">
                        <h3 className="border-b-2 border-dashed border-[#dcebe6] pb-3 font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                            Items Ordered ({itemsList.length})
                        </h3>

                        <OrderSummary items={itemsList} totalAmount={grandTotal} />
                    </section>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                        <section className="flex flex-col gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 md:p-6">
                            <h3 className="border-b-2 border-dashed border-[#dcebe6] pb-3 font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                                Shipping Address
                            </h3>

                            {shippingAddress ? (
                                <div className="flex flex-col gap-4 font-[family-name:var(--body-font)]">
                                    <p className="flex gap-3 text-sm font-bold leading-relaxed md:text-base">
                                        <i className="fa-solid fa-location-dot mt-1 text-[color:var(--secondary-color)]"></i>
                                        <span>
                                            {shippingAddress.street || ''}, {shippingAddress.province || ''}, {shippingAddress.city || ''}, {shippingAddress.postalCode || ''}
                                        </span>
                                    </p>

                                    <dl className="grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-2 text-xs md:text-sm">
                                        <dt className="text-[#555]">Street</dt>
                                        <dd className="font-bold">{shippingAddress.street || shippingAddress.address || 'N/A'}</dd>

                                        <dt className="text-[#555]">Province</dt>
                                        <dd className="font-bold">{shippingAddress.province || 'N/A'}</dd>

                                        <dt className="text-[#555]">City</dt>
                                        <dd className="font-bold">{shippingAddress.city || 'N/A'}</dd>

                                        <dt className="text-[#555]">Postal code</dt>
                                        <dd className="font-bold">{shippingAddress.postalCode || 'N/A'}</dd>

                                        <dt className="text-[#555]">Phone</dt>
                                        <dd className="font-bold">{shippingAddress.phone || 'N/A'}</dd>
                                    </dl>
                                </div>
                            ) : (
                                <p className="font-[family-name:var(--body-font)] text-sm text-[#555] md:text-base">No shipping address attached.</p>
                            )}
                        </section>

                        <section className="flex flex-col gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4 md:p-6">
                            <h3 className="border-b-2 border-dashed border-[#dcebe6] pb-3 font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                                Payment & Summary
                            </h3>

                            <div className="flex flex-1 flex-col gap-4 font-[family-name:var(--body-font)]">
                                <dl className="grid grid-cols-[6.5rem_1fr] items-center gap-x-4 gap-y-2 text-xs md:text-sm">
                                    <dt className="text-[#555]">Method</dt>
                                    <dd className="font-bold">{order.paymentMethod || 'Cash on Delivery'}</dd>

                                    <dt className="text-[#555]">Status</dt>
                                    <dd>
                                        <span
                                            data-status={order.isPaid ? 'paid' : 'unpaid'}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-bold text-[#92400e] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-[''] data-[status=paid]:bg-[#dcfce7] data-[status=paid]:text-[#166534]"
                                        >
                                            {order.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </dd>
                                </dl>

                                <div className="mt-auto flex items-end justify-between gap-4 border-t-2 border-dashed border-[#dcebe6] pt-4">
                                    <span className="text-sm text-[#555] md:text-base">Total amount</span>
                                    <strong className="text-2xl font-bold tabular-nums text-[color:var(--tertiary-color)] md:text-3xl">
                                        PHP {grandTotal.toFixed(2)}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}