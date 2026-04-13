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
                            <tr><td colSpan={columns.length} className="text-center p-4">Loading data...</td></tr>
                        )}
                        
                        {!loading && filteredData.length === 0 && (
                            <tr><td colSpan={columns.length} className="text-center p-4">
                                {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : emptyMessage}
                            </td></tr>
                        )}

                        {!loading && paginatedData.map((row, idx) => (
                            <tr key={row.id || idx} className={rowClassName(row)} style={{ height: '3.2rem', transition: 'all 0.1s', borderBottom: '1px solid #f1f5f9' }}>
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
                <p className="footer-text font-bold" style={{ color: '#6b7280' }}>
                    Menampilkan {filteredData.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}–{Math.min(safePage * itemsPerPage, filteredData.length)} dari {filteredData.length} entri
                </p>
                <div className="pagination">
                    <button
                        className="page-nav"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={`page-num${page === safePage ? ' active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        className="page-nav"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
