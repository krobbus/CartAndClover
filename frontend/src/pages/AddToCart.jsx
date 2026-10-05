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
        <div className="cartContainer">
            <header>
                <h1>Shopping Cart</h1>
                <p>Review items in your cart before checking out</p>
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
                <div className="cartItemsGrid">
                    {cartItems.map((item) => {
                        const itemId = item._id || item.id;
                        const product = item.product || item;
                        const isUpdating = updatingId === itemId;
                        const isSelected = selectedItem.includes(itemId);

                        return (
                            <div className="cardWrapper">
                                <div className="cardActions">
                                    <input 
                                        className="itemSelector" 
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelectItem(itemId)}
                                    />

                                    <button
                                        type="button"
                                        className="removeItemBtn"
                                        onClick={() => handleRemoveItem(itemId, product)}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>

                                <div key={itemId} className="productCard">
                                    <div className="productHeader">                                  
                                        <h3>{product.name}</h3>
                                        <p className="categoryTag">{capitalizeWords(product.category || 'General')}</p>
                                    </div>

                                    <div className="productImageWrapper">
                                        <p className="price">PHP {product.price}</p>
                                        
                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className="productDetailImage"
                                        />

                                        <p className="stockStatus">
                                            {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                                        </p>
                                    </div>

                                    <div className="productDetailInfo">                                   
                                        <div className="productItemQuantity">
                                            <button
                                                type="button"
                                                disabled={isUpdating || item.quantity <= 1}
                                                onClick={() => handleUpdateQuantity(itemId, item.quantity - 1)}
                                            >
                                                -
                                            </button>

                                            <input 
                                                className="counter"
                                                value={item.quantity}
                                                min="1"
                                                max={product.stock || undefined}
                                                onChange={(e) => handleInputChange(itemId, e.target.value, product.stock)}
                                                onBlur={() => handleInputFocus(itemId, item.quantity)}
                                            />

                                            <button
                                                type="button"
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

            <div className={`summaryCard ${showSummary ? 'open' : ''}`}>
                <button
                    type="button"
                    className="hideBtn"
                    onClick={() => setShowSummary(false)}
                >
                    <i className="fa-solid fa-eye-slash"></i>
                </button>

                <h2>Order Summary</h2>
                
                <div className="totalWrapper">
                    <div className="wrapper">
                        <span className="itemHeading">Total Items</span>
                        <span className="totalItems">{totalItemsCount} item</span>
                    </div>

                    <div className="wrapper">
                        <span className="amountHeading">Total Amount</span>
                        <span className="totalAmount">PHP {totalAmount.toFixed(2)}</span>
                    </div>

                    <button
                        type="button"
                        className="checkoutBtn"
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
                    className="displayBtn"
                    onClick={() => setShowSummary(true)}
                >
                    <i className="fa-solid fa-eye"></i>
                    {!showSummary && selectedItem.length > 0 && (
                        <span className="selectedBadge">{selectedItem.length}</span>
                    )}
                </button>
            )}
        </div>
    );
}