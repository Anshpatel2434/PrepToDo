import { useEffect, useState, useCallback } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { DataTable, type Column } from '../components/DataTable';
import { Search } from 'lucide-react';
// import { useDebounce } from '../../../hooks/useDebounce'; // Assuming generic hook exists, or implements local

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at: string | null;
    profile?: {
        display_name: string | null;
    };
}

interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function UsersPage() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(debouncedSearch && { search: debouncedSearch }),
            });

            const response = await adminApiClient<UsersResponse>(`/users?${queryParams}`);
            setData(response);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const columns: Column<User>[] = [
        {
            header: 'User',
            cell: (user) => (
                <div>
                    <div className="font-medium text-white">
                        {user.profile?.display_name || 'No Name'}
                    </div>
                    <div className="text-xs text-[#94a3b8]">{user.email}</div>
                </div>
            ),
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (user) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.role === 'admin'
                    ? 'bg-purple-400/10 text-purple-400'
                    : 'bg-blue-400/10 text-blue-400'
                    }`}>
                    {user.role}
                </span>
            ),
        },
        {
            header: 'Joined',
            accessorKey: 'created_at',
            cell: (user) => new Date(user.created_at).toLocaleDateString(),
        },
        {
            header: 'Last Active',
            accessorKey: 'last_sign_in_at',
            cell: (user) => user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString()
                : 'Never',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-white">Users</h1>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-[#2a2d3a] bg-[#1a1d27] py-2 pl-10 pr-4 text-sm text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1] sm:w-64"
                    />
                </div>
            </div>

            <DataTable
                data={data?.users || []}
                columns={columns}
                isLoading={isLoading}
                title="User Directory"
                showExport={true}
                pagination={data ? {
                    page: data.pagination.page,
                    limit: data.pagination.limit,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                    onPageChange: setPage,
                } : undefined}
            />
        </div>
    );
}
