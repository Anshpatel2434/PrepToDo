import { useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { Database, Terminal, AlertTriangle, Play } from 'lucide-react';

export default function SystemPage() {
    const [query, setQuery] = useState('');
    const [queryResult, setQueryResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    // Separate state for logs to keep independent
    const [logs, setLogs] = useState<any[]>([]);

    const handleRunQuery = async () => {
        if (!query.trim()) return;
        setIsRunning(true);
        setError(null);
        setQueryResult(null);

        try {
            const result = await adminApiClient('/system/run-query', {
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

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">System Operations</h1>

            {/* SQL Runner */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] flex flex-col overflow-hidden">
                <div className="border-b border-[#2a2d3a] bg-[#0f1117]/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Terminal className="mr-2 h-5 w-5 text-[#94a3b8]" />
                        <h2 className="font-semibold text-white">SQL Query Runner</h2>
                    </div>
                    <div className="flex items-center text-amber-500 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Read-only mode recommended</span>
                    </div>
                </div>

                <div className="p-6">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SELECT * FROM users LIMIT 5;"
                        className="h-32 w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4 font-mono text-sm text-[#e2e8f0] focus:border-[#6366f1] focus:outline-none"
                        spellCheck={false}
                    />

                    <div className="mt-4 flex justify-end">
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
                            <h3 className="mb-2 text-sm font-medium text-[#94a3b8]">Query Result: <span className="text-[#6366f1]">{Array.isArray(queryResult) ? `${queryResult.length} rows` : 'Success'}</span></h3>
                            <div className="overflow-x-auto rounded-lg border border-[#2a2d3a] bg-[#0f1117] p-4">
                                {Array.isArray(queryResult) && queryResult.length > 0 ? (
                                    <table className="w-full text-left text-xs font-mono text-[#e2e8f0]">
                                        <thead>
                                            <tr className="border-b border-[#2a2d3a] text-[#94a3b8]">
                                                {Object.keys(queryResult[0]).map(key => (
                                                    <th key={key} className="px-4 py-2">{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2d3a]">
                                            {queryResult.map((row, i) => (
                                                <tr key={i} className="hover:bg-[#2a2d3a]/30">
                                                    {Object.values(row).map((val: any, j) => (
                                                        <td key={j} className="px-4 py-2 whitespace-nowrap">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <pre className="text-xs text-[#94a3b8]">{JSON.stringify(queryResult, null, 2)}</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
