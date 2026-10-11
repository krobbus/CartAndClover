import { Link } from 'react-router';

export default function NotFound() {
    return (
        <div className="flex h-full items-start justify-center p-8 md:p-16">
            <div className="mx-auto my-8 flex w-full flex-col items-center justify-start gap-4 rounded-[20px] border-2 border-[color:var(--secondary-color)] bg-[color:var(--main-color)] p-8">
                <h1 className="text-center font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    That page does not exist
                </h1>
                <p className="text-center font-[family-name:var(--body-font)] text-sm text-[color:var(--dark-color)] md:text-base">
                    The link may be out of date, or page may have been removed.
                </p>

                <Link
                    className="inline-block rounded-lg bg-[color:var(--secondary-color)] px-6 py-3 font-[family-name:var(--body-font)] text-sm font-semibold text-[color:var(--light-color)] transition-colors duration-200 ease-in-out hover:bg-[color:var(--light-color)] hover:text-[color:var(--tertiary-color)] md:text-base"
                    to="/marketplace"
                >
                    Go to marketplace
                </Link>
            </div>
        </div>
    );
}