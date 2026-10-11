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

    const searchMatches = productsList.filter((product) => {
        return (
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const filteredProducts = searchMatches.filter((product) => {
        return selectedCategory === 'All' || product.category === selectedCategory;
    });

    const categoryCount = (category) => {
        return category === 'All'
            ? searchMatches.length
            : searchMatches.filter((product) => product.category === category).length;
    };

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
                className="relative flex min-h-[100dvh] flex-col items-start justify-center gap-3 bg-cover bg-bottom bg-no-repeat px-5 py-16 sm:px-10 md:px-16"
                style={{
                    backgroundImage: `linear-gradient(to right, #000 20%, rgba(255, 255, 255, 0.1)), url(${headerBanner})`,
                }}
            >
                <h1 className="max-w-3xl font-[family-name:var(--heading-font)] text-4xl font-bold leading-[1.05] text-[color:var(--main-color)] sm:text-6xl md:text-7xl">
                    Welcome to Cart & Clover
                </h1>
                <p className="max-w-[320px] font-[family-name:var(--body-font)] text-sm leading-relaxed tracking-[0.5px] text-[color:var(--light-color)] sm:max-w-md md:text-base">
                    Discover everyday essentials and exclusive collections from all sellers.
                </p>

                <button
                    type="button"
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[color:var(--main-color)] bg-[color:var(--main-color)] px-6 py-3 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:bg-transparent hover:text-[color:var(--main-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--main-color)] md:px-8 md:text-base"
                    onClick={scrollToCatalog}
                >
                    Explore Catalog <i className="fa-solid fa-chevron-down"></i>
                </button>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <section
                className="flex min-h-[100dvh] flex-col justify-start gap-6 p-5 sm:p-8 md:p-16"
                ref={catalogRef}
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <h2 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--tertiary-color)] md:text-4xl">
                        Explore Marketplace
                    </h2>

                    {!loading && (
                        <p className="font-[family-name:var(--body-font)] text-xs text-[#555] md:text-sm">
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[color:var(--secondary-color)] md:left-5"></i>
                        <input
                            type="text"
                            className="w-full rounded-full border-2 border-[color:var(--main-color)] bg-white py-2.5 pl-11 pr-4 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out placeholder:text-[#8a8a8a] focus:border-[color:var(--tertiary-color)] focus:ring-4 focus:ring-[rgba(164,223,204,0.5)] md:py-3 md:pl-12 md:pr-6 md:text-base"
                            placeholder="Search all products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                        {categories.map((category) => {
                            const isActive = selectedCategory === category;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    aria-pressed={isActive}
                                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] md:py-2 md:text-sm ${
                                        isActive
                                            ? 'border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] text-[color:var(--light-color)]'
                                            : 'border-[color:var(--main-color)] bg-white text-[color:var(--tertiary-color)] hover:border-[color:var(--secondary-color)] hover:bg-[rgba(164,223,204,0.35)]'
                                    }`}
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {capitalizeWords(category)}
                                    <span
                                        className={`rounded-full px-1.5 text-[10px] font-bold leading-4 md:text-xs ${
                                            isActive
                                                ? 'bg-[rgba(255,255,255,0.25)] text-[color:var(--light-color)]'
                                                : 'bg-[color:var(--light-color)] text-[color:var(--tertiary-color)]'
                                        }`}
                                    >
                                        {categoryCount(category)}
                                    </span>
                                </button>
                            );
                        })}
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
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                        {filteredProducts.map((product) => {
                            const isInCart = cartProductIds.includes(product._id);
                            const isSoldOut = !(product.stock > 0);
                            const isLowStock = !isSoldOut && product.stock <= 5;

                            return (
                                <article
                                    key={product._id}
                                    className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-[color:var(--main-color)] bg-white transition duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(84,146,125,0.25)]"
                                >
                                    <Link
                                        to={`/products/${product._id}`}
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        className="relative block aspect-[4/3] overflow-hidden bg-[color:var(--main-color)]"
                                    >
                                        <img
                                            src={placeholderDisplay(product.category)}
                                            alt={product.name}
                                            className={`h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-105 ${
                                                isSoldOut ? 'opacity-50 grayscale' : ''
                                            }`}
                                        />

                                        <span className="absolute left-2.5 top-2.5 rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-1 font-[family-name:var(--body-font)] text-[10px] font-bold leading-none text-[color:var(--tertiary-color)] md:text-xs">
                                            {capitalizeWords(product.category || 'General')}
                                        </span>
                                    </Link>

                                    <div className="flex flex-1 flex-col gap-1 p-3 md:gap-1.5 md:p-4">
                                        <h3 className="line-clamp-2 font-[family-name:var(--heading-font)] text-lg font-bold leading-tight text-[color:var(--dark-color)] md:text-xl">
                                            {product.name}
                                        </h3>

                                        {product.description && (
                                            <p className="line-clamp-2 font-[family-name:var(--body-font)] text-xs leading-relaxed text-[#555] max-sm:hidden md:text-sm">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 pt-2">
                                            <p className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] md:text-lg">
                                                PHP {product.price?.toFixed(2)}
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

                                    <div className="flex flex-col gap-2 px-3 pb-3 md:flex-row md:px-4 md:pb-4">
                                        <button
                                            type="button"
                                            className="flex-1 cursor-pointer rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-transparent px-3 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                                            onClick={() => navigate(`/products/${product._id}`)}
                                        >
                                            View Details
                                        </button>

                                        {(!canManage && user) && (
                                            <button
                                                type="button"
                                                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 cursor-pointer rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-3 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:border-[color:var(--secondary-color)] hover:enabled:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] disabled:cursor-not-allowed disabled:border-[#ddd] disabled:bg-[#ddd] disabled:text-[#777]"
                                                disabled={addingProductId === product._id || product.stock <= 0 || isInCart}
                                                onClick={() => handleAddToCart(product._id)}
                                            >
                                                <i className="fa-solid fa-cart-shopping"></i> {addingProductId === product._id ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
                                            </button>
                                        )}

                                        {(canManage && user) && (
                                            <Link
                                                to={`/products/edit/${product._id}`}
                                                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-3 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                                            >
                                               <i className="fa-solid fa-pen-to-square"></i> Edit
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}