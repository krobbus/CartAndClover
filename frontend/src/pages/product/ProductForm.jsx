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
            <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
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
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <button
                type="button"
                className="mb-6 flex cursor-pointer items-center justify-start gap-2 self-start bg-transparent font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] transition-colors duration-200 ease-in-out hover:text-[color:var(--secondary-color)] md:mb-8 md:text-base"
                onClick={() => navigate(-1)}
            >
                <i className="fa-solid fa-chevron-left"></i> Back
            </button>

            <form
                onSubmit={handleSubmit}
                className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:px-16"
            >
                <header className="col-span-full flex flex-col justify-start">
                    <h2 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                        {isEdit ? 'Edit Product' : 'Create New Product'}
                    </h2>
                    <p className="font-[family-name:var(--body-font)] text-sm tracking-[1px] md:text-base">
                        {isEdit
                            ? 'Update the details, pricing, or inventory for this product listing.'
                            : 'Fill in the information below to publish a new item to the marketplace.'
                        }
                    </p>
                </header>

                <div className="col-span-full">
                    <ErrorNote error={error} />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="name"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Product Name <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Leather Jacket"
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="category"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Category <span className="text-[#ff7171]">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        value={formData.category}
                        onChange={handleChange}
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {capitalizeWords(cat)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="price"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Price (PHP) <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="stockQuantity"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Stock Quantity <span className="text-[#ff7171]">*</span>
                    </label>
                    <input
                        id="stockQuantity"
                        name="stock"
                        type="number"
                        min="0"
                        className="w-full rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="col-span-full flex min-w-0 flex-col gap-2">
                    <label
                        htmlFor="description"
                        className="flex gap-1 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] md:text-base"
                    >
                        Description (Optional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows="4"
                        className="min-h-[100px] w-full resize-y rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-3 font-[family-name:var(--body-font)] text-sm leading-normal text-[color:var(--dark-color)] outline-none transition duration-200 ease-in-out focus:border-[color:var(--tertiary-color)] md:text-base"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide details regarding the product..."
                    />
                </div>

                <div className="col-span-full mt-4 flex justify-center gap-4 md:justify-end">
                    <button
                        type="submit"
                        className="flex cursor-pointer items-center gap-2 rounded-[10px] border-2 border-transparent bg-[color:var(--tertiary-color)] px-4 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--secondary-color)] disabled:cursor-not-allowed disabled:bg-[#ddd] disabled:opacity-60 md:py-3 md:text-base"
                        disabled={submitting}
                    >
                        {submitting ? <i className="fa-solid fa-floppy-disk"></i> :
                            isEdit ? <i className="fa-solid fa-pen-to-square"></i> : <i className="fa-solid fa-square-plus"></i>
                        }
                        {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>

                    <button
                        type="button"
                        className="flex cursor-pointer items-center gap-2 rounded-[10px] border-2 border-[color:var(--tertiary-color)] bg-transparent px-4 py-2.5 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--tertiary-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)] md:py-3 md:text-base"
                        onClick={() => navigate(-1)}
                    >
                        <i className="fa-solid fa-xmark"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}