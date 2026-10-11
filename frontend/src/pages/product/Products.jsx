import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import EmptyState from '../../components/EmptyState';
import { capitalizeWords, placeholderDisplay } from '../../utils.js';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user, canManage } = useAuth();
    const navigate = useNavigate();

    const categories = ['All', 'General', 'Clothing', 'Electronics', 'Home & Living', 'Food', 'Accessories'];
    const currentUserId = user?._id || user?.id;

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let data;

            try {
                data = await api.get('/products/me');
            } catch {
                data = await api.get('/products');
            }

            setProducts(data);
        } catch (err) {
            setError(err?.message || 'Failed to load your products list.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (canManage) loadProducts();
    }, [canManage, loadProducts]);

    if (!canManage) {
        return (
            <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-5 sm:p-8 md:p-16">
                <ErrorNote error="Unauthorized: Only sellers or admins can manage products." />
            </div>
        );
    }

    const myProducts = products.filter((product) => {
        const sellerId =
            product.sellerId ||
            product.userId ||
            product.seller?._id ||
            product.seller ||
            product.createdBy;

        return String(sellerId) === String(currentUserId);
    });

    const searchMatches = myProducts.filter((product) => {
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

    const soldOutCount = myProducts.filter((product) => !(product.stock > 0)).length;
    const lowStockCount = myProducts.filter((product) => product.stock > 0 && product.stock <= 5).length;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-6 p-5 sm:p-8 md:p-16">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-[family-name:var(--heading-font)] text-3xl font-bold text-[color:var(--tertiary-color)] md:text-4xl">
                            Your Products
                        </h1>
                        <p className="font-[family-name:var(--body-font)] text-sm tracking-[0.5px] text-[color:var(--dark-color)] md:text-base">
                            Manage inventory and view products you are selling
                        </p>
                    </div>

                    {!loading && myProducts.length > 0 && (
                        <div className="flex flex-wrap gap-2 font-[family-name:var(--body-font)] text-xs font-bold">
                            <span className="rounded-full border border-[color:var(--main-color)] bg-white px-3 py-1 text-[color:var(--tertiary-color)]">
                                {myProducts.length} {myProducts.length === 1 ? 'listing' : 'listings'}
                            </span>

                            {lowStockCount > 0 && (
                                <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-[#92400e]">
                                    {lowStockCount} running low
                                </span>
                            )}

                            {soldOutCount > 0 && (
                                <span className="rounded-full bg-[#fee2e2] px-3 py-1 text-[#991b1b]">
                                    {soldOutCount} sold out
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <Link
                    to="/products/new"
                    className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[color:var(--tertiary-color)] px-5 py-2.5 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)] sm:self-auto md:px-6 md:py-3 md:text-sm"
                >
                    <i className="fa-solid fa-plus"></i> Add New Product
                </Link>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <div className="flex flex-col gap-4">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[color:var(--secondary-color)] md:left-5"></i>
                    <input
                        type="text"
                        className="w-full rounded-full border-2 border-[color:var(--main-color)] bg-white py-2.5 pl-11 pr-4 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out placeholder:text-[#8a8a8a] focus:border-[color:var(--tertiary-color)] focus:ring-4 focus:ring-[rgba(164,223,204,0.5)] md:py-3 md:pl-12 md:pr-6 md:text-base"
                        placeholder="Search your products..."
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
                <Loading label="Fetching your products..." />
            ) : filteredProducts.length === 0 ? (
                <EmptyState
                    title={
                        myProducts.length === 0
                            ? "You haven't listed any products for sale yet."
                            : 'No matching products found.'
                    }
                    action={<Link to="/products/new">Create Product Listing</Link>}
                />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] md:gap-6">
                    {filteredProducts.map((product) => {
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

                                    <Link
                                        to={`/products/edit/${product._id}`}
                                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-[color:var(--tertiary-color)] px-3 py-2 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:border-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--tertiary-color)]"
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i>Edit
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}