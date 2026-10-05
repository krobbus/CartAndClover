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
                <div className="checkoutHeader">
                    <h3>Items to Review</h3>
                    <p>Please double-check your selected items and quantities before placing your order.</p>
                </div>

                <div className="bodyWrapper">
                    <div className="orderOverview">
                        <h3>Order Total Items/Amount</h3>
                        
                        <div className="detailWrapper">
                            <span className="itemsHeading">Total Items</span>
                            <span className="totalItems">{totalItemsCount}</span>
                        </div>

                        <div className="detailWrapper">
                            <span className="amountHeading">Total Amount</span>
                            <span className="totalAmount">PHP {totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="checkoutProductFlex">
                        {cartItems.map((item) => {
                            const product = item.product || item;
                            const itemId = item._id || item.id;
                            const itemSubtotal = ((product.price || 0) * item.quantity).toFixed(2);

                            return (
                                <div key={itemId} className="productCard">
                                    <div className="productHeader">
                                        <h4>{product.name}</h4>
                                        <p className="categoryTag">{capitalizeWords(product.category || 'General')}</p>
                                    </div>
                                    
                                    <div className="bodyWrapper">
                                        <div className="productImageWrapper">                                
                                            <img
                                                src="/placeholder.png"
                                                alt={product.name}
                                                className="productDetailImage"
                                            />

                                            <p className="stockStatus">
                                                {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                                            </p>
                                        </div>

                                        <div className="productDetailInfo">
                                            <p className="productDescription">{product.description || 'No description provided.'}</p>

                                            <div className="orderItemMeta">
                                                <div className="detailWrapper">
                                                    <span className="unitHeading">Unit Price</span>
                                                    <span className="productPrice">PHP {(product.price || 0).toFixed(2)}</span>
                                                </div>

                                                <div className="detailWrapper">
                                                    <span className="quantityHeading">Quantity</span>
                                                    <span className="itemQuantity">{item.quantity}</span>                   
                                                </div>

                                                <div className="detailWrapper">
                                                    <span className="subtotalHeading">Subtotal</span>
                                                    <span className="itemSubtotal">PHP {itemSubtotal}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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