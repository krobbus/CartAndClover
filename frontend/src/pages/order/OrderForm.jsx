import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import OrderSummary from '../../components/OrderSummary';

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
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <button
                type="button"
                className="mb-6 flex cursor-pointer items-center justify-start gap-2 self-start bg-transparent font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] transition-colors duration-200 ease-in-out hover:text-[color:var(--secondary-color)] md:mb-8 md:text-base"
                onClick={() => navigate(-1)}
            >
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <header className="flex flex-col pb-8">
                <h2 className="break-all font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                    {isEditing ? `Edit Order #${orderToEdit._id || orderToEdit.id}` : 'Complete Your Order'}
                </h2>
                <p className="pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                    {isEditing ?
                        'Update delivery details and payment preferences for your order' :
                        'Review items, total cost, and enter delivery details'
                    }
                </p>
            </header>

            <ErrorNote error={error} />

            <section className="flex flex-col gap-4 rounded-[20px] bg-[color:var(--main-color)] p-5 text-[color:var(--dark-color)] shadow-[0_10px_25px_rgba(0,0,0,0.1)] sm:p-8 md:gap-8 md:p-10">
                <div className="flex flex-col gap-4">
                    <div className="border-b-2 border-[rgba(0,0,0,0.1)] pb-2">
                        <h3 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                            Ordered Items to Review
                        </h3>
                        <p className="pl-2 font-[family-name:var(--body-font)] text-sm text-[#444] md:text-base">
                            Please double-check your selected items and quantities before placing your order.
                        </p>
                    </div>

                    <OrderSummary items={cartItems} totalAmount={totalAmount} />

                    <div className="flex flex-col gap-2 font-[family-name:var(--body-font)] text-sm leading-normal [word-spacing:1px] md:text-base">
                        <h3 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--dark-color)] md:text-3xl">
                            Total Items & Amount
                        </h3>
                        <hr className="my-1 border-t-2 border-dashed border-[rgba(0,0,0,0.15)] md:my-2" />
                        <p className="flex items-end justify-between text-base text-[color:var(--dark-color)] md:items-center md:pl-4 md:text-xl">
                            <span>Total Items:</span>
                            <strong className="text-xl md:text-3xl">{totalItemsCount}</strong>
                        </p>
                        <p className="flex items-end justify-between text-base text-[color:var(--dark-color)] md:items-center md:pl-4 md:text-xl">
                            <span>Total Amount:</span>
                            <strong className="text-xl md:text-3xl">PHP {totalAmount.toFixed(2)}</strong>
                        </p>
                    </div>
                </div>
            </section>

            <form
                onSubmit={handleSubmitOrder}
                className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                <h3 className="col-span-full font-[family-name:var(--heading-font)] text-2xl font-bold md:text-3xl">
                    Shipping Information
                </h3>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="streetAddress"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Street Address <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="streetAddress"
                        name="street"
                        type="text"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="Enter your street address"
                        value={shippingAddress.street}
                        onChange={handleAddressChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="city"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        City <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="city"
                        name="city"
                        type="text"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="Enter your city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="province"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Province / State <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="province"
                        name="province"
                        type="text"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="Enter your province"
                        value={shippingAddress.province}
                        onChange={handleAddressChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="postalCode"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Postal Code <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="postalCode"
                        name="postalCode"
                        type="text"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="Enter your postal code"
                        value={shippingAddress.postalCode}
                        onChange={handleAddressChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="contactPhone"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Contact Phone <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="contactPhone"
                        name="phone"
                        type="tel"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="Enter your contact number"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="paymentMethod"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Payment Method <span className="text-[#ff7171]">*</span>
                    </label>
                    <select
                        id="paymentMethod"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                        <option value="Cash on Delivery">Cash on Delivery</option>
                        <option value="Credit/Debit Card">Credit / Debit Card</option>
                        <option value="E-Wallet (GCash/Maya)">E-Wallet (GCash/Maya)</option>
                    </select>
                </div>

                <div className="col-span-full mt-4 flex justify-center gap-4 md:justify-end">
                    <button
                        type="submit"
                        className="flex cursor-pointer items-center gap-2 rounded-[10px] border-2 border-transparent bg-[color:var(--tertiary-color)] px-4 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] disabled:cursor-not-allowed disabled:bg-[#ddd] disabled:opacity-60 md:px-6 md:py-3 md:text-base"
                        disabled={submitting || cartItems.length === 0}
                    >
                        {submitting
                            ? (isEditing ? 'Updating Order...' : 'Placing Order...')
                            : (isEditing ? 'Save & Update Order' : 'Confirm & Place Order')}
                    </button>

                    <button
                        type="button"
                        className="flex cursor-pointer items-center gap-2 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-transparent px-4 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)] md:px-6 md:py-3 md:text-base"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}