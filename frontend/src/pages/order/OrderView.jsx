import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
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
        navigate('/products/orders/edit/:userId', { state: { orderToEdit: order } });
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
            <EmptyState
                title="Order not found."
                action={
                    <button type="button" onClick={() => navigate('/products/orders')}>
                        Back to Orders
                    </button>
                }
            />
        );
    }

    const { shippingAddress } = order || {};
    const itemsList = order?.orderItems || order?.items || [];
    const grandTotal = order?.totalAmount ?? order?.totalPrice ?? 0;
    const isPending = (order?.status || 'Pending').toLowerCase() === 'pending';

    return (
        <div className="orderViewContainer">
            <button type="button" className="backBtn" onClick={() => navigate('/products/orders')}>
                <i className="fa-solid fa-chevron-left"></i>Back to Orders
            </button>

            <header>
                <div>
                    <h1>Order #{order._id || order.id}</h1>
                    <p className="orderDate">Placed on: {formatDate(order.createdAt || order.date)}</p>
                </div>

                <div className="headerActions">
                    {isPending && (
                        <div className="orderActions">
                            <button
                                type="button"
                                className="editBtn"
                                onClick={handleEditOrder}
                                disabled={updating}
                            >
                                <i className="fa-solid fa-pen-to-square"></i>Edit Order
                            </button>
                            
                            <button
                                type="button"
                                className="cancelBtn"
                                onClick={handleCancelOrder}
                                disabled={updating}
                            >
                                <i className="fa-solid fa-trash"></i>Cancel Order
                            </button>
                        </div>
                    )}

                    <div className="statusDisplay">
                        <span className={`statusBadge ${order.status?.toLowerCase()}`}>
                            {capitalizeWords(order.status || 'Pending')}
                        </span>

                        <span className={`statusBadge ${order.isPaid ? "paid" : "unpaid"}`}>
                            {order.isPaid ? "Paid" : "Unpaid"}
                        </span>
                    </div>
                </div>
            </header>

            <ErrorNote error={error} onRetry={loadOrder} />

            {order && (
                <div className="orderDetailCard">
                    {canManage && (
                        <div className="statusManagementBar">
                            <label htmlFor="statusSelect">Update Order Status</label>
                            <select
                                id="statusSelect"
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

                            <label htmlFor="paymentStatusSelect">Payment Status: </label>
                            <select
                                id="paymentStatusSelect"
                                value={Boolean(order.isPaid)}
                                disabled={updating}
                                onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                            >
                                <option value="false">Unpaid</option>
                                <option value="true">Paid</option>
                            </select>
                        </div>
                    )}

                    <section className="orderSection">
                        <h3>Items Ordered ({itemsList.length})</h3>

                        <div className="orderItemsList">
                            {itemsList.map((item) => {
                                const product = item.product || {};
                                const itemName = product.name || item.name || 'Product Item';
                                const itemPrice = Number(item.price || product.price || 0);
                                const itemQuantity = Number(item.quantity || 1);
                                const itemSubtotal = (itemPrice * itemQuantity).toFixed(2);

                                return (
                                    <div key={item._id || item.id || product._id} className="orderItemRow">
                                        <div className="itemInfo">
                                            <h4>{itemName}</h4>
                                            
                                            <span className="itemMeta">
                                                <strong>Unit Price:</strong> PHP {itemPrice.toFixed(2)}
                                            </span>

                                            <span className="itemMeta">
                                                <strong>Quantity:</strong> {itemQuantity}
                                            </span>
                                        </div>
                                        
                                        <div className="itemPricing">
                                            <span className="subtotalLabel">Subtotal</span>
                                            <span className="subtotalAmount">PHP {itemSubtotal}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="orderFooterGrid">
                        <section className="orderSection">
                            <h3>Shipping Address</h3>
                            {shippingAddress ? (
                                <div className="addressDetails">
                                    <span className="fullAddress">
                                        {shippingAddress.street || ''}, {shippingAddress.province || ''}, {shippingAddress.city || ''}, {shippingAddress.postalCode || ''}
                                    </span>
                                    <p><strong>Street:</strong> {shippingAddress.street || shippingAddress.address || 'N/A'}</p>
                                    <p><strong>Province:</strong> {shippingAddress.province || 'N/A'}</p>
                                    <p><strong>City:</strong> {shippingAddress.city || 'N/A'}</p>
                                    <p><strong>Postal Code:</strong> {shippingAddress.postalCode || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {shippingAddress.phone || 'N/A'}</p>
                                </div>
                            ) : (
                                <p>No shipping address attached.</p>
                            )}
                        </section>

                        <section className="orderSection">
                            <h3>Payment & Summary</h3>
                            <div className="paymentDetails">
                                <p><strong>Payment Method:</strong> {order.paymentMethod || 'Cash on Delivery'}</p>
                                <p><strong>Payment Status:</strong> {order.isPaid ? 'Paid' : 'Unpaid'}</p>
                                <hr />
                                <p className="orderGrandTotal">
                                    <span>Total Amount:</span>
                                    <strong>PHP {grandTotal.toFixed(2)}</strong>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}