import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';
import { capitalizeWords, placeholderDisplay} from '../utils.js';
import headerBanner from '../assets/headerBanner.png';

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
    }, [user]);

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
        <div className="h-auto w-full">
            <header
                className="relative flex min-h-[100dvh] flex-col items-start justify-center gap-2 bg-cover bg-bottom bg-no-repeat px-4 py-16 sm:px-8"
                style={{
                    backgroundImage: `linear-gradient(to right, #000 20%, rgba(255, 255, 255, 0.1)), url(${headerBanner})`,
                }}
            >
                <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--main-color)] sm:text-5xl md:text-6xl">
                    Welcome to Cart & Clover
                </h1>
                <p className="max-w-[300px] pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--light-color)] md:max-w-none md:text-base">
                    Discover everyday essentials and exclusive collections from all sellers.
                </p>

                <button
                    type="button"
                    className="absolute bottom-[15%] left-[20%] right-[20%] cursor-pointer whitespace-nowrap rounded-[30px] border-[2.5px] border-[color:var(--main-color)] bg-transparent p-2.5 font-[family-name:var(--body-font)] text-sm text-[color:var(--main-color)] transition duration-200 ease-in-out drop-shadow-[0_0_10px_var(--main-color)] md:left-[35%] md:right-[35%] md:border-4 md:p-3 md:text-base md:drop-shadow-none md:hover:drop-shadow-[0_0_10px_var(--main-color)]"
                    onClick={scrollToCatalog}
                >
                    Explore Catalog <i className="fa-solid fa-chevron-down"></i>
                </button>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <section
                className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16"
                ref={catalogRef}
            >
                <h2 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    Explore Marketplace
                </h2>

                <div className="flex flex-col gap-4 md:gap-2">
                    <input
                        type="text"
                        className="flex-1 rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-2.5 font-[family-name:var(--body-font)] text-sm md:px-8 md:py-3 md:text-base"
                        placeholder="Search all products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={`cursor-pointer rounded-[10px] border-2 border-[color:var(--secondary-color)] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)] md:px-4 md:py-2 md:text-sm ${
                                    selectedCategory === category
                                        ? 'bg-[color:var(--secondary-color)] text-[color:var(--light-color)]'
                                        : 'bg-transparent text-[color:var(--secondary-color)]'
                                }`}
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
                    <div className="my-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fit,minmax(250px,300px))]">
                        {filteredProducts.map((product) => {
                            const isInCart = cartProductIds.includes(product._id);

                            return (
                                <div
                                    key={product._id}
                                    className="min-w-0 rounded-[20px] bg-[color:var(--secondary-color)] p-3 md:p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-x-2 pb-3 md:pb-4">
                                        <h3 className="font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] md:text-base">
                                            {product.name}
                                        </h3>
                                        <p className="font-[family-name:var(--body-font)] text-xs text-[#444] md:text-base">
                                            {capitalizeWords(product.category || 'General')}
                                        </p>
                                    </div>

                                    <div className="relative aspect-square">
                                        <p className="absolute right-0 top-0 rounded-bl-[20px] bg-[color:var(--secondary-color)] pb-2 pl-4 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] md:text-base">
                                            PHP {product.price?.toFixed(2)}
                                        </p>

                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className="h-full w-full rounded-[20px] object-cover"
                                        />

                                        <p className="absolute inset-x-2.5 bottom-2.5 rounded-[20px] bg-[color:var(--secondary-color)] px-2 py-1 text-center font-[family-name:var(--body-font)] text-[10px] font-bold leading-tight text-[color:var(--light-color)] md:px-8 md:py-0.5 md:text-xs">
                                            {product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock'}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex flex-col justify-center gap-2 md:mt-4 md:flex-row">
                                        <button
                                            type="button"
                                            className="cursor-pointer rounded-[10px] bg-[color:var(--tertiary-color)] px-4 py-2.5 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[color:var(--main-color)] hover:text-[color:var(--dark-color)]"
                                            onClick={() => navigate(`/products/${product._id}`)}
                                        >
                                            View Details
                                        </button>

                                        {(!canManage && user) && (
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-[10px] bg-[color:var(--light-color)] px-4 py-2.5 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--tertiary-color)] hover:enabled:text-[color:var(--light-color)] disabled:cursor-not-allowed disabled:bg-[#ddd] disabled:opacity-60"
                                                disabled={addingProductId === product._id || product.stock <= 0 || isInCart}
                                                onClick={() => handleAddToCart(product._id)}
                                            >
                                                {addingProductId === product._id ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
                                            </button>
                                        )}

                                        {(canManage && user) && (
                                            <Link
                                                to={`/products/edit/${product._id}`}
                                                className="flex cursor-pointer justify-center rounded-[10px] bg-[color:var(--light-color)] px-4 py-2.5 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)]"
                                            >
                                                Edit Product
                                            </Link>
                                        )}
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