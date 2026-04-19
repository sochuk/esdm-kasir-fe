import React, { useState, useMemo } from 'react';

const DataTable = ({
    data = [],
    columns = [],
    searchable = false,
    searchPlaceholder = "Cari data...",
    searchKeys = [],
    itemsPerPage = 10,
    loading = false,
    emptyMessage = "Belum ada data",
    customTopBar = null,
    rowClassName = () => "row-normal",
    searchQuery: controlledSearchQuery,
    onSearchChange,
}) => {
    const [internalSearch, setInternalSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const isControlled = controlledSearchQuery !== undefined;
    const searchQuery = isControlled ? controlledSearchQuery : internalSearch;

    // Filter Data Based on Search
    const filteredData = useMemo(() => {
        if (!searchable || !searchQuery.trim()) return data;
        const query = searchQuery.toLowerCase();
        
        return data.filter(item => {
            return searchKeys.some(key => {
                const val = item[key];
                return val && String(val).toLowerCase().includes(query);
            });
        });
    }, [data, searchable, searchQuery, searchKeys]);

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    
    const paginatedData = useMemo(() => {
        const start = (safePage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, safePage, itemsPerPage]);

    const handleSearchChange = (val) => {
        if (!isControlled) setInternalSearch(val);
        if (onSearchChange) onSearchChange(val);
        setCurrentPage(1);
    };

    // Helper to generate pagination range
    const getPageRange = (current, total) => {
        const delta = 2; 
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    // Default Search Node
    const searchNode = searchable ? (
        <div className="search-inline-wrapper">
            <span className="material-symbols-outlined search-inline-icon">search</span>
            <input
                className="search-inline-input"
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
                <button className="search-clear-btn" onClick={() => handleSearchChange('')}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                </button>
            )}
        </div>
    ) : null;

    return (
        <div>
            {/* Top Bar (Filters + Search) */}
            {customTopBar ? customTopBar(searchNode) : (
                searchable && (
                    <div className="filters-container" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        {searchNode}
                    </div>
                )
            )}

            {/* Table */}
            <div className="table-container" style={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <table className="inventory-table" style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#FDD400 !important', background: '#FDD400 !important' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', background: 'transparent', width: '3.5rem', textAlign: 'center' }}>No</th>
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={col.className || ''} 
                                    style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: '#18181b !important', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', background: 'transparent', ...(col.style || {}) }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={columns.length + 1} className="text-center p-4">Loading data...</td></tr>
                        )}
                        
                        {!loading && filteredData.length === 0 && (
                            <tr><td colSpan={columns.length + 1} className="text-center p-4">
                                {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : emptyMessage}
                            </td></tr>
                        )}

                        {!loading && paginatedData.map((row, idx) => (
                            <tr key={row.id || idx} className={rowClassName(row)} style={{ height: '3.2rem', transition: 'all 0.1s', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0 1rem', fontSize: '0.8rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                                    {(safePage - 1) * itemsPerPage + idx + 1}
                                </td>
                                {columns.map((col, cIdx) => (
                                    <td key={cIdx} className={col.cellClassName || ''} style={{ padding: '0 1rem', fontSize: '0.8rem', ...(col.cellStyle || {}) }}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="table-footer" style={{ marginTop: '0', borderTop: 'none', backgroundColor: 'transparent', padding: '1rem 0' }}>
                <p className="footer-text" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Menampilkan <strong>{filteredData.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> entri
                </p>
                <div className="pagination" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                        className="page-nav"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        style={{ border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '0.6rem', width: '2.4rem', height: '2.4rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>chevron_left</span>
                    </button>
                    
                    {getPageRange(safePage, totalPages).map((page, i) => (
                        page === '...' ? (
                            <span key={`dots-${i}`} style={{ color: '#94a3b8', padding: '0 0.5rem' }}>...</span>
                        ) : (
                            <button
                                key={page}
                                className={`page-num${page === safePage ? ' active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    border: page === safePage ? 'none' : '1.5px solid #e2e8f0',
                                    background: page === safePage ? '#FDD400' : 'white',
                                    color: page === safePage ? '#18181b' : '#64748b',
                                    borderRadius: '0.6rem',
                                    width: '2.4rem',
                                    height: '2.4rem',
                                    fontWeight: page === safePage ? '800' : '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {page}
                            </button>
                        )
                    ))}
                    
                    <button
                        className="page-nav"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        style={{ border: '1.5px solid #e2e8f0', background: 'white', borderRadius: '0.6rem', width: '2.4rem', height: '2.4rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
