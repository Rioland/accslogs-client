"use client";

import { useState, useEffect } from 'react';
import supabaseClient from '@/lib/supabaseClient';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  status: string;
  created_at: string;
  seller_product_accounts: Array<{
    id: number;
    username: string;
    password: string;
    email?: string;
  }>;
}

export default function ManageSellAccountsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        setProducts([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/sell-accounts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        let errorMessage = 'Failed to fetch products';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Failed to fetch products: ${response.status} ${response.statusText}`;
        }
        alert(errorMessage);
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error fetching products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/sell-accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        alert('Status updated');
        fetchProducts(); // Refresh
      } else {
        let errorMessage = 'Failed to update status';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Failed to update status: ${response.status} ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update status');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const response = await fetch('/api/admin/sell-accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert('Product deleted');
        fetchProducts(); // Refresh
      } else {
        let errorMessage = 'Failed to delete product';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `Failed to delete product: ${response.status} ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Sell Accounts</h1>
        <a
          href="/admin/sell"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Account to Sell
        </a>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Submitted Products</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${product.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.seller_product_accounts.length} accounts</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : product.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {product.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(product.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(product.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            No products submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}
