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
        const name = fullName(u).toLowerCase();
        const email = user.email?.toLowerCase() || '';
        const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (loading) return <Loading label="Loading users directory..." />;

    return (
        <div className="usersContainer">
            <header>
                <h1>Users Directory & Management</h1>
                <p>Manage accounts and oversee platform user roles</p>
            </header>

            <ErrorNote error={error} onRetry={loadUsers} />

            <div className="filterBar">
                <input
                    type="text"
                    className="searchInput"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="categoryPills">
                    {roles.map((role) => (
                        <button
                            key={role}
                            type="button"
                            className={`pill ${roleFilter === role ? 'active' : ''}`}
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
                <div className="tableWrapper">
                    <table >
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Registered Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {filteredUsers.map((u) => {
                                const userId = u._id || u.id;
                                const isSelf = (currentUser?._id || currentUser?.id) === userId;
                                const isDeleting = deletingUserId === userId;

                                return (
                                    <tr key={userId}>
                                        <td>
                                            <strong>{fullName(u)}</strong>
                                            {isSelf && <span className="selfBadge">You</span>}
                                        </td>
                                        <td>{u.email}</td>
                                        <td>{capitalizeFirstLetter(u.role)}</td>
                                        <td>{formatDate(u.createdAt || u.registeredAt)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="deleteBtn"
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