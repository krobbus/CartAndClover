export default function Loading({ label = 'Loading' }) {
    return (
        <div
            className="flex min-h-[8rem] items-center justify-center gap-2.5 font-[family-name:var(--body-font)] text-xs text-[color:var(--tertiary-color)] md:text-sm"
            role="status"
        >
            <span
                className="h-4 w-4 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(42,107,92,0.2)] border-t-[color:var(--tertiary-color)]"
                aria-hidden="true"
            />
            <span>{label}…</span>
        </div>
    );
}