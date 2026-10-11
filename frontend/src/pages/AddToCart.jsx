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

    const allSelected = cartItems.length > 0 && cartItems.every((item) => selectedItem.includes(item._id || item.id));

    const toggleSelectAll = () => {
        setSelectedItem(allSelected ? [] : cartItems.map((item) => item._id || item.id));
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
        <div
            className={`flex min-h-[100dvh] flex-col justify-start gap-6 p-5 sm:p-8 md:p-16 ${
                cartItems.length === 0 || !showSummary
                    ? ''
                    : 'pb-44 sm:pb-44 md:pb-64'
            }`}
        >
            <header className="flex flex-col gap-1">
                <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--tertiary-color)] md:text-4xl">
                    Shopping Cart
                </h1>
                <p className="font-[family-name:var(--body-font)] text-sm tracking-[0.5px] text-[color:var(--dark-color)] md:text-base">
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
                <>
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-[family-name:var(--body-font)] text-xs text-[#555] md:text-sm tracking-wider">
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                            <span className="text-[color:var(--tertiary-color)] font-bold">{selectedItem.length > 0 && ` (${selectedItem.length} selected)`}</span>
                        </p>

                        <button
                            type="button"
                            className="cursor-pointer rounded-full border-2 border-[color:var(--main-color)] bg-white px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[rgba(164,223,204,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] md:py-2 md:text-sm"
                            onClick={toggleSelectAll}
                        >
                            {allSelected ? 'Clear selection' : 'Select all'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                        {cartItems.map((item) => {
                            const itemId = item._id || item.id;
                            const product = item.product || item;
                            const isUpdating = updatingId === itemId;
                            const isSelected = selectedItem.includes(itemId);

                            const unitPrice = Number(product.price) || 0;
                            const quantity = Number(item.quantity) || 0;
                            const isSoldOut = !(product.stock > 0);
                            const isLowStock = !isSoldOut && product.stock <= 5;
                            const atStockLimit = product.stock > 0 && quantity >= product.stock;

                            return (
                                <article
                                    key={itemId}
                                    className={`relative flex min-w-0 overflow-hidden rounded-[20px] border-2 bg-white transition duration-200 ease-in-out sm:flex-col ${
                                        isSelected
                                            ? 'border-[color:var(--tertiary-color)] shadow-[0_8px_22px_rgba(84,146,125,0.25)]'
                                            : 'border-[color:var(--main-color)]'
                                    }`}
                                >
                                    <div className="relative min-h-[11rem] w-28 shrink-0 self-stretch bg-[color:var(--main-color)] sm:aspect-[4/3] sm:min-h-0 sm:w-auto sm:self-auto">
                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className={`absolute inset-0 h-full w-full object-[20%_15%] md:object-center object-cover ${
                                                isSoldOut ? 'opacity-50 grayscale' : ''
                                            }`}
                                        />

                                        <span className="absolute left-2.5 top-2.5 hidden rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-1 font-[family-name:var(--body-font)] text-[10px] font-bold leading-none text-[color:var(--tertiary-color)] sm:block md:text-xs">
                                            {capitalizeWords(product.category || 'General')}
                                        </span>

                                        <label className="absolute left-2 top-2 grid h-8 w-8 cursor-pointer place-items-center sm:left-auto sm:right-2.5 sm:top-2.5">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                aria-label={`Select ${product.name}`}
                                                checked={isSelected}
                                                onChange={() => toggleSelectItem(itemId)}
                                            />
                                            <span className="grid h-6 w-6 place-items-center rounded-md border-2 border-[color:var(--tertiary-color)] bg-white text-transparent transition duration-200 ease-in-out before:-mt-px before:h-2.5 before:w-1.5 before:rotate-45 before:border-b-2 before:border-r-2 before:border-current before:content-[''] peer-checked:bg-[color:var(--tertiary-color)] peer-checked:text-[color:var(--light-color)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--tertiary-color)]"></span>
                                        </label>
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 md:p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="w-fit rounded-full bg-[color:var(--light-color)] px-2.5 py-0.5 font-[family-name:var(--body-font)] text-[10px] font-bold text-[color:var(--tertiary-color)] sm:hidden">
                                                {capitalizeWords(product.category || 'General')}
                                            </span>

                                            <h3 className="line-clamp-2 font-[family-name:var(--heading-font)] text-lg font-bold leading-tight text-[color:var(--dark-color)] md:text-xl">
                                                {product.name}
                                            </h3>

                                            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                                                <p className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] md:text-base">
                                                    PHP {unitPrice.toFixed(2)}
                                                    <span className="pl-1 text-xs font-normal text-[#555]">each</span>
                                                </p>
                                                <p
                                                    className={`font-[family-name:var(--body-font)] text-[11px] font-bold md:text-xs ${
                                                        isSoldOut
                                                            ? 'text-[#991b1b]'
                                                            : isLowStock
                                                                ? 'text-[#92400e]'
                                                                : 'text-[#555]'
                                                    }`}
                                                >
                                                    {isSoldOut ? 'Sold out' : isLowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    aria-label="Decrease quantity"
                                                    className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--tertiary-color)] hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={isUpdating || item.quantity <= 1}
                                                    onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                                                >
                                                    <i class="fa-solid fa-minus"></i>
                                                </button>

                                                <input
                                                    className="h-9 min-w-0 flex-1 rounded-[10px] border-2 border-[color:var(--main-color)] bg-white text-center font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)]"
                                                    aria-label="Quantity"
                                                    value={item.quantity}
                                                    min="1"
                                                    max={product.stock || undefined}
                                                    onChange={(e) => handleInputChange(itemId, e.target.value, product.stock)}
                                                    onBlur={() => handleInputFocus(itemId, item.quantity)}
                                                />

                                                <button
                                                    type="button"
                                                    aria-label="Increase quantity"
                                                    className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--tertiary-color)] hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={isUpdating || atStockLimit}
                                                    onClick={() => handleUpdateQuantity(itemId, item.quantity + 1)}
                                                >
                                                    <i class="fa-solid fa-plus"></i>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 border-t-2 border-dashed border-[#dcebe6] pt-3">
                                                <span className="font-[family-name:var(--body-font)] text-xs text-[#555]">Subtotal</span>
                                                <span className="font-[family-name:var(--body-font)] text-sm font-bold tabular-nums text-[color:var(--dark-color)] md:text-base">
                                                    PHP {(unitPrice * quantity).toFixed(2)}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-[#ecc9c9] bg-transparent px-3 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[#a24a4a] transition duration-200 ease-in-out hover:border-[rgb(200,100,100)] hover:bg-[rgb(200,100,100)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(200,100,100)] disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={isUpdating}
                                                onClick={() => handleRemoveItem(itemId, product)}
                                            >
                                                <i className="fa-solid fa-trash"></i>Remove
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}

            <aside
                aria-label="Order summary"
                className={`fixed inset-x-3 bottom-3 z-[2] flex-col gap-2 rounded-[20px] border border-[color:var(--main-color)] bg-white p-3 shadow-[0_12px_32px_rgba(40,40,40,0.2)] md:inset-x-auto md:bottom-6 md:right-6 md:w-[360px] md:gap-4 md:p-5 ${
                    showSummary ? 'flex' : 'hidden'
                }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <h2 className="font-[family-name:var(--heading-font)] text-xl font-bold text-[color:var(--tertiary-color)] md:text-2xl">
                        Order Summary
                    </h2>

                    <button
                        type="button"
                        aria-label="Hide order summary"
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-[color:var(--secondary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--light-color)] hover:text-[color:var(--dark-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                        onClick={() => setShowSummary(false)}
                    >
                        <i className="fa-solid fa-eye-slash"></i>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3 md:flex-col md:items-stretch md:gap-4">
                    <dl className="flex flex-col gap-0.5 font-[family-name:var(--body-font)] md:gap-2">
                        <div className="flex items-baseline gap-2 md:justify-between">
                            <dt className="text-xs text-[#555] md:text-sm">Selected items</dt>
                            <dd className="text-base font-bold tabular-nums text-[color:var(--tertiary-color)] md:text-xl">
                                {totalItemsCount}
                            </dd>
                        </div>

                        <div className="flex items-baseline gap-2 md:justify-between md:border-t-2 md:border-dashed md:border-[#dcebe6] md:pt-2">
                            <dt className="text-xs text-[#555] md:text-sm">Total amount</dt>
                            <dd className="text-base font-bold tabular-nums text-[color:var(--tertiary-color)] md:text-xl">
                                PHP {totalAmount.toFixed(2)}
                            </dd>
                        </div>
                    </dl>

                    <button
                        type="button"
                        className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-4 py-2.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--secondary-color)] hover:enabled:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:border-[#ddd] disabled:bg-[#ddd] disabled:text-[#777] md:py-3 md:text-sm"
                        disabled={selectedItem.length === 0}
                        onClick={handleProceedToCheckout}
                    >
                        <i className="fa-solid fa-credit-card"></i>
                        <span className="md:hidden">Checkout</span>
                        <span className="hidden md:inline">Proceed to Checkout</span>
                    </button>
                </div>
            </aside>

            {!showSummary && (
                <button
                    type="button"
                    aria-label="Show order summary"
                    className="fixed bottom-3 right-3 z-[2] flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-5 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] shadow-[0_8px_22px_rgba(40,40,40,0.25)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] md:bottom-6 md:right-6"
                    onClick={() => setShowSummary(true)}
                >
                    <i className="fa-solid fa-eye"></i>
                    Order Summary
                    {selectedItem.length > 0 && (
                        <span className="rounded-full bg-[rgba(255,255,255,0.25)] px-2 text-xs leading-5">{selectedItem.length}</span>
                    )}
                </button>
            )}
        </div>
    );
}