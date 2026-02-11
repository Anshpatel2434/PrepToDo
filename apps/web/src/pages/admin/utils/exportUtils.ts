export const exportToCsv = (filename: string, rows: any[], columns: { header: string, accessorKey?: string }[]) => {
    if (!rows || !rows.length) return;

    const headers = columns.map(col => col.header).join(',');
    const csvContent = [
        headers,
        ...rows.map(row =>
            columns.map(col => {
                const val = col.accessorKey ? (row as any)[col.accessorKey] : '';
                const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
