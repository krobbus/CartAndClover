import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';
import { capitalizeWords, placeholderDisplay } from '../utils.js';

export default function AddToCart() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [cartItems, setCartItems] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedItem, setSelectedItem] = useState([]);
    const [showSummary, setShowSummary] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const targetProductId = location.state?.selectedProductId;

    const loadCart = useCallback(async () => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        setLoading(true);
        setError(null);
        try {
            const data = await api.get('/cart');
            const items = data.items || data || [];
            setCartItems(items);

            if (targetProductId) {
                const targetItem = items.find(
                    (item) => (item.product?._id || item.product || item.id) === targetProductId
                );

                const targetId = targetItem ? (targetItem._id || targetItem.id) : null;
                setSelectedItem(targetId ? [targetId] : []);
            } else {
                setSelectedItem([]);
            }
        } catch (err) {
            setError(err?.message || 'Failed to fetch cart items.');
        } finally {
            setLoading(false);
        }
    }, [user, navigate, location, targetProductId]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const toggleSelectItem = (itemId) => {
        setSelectedItem((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        setUpdatingId(itemId);
        setError(null);

        try {
            await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
            setCartItems((prev) =>
                prev.map((item) =>
                    (item._id === itemId || item.id === itemId)
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        } catch (err) {
            setError(err?.message || 'Failed to update item quantity.');
            loadCart();
        } finally {
            setUpdatingId(null);
        }
    };

    const handleInputChange = (itemId, val, stock) => {
        if (val === '') {
            setCartItems((prev) =>
                prev.map((item) =>
                    (item._id === itemId || item.id === itemId)
                        ? { ...item, quantity: '' }
                        : item
                )
            );
            return;
        }

        const parsedVal = parseInt(val, 10);
        if (!isNaN(parsedVal)) {
            const maxAvailable = stock > 0 ? stock : 999;
            const clampedVal = Math.max(1, Math.min(maxAvailable, parsedVal));
            handleUpdateQuantity(itemId, clampedVal);
        }
    };

    const handleInputFocus = (itemId, currentQty) => {
        if (currentQty === '' || currentQty < 1) {
            handleUpdateQuantity(itemId, 1);
        }
    }

    const handleRemoveItem = async (itemId, item) => {
        const itemName = item?.product?.name || item?.name || 'this item';

        if (!window.confirm(`Are you sure you want to remove ${itemName}?`)) return;

        setUpdatingId(itemId);
        setError(null);

        try {
            await api.delete(`/cart/items/${itemId}`);
            setCartItems((prev) => prev.filter((item) => item._id !== itemId && item.id !== itemId));
            setSelectedItem((prev) => prev.filter((id) => id !== itemId));
        } catch (err) {
            setError(err?.message || 'Failed to remove item from cart.');
        } finally {
            setUpdatingId(null);
        }
    };

    const selectedCartItems = cartItems.filter((item) =>
        selectedItem.includes(item._id || item.id)
    );

    const totalAmount = selectedCartItems.reduce((acc, item) => {
        const price = item.product?.price || item.price || 0;
        const qty = Number(item.quantity) || 0;
        return acc + price * qty;
    }, 0);

    const totalItemsCount = selectedCartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const handleProceedToCheckout = () => {
        navigate('/products/orders/checkout', {
            state: { selectedItems: selectedCartItems }
        });
    };

    if (loading) return <Loading label="Loading your cart..." />;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <header className="flex flex-col pb-8">
                <h1 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    Shopping Cart
                </h1>
                <p className="pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                    Review items in your cart before checking out
                </p>
            </header>

            <ErrorNote error={error} onRetry={loadCart} />

            {cartItems.length === 0 ? (
                <EmptyState
                    title="Your shopping cart is empty."
                    action={
                        <Link to="/marketplace">Explore Marketplace</Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,300px))] justify-center gap-4 md:justify-start">
                    {cartItems.map((item) => {
                        const itemId = item._id || item.id;
                        const product = item.product || item;
                        const isUpdating = updatingId === itemId;
                        const isSelected = selectedItem.includes(itemId);

                        return (
                            <div key={itemId} className="flex justify-start gap-2">
                                <div className="flex flex-col gap-2">
                                    <input
                                        className="grid h-8 w-8 shrink-0 cursor-pointer appearance-none place-content-center rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--light-color)] transition duration-200 ease-in-out before:h-[1.4rem] before:w-[1.4rem] before:scale-0 before:rounded-md before:bg-[color:var(--tertiary-color)] before:content-[''] checked:before:scale-100"
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelectItem(itemId)}
                                    />

                                    <button
                                        type="button"
                                        className="w-full cursor-pointer rounded-[10px] bg-[rgb(200,100,100)] p-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[rgb(180,80,80)]"
                                        onClick={() => handleRemoveItem(itemId, product)}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div className="relative flex min-w-0 flex-1 flex-col justify-end rounded-[20px] bg-[color:var(--secondary-color)] p-4 pb-2">
                                    <div className="flex flex-wrap items-center justify-between gap-x-2 pb-4">
                                        <h3 className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base">
                                            {product.name}
                                        </h3>
                                        <p className="font-[family-name:var(--body-font)] text-sm text-[#444] md:text-base">
                                            {capitalizeWords(product.category || 'General')}
                                        </p>
                                    </div>

                                    <div className="relative aspect-square">
                                        <p className="absolute right-0 top-0 rounded-bl-[20px] bg-[color:var(--secondary-color)] pb-2 pl-4 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] md:text-base">
                                            PHP {product.price}
                                        </p>

                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className="h-full w-full rounded-[20px] object-cover"
                                        />

                                        <p className="absolute inset-x-2.5 bottom-2.5 rounded-[20px] bg-[color:var(--secondary-color)] px-4 py-0.5 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)]">
                                            {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:opacity-60"
                                                disabled={isUpdating || item.quantity <= 1}
                                                onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                                            >
                                                -
                                            </button>

                                            <input
                                                className="min-w-0 max-w-[6rem] flex-1 rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] text-center font-[family-name:var(--body-font)] text-xs font-bold"
                                                value={item.quantity}
                                                min="1"
                                                max={product.stock || undefined}
                                                onChange={(e) => handleInputChange(itemId, e.target.value, product.stock)}
                                                onBlur={() => handleInputFocus(itemId, item.quantity)}
                                            />

                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:opacity-60"
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                className={`fixed bottom-2.5 left-2.5 right-2.5 z-[2] flex-col gap-2 rounded-[20px] bg-[color:var(--secondary-color)] p-3 md:left-auto md:gap-4 md:p-4 ${
                    showSummary ? 'flex' : 'hidden'
                }`}
            >
                <button
                    type="button"
                    className="absolute -top-[60px] right-3 cursor-pointer rounded-[10px] bg-[color:var(--secondary-color)] px-4 py-3 text-xl text-[color:var(--light-color)] transition duration-200 ease-in-out hover:text-[color:var(--dark-color)] md:top-3 md:rounded-full md:bg-transparent md:px-2 md:py-[0.2rem]"
                    onClick={() => setShowSummary(false)}
                >
                    <i className="fa-solid fa-eye-slash"></i>
                </button>

                <h2 className="whitespace-nowrap text-center font-[family-name:var(--heading-font)] text-base font-bold text-[color:var(--light-color)] md:text-2xl">
                    Order Summary
                </h2>

                <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                    <div className="flex flex-col gap-[0.2rem] rounded-[10px] bg-[color:var(--main-color)] px-4 py-2">
                        <span className="font-[family-name:var(--body-font)] text-[10px] tracking-[1px] text-[color:var(--dark-color)] md:text-xs">
                            Total Items
                        </span>
                        <span className="font-[family-name:var(--body-font)] text-xs font-bold tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                            {totalItemsCount} item
                        </span>
                    </div>

                    <div className="flex flex-col gap-[0.2rem] rounded-[10px] bg-[color:var(--main-color)] px-4 py-2">
                        <span className="font-[family-name:var(--body-font)] text-[10px] tracking-[1px] text-[color:var(--dark-color)] md:text-xs">
                            Total Amount
                        </span>
                        <span className="font-[family-name:var(--body-font)] text-xs font-bold tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                            PHP {totalAmount.toFixed(2)}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[color:var(--light-color)] px-3 py-2.5 font-[family-name:var(--body-font)] text-[10px] font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--main-color)] disabled:cursor-not-allowed disabled:bg-[#ddd] disabled:opacity-60 md:px-4 md:py-3 md:text-xs"
                        disabled={selectedItem.length === 0}
                        onClick={handleProceedToCheckout}
                    >
                        <i className="fa-solid fa-money-bill-wave"></i> Proceed to Checkout
                    </button>
                </div>
            </div>

            {!showSummary && (
                <button
                    type="button"
                    className="fixed bottom-2.5 right-2.5 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-base font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)]"
                    onClick={() => setShowSummary(true)}
                >
                    <i className="fa-solid fa-eye"></i>
                    {selectedItem.length > 0 && (
                        <span className="text-base font-bold text-[color:var(--dark-color)]">{selectedItem.length}</span>
                    )}
                </button>
            )}
        </div>
    );
}