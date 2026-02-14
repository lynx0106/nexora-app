import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPIWithAuth, API_URL, uploadFile } from "../lib/api";

interface Tenant {
  id: string;
  name: string;
  sector?: string;
}

interface ProductsSectionProps {
  role: string | null;
  tenantId: string;
  selectedTenantId: string | null;
  onTenantChange: (id: string) => void;
  tenants: Tenant[];
  currency?: string;
  tenantSector?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  isActive: boolean;
  imageUrl?: string;
  stock: number;
  tenantId?: string;
}

export function ProductsSection({ role, tenantId, selectedTenantId, onTenantChange, tenants, currency = 'USD', tenantSector }: ProductsSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const effectiveTenantId = role === 'superadmin' ? selectedTenantId : tenantId;

  const { data: products = [], isLoading: loadingProducts, error } = useQuery({
    queryKey: ['products', effectiveTenantId],
    queryFn: async () => {
      let url = '/products';
      if (role === 'superadmin' && selectedTenantId) {
        url = `/products/tenant/${selectedTenantId}`;
      }
      const data = await fetchAPIWithAuth(url);
      return (data || []) as Product[];
    },
    enabled: !!effectiveTenantId || (role === 'superadmin' && !selectedTenantId)
  });

  const productsError = error ? t('products.error_loading') : null;

  const isRestaurant = (tenantSector || '').toLowerCase().includes('restaurante');
  const itemLabel = isRestaurant ? t('products.item_label_restaurant') : t('products.item_label');
  const descriptionLabel = isRestaurant ? t('products.description_restaurant') : t('products.description');
  const sectionTitle = isRestaurant ? t('products.menu_title') : t('products.title');

  const [showCreateProductForm, setShowCreateProductForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDuration, setNewProductDuration] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createProductError, setCreateProductError] = useState<string | null>(null);
  const [createProductSuccess, setCreateProductSuccess] = useState<string | null>(null);
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [newProductImageUrlInput, setNewProductImageUrlInput] = useState("");
  const [productImageInputType, setProductImageInputType] = useState<'file' | 'url'>('file');
  const [importingProducts, setImportingProducts] = useState(false);
  
  // Quick Edit State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>("");

  const formatPrice = (amount: number) => {
    const locale = currency === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
      minimumFractionDigits: currency === 'COP' ? 0 : 2
    }).format(amount);
  };

  async function handleImportProducts(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setImportingProducts(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (role === 'superadmin' && selectedTenantId) {
        formData.append('tenantId', selectedTenantId);
      }
      
      const res = await fetchAPIWithAuth('/products/upload', {
        method: 'POST',
        body: formData
      });

      alert(res.message || t('products.import_success'));
      
      // Reload products
      queryClient.invalidateQueries({ queryKey: ['products', effectiveTenantId] });

    } catch (err: any) {
      alert(t('products.import_error') + err.message);
    } finally {
      setImportingProducts(false);
      e.target.value = ''; // Reset input
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreatingProduct(true);
    setCreateProductError(null);
    setCreateProductSuccess(null);

    try {
      let imageUrl = "";
      if (productImageInputType === 'file' && newProductImageFile) {
        imageUrl = await uploadFile(newProductImageFile, 'products');
      } else if (productImageInputType === 'url' && newProductImageUrlInput) {
        imageUrl = newProductImageUrlInput;
      }

      const payload: any = {
        name: newProductName,
        description: newProductDescription,
        price: newProductPrice ? parseFloat(newProductPrice) : null,
        duration: newProductDuration ? parseInt(newProductDuration) : null,
        stock: newProductStock ? parseInt(newProductStock) : 0,
      };

      if (role === 'superadmin' && selectedTenantId) {
        payload.tenantId = selectedTenantId;
      }

      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      if (editingProductId) {
        await fetchAPIWithAuth(`/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setCreateProductSuccess('products.update_success');
      } else {
        await fetchAPIWithAuth('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCreateProductSuccess('products.create_success');
      }

      // Reset form
      setNewProductName("");
      setNewProductDescription("");
      setNewProductPrice("");
      setNewProductDuration("");
      setNewProductStock("");
      setNewProductImageFile(null);
      setNewProductImageUrlInput("");
      setProductImageInputType('file');
      setEditingProductId(null);
      setShowCreateProductForm(false);
      
      // Reload products
      queryClient.invalidateQueries({ queryKey: ['products', effectiveTenantId] });

    } catch (err: any) {
      setCreateProductError(err.message || t('products.save_error'));
    } finally {
      setCreatingProduct(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm(t('products.delete_confirm'))) return;
    try {
      await fetchAPIWithAuth(`/products/${id}`, { method: 'DELETE' });
      // Optimistic update or refetch
      queryClient.setQueryData(['products', effectiveTenantId], (old: Product[] | undefined) => 
        old ? old.filter(p => p.id !== id) : []
      );
      queryClient.invalidateQueries({ queryKey: ['products', effectiveTenantId] });
    } catch (err) {
      alert('Error al eliminar producto');
    }
  }

  function handleEditProductClick(product: Product) {
    setNewProductName(product.name);
    setNewProductDescription(product.description || "");
    setNewProductPrice(product.price ? product.price.toString() : "");
    setNewProductDuration(product.duration?.toString() || "");
    setNewProductStock(product.stock?.toString() || "0");
    setNewProductImageFile(null); // Reset file input
    
    if (product.imageUrl && !product.imageUrl.startsWith('/uploads/')) {
        setProductImageInputType('url');
        setNewProductImageUrlInput(product.imageUrl);
    } else {
        setProductImageInputType('file');
        setNewProductImageUrlInput("");
    }

    setEditingProductId(product.id);
    setShowCreateProductForm(true);
    setCreateProductError(null);
    setCreateProductSuccess(null);
  }

  const handleStockClick = (product: Product) => {
    setEditingStockId(product.id);
    setTempStockValue(product.stock.toString());
  };

  const handleStockBlur = async () => {
    if (!editingStockId) return;
    
    const newStock = parseInt(tempStockValue);
    if (isNaN(newStock) || newStock < 0) {
        setEditingStockId(null);
        return;
    }

    const product = products.find(p => p.id === editingStockId);
    const previousStock = product?.stock;

    if (product && product.stock === newStock) {
        setEditingStockId(null);
        return;
    }

    const idToUpdate = editingStockId;

    // Optimistic update
    queryClient.setQueryData(['products', effectiveTenantId], (old: Product[] | undefined) => 
      old ? old.map(p => p.id === idToUpdate ? { ...p, stock: newStock } : p) : []
    );
    setEditingStockId(null);

    try {
        await fetchAPIWithAuth(`/products/${idToUpdate}`, {
            method: 'PUT',
            body: JSON.stringify({ stock: newStock })
        });
        // Optionally invalidate to ensure sync
        // queryClient.invalidateQueries({ queryKey: ['products', effectiveTenantId] });
    } catch (err) {
        console.error("Failed to update stock", err);
        if (previousStock !== undefined) {
             queryClient.setQueryData(['products', effectiveTenantId], (old: Product[] | undefined) => 
               old ? old.map(p => p.id === idToUpdate ? { ...p, stock: previousStock } : p) : []
             );
        }
        alert(t('products.stock_update_error'));
    }
  };

  const handleStockKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleStockBlur();
    } else if (e.key === 'Escape') {
        setEditingStockId(null);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isRestaurant ? t('products.subtitle_restaurant') : t('products.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            {role !== 'user' && (
              <>
            <button
              onClick={() => {
                const csvContent = `name,description,price,stock,duration,imageUrl\n${t('products.csv_example_name')},${t('products.csv_example_desc')},10.50,100,60,${t('products.image_url_placeholder')}`;
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                if (link.download !== undefined) {
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute("download", "plantilla_productos.csv");
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t('products.download_template')}
            </button>
            <label className={`cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 ${importingProducts ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {importingProducts ? t('products.importing') : t('products.import_csv')}
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleImportProducts}
                  disabled={importingProducts}
                />
            </label>
            <button
              onClick={() => {
                setShowCreateProductForm(!showCreateProductForm);
                if (!showCreateProductForm) {
                  setEditingProductId(null);
                  setNewProductName("");
                  setNewProductDescription("");
                  setNewProductPrice("");
                  setNewProductDuration("");
                  setNewProductStock("");
                  setNewProductImageUrlInput("");
                  setNewProductImageFile(null);
                  setCreateProductError(null);
                  setCreateProductSuccess(null);
                }
              }}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {showCreateProductForm ? t('common.cancel') : t('products.new_product')}
            </button>
              </>
            )}
          </div>
        </div>

        {role === "superadmin" && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-zinc-50 p-3">
            <span className="text-xs font-medium text-zinc-700">
              {t('common.filter_by_tenant')}
            </span>
            <select
              value={selectedTenantId ?? ""}
              onChange={(e) => onTenantChange(e.target.value === "" ? "" : e.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            >
              <option value="">{t('common.all_tenants')}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name || tenant.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {showCreateProductForm && (
          <form
            onSubmit={handleCreateProduct}
            className="mt-6 border-t border-zinc-100 pt-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-900">
                  {t('products.product_image')}
                </label>
                
                <div className="mb-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input 
                      type="radio" 
                      name="imageType" 
                      checked={productImageInputType === 'file'}
                      onChange={() => setProductImageInputType('file')}
                      className="text-zinc-900 focus:ring-zinc-900"
                    />
                    {t('products.upload_file')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input 
                      type="radio" 
                      name="imageType" 
                      checked={productImageInputType === 'url'}
                      onChange={() => setProductImageInputType('url')}
                      className="text-zinc-900 focus:ring-zinc-900"
                    />
                    {t('products.image_link')}
                  </label>
                </div>

                {productImageInputType === 'file' ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewProductImageFile(e.target.files[0]);
                        }
                      }}
                      className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
                    />
                    {newProductImageFile && (
                       <p className="text-xs text-green-600">{t('products.image_selected')}{newProductImageFile.name}</p>
                    )}
                  </>
                ) : (
                  <input
                    type="url"
                    value={newProductImageUrlInput}
                    onChange={(e) => setNewProductImageUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">
                  {t('products.name')}
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                  placeholder={t('products.name_placeholder')}
                  className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">
                  {t('products.price')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  required
                  placeholder="0.00"
                  className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">
                  {t('products.stock')}
                </label>
                <input
                  type="number"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  required
                  placeholder="0"
                  className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-semibold text-zinc-900">
                  {descriptionLabel}
                </label>
                <textarea
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  rows={3}
                  placeholder={t('products.description_placeholder')}
                  className="rounded-md border border-zinc-400 px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-900">
                  {t('products.duration')}
                </label>
                <input
                  type="number"
                  value={newProductDuration}
                  onChange={(e) => setNewProductDuration(e.target.value)}
                  placeholder="Ej. 30"
                  className="h-9 rounded-md border border-zinc-400 px-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
                <span className="text-xs text-zinc-500">
                  {t('products.duration_hint')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateProductForm(false);
                  setEditingProductId(null);
                  setNewProductName("");
                  setNewProductDescription("");
                  setNewProductPrice("");
                  setNewProductDuration("");
                  setNewProductStock("");
                }}
                className="h-9 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={creatingProduct}
                className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {creatingProduct
                  ? t('products.saving')
                  : editingProductId
                  ? t('products.save_changes')
                  : t('products.create_product')}
              </button>
            </div>
          </form>
        )}

        {createProductError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {createProductError.startsWith('products.') ? t(createProductError) : createProductError}
          </div>
        )}

        {createProductSuccess && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t(createProductSuccess)}
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_image')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_name')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_description')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_price')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_stock')}</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700">{t('products.table_duration')}</th>
                {role === "superadmin" && (
                  <th className="px-3 py-2 text-left font-medium text-zinc-700">
                    {t('common.tenant')}
                  </th>
                )}
                {role !== 'user' && (
                <th className="px-3 py-2 text-left font-medium text-zinc-700">
                  {t('common.actions')}
                </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loadingProducts && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-3 text-center text-zinc-700"
                  >
                    {t('common.loading')}
                  </td>
                </tr>
              )}
              {productsError && !loadingProducts && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-3 text-center text-red-600"
                  >
                    {productsError}
                  </td>
                </tr>
              )}
              {!loadingProducts && !productsError && products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-3 text-center text-zinc-700"
                  >
                    {t('products.no_products')}
                  </td>
                </tr>
              )}
              {!loadingProducts &&
                !productsError &&
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-3 py-2">
                      {product.imageUrl ? (
                        <img src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL}${product.imageUrl}`} alt={product.name} className="h-10 w-10 rounded-md object-cover bg-zinc-50" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-900">
                      {product.name}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {product.description || "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-900 font-semibold">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-3 py-2 text-zinc-900">
                      {editingStockId === product.id ? (
                        <input
                            type="number"
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(e.target.value)}
                            onBlur={handleStockBlur}
                            onKeyDown={handleStockKeyDown}
                            autoFocus
                            className="w-20 rounded-md border border-zinc-400 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                        />
                      ) : (
                        <span 
                            onClick={() => role !== 'user' && handleStockClick(product)}
                            className={role !== 'user' ? "cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded" : ""}
                            title={role !== 'user' ? t('products.edit_stock_hint') : ""}
                        >
                            {product.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {product.duration ? `${product.duration} min` : "-"}
                    </td>
                    {role === "superadmin" && (
                      <td className="px-3 py-2 text-zinc-500 text-xs font-mono">
                        {product.tenantId}
                      </td>
                    )}
                    {role !== 'user' && (
                    <td className="px-3 py-2 flex items-center gap-3">
                      <button
                        onClick={() => handleEditProductClick(product)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                      {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                      {t('common.delete')}
                      </button>
                    </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
