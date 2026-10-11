import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import { capitalizeWords, placeholderDisplay } from '../../utils.js';

export default function ProductView() {
    const { productId } = useParams();
    const { user, canManage } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadProduct = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [data, cartRes] = await Promise.all([
                api.get(`/products/${productId}`),
                user ? api.get('/cart').catch(() => null) : Promise.resolve(null),
            ]);

            setProduct(data);

            if (cartRes) {
                const items = cartRes.items || cartRes || [];
                const cartProductIds = items.map((item) => String(item.product?._id || item.productId || item.product || item._id));
                setIsInCart(cartProductIds.includes(String(productId)));
            } else {
                setIsInCart(false);
            }
        } catch (err) {
            setError(err?.message || 'Failed to load product details.');
        } finally {
            setLoading(false);
        }
    }, [productId, user]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    const handleAddToCart = async () => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        setAdding(true);
        setError(null);
        try {
            await api.post('/cart/add', {
                userId: user._id || user.id,
                productId,
                quantity: Number(quantity),
            });
            setIsInCart(true);
            navigate('/products/add-to-cart', { state: { selectedProductId: productId } });
        } catch (err) {
            setError(err?.message || 'Failed to add product to cart.');
        } finally {
            setAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        setBuyingNow(true);
        setError(null);
        try {
            await api.post('/cart/add', {
                userId: user._id || user.id,
                productId,
                quantity: Number(quantity),
            });
            setIsInCart(true);
            navigate('/products/orders/checkout');
        } catch (err) {
            setError(err?.message || 'Failed to proceed to checkout.');
        } finally {
            setBuyingNow(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${productId}`);
            navigate('/products');
        } catch (err) {
            setError(err?.message || 'Failed to delete product.');
        }
    };

    if (loading) return <Loading label="Loading product details..." />;

    if (!product && !error) {
        return (
            <div className="p-5 sm:p-8 md:p-16">
                <EmptyState
                    title="Product Not Found"
                    action={<Link to="/products">Back to Products</Link>}
                />
            </div>
        );
    }

    const calculatedPrice = ((product?.price || 0) * quantity).toFixed(2);
    const isSoldOut = !(product?.stock > 0);
    const isLowStock = !isSoldOut && product?.stock <= 5;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-6 bg-[color:var(--tertiary-color)] p-5 sm:p-8 md:p-16">
            <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full bg-[rgba(255,255,255,0.12)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--main-color)] md:text-sm"
                onClick={() => navigate(-1)}
            >
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <ErrorNote error={error} onRetry={loadProduct} />

            {product && (
                <div className="grid grid-cols-1 gap-6 bg-[color:var(--light-color)] shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-[24px] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10">
                    <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-[24px] bg-[color:var(--main-color)] shadow-[0_10px_25px_rgba(0,0,0,0.35)] lg:sticky lg:top-8 lg:mx-0 lg:max-w-none">
                        <img
                            src={placeholderDisplay(product.category)}
                            alt={product.name}
                            className={`h-full w-full object-cover ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                        />

                        <span className="absolute left-4 top-4 rounded-full bg-[rgba(255,255,255,0.92)] px-3 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold leading-none text-[color:var(--tertiary-color)] md:text-sm">
                            {capitalizeWords(product.category || 'General')}
                        </span>
                    </div>

                    <div className="flex flex-col gap-6 p-5 text-[color:var(--dark-color)] my-auto sm:p-8">
                        <div className="flex items-center justify-between gap-3">
                            <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold leading-[1.1] text-[color:var(--dark-color)] md:text-4xl lg:text-5xl">
                                {product.name}
                            </h1>

                            <span
                                className={`w-fit rounded-full px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold md:text-sm ${
                                    isSoldOut
                                        ? 'bg-[#fee2e2] text-[#991b1b]'
                                        : isLowStock
                                            ? 'bg-[#fef3c7] text-[#92400e]'
                                            : 'bg-[#dcfce7] text-[#166534]'
                                }`}
                            >
                                {isSoldOut ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left` : `${product.stock} items in stock`}
                            </span>
                        </div>

                        <p className="font-[family-name:var(--body-font)] text-base leading-relaxed text-[#444] md:text-lg">
                            {product.description || 'No description provided.'}
                        </p>

                        <dl className="w-full flex flex-col rounded-[16px] border border-[color:var(--main-color)] bg-white px-4 font-[family-name:var(--body-font)] md:px-6">
                            <div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-[#dcebe6] py-4">
                                <dt className="text-sm text-[#555] md:text-base">Original Price</dt>
                                <dd className="text-xl font-bold tabular-nums text-[color:var(--tertiary-color)] md:text-3xl">
                                    PHP {product.price}
                                </dd>
                            </div>

                            <div className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-[#dcebe6] py-4">
                                <dt className="text-sm text-[#555] md:text-base">Category</dt>
                                <dd className="text-sm font-bold md:text-lg">{capitalizeWords(product.category || 'General')}</dd>
                            </div>

                            <div className="flex items-baseline justify-between gap-4 py-4">
                                <dt className="text-sm text-[#555] md:text-base">Stock</dt>
                                <dd className="text-sm font-bold md:text-lg">
                                    {product.stock > 0 ? `(${product.stock}) items in stock` : 'Out of Stock'}
                                </dd>
                            </div>
                        </dl>

                        <div className="flex flex-col gap-4">
                            {(!canManage && user) && (
                                <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[color:var(--main-color)] bg-white p-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            aria-label="Decrease quantity"
                                            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] font-[family-name:var(--body-font)] text-base font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--tertiary-color)] hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={quantity <= 1 || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        >
                                            −
                                        </button>

                                        <input
                                            className="h-10 w-16 min-w-0 rounded-[10px] border-2 border-[color:var(--main-color)] bg-white text-center font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:w-20"
                                            aria-label="Quantity"
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '') {
                                                    setQuantity('');
                                                    return;
                                                }

                                                const parsedVal = parseInt(val, 10);
                                                if (!isNaN(parsedVal)) {
                                                    const clampedVal = Math.max(1, Math.min(product.stock, parsedVal));
                                                    setQuantity(clampedVal);
                                                }
                                            }}
                                        />

                                        <button
                                            type="button"
                                            aria-label="Increase quantity"
                                            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] font-[family-name:var(--body-font)] text-base font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--tertiary-color)] hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={quantity >= product.stock || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end">
                                        <span className="font-[family-name:var(--body-font)] text-xs text-[#555]">Total</span>
                                        <p className="font-[family-name:var(--body-font)] whitespace-nowrap text-lg font-bold tabular-nums text-[color:var(--tertiary-color)] md:text-2xl">
                                            PHP {calculatedPrice}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row">
                                {(canManage && user) ? (
                                    <>
                                        <Link
                                            to={`/products/edit/${product._id}`}
                                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-5 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>Edit Product
                                        </Link>

                                        <button
                                            type="button"
                                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 border-[#ecc9c9] bg-transparent px-5 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[#a24a4a] transition duration-200 ease-in-out hover:border-[rgb(200,100,100)] hover:bg-[rgb(200,100,100)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(200,100,100)]"
                                            onClick={handleDelete}
                                        >
                                            <i className="fa-solid fa-trash"></i>Delete Product
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-5 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--secondary-color)] hover:enabled:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:border-[#ddd] disabled:bg-[#ddd] disabled:text-[#777]"
                                        onClick={handleAddToCart}
                                        disabled={adding || product.stock <= 0 || isInCart}
                                    >
                                        <i className="fa-solid fa-cart-shopping"></i>
                                        {!user ?
                                            'Login to Purchase' : adding ?
                                            'Adding...' : isInCart ?
                                            'In Cart' : product.stock <= 0 ?
                                            'Out of Stock' : 'Add to Cart'
                                        }
                                    </button>
                                )}

                                {(!canManage && user) && product.stock > 0 && (
                                    <button
                                        type="button"
                                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 border-[color:var(--tertiary-color)] bg-transparent px-5 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={handleBuyNow}
                                        disabled={adding || buyingNow}
                                    >
                                        <i className="fa-solid fa-store"></i>
                                        {buyingNow ? 'Redirecting...' : 'Buy Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}