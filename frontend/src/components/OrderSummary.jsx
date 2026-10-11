import { useState } from 'react';
import OrderModal from './OrderModal';
import { placeholderDisplay } from '../utils.js';

const MAX_THUMBS = 4;

export default function OrderItemsSummary({ items = [], totalAmount, title }) {
    const [open, setOpen] = useState(false);

    const entries = items.map((item, index) => {
        const product = item.product && typeof item.product === 'object' ? item.product : item;

        return {
            key: item._id || item.id || product._id || index,
            name: product.name || item.name || 'Product Item',
            category: product.category || item.category || 'General',
            quantity: Number(item.quantity || 1),
        };
    });

    const totalPieces = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const thumbs = entries.slice(0, MAX_THUMBS);
    const hiddenCount = entries.length - thumbs.length;

    const previewNames = entries.slice(0, 2).map((entry) => entry.name).join(', ');
    const previewMore = entries.length > 2 ? ` and ${entries.length - 2} more` : '';

    return (
        <>
            <div className="flex flex-col gap-4 rounded-[14px] bg-[color:var(--secondary-color)] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                {entries.length === 0 ? (
                    <p className="font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] md:text-base">
                        No items in this order.
                    </p>
                ) : (
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex shrink-0 -space-x-3">
                            {thumbs.map((entry) => (
                                <img
                                    key={entry.key}
                                    src={placeholderDisplay(entry.category)}
                                    alt={entry.name}
                                    className="h-12 w-12 rounded-full border-2 border-[color:var(--main-color)] object-cover sm:h-14 sm:w-14"
                                />
                            ))}

                            {hiddenCount > 0 && (
                                <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[color:var(--main-color)] bg-[color:var(--light-color)] font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--tertiary-color)] sm:h-14 sm:w-14 sm:text-sm">
                                    +{hiddenCount}
                                </span>
                            )}
                        </div>

                        <div className="flex min-w-0 flex-col gap-0.5">
                            <p className="font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] tracking-wider md:text-base">
                                {entries.length} {entries.length === 1 ? 'product' : 'products'} ({totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'})
                            </p>
                            <p className="truncate font-[family-name:var(--body-font)] text-xs text-[#333] md:text-sm">
                                {previewNames}{previewMore}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[color:var(--tertiary-color)] px-4 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[color:var(--dark-color)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto md:text-sm"
                    disabled={entries.length === 0}
                    onClick={() => setOpen(true)}
                >
                    <i className="fa-solid fa-list"></i>View All Items
                </button>
            </div>

            <OrderModal
                open={open}
                onClose={() => setOpen(false)}
                items={items}
                totalAmount={totalAmount}
                title={title}
            />
        </>
    );
}