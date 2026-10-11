export default function EmptyState({ title, action, icon }) {
    return (
        <section className="mx-auto my-8 flex min-h-[280px] w-full flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-[color:var(--secondary-color)] bg-[color:var(--main-color)] p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,0,0,0.04)] text-[color:var(--tertiary-color)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:h-20 md:w-20">
                {icon || (
                    <svg
                        className="h-6 w-6 md:h-10 md:w-10"
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

            {title && (
                <p className="text-center font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    {title}
                </p>
            )}

            {action && (
                <div className="[&_a]:inline-block [&_a]:rounded-lg [&_a]:bg-[color:var(--secondary-color)] [&_a]:px-6 [&_a]:py-3 [&_a]:font-[family-name:var(--body-font)] [&_a]:text-sm [&_a]:font-semibold [&_a]:text-[color:var(--light-color)] [&_a]:transition-colors [&_a]:duration-200 [&_a]:ease-in-out [&_a:hover]:bg-[color:var(--light-color)] [&_a:hover]:text-[color:var(--tertiary-color)] md:[&_a]:text-base">
                    {action}
                </div>
            )}
        </section>
    );
}