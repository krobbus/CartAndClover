import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';
import { capitalizeWords, placeholderDisplay} from '../utils.js';

export default function Marketplace() {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartProductIds, setCartProductIds] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [addingProductId, setAddingProductId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, canManage } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const catalogRef = useRef(null);

    const categories = ['All', 'General', 'Clothing', 'Electronics', 'Home & Living', 'Food', 'Accessories'];

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [productsRes, cartRes] = await Promise.all([
                api.get('/products'),
                user ? api.get('/cart').catch(() => null) : Promise.resolve(null),
            ]);

            const productsList = Array.isArray(productsRes)
                ? productsRes
                : productsRes?.products || productsRes?.data || [];
            setProducts(productsList);

            if (cartRes) {
                const items = cartRes.items || cartRes || [];
                const ids = items.map((item) => String(item.product?._id || item.productId || item.product || item._id));
                setCartProductIds(ids);
            } else {
                setCartProductIds([]);
            }
        } catch (err) {
            setError(err?.message || 'Failed to fetch catalog. Please try again.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const scrollToCatalog = () => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const productsList = Array.isArray(products) ? products : [];

    const filteredProducts = productsList.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddToCart = async (productId) => {
        if (!user) {
            return navigate('/login', { state: { from: location } });
        }

        setAddingProductId(productId);
        setError(null);

        try {
            await api.post('/cart/add', {
                userId: user._id || user.id,
                productId,
                quantity: 1,
            });
            setCartProductIds((prev) => [...prev, productId]);
            navigate('/products/add-to-cart', { state: { selectedProductId: productId } });
        } catch (err) {
            setError(err?.message || 'Failed to add product to cart.');
        } finally {
            setAddingProductId(null);
        }
    };

    return (
        <div className="marketplaceContainer">
            <header>
                <h1>Welcome to Cart & Clover</h1>
                <p>Discover everyday essentials and exclusive collections from all sellers.</p>

                <button type="button" className="scrollBtn" onClick={scrollToCatalog}>
                    Explore Catalog <i className="fa-solid fa-chevron-down"></i>
                </button>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <section className="catalogSection" ref={catalogRef}>
                <h2>Explore Marketplace</h2>

                <div className="filterBar">
                    <input
                        type="text"
                        className="searchInput"
                        placeholder="Search all products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className="categoryPills">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={`pill ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {capitalizeWords(category)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <Loading label="Loading marketplace..." />
                ) : filteredProducts.length === 0 ? (
                    <EmptyState
                        title="No products found matching your criteria."
                        action={canManage && <Link to="/products/new">Add a Product</Link>}
                    />
                ) : (
                    <div className="productGrid">
                        {filteredProducts.map((product) => {
                            const isInCart = cartProductIds.includes(product._id);
                            
                            return (
                                <div key={product._id} className="productCard">
                                    <div className="productHeader">
                                        <h3>{product.name}</h3>
                                        <p className="categoryTag">{capitalizeWords(product.category || 'General')}</p>
                                    </div>

                                    <div className="productImageWrapper">
                                        <p className="price">PHP {product.price?.toFixed(2)}</p>
                                        
                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className="productDetailImage"
                                        />

                                        <p className="stockStatus">
                                            {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                                        </p>
                                    </div>

                                    <div className="cardActions">
                                        <button
                                            type="button"
                                            className="viewBtn"
                                            onClick={() => navigate(`/products/${product._id}`)}
                                        >
                                            View Details
                                        </button>

                                        {(!canManage && user) && (
                                            <button
                                                type="button"
                                                className="addCartBtn"
                                                disabled={addingProductId === product._id || product.stock <= 0 || isInCart}
                                                onClick={() => handleAddToCart(product._id)}
                                            >
                                                {addingProductId === product._id ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
                                            </button>
                                        )}

                                        {(canManage && user) && <Link to={`/products/edit/${product._id}`} className="editBtn">Edit Product</Link>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}