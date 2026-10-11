export default function ErrorNote({ error, onRetry }) {
    if (!error) return null;
    const message = typeof error === 'string' ? error : error.message;

    return (
        <section
            className="flex w-full flex-wrap items-center justify-center gap-2 rounded-[10px] bg-[rgb(255,138,138)] px-4 py-3"
            role="alert"
        >
            <p className="text-center font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--dark-color)] md:text-sm">
                {message}
            </p>

            {onRetry && (
                <button
                    type="button"
                    className="cursor-pointer rounded-md border border-transparent bg-[color:var(--light-color)] px-3 py-1.5 font-[family-name:var(--body-font)] text-xs font-bold text-[rgb(255,113,113)] transition-colors duration-200 ease-in-out hover:bg-[#ddd] md:text-sm"
                    onClick={onRetry}
                >
                    Try again
                </button>
            )}
        </section>
    );
}