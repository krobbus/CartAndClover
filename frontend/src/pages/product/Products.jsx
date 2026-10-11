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
            <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
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

    const filteredProducts = myProducts.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <header className="flex items-center justify-between gap-4 pb-8">
                <div>
                    <h1 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                        Your Products
                    </h1>
                    <p className="max-w-[200px] pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--dark-color)] md:max-w-none md:text-base">
                        Manage inventory and view products you are selling
                    </p>
                </div>

                <Link
                    to="/products/new"
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[color:var(--secondary-color)] px-4 py-2.5 font-[family-name:var(--body-font)] text-xs font-semibold text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:bg-[color:var(--main-color)] hover:text-[color:var(--tertiary-color)] md:text-sm"
                >
                    <i className="fa-solid fa-plus"></i> Add New Product
                </Link>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <div className="flex flex-col gap-4 md:gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-2.5 font-[family-name:var(--body-font)] text-sm md:px-8 md:py-3 md:text-base"
                    placeholder="Search your products..."
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
                <div className="my-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fit,minmax(250px,300px))]">
                    {filteredProducts.map((product) => (
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

                                <Link
                                    to={`/products/edit/${product._id}`}
                                    className="cursor-pointer rounded-[10px] bg-[color:var(--light-color)] px-4 py-2.5 text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)]"
                                >
                                    Edit Product
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}