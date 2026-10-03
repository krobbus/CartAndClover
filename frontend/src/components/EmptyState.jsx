export default function EmptyState({ title, action, icon }) {
    return (
        <section className="emptyState">
            <div className="emptyStateVisual">
                {icon || (
                    <svg
                        className="emptyCartIcon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="8" cy="20" r="1" />
                        <circle cx="19" cy="20" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        <line x1="10" y1="10" x2="16" y2="10" />
                    </svg>
                )}
            </div>

            {title && <p className="title">{title}</p>}
            {action && <div className="action">{action}</div>}
        </section>
    );
}