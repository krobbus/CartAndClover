import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { capitalizeWords, placeholderDisplay } from '../utils.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function OrderItemsModal({ open, onClose, items = [], totalAmount, title = 'Ordered Items' }) {
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const titleId = useId();

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        const root = document.documentElement;
        const body = document.body;
        const previous = {
            rootOverflow: root.style.overflow,
            bodyOverflow: body.style.overflow,
            bodyPaddingRight: body.style.paddingRight,
        };
        const previouslyFocused = document.activeElement;

        // Measure the scrollbar before hiding it, so the page doesn't jump sideways.
        const scrollbarWidth = window.innerWidth - root.clientWidth;
        const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight) || 0;

        root.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;

        panelRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current?.();
                return;
            }

            if (e.key !== 'Tab' || !panelRef.current) return;

            const focusables = panelRef.current.querySelectorAll(FOCUSABLE);
            if (focusables.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && (active === first || active === panelRef.current)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            root.style.overflow = previous.rootOverflow;
            body.style.overflow = previous.bodyOverflow;
            body.style.paddingRight = previous.bodyPaddingRight;
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
        };
    }, [open]);

    if (!open) return null;

    const rows = items.map((item, index) => {
        const product = item.product && typeof item.product === 'object' ? item.product : item;
        const unitPrice = Number(item.price || product.price || 0);
        const quantity = Number(item.quantity || 1);

        return {
            key: item._id || item.id || product._id || index,
            name: product.name || item.name || 'Product Item',
            category: product.category || item.category || 'General',
            unitPrice,
            quantity,
            subtotal: unitPrice * quantity,
        };
    });

    const totalPieces = rows.reduce((sum, row) => sum + row.quantity, 0);
    const computedTotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
    const grandTotal = Number(totalAmount ?? computedTotal) || 0;

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-[rgba(0,0,0,0.55)] transition-opacity duration-200 starting:opacity-0 sm:items-center sm:p-6"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[20px] bg-[color:var(--light-color)] text-[color:var(--dark-color)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] outline-none transition duration-200 starting:translate-y-6 starting:opacity-0 sm:max-h-[85dvh] sm:max-w-2xl sm:rounded-[20px]"
            >
                <header className="flex items-start justify-between gap-4 border-b-2 border-[rgba(0,0,0,0.08)] px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 flex-col">
                        <h3
                            id={titleId}
                            className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] sm:text-3xl"
                        >
                            {title} ({rows.length})
                        </h3>
                        <p className="font-[family-name:var(--body-font)] text-xs text-[#555] sm:text-sm">
                            {totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'} in total
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-[color:var(--main-color)] text-[color:var(--dark-color)] transition duration-200 ease-in-out hover:bg-[color:var(--tertiary-color)] hover:text-[color:var(--light-color)]"
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                    {rows.length === 0 ? (
                        <p className="font-[family-name:var(--body-font)] text-sm text-[#444] sm:text-base">
                            No items to show.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {rows.map((row) => (
                                <li
                                    key={row.key}
                                    className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 rounded-[14px] bg-[color:var(--main-color)] p-3 sm:grid-cols-[auto_1fr_auto] sm:gap-x-4 sm:p-4"
                                >
                                    <img
                                        src={placeholderDisplay(row.category)}
                                        alt={row.name}
                                        className="h-16 w-16 shrink-0 rounded-[10px] object-cover sm:h-20 sm:w-20"
                                    />

                                    <div className="flex min-w-0 flex-col gap-1">
                                        <h4 className="line-clamp-2 font-[family-name:var(--body-font)] text-sm font-bold text-[color:var(--dark-color)] sm:text-base">
                                            {row.name}
                                        </h4>

                                        <span className="w-fit rounded-full bg-[rgba(255,255,255,0.55)] px-2 py-0.5 font-[family-name:var(--body-font)] text-[10px] font-bold text-[color:var(--tertiary-color)] sm:text-xs">
                                            {capitalizeWords(row.category)}
                                        </span>

                                        <p className="flex flex-wrap items-center gap-x-2 font-[family-name:var(--body-font)] text-xs text-[#444] sm:text-sm">
                                            <span>PHP {row.unitPrice.toFixed(2)} each</span>
                                            <span aria-hidden="true">•</span>
                                            <span>Qty: <strong>{row.quantity}</strong></span>
                                        </p>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between border-t-2 border-dashed border-[rgba(0,0,0,0.15)] pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:border-t-0 sm:pt-0">
                                        <span className="font-[family-name:var(--body-font)] text-xs uppercase tracking-[0.5px] text-[#555]">
                                            Subtotal
                                        </span>
                                        <span className="font-[family-name:var(--body-font)] text-base font-bold text-[color:var(--dark-color)] sm:text-xl">
                                            PHP {row.subtotal.toFixed(2)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <footer className="flex flex-col gap-3 border-t-2 border-[rgba(0,0,0,0.08)] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-4">
                    <p className="flex items-baseline justify-between gap-3 font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] sm:justify-start sm:text-base">
                        <span>Total Amount:</span>
                        <strong className="text-lg sm:text-2xl">PHP {grandTotal.toFixed(2)}</strong>
                    </p>

                    <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[color:var(--tertiary-color)] px-6 py-3 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}