import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import { capitalizeWords } from '../../utils.js';

export default function OrderForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const orderToEdit = location.state?.orderToEdit;
    const isEditing = Boolean(orderToEdit);

    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        province: '',
        postalCode: '',
        phone: '',
    });

    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const selectedItemsFromState = location.state?.selectedItems;

    useEffect(() => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        if (orderToEdit) {
            setCartItems(orderToEdit.orderItems || orderToEdit.items || []);

            if (orderToEdit.shippingAddress) {
                setShippingAddress({
                    street: orderToEdit.shippingAddress.street || orderToEdit.shippingAddress.address || '',
                    city: orderToEdit.shippingAddress.city || '',
                    province: orderToEdit.shippingAddress.province || '',
                    postalCode: orderToEdit.shippingAddress.postalCode || '',
                    phone: orderToEdit.shippingAddress.phone || '',
                });
            }

            if (orderToEdit.paymentMethod) {
                setPaymentMethod(orderToEdit.paymentMethod);
            }
            setLoading(false);
        } else if (selectedItemsFromState && selectedItemsFromState.length > 0) {
            setCartItems(selectedItemsFromState);
            setLoading(false);
        } else {
            api.get('/cart')
                .then((data) => setCartItems(data.items || data || []))
                .catch((err) => setError(err?.message || 'Failed to load cart for checkout.'))
                .finally(() => setLoading(false));
        }
    }, [user, navigate, location, selectedItemsFromState]);

    const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const totalAmount = cartItems.reduce((acc, item) => {
        const price = item.product?.price || item.price || 0;
        return acc + price * item.quantity;
    }, 0);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const orderPayload = {
                orderItems: cartItems.map((item) => {
                    const product = item.product || item;
                    
                    return {
                        product: product._id || item.productId || item._id,
                        name: product.name || 'Unnamed Product',
                        quantity: Number(item.quantity),
                        price: Number(product.price || item.price || 0),
                    };
                }),
                shippingAddress: {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    province: shippingAddress.province,
                    postalCode: shippingAddress.postalCode,
                    phone: shippingAddress.phone
                },
                paymentMethod,
                totalAmount: Number(totalAmount),
            };

            let targetOrderId;

            if (isEditing) {
                const targetId = orderToEdit._id || orderToEdit.id;
                await api.put(`/orders/${targetId}`, orderPayload);
                targetOrderId = targetId;
            } else {
                const createdOrder = await api.post('/orders', orderPayload);
                targetOrderId = createdOrder._id || createdOrder.id;
            }

            navigate(`/products/orders/${targetOrderId}`, { replace: true });
        } catch (err) {
            setError(err?.message || `Failed to ${isEditing ? 'update' : 'place'} order. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading label={isEditing ? "Loading order details..." : "Preparing checkout..."} />;

    return (
        <div className="orderFormContainer">
            <button type="button" className="backBtn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>
            
            <header>
                <h2>{isEditing ? `Edit Order #${orderToEdit._id || orderToEdit.id}` : 'Complete Your Order'}</h2>
                <p>
                    {isEditing ?
                        'Update delivery details and payment preferences for your order' : 
                        'Review items, total cost, and enter delivery details'
                    }
                </p>
            </header>

            <ErrorNote error={error} />

            <section className="checkoutProductsSection">
                <div className="orderSection">
                    <div className="orderHeader">
                        <h3>Ordered Items to Review</h3>
                        <p>Please double-check your selected items and quantities before placing your order.</p>
                    </div>

                    <div className="orderItemsList">
                        {cartItems.map((item) => {
                            const product = item.product || item;
                            const itemName = product.name || item.name || 'Product Item';
                            const itemPrice = Number(item.price || product.price || 0);
                            const itemQuantity = Number(item.quantity || 1);
                            const itemSubtotal = ((product.price || 0) * item.quantity).toFixed(2);

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

                    <div className="orderOverview">
                        <h3>Total Items & Amount</h3>
                        <hr />
                        <p className="orderTotalItems">
                            <span>Total Items:</span>
                            <strong>{totalItemsCount}</strong>
                        </p>
                        <p className="orderTotalAmount">
                            <span>Total Amount:</span>
                            <strong>PHP {totalAmount.toFixed(2)}</strong>
                        </p>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmitOrder}>
                <h3 className="span">Shipping Information</h3>

                <label>
                    Street Address
                    <input
                        name="street"
                        type="text"
                        placeholder="Enter your street address"
                        value={shippingAddress.street}
                        onChange={handleAddressChange}
                        required
                    />
                </label>

                <label>
                    City
                    <input
                        name="city"
                        type="text"
                        placeholder="Enter your city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        required
                    />
                </label>

                <label>
                    Province / State
                    <input
                        name="province"
                        type="text"
                        placeholder="Enter your province"
                        value={shippingAddress.province}
                        onChange={handleAddressChange}
                        required
                    />
                </label>

                <label>
                    Postal Code
                    <input
                        name="postalCode"
                        type="text"
                        placeholder="Enter your postal code"
                        value={shippingAddress.postalCode}
                        onChange={handleAddressChange}
                        required
                    />
                </label>

                <label>
                    Contact Phone
                    <input
                        name="phone"
                        type="tel"
                        placeholder="Enter your contact number"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        required
                    />
                </label>

                <label>
                    Payment Method
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="Cash on Delivery">Cash on Delivery</option>
                        <option value="Credit/Debit Card">Credit / Debit Card</option>
                        <option value="E-Wallet (GCash/Maya)">E-Wallet (GCash/Maya)</option>
                    </select>
                </label>

                <div className="formActions span">
                    <button
                        type="submit"
                        className="placeOrderBtn"
                        disabled={submitting || cartItems.length === 0}
                    >
                        {submitting
                            ? (isEditing ? 'Updating Order...' : 'Placing Order...')
                            : (isEditing ? 'Save & Update Order' : 'Confirm & Place Order')}
                    </button>

                    <button type="button" className="cancelBtn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}