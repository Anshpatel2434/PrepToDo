import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
}

interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    pagination?: PaginationProps;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({
    data,
    columns,
    isLoading,
    pagination,
    onRowClick
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-8 text-center text-[#94a3b8]">
                Loading data...
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#2a2d3a] bg-[#0f1117]/50 text-[#94a3b8]">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-4 font-medium">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2d3a]">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-[#94a3b8]">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-[#2a2d3a]/50' : ''}`}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 text-[#e2e8f0]">
                                            {col.cell
                                                ? col.cell(item)
                                                : (item as any)[col.accessorKey!]
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#2a2d3a] px-6 py-4">
                    <div className="text-sm text-[#94a3b8]">
                        Showing <span className="font-medium text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-white">{pagination.total}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="rounded-lg border border-[#2a2d3a] p-2 text-[#94a3b8] hover:bg-[#2a2d3a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-[#94a3b8]">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="rounded-lg border border-[#2a2d3a] p-2 text-[#94a3b8] hover:bg-[#2a2d3a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
