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
            <div className="p-8 md:p-16">
                <EmptyState
                    title="Product Not Found"
                    action={<Link to="/products">Back to Products</Link>}
                />
            </div>
        );
    }

    const calculatedPrice = ((product?.price || 0) * quantity).toFixed(2);

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 bg-[color:var(--tertiary-color)] p-8 md:p-16">
            <button
                type="button"
                className="mb-6 flex cursor-pointer items-center justify-start gap-2 self-start bg-transparent font-[family-name:var(--body-font)] text-sm text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:text-[color:var(--main-color)] md:mb-8 md:text-base"
                onClick={() => navigate(-1)}
            >
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <header className="flex items-end justify-between pb-8">
                <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--light-color)] md:text-5xl">
                    {product?.name}
                </h1>
            </header>

            <ErrorNote error={error} onRetry={loadProduct} />

            {product && (
                <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-8">
                    <div className="aspect-square w-full max-w-md self-center md:max-w-none md:self-auto">
                        <img
                            src={placeholderDisplay(product.category)}
                            alt={product.name}
                            className="h-full w-full rounded-[20px] object-cover"
                        />
                    </div>

                    <div className="flex flex-col justify-evenly gap-4 md:col-span-2">
                        <p className="font-[family-name:var(--body-font)] text-xl text-[color:var(--light-color)] md:text-3xl">
                            {product.description || 'No description provided.'}
                        </p>

                        <div>
                            <div className="flex flex-col items-start justify-between border-b-4 border-[color:var(--main-color)] pb-1 pt-4 md:flex-row md:flex-wrap md:items-end md:pb-2 md:pt-8">
                                <span className="font-[family-name:var(--body-font)] text-xs tracking-[1px] text-[color:var(--light-color)] md:pl-2 md:text-xl">
                                    Original Price
                                </span>
                                <span className="font-[family-name:var(--body-font)] text-xl font-bold tracking-[1px] text-[color:var(--light-color)] [word-spacing:0.6rem] md:pr-2 md:text-2xl">
                                    PHP {product.price}
                                </span>
                            </div>

                            <div className="flex flex-col items-start justify-between border-b-4 border-[color:var(--main-color)] pb-1 pt-4 md:flex-row md:flex-wrap md:items-end md:pb-2 md:pt-8">
                                <span className="font-[family-name:var(--body-font)] text-xs tracking-[1px] text-[color:var(--light-color)] md:pl-2 md:text-xl">
                                    Category
                                </span>
                                <span className="font-[family-name:var(--body-font)] text-xl font-bold tracking-[1px] text-[color:var(--light-color)] [word-spacing:0.6rem] md:pr-2 md:text-2xl">
                                    {capitalizeWords(product.category || 'General')}
                                </span>
                            </div>

                            <div className="flex flex-col items-start justify-between border-b-4 border-[color:var(--main-color)] pb-1 pt-4 md:flex-row md:flex-wrap md:items-end md:pb-2 md:pt-8">
                                <span className="font-[family-name:var(--body-font)] text-xs tracking-[1px] text-[color:var(--light-color)] md:pl-2 md:text-xl">
                                    Stock
                                </span>
                                <p className="font-[family-name:var(--body-font)] text-xl font-bold tracking-[1px] text-[color:var(--light-color)] [word-spacing:0.6rem] md:pr-2 md:text-2xl">
                                    {product.stock > 0 ? `(${product.stock}) items in stock` : 'Out of Stock'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-start gap-4 py-4 md:justify-between">
                            {(!canManage && user) && (
                                <>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                            disabled={quantity <= 1 || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        >
                                            <i className="fa-solid fa-minus"></i>
                                        </button>

                                        <input
                                            className="w-24 min-w-0 rounded-[10px] border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] text-center font-[family-name:var(--body-font)] text-xs font-bold md:text-sm"
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
                                            className="cursor-pointer rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                                            disabled={quantity >= product.stock || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                        >
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>

                                    <p className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] md:text-base">
                                        PHP {calculatedPrice}
                                    </p>
                                </>
                            )}

                            <div className="flex flex-wrap gap-3 md:gap-4">
                                {(canManage && user) ? (
                                    <>
                                        <Link
                                            to={`/products/edit/${product._id}`}
                                            className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)] md:text-sm"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>Edit Product
                                        </Link>

                                        <button
                                            type="button"
                                            className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[rgb(200,100,100)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[rgb(180,80,80)] md:text-sm"
                                            onClick={handleDelete}
                                        >
                                            <i className="fa-solid fa-trash"></i>Delete Product
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[color:var(--main-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:bg-[#ddd] disabled:opacity-60 md:text-sm"
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
                                        className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[color:var(--light-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
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