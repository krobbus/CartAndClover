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
            <EmptyState
                title="Product Not Found"
                action={
                    <button type="button" onClick={() => navigate('/products')}>
                        Back to Products
                    </button>
                }
            />
        );
    }

    const calculatedPrice = ((product?.price || 0) * quantity).toFixed(2);

    return (
        <div className="productViewContainer">
            <button type="button" className="backBtn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <header>
                <h1>{product.name}</h1>
            </header>

            <ErrorNote error={error} onRetry={loadProduct} />

            {product && (
                <div className="productDetailCard">
                    <div className="productImageWrapper">
                        <img
                            src={placeholderDisplay(product.category)}
                            alt={product.name}
                            className="productDetailImage"
                        />
                    </div>

                    <div className="productDetailInfo">
                        <p className="productDescription">{product.description || 'No description provided.'}</p>

                        <div>
                            <div className="detailWrapper">
                                <span className="priceHeading">Original Price</span>
                                <span className="productPrice">PHP {product.price}</span>
                            </div>

                            <div className="detailWrapper">
                                <span className="categoryHeading">Category</span>
                                <span className="categoryBadge">{capitalizeWords(product.category || 'General')}</span>
                            </div>
                            
                            <div className="detailWrapper">
                                <span className="statusHeading">Stock</span>
                                <p className="productStatus">
                                    {product.stock > 0 ? `(${product.stock}) items in stock` : 'Out of Stock'}
                                </p>
                            </div>
                        </div>

                        <div className="productActionsContainer">
                            {(!canManage && user) && (
                                <>
                                    <div className="productItemQuantity">
                                        <button
                                            type="button"
                                            className="minusOne"
                                            disabled={quantity <= 1 || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        >
                                            <i className="fa-solid fa-minus"></i>
                                        </button>

                                        <input 
                                            className="counter"
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
                                            className="plusOne"
                                            disabled={quantity >= product.stock || adding || buyingNow}
                                            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                                        >
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>

                                    <p className="calculatedPrice">PHP {calculatedPrice}</p>
                                </>
                            )}

                            <div className="productActions">
                                {(canManage && user) ? (
                                    <>
                                        <Link to={`/products/edit/${product._id}`} className="editBtn">
                                            <i className="fa-solid fa-pen-to-square"></i>Edit Product
                                        </Link>
                                        
                                        <button type="button" className="deleteBtn" onClick={handleDelete}>
                                            <i className="fa-solid fa-trash"></i>Delete Product
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="addCartBtn"
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
                                        className="buyNowBtn"
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