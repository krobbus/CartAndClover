import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';
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
    const location = useLocation();

    const categories = ['All', 'General', 'Clothing', 'Electronics', 'Home & Living', 'Food', 'Accessories'];
    const currentUserId = user?._id || user?.id;

    if (!canManage) {
        return (
            <div className="productsContainer">
                <ErrorNote error="Unauthorized: Only sellers or admins can manage products." />
            </div>
        );
    }

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
        loadProducts();
    }, [loadProducts]);

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
        <div className="productsContainer">
            <header>
                <div>
                    <h1>Your Products</h1>
                    <p>Manage inventory and view products you are selling</p>
                </div>

                <Link to="/products/new" className="addBtn"><i className="fa-solid fa-plus"></i> Add New Product</Link>
            </header>

            <ErrorNote error={error} onRetry={loadProducts} />

            <div className="filterBar">
                <input
                    type="text"
                    className="searchInput"
                    placeholder="Search your products..."
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
                <div className="productGrid">
                    {filteredProducts.map((product) => (
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

                                <Link to={`/products/edit/${product._id}`} className="editBtn">Edit Product</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}