import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Loading from '../../components/Loading';
import ErrorNote from '../../components/ErrorNote';
import { capitalizeWords } from '../../utils.js';

export default function ProductForm() {
    const { productId } = useParams();
    const isEdit = Boolean(productId);
    const { canManage } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'General',
        stock: 0,
    });

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const categories = ['Clothing', 'Electronics', 'Home & Living', 'Food', 'Accessories', 'General'];

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            api.get(`/products/${productId}`)
                .then((data) => {
                    setFormData({
                        name: data.name || '',
                        description: data.description || '',
                        price: data.price || '',
                        category: data.category || 'General',
                        stock: data.stock ?? 0,
                    });
                })
                .catch((err) => setError(err?.message || 'Failed to fetch product details.'))
                .finally(() => setLoading(false));
        }
    }, [productId, isEdit]);

    if (!canManage) {
        return (
            <div className="productFormContainer">
                <ErrorNote error="Unauthorized: Only sellers or admins can manage products." />
            </div>
        );
    }

    if (loading) return <Loading label="Loading product form..." />;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const placeholder = '/placeholder.png';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
            };

            if (isEdit) {
                await api.put(`/products/${productId}`, payload);
            } else {
                await api.post('/products', payload);
            }

            navigate('/products');
        } catch (err) {
            setError(err?.message || 'Failed to save product. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="productFormContainer">
            <button type="button" className="backBtn" onClick={() => navigate(-1)}>
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <form onSubmit={handleSubmit}>
                <header className="span">
                    <h2>{isEdit ? 'Edit Product' : 'Create New Product'}</h2>
                    <p>
                        {isEdit
                            ? 'Update the details, pricing, or inventory for this product listing.'
                            : 'Fill in the information below to publish a new item to the marketplace.'
                        }
                    </p>
                </header>
                
                <div className="span">
                    <ErrorNote error={error} />
                </div>
                
                <div className="inputWrapper">
                    <label htmlFor="name">Product Name <span className="requiredMarker">*</span></label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Leather Jacket"
                    />    
                </div>
                
                <div className="inputWrapper">
                    <label htmlFor="category">Category <span className="requiredMarker">*</span></label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange}>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {capitalizeWords(cat)}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="inputWrapper">
                    <label htmlFor="price">Price (PHP) <span className="requiredMarker">*</span></label>
                    <input
                        id="price"
                        placeholder="0.00"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="inputWrapper">
                    <label htmlFor="stockQuantity">Stock Quantity <span className="requiredMarker">*</span></label>
                    <input
                        id="stockQuantity"
                        name="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                    />    
                </div>
                
                <div className="inputWrapper span">
                    <label id="description">Description (Optional)</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide details regarding the product..."
                    />
                </div>

                <div className="formActions span">
                    <button type="submit" className="submitBtn" disabled={submitting}>
                        {submitting ? <i className="fa-solid fa-floppy-disk"></i> : 
                            isEdit ? <i className="fa-solid fa-pen-to-square"></i> : <i className="fa-solid fa-square-plus"></i>
                        } 
                        {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    
                    <button type="button" className="cancelBtn" onClick={() => navigate(-1)}>
                        <i className="fa-solid fa-xmark"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}