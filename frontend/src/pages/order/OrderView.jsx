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
            <div className="p-8 md:p-16">
                <EmptyState
                    title="Order not found."
                    action={<Link to="/products/orders">Back to Orders</Link>}
                />
            </div>
        );
    }

    const { shippingAddress } = order || {};
    const itemsList = order?.orderItems || order?.items || [];
    const grandTotal = order?.totalAmount ?? order?.totalPrice ?? 0;
    const isPending = (order?.status || 'Pending').toLowerCase() === 'pending';

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 bg-[color:var(--tertiary-color)] p-8 md:p-16">
            <button
                type="button"
                className="mb-6 flex cursor-pointer items-center justify-start gap-2 self-start bg-transparent font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:text-[color:var(--main-color)] md:mb-8 md:text-base"
                onClick={() => navigate('/products/orders')}
            >
                <i className="fa-solid fa-chevron-left"></i>Back to Orders
            </button>

            <header className="flex flex-col items-center justify-center gap-4 pb-8 xl:flex-row xl:items-start xl:justify-between">
                <div className="text-center xl:text-left">
                    <h1 className="break-all font-mono text-xl font-bold text-[color:var(--light-color)] md:text-2xl xl:text-3xl">
                        Order #{order?._id || order?.id}
                    </h1>
                    <p className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] opacity-80 md:text-base">
                        Placed on: {formatDate(order?.createdAt || order?.date)}
                    </p>
                </div>

                {order && (
                    <div className="flex flex-col justify-end gap-4">
                        <div className="flex justify-center gap-2 xl:justify-end">
                            <span
                                data-status={order.status?.toLowerCase() || 'pending'}
                                className="whitespace-nowrap rounded-[10px] bg-[#ddd] px-4 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold tracking-[0.5px] text-[color:var(--dark-color)] md:px-6 md:text-base data-[status=pending]:bg-[#fef3c7] data-[status=pending]:text-[#92400e] data-[status=processing]:bg-[#e0f2fe] data-[status=processing]:text-[#075985] data-[status=shipped]:bg-[#dcfce7] data-[status=shipped]:text-[#166534] data-[status=delivered]:bg-[#dcfce7] data-[status=delivered]:text-[#166534] data-[status=completed]:bg-[#dcfce7] data-[status=completed]:text-[#166534] data-[status=cancelled]:bg-[#fee2e2] data-[status=cancelled]:text-[#991b1b] data-[status=canceled]:bg-[#fee2e2] data-[status=canceled]:text-[#991b1b]"
                            >
                                {capitalizeWords(order.status || 'Pending')}
                            </span>

                            <span
                                data-status={order.isPaid ? 'paid' : 'unpaid'}
                                className="whitespace-nowrap rounded-[10px] bg-[#ddd] px-4 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold tracking-[0.5px] text-[color:var(--dark-color)] md:px-6 md:text-base data-[status=paid]:bg-[#dcfce7] data-[status=paid]:text-[#166534] data-[status=unpaid]:bg-[#fef3c7] data-[status=unpaid]:text-[#92400e]"
                            >
                                {order.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                    </div>
                )}
            </header>

            <ErrorNote error={error} onRetry={loadOrder} />

            {order && (
                <div className="flex flex-col gap-4 rounded-[20px] bg-[color:var(--main-color)] p-5 text-[color:var(--dark-color)] shadow-[0_10px_25px_rgba(0,0,0,0.1)] sm:p-8 md:gap-8 md:p-10">
                    {canManage ? (
                        <div className="flex flex-row items-center justify-end gap-4 rounded-xl">
                            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
                                <label
                                    htmlFor="statusSelect"
                                    className="font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] md:text-base"
                                >
                                    Order Status:
                                </label>
                                <select
                                    id="statusSelect"
                                    className="cursor-pointer rounded-lg border-2 border-[color:var(--tertiary-color)] bg-[color:var(--light-color)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] outline-none focus:border-[color:var(--main-color)] disabled:cursor-not-allowed disabled:opacity-60"
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

                            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
                                <label
                                    htmlFor="paymentStatusSelect"
                                    className="font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] md:text-base"
                                >
                                    Payment Status:
                                </label>
                                <select
                                    id="paymentStatusSelect"
                                    className="cursor-pointer rounded-lg border-2 border-[color:var(--tertiary-color)] bg-[color:var(--light-color)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] outline-none focus:border-[color:var(--main-color)] disabled:cursor-not-allowed disabled:opacity-60"
                                    value={Boolean(order.isPaid)}
                                    disabled={updating}
                                    onChange={(e) => handlePaymentStatusUpdate(e.target.value === 'true')}
                                >
                                    <option value="false">Unpaid</option>
                                    <option value="true">Paid</option>
                                </select>
                            </div>
                        </div>
                    ) : isPending && (
                        <div className="flex flex-row items-center justify-end gap-4 rounded-xl">
                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[color:var(--tertiary-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                onClick={handleEditOrder}
                                disabled={updating}
                            >
                                <i className="fa-solid fa-pen-to-square"></i>Edit Order
                            </button>

                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[rgb(200,100,100)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[rgb(180,80,80)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                onClick={handleCancelOrder}
                                disabled={updating}
                            >
                                <i className="fa-solid fa-trash"></i>Cancel Order
                            </button>
                        </div>
                    )}

                    <section className="flex flex-col gap-4">
                        <h3 className="border-b-2 border-[rgba(0,0,0,0.1)] pb-2 font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                            Items Ordered ({itemsList.length})
                        </h3>

                        <OrderSummary items={itemsList} totalAmount={grandTotal} />
                    </section>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
                        <section className="flex flex-col gap-4">
                            <h3 className="border-b-2 border-[rgba(0,0,0,0.1)] pb-2 font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                                Shipping Address
                            </h3>
                            {shippingAddress ? (
                                <div className="flex flex-col gap-2 font-[family-name:var(--body-font)] text-xs leading-normal [word-spacing:1px] md:text-base">
                                    <span className="font-bold">
                                        {shippingAddress.street || ''}, {shippingAddress.province || ''}, {shippingAddress.city || ''}, {shippingAddress.postalCode || ''}
                                    </span>
                                    <p className="md:pl-4"><strong>Street:</strong> {shippingAddress.street || shippingAddress.address || 'N/A'}</p>
                                    <p className="md:pl-4"><strong>Province:</strong> {shippingAddress.province || 'N/A'}</p>
                                    <p className="md:pl-4"><strong>City:</strong> {shippingAddress.city || 'N/A'}</p>
                                    <p className="md:pl-4"><strong>Postal Code:</strong> {shippingAddress.postalCode || 'N/A'}</p>
                                    <p className="md:pl-4"><strong>Phone:</strong> {shippingAddress.phone || 'N/A'}</p>
                                </div>
                            ) : (
                                <p className="font-[family-name:var(--body-font)] text-xs md:text-base">No shipping address attached.</p>
                            )}
                        </section>

                        <section className="flex flex-col gap-4">
                            <h3 className="border-b-2 border-[rgba(0,0,0,0.1)] pb-2 font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                                Payment & Summary
                            </h3>
                            <div className="flex flex-col gap-2 font-[family-name:var(--body-font)] text-xs leading-normal [word-spacing:1px] md:text-base">
                                <p className="md:pl-4"><strong>Payment Method:</strong> {order.paymentMethod || 'Cash on Delivery'}</p>
                                <p className="md:pl-4"><strong>Payment Status:</strong> {order.isPaid ? 'Paid' : 'Unpaid'}</p>
                                <hr className="my-1 border-t-2 border-dashed border-[rgba(0,0,0,0.15)] md:my-2" />
                                <p className="flex items-center justify-between text-base text-[color:var(--dark-color)] md:pl-4 md:text-xl">
                                    <span>Total Amount:</span>
                                    <strong className="text-base md:text-3xl">PHP {grandTotal.toFixed(2)}</strong>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}