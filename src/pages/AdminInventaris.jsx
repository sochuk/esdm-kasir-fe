import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AdminSidebar from '../components/AdminSidebar';
import DataTable from '../components/DataTable';
import { fetchProducts, addProduct, editProduct, removeProduct } from '../features/inventory/inventorySlice';
import { addNotification } from '../features/ui/uiSlice';
import axiosInstance from '../api/axiosInstance';
import './AdminInventaris.css';

const AdminInventaris = () => {
    const dispatch = useDispatch();
    const { items, status } = useSelector((state) => state.inventory);
    const fileInputRef = useRef(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'empty'
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('stock-desc');

    // Master category list — fetched dynamically from DB
    const [categories, setCategories] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        sku: '',
        category: 'Makanan',
        price: '',
        stock: '',
        image_url: ''
    });

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts());
        }
    }, [status, dispatch]);

    // Fetch Master Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.get('/api/category');
                setCategories(response.data.map(cat => cat.name));
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditMode(true);
            setFormData({
                id: product.id,
                name: product.name,
                sku: product.sku,
                category: product.category,
                price: product.price,
                stock: product.stock,
                image_url: product.image_url || ''
            });
        } else {
            setEditMode(false);
            setFormData({
                id: null,
                name: '',
                sku: '',
                category: 'Makanan',
                price: '',
                stock: '',
                image_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            dispatch(addNotification({ message: 'Ukuran foto terlalu besar (maks 2MB)', type: 'error' }));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        const category = formData.category.trim() || 'Lain-lain';
        const payload = {
            name: formData.name,
            sku: formData.sku,
            category,
            price: Number(formData.price),
            stock: Number(formData.stock),
            image_url: formData.image_url
        };

        // Auto-register new category into master list
        if (category && !categories.includes(category)) {
            setCategories(prev => [...prev, category]);
        }
        
        if (editMode) {
            dispatch(editProduct({ id: formData.id, data: payload }));
        } else {
            dispatch(addProduct(payload));
        }
        setIsModalOpen(false);
    };

    const handleDeleteRequest = (prod) => {
        setDeleteTarget({ id: prod.id, name: prod.name });
    };

    const handleDeleteConfirm = () => {
        dispatch(removeProduct(deleteTarget.id));
        setDeleteTarget(null);
    };

    // Derived Statistics
    const totalItems = items.length;
    const totalValue = items.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.stock)), 0);
    const lowStockCount = items.filter(i => Number(i.stock) < 15).length;

    // Combined filter + sort pipeline (Search handled by DataTable)
    const baseFilteredItems = items
        .filter(item => {
            const stock = Number(item.stock);
            const matchStock =
                stockFilter === 'low'   ? stock > 0 && stock < 15 :
                stockFilter === 'empty' ? stock === 0 :
                true;
            const matchCategory = categoryFilter ? item.category === categoryFilter : true;
            return matchStock && matchCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'stock-desc') return Number(b.stock) - Number(a.stock);
            if (sortBy === 'price-asc')  return Number(a.price) - Number(b.price);
            if (sortBy === 'newest')     return new Date(b.created_date) - new Date(a.created_date);
            return 0;
        });

    const resetFilters = () => {
        setSearchQuery('');
        setStockFilter('all');
        setCategoryFilter('');
    };

    const handleStockFilter = (val) => setStockFilter(val);
    const handleCategoryFilter = (val) => setCategoryFilter(val);
    const handleSort = (val) => setSortBy(val);

    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    });

    const inventoryColumns = [
        {
            header: 'Nama Produk',
            accessor: 'name',
            render: (prod) => (
                <div className="prod-name-col">
                    {prod.image_url ? (
                        <img 
                            alt={prod.name} 
                            className="table-img" 
                            src={prod.image_url} 
                        />
                    ) : (
                        <div className="table-img-fallback">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-900" style={{ fontSize: '0.85rem' }}>{prod.name}</p>
                        <p className={Number(prod.stock) < 15 ? "prod-sku text-error" : "prod-sku"} style={{ fontSize: '0.75rem' }}>SKU: {prod.sku}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Kategori',
            accessor: 'category',
            render: (prod) => <span className="badge">{prod.category}</span>
        },
        {
            header: 'Harga Jual (Rp)',
            accessor: 'price',
            cellClassName: 'text-right',
            className: 'text-right',
            render: (prod) => <span className="font-headline font-bold text-gray-900" style={{ fontSize: '0.9rem' }}>{formatter.format(prod.price).replace('Rp', '').trim()}</span>
        },
        {
            header: 'Tingkat Stok',
            accessor: 'stock',
            cellClassName: 'text-right',
            className: 'text-right',
            render: (prod) => (
                <div className="flex-col-end" style={{ fontSize: '0.75rem' }}>
                    <span className={Number(prod.stock) < 15 ? "font-bold text-error" : "font-bold text-gray-900"}>{prod.stock} Unit</span>
                    <div className="stock-bar-bg" style={{ height: '4px' }}>
                        <div className={Number(prod.stock) < 15 ? "stock-bar-fill bg-error" : "stock-bar-fill bg-primary"} style={{width: `${Math.min((prod.stock/200)*100, 100)}%`}}></div>
                    </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            accessor: 'actions',
            cellClassName: 'text-center',
            className: 'text-center',
            render: (prod) => (
                <div className="action-flex">
                    <button className="material-symbols-outlined icon-btn hover-primary" onClick={() => handleOpenModal(prod)}>edit</button>
                    <button className="material-symbols-outlined icon-btn hover-error" onClick={() => handleDeleteRequest(prod)}>delete</button>
                </div>
            )
        }
    ];

    return (
        <div className="admin-layout">
            <AdminSidebar />
            
            <main className="admin-main inventory-main">
                <div className="inventory-container" style={{ maxWidth: '100%', padding: '0 2rem' }}>
                    
                    {/* HEADER ACTION */}
                    <div className="inventory-header" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <h1 className="inventory-title" style={{ fontSize: '2.2rem', fontWeight: '900', color: '#111827' }}>Manajemen Inventaris</h1>
                            <p className="inventory-subtitle" style={{ fontSize: '1rem', color: '#6b7280' }}>Pemantauan stok & valuasi real-time</p>
                        </div>
                        <div className="header-actions">
                            <div className="search-box hidden-mobile">
                                <input 
                                    className="search-input" 
                                    placeholder="Cari inventaris..." 
                                    type="text"
                                />
                                <span className="material-symbols-outlined search-icon">search</span>
                            </div>
                            <button className="btn-primary" onClick={() => handleOpenModal()}>
                                <span className="material-symbols-outlined">add</span>
                                Tambah Produk Baru
                            </button>
                            <button className="btn-scan" onClick={() => dispatch(addNotification({ message: "Scanner mode activated (Simulation)", type: "info" }))}>
                                <span className="material-symbols-outlined">barcode_scanner</span>
                                Scan
                            </button>
                        </div>
                    </div>

                    {/* LOW STOCK COMPACT BANNER */}
                    {lowStockCount > 0 && (
                        <div className="low-stock-banner">
                            <span className="material-symbols-outlined icon-sm">warning</span>
                            <span><strong>{lowStockCount} produk</strong> memiliki stok rendah (&lt;15 unit)</span>
                        </div>
                    )}

                    <DataTable 
                        data={baseFilteredItems}
                        columns={inventoryColumns}
                        searchable={true}
                        searchKeys={['name', 'sku']}
                        searchPlaceholder="Cari nama atau SKU..."
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        loading={status === 'loading'}
                        emptyMessage={stockFilter !== 'all' || categoryFilter ? <span>Tidak ada produk yang cocok. <button className="filter-reset-link" onClick={resetFilters}>Reset filter</button></span> : 'Belum ada produk di database.'}
                        rowClassName={(prod) => Number(prod.stock) < 15 ? "row-warning group" : "row-normal group"}
                        customTopBar={(searchNode) => (
                            <div className="filters-container mt-4">
                                <button
                                    className={`filter-btn${stockFilter === 'all' ? ' active' : ''}`}
                                    onClick={() => handleStockFilter('all')}
                                >Semua Produk</button>
                                <button
                                    className={`filter-btn${stockFilter === 'low' ? ' active' : ''}`}
                                    onClick={() => handleStockFilter('low')}
                                >Stok Rendah</button>
                                <button
                                    className={`filter-btn${stockFilter === 'empty' ? ' active' : ''}`}
                                    onClick={() => handleStockFilter('empty')}
                                >Stok Habis</button>
                                <div className="filter-select-wrapper">
                                    <select
                                        className="filter-select"
                                        value={categoryFilter}
                                        onChange={(e) => handleCategoryFilter(e.target.value)}
                                    >
                                        <option value="">Semua Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined filter-icon">keyboard_arrow_down</span>
                                </div>
                                
                                {searchNode}
                                
                                <div className="sort-wrapper">
                                    <span className="sort-label">Urutkan:</span>
                                    <select
                                        className="sort-select"
                                        value={sortBy}
                                        onChange={(e) => handleSort(e.target.value)}
                                    >
                                        <option value="stock-desc">Tingkat Stok (Tinggi ke Rendah)</option>
                                        <option value="price-asc">Harga (Rendah ke Tinggi)</option>
                                        <option value="newest">Baru Ditambahkan</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    />
                    
                </div>
            </main>

            {/* MODAL OVERLAY (INPUT INVENTARIS BARU / EDIT) */}
            {isModalOpen && (
                <div className="modal-overlay z-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{editMode ? 'Edit Inventaris' : 'Input Inventaris Baru'}</h3>
                                <p className="modal-subtitle">Input Manual & Scan Barcode</p>
                            </div>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Barcode Scan Area */}
                            <div className="barcode-simulation p-4 mb-4" style={{border: '1px dashed #ccc'}}>
                                <h4 className="font-bold text-lg mb-2">Input SKU Produk (Barcode)</h4>
                                <input 
                                    type="text" 
                                    className="form-input w-full p-2 border rounded font-mono" 
                                    placeholder="Ketik manual atau sorot alat scanner kesini..." 
                                    value={formData.sku}
                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nama Produk</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="misal: ESDM Ultra X" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kategori</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        list="category-datalist"
                                        placeholder="Pilih atau ketik kategori baru..."
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    />
                                    <datalist id="category-datalist">
                                        {categories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label>Harga Jual (Rp)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Contoh: 15.000" 
                                        value={formData.price ? new Intl.NumberFormat('id-ID').format(formData.price) : ''}
                                        onChange={(e) => setFormData({...formData, price: e.target.value.replace(/\D/g, '')})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stok Awal</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        placeholder="0" 
                                        value={formData.stock}
                                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="photo-upload-section mt-4">
                                <label className="block text-sm font-bold mb-2">Foto Produk</label>
                                <div className="photo-upload-container">
                                    <div className="photo-preview-box" onClick={() => fileInputRef.current.click()}>
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="photo-preview-img" />
                                        ) : (
                                            <div className="photo-placeholder">
                                                <span className="material-symbols-outlined">add_a_photo</span>
                                                <p>Klik untuk unggah</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="photo-upload-hint">
                                        <p className="font-bold">Format: JPG, PNG, WEBP</p>
                                        <p>Maksimum 2MB. Gunakan rasio 1:1 untuk hasil terbaik.</p>
                                        <button className="btn-secondary mt-2" onClick={() => fileInputRef.current.click()}>
                                            Pilih File
                                        </button>
                                        {formData.image_url && (
                                            <button className="btn-text-error mt-2 ml-2" onClick={() => setFormData({...formData, image_url: ''})}>
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handlePhotoChange} 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={handleCloseModal}>Batal</button>
                                <button className="btn-save" onClick={handleSave}>
                                    <span className="material-symbols-outlined">save</span>
                                    {editMode ? 'Simpan Perubahan' : 'Daftarkan Produk'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="modal-overlay z-modal">
                    <div className="confirm-modal">
                        <div className="confirm-icon-wrapper">
                            <span className="material-symbols-outlined confirm-icon">delete_forever</span>
                        </div>
                        <h3 className="confirm-title">Hapus Produk?</h3>
                        <p className="confirm-desc">
                            Produk <strong>&ldquo;{deleteTarget.name}&rdquo;</strong> akan dihapus secara permanen dari database.
                        </p>
                        <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Batal</button>
                            <button className="btn-danger" onClick={handleDeleteConfirm}>
                                <span className="material-symbols-outlined">delete</span>
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ACTION BAR (FLOATING) */}
            <div className="floating-action">
                <button className="bolt-btn" onClick={() => handleOpenModal()}>
                    <span className="material-symbols-outlined bolt-icon">bolt</span>
                </button>
            </div>
        </div>
    );
};

export default AdminInventaris;
