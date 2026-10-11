import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Loading from '../components/Loading';
import ErrorNote from '../components/ErrorNote';
import EmptyState from '../components/EmptyState';
import { fullName, capitalizeFirstLetter, capitalizeWords, formatDate } from '../utils.js';

export default function Users() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [error, setError] = useState(null);

    const roles = ['All', 'shopper', 'seller', 'admin'];

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get('/users');
            setUsers(data);
        } catch (err) {
            setError(err?.message || 'Failed to fetch users list.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setDeletingUserId(userId);
        setError(null);

        try {
            await api.delete(`/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u._id !== userId && u.id !== userId));
        } catch (err) {
            setError(err?.message || 'Failed to delete user.');
        } finally {
            setDeletingUserId(null);
        }
    };

    const filteredUsers = users.filter((user) => {
        const name = fullName(user).toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (loading) return <Loading label="Loading users directory..." />;

    return (
        <div className="flex min-h-[100dvh] flex-col justify-start gap-2 p-8 md:p-16">
            <header className="flex flex-col pb-8">
                <h1 className="font-[family-name:var(--heading-font)] text-2xl font-bold text-[color:var(--tertiary-color)] md:text-3xl">
                    Users Directory & Management
                </h1>
                <p className="pl-2 font-[family-name:var(--body-font)] text-sm tracking-[1px] text-[color:var(--dark-color)] md:text-base">
                    Manage accounts and oversee platform user roles
                </p>
            </header>

            <ErrorNote error={error} onRetry={loadUsers} />

            <div className="mb-8 flex flex-col gap-4 md:gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-[10px] border-2 border-[color:var(--secondary-color)] bg-white px-4 py-2.5 font-[family-name:var(--body-font)] text-sm md:px-8 md:py-3 md:text-base"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                    {roles.map((role) => (
                        <button
                            key={role}
                            type="button"
                            className={`cursor-pointer rounded-[10px] border-2 border-[color:var(--secondary-color)] px-3 py-1 font-[family-name:var(--body-font)] text-xs font-bold transition duration-200 ease-in-out hover:bg-[color:var(--secondary-color)] hover:text-[color:var(--light-color)] md:px-4 md:py-2 md:text-sm ${
                                roleFilter === role
                                    ? 'bg-[color:var(--secondary-color)] text-[color:var(--light-color)]'
                                    : 'bg-transparent text-[color:var(--secondary-color)]'
                            }`}
                            onClick={() => setRoleFilter(role)}
                        >
                            {capitalizeWords(role)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <EmptyState title="No users found matching your search criteria." />
            ) : (
                <div className="min-h-0 w-full overflow-auto rounded-[10px] border border-[color:var(--secondary-color)] bg-[color:var(--main-color)]">
                    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-[color:var(--secondary-color)] bg-[color:var(--main-color)] font-[family-name:var(--body-font)]">
                        <thead className="bg-[color:var(--light-color)]">
                            <tr>
                                <th className="border-b border-[#e5e7eb] p-3 text-left text-xs font-bold uppercase tracking-[0.05em] text-[color:var(--tertiary-color)] md:p-4 md:text-base">User</th>
                                <th className="border-b border-[#e5e7eb] p-3 text-left text-xs font-bold uppercase tracking-[0.05em] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Email</th>
                                <th className="border-b border-[#e5e7eb] p-3 text-left text-xs font-bold uppercase tracking-[0.05em] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Role</th>
                                <th className="border-b border-[#e5e7eb] p-3 text-left text-xs font-bold uppercase tracking-[0.05em] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Registered Date</th>
                                <th className="border-b border-[#e5e7eb] p-3 text-center text-xs font-bold uppercase tracking-[0.05em] text-[color:var(--tertiary-color)] md:p-4 md:text-base">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredUsers.map((u) => {
                                const userId = u._id || u.id;
                                const isSelf = (currentUser?._id || currentUser?.id) === userId;
                                const isDeleting = deletingUserId === userId;

                                return (
                                    <tr
                                        key={userId}
                                        className="transition-colors duration-200 ease-in-out hover:bg-[rgba(0,0,0,0.02)] [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-[#f3f4f6]"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            <strong>{fullName(u)}</strong>
                                            {isSelf && (
                                                <span className="ml-4 rounded-md bg-[color:var(--secondary-color)] px-2 py-[0.2rem] text-[10px] font-bold uppercase text-[color:var(--light-color)] md:text-xs">
                                                    You
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            {u.email}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            {capitalizeFirstLetter(u.role)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            {formatDate(u.createdAt || u.registeredAt)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-center align-middle text-xs text-[color:var(--dark-color)] md:px-6 md:py-4 md:text-base">
                                            <button
                                                type="button"
                                                className="cursor-pointer rounded-lg bg-[rgb(200,100,100)] px-4 py-2 font-[family-name:var(--body-font)] text-xs font-bold text-[color:var(--light-color)] transition duration-200 ease-in-out hover:enabled:bg-[rgb(180,80,80)] disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={isSelf || isDeleting}
                                                onClick={() => handleDeleteUser(userId)}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}