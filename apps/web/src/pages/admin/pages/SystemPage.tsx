import { useState, useEffect } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { Terminal, AlertTriangle, Play, ScrollText } from 'lucide-react';
import { DataTable, type Column } from '../components/DataTable';

interface QueryResult {
    rows: any[];
    rowCount: number;
    fields: string[];
}

interface ActivityLog {
    id: string;
    user_id: string;
    event_type: string; // Matched with DB
    metadata: any; // Matched with DB
    created_at: string;
    user?: { email: string; profile?: { display_name: string } };
}

export default function SystemPage() {
    const [query, setQuery] = useState('');
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false); // For daily content generation

    // Activity logs
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    useEffect(() => {
        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                const response = await adminApiClient<{ logs: ActivityLog[]; pagination: any }>(
                    `/system/logs?page=${logsPagination.page}&limit=${logsPagination.limit}`
                );
                setLogs(response.logs || []);
                if (response.pagination) {
                    setLogsPagination(prev => ({
                        ...prev,
                        total: response.pagination.total,
                        totalPages: response.pagination.totalPages,
                    }));
                }
            } catch (err) {
                // Logs may be empty
            } finally {
                setLogsLoading(false);
            }
        };

        fetchLogs();
    }, [logsPagination.page]);

    const handleRunQuery = async () => {
        if (!query.trim()) return;
        setIsRunning(true);
        setError(null);
        setQueryResult(null);

        try {
            const result = await adminApiClient<QueryResult>('/system/run-query', {
                method: 'POST',
                body: JSON.stringify({ query }),
            });
            setQueryResult(result);
        } catch (err: any) {
            setError(err.message || 'Query failed');
        } finally {
            setIsRunning(false);
        }
    };

    const handleGenerateDaily = async () => {
        if (!confirm('Are you sure you want to trigger daily content generation? This process may take a few minutes.')) return;

        setIsGenerating(true);
        try {
            await adminApiClient('/daily-content/generate', {
                method: 'POST',
                body: JSON.stringify({ force: true })
            });
            alert('Daily content generation triggered successfully!');
            // Refresh logs after a short delay
            setTimeout(() => setLogsPagination(prev => ({ ...prev })), 2000);
        } catch (err: any) {
            alert(`Failed to generate content: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const logColumns: Column<ActivityLog>[] = [
        {
            header: 'User',
            cell: (log) => (
                <span className="font-medium text-white">
                    {log.user?.email || log.user_id?.substring(0, 8) + '...' || '-'}
                </span>
            ),
        },
        { header: 'Action', accessorKey: 'event_type' }, // Changed to event_type
        {
            header: 'Details',
            cell: (log) => (
                <span className="text-[#94a3b8] text-xs font-mono">
                    {typeof log.metadata === 'string'
                        ? log.metadata
                        : JSON.stringify(log.metadata, null, 1).replace(/[\{\}]/g, '')}
                </span>
            ),
        },
        {
            header: 'Time',
            cell: (log) => <span className="text-[#64748b]">{new Date(log.created_at).toLocaleString()}</span>,
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">System Operations</h1>
                <button
                    onClick={handleGenerateDaily}
                    disabled={isGenerating}
                    className="flex items-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 px-4 py-2 text-sm font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                >
                    <Play className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Trigger Daily Content'}
                </button>
            </div>

            {/* SQL Runner */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] flex flex-col overflow-hidden">
                <div className="border-b border-[#2a2d3a] bg-[#0f1117]/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Terminal className="mr-2 h-5 w-5 text-[#94a3b8]" />
                        <h2 className="font-semibold text-white">SQL Query Runner</h2>
                    </div>
                    <div className="flex items-center text-amber-500 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Read-only mode — SELECT only</span>
                    </div>
                </div>

                <div className="p-6">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SELECT COUNT(*) FROM users;"
                        className="h-32 w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4 font-mono text-sm text-[#e2e8f0] focus:border-[#6366f1] focus:outline-none"
                        spellCheck={false}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleRunQuery();
                            }
                        }}
                    />

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-[#64748b]">Ctrl+Enter to execute • Results limited to 100 rows</span>
                        <button
                            onClick={handleRunQuery}
                            disabled={isRunning || !query.trim()}
                            className="flex items-center rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white hover:bg-[#5558dd] disabled:opacity-50"
                        >
                            <Play className="mr-2 h-4 w-4" />
                            {isRunning ? 'Running...' : 'Execute Query'}
                        </button>
                    </div>

                    {/* Error Output */}
                    {error && (
                        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 font-mono">
                            Error: {error}
                        </div>
                    )}

                    {/* Result Output */}
                    {queryResult && (
                        <div className="mt-6">
                            <h3 className="mb-2 text-sm font-medium text-[#94a3b8]">
                                Query Result: <span className="text-[#6366f1]">{queryResult.rowCount} row{queryResult.rowCount !== 1 ? 's' : ''}</span>
                            </h3>
                            <div className="overflow-x-auto rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4">
                                {queryResult.rows.length > 0 ? (
                                    <table className="w-full text-left text-xs font-mono text-[#e2e8f0]">
                                        <thead>
                                            <tr className="border-b border-[#2a2d3a] text-[#94a3b8]">
                                                {queryResult.fields.map(key => (
                                                    <th key={key} className="px-4 py-2">{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2d3a]">
                                            {queryResult.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-[#2a2d3a]/30">
                                                    {queryResult.fields.map((field, j) => (
                                                        <td key={j} className="px-4 py-2 whitespace-nowrap">
                                                            {typeof row[field] === 'object' ? JSON.stringify(row[field]) : String(row[field] ?? 'NULL')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <pre className="text-xs text-[#94a3b8]">Query returned 0 rows.</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Logs */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                <div className="flex items-center mb-4">
                    <ScrollText className="mr-2 h-5 w-5 text-[#94a3b8]" />
                    <h2 className="text-lg font-semibold text-white">Activity Logs</h2>
                </div>
                <DataTable
                    data={logs}
                    columns={logColumns}
                    isLoading={logsLoading}
                    pagination={{
                        page: logsPagination.page,
                        limit: logsPagination.limit,
                        total: logsPagination.total,
                        totalPages: logsPagination.totalPages,
                        onPageChange: (page) => setLogsPagination(prev => ({ ...prev, page })),
                    }}
                />
            </div>
        </div>
    );
}
