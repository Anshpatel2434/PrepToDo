import { useEffect, useState } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { HelpCircle, BookOpen, Layers } from 'lucide-react';
import { DataTable, type Column } from '../components/DataTable';

interface ContentStats {
    passages: { total: number; today: number };
    questions: { total: number; today: number };
    exams: { total: number; today: number };
}

type ContentTab = 'passages' | 'questions' | 'exams';

export default function ContentPage() {
    const [stats, setStats] = useState<ContentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ContentTab>('passages');
    const [tabData, setTabData] = useState<any[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [tabPagination, setTabPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

    // Fetch content stats on mount
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminApiClient<ContentStats>('/content/stats');
                setStats(response);
            } catch (err) {
                setError('Failed to fetch content stats');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Fetch tab data when tab or page changes
    useEffect(() => {
        const fetchTabData = async () => {
            setTabLoading(true);
            try {
                const response = await adminApiClient<any>(
                    `/content/${activeTab}?page=${tabPagination.page}&limit=${tabPagination.limit}`
                );
                setTabData(response[activeTab] || []);
                if (response.pagination) {
                    setTabPagination(prev => ({
                        ...prev,
                        total: response.pagination.total,
                        totalPages: response.pagination.totalPages,
                    }));
                }
            } catch (err) {
                setTabData([]);
            } finally {
                setTabLoading(false);
            }
        };

        fetchTabData();
    }, [activeTab, tabPagination.page]);

    // --- Loading/error states AFTER all hooks ---
    if (isLoading) return <div className="p-8 text-[#94a3b8]">Loading content stats...</div>;
    if (error) return <div className="p-8 text-red-400">{error}</div>;

    const statCards = [
        {
            title: 'Passages',
            total: stats?.passages.total || 0,
            today: stats?.passages.today || 0,
            icon: BookOpen,
            color: 'text-blue-400',
        },
        {
            title: 'Questions',
            total: stats?.questions.total || 0,
            today: stats?.questions.today || 0,
            icon: HelpCircle,
            color: 'text-green-400',
        },
        {
            title: 'Exams Generated',
            total: stats?.exams.total || 0,
            today: stats?.exams.today || 0,
            icon: Layers,
            color: 'text-purple-400',
        },
    ];

    const tabs: { key: ContentTab; label: string }[] = [
        { key: 'passages', label: 'Passages' },
        { key: 'questions', label: 'Questions' },
        { key: 'exams', label: 'Exams' },
    ];

    // Define columns per tab
    const passageColumns: Column<any>[] = [
        { header: 'Title', accessorKey: 'title' },
        { header: 'Topic', accessorKey: 'topic' },
        { header: 'Difficulty', accessorKey: 'difficulty' },
        { header: 'Questions', cell: (item: any) => item.questionCount ?? '-' },
        { header: 'Created', cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
    ];

    const questionColumns: Column<any>[] = [
        { header: 'Type', accessorKey: 'question_type' },
        { header: 'Text', cell: (item: any) => (item.question_text || '').substring(0, 80) + '...' },
        { header: 'Passage', cell: (item: any) => item.passage?.title || '-' },
        { header: 'Created', cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
    ];

    const examColumns: Column<any>[] = [
        { header: 'Name', accessorKey: 'name' },
        { header: 'Type', accessorKey: 'exam_type' },
        { header: 'Status', accessorKey: 'status' },
        { header: 'Created', cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
    ];

    const columnMap = {
        passages: passageColumns,
        questions: questionColumns,
        exams: examColumns,
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Content Management</h1>

            {/* Stats Row */}
            <div className="grid gap-6 sm:grid-cols-3">
                {statCards.map((card) => (
                    <div key={card.title} className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#94a3b8]">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-white">{card.total.toLocaleString()}</p>
                                <p className="text-xs text-[#64748b]">+{card.today} today</p>
                            </div>
                            <div className="rounded-lg bg-[#2a2d3a] p-3">
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Browser Tabs */}
            <div className="rounded-xl border border-[#2a2d3a] bg-[#1a1d27]">
                {/* Tab Headers */}
                <div className="flex border-b border-[#2a2d3a]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setTabPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? 'border-b-2 border-[#6366f1] text-[#6366f1]'
                                    : 'text-[#94a3b8] hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    <DataTable
                        data={tabData}
                        columns={columnMap[activeTab]}
                        isLoading={tabLoading}
                        pagination={{
                            page: tabPagination.page,
                            limit: tabPagination.limit,
                            total: tabPagination.total,
                            totalPages: tabPagination.totalPages,
                            onPageChange: (page) => setTabPagination(prev => ({ ...prev, page })),
                        }}
                        showExport
                    />
                </div>
            </div>
        </div>
    );
}
