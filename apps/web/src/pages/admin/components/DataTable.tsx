import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { exportToCsv } from '../utils/exportUtils';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => ReactNode;
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
    pagination?: PaginationProps;
    isLoading?: boolean;
    title?: string;
    showExport?: boolean;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({
    data,
    columns,
    pagination,
    isLoading,
    title,
    showExport = false,
    onRowClick,
}: DataTableProps<T>) {

    const handleExport = () => {
        const filename = `${title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
        // Map columns to format expected by exportToCsv
        const exportCols = columns.map(c => ({
            header: c.header,
            accessorKey: c.accessorKey as string
        }));
        exportToCsv(filename, data, exportCols);
    };

    return (
        <div className="flex flex-col space-y-4">
            {(title || showExport) && (
                <div className="flex items-center justify-between mb-2">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {showExport && (
                        <button
                            onClick={handleExport}
                            className="flex items-center rounded-lg border border-[#2a2d3a] bg-[#1a1d27] px-3 py-1.5 text-xs font-medium text-[#94a3b8] transition-colors hover:bg-[#2a2d3a] hover:text-white"
                        >
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Export CSV
                        </button>
                    )}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[#2a2d3a] bg-[#1a1d27]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[#2a2d3a] bg-[#1a1d27] text-[#94a3b8]">
                            <tr>
                                {columns.map((column, idx) => (
                                    <th key={idx} className="px-6 py-4 font-medium uppercase tracking-wider">
                                        {column.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2d3a]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center text-[#64748b]">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-10 text-center text-[#64748b]">
                                        No results found.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, rowIdx) => (
                                    <tr
                                        key={rowIdx}
                                        className={`transition-colors hover:bg-[#2a2d3a]/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                                        onClick={() => onRowClick?.(item)}
                                    >                                        {columns.map((column, colIdx) => (
                                        <td key={colIdx} className="whitespace-nowrap px-6 py-4 text-[#e2e8f0]">
                                            {column.cell
                                                ? column.cell(item)
                                                : column.accessorKey
                                                    ? String(item[column.accessorKey] ?? '-')
                                                    : '-'}
                                        </td>
                                    ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && data.length > 0 && (
                    <div className="flex items-center justify-between border-t border-[#2a2d3a] bg-[#1a1d27]/50 px-6 py-3">
                        <div className="text-xs text-[#64748b]">
                            Showing <span className="font-medium text-[#94a3b8]">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-[#94a3b8]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-[#94a3b8]">{pagination.total}</span> entries
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => pagination.onPageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2d3a] text-[#94a3b8] transition-colors hover:bg-[#2a2d3a] disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs font-medium text-[#94a3b8]">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => pagination.onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2d3a] text-[#94a3b8] transition-colors hover:bg-[#2a2d3a] disabled:opacity-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
