"use client";

import { useState, useEffect } from 'react';
import supabaseClient from '@/lib/supabaseClient';

interface Account {
  id: number;
  product_id: number;
  username: string;
  password: string;
  email?: string;
  email_password?: string;
  additional_info?: string;
  preview_link?: string;
  created_at: string;
  seller_products: {
    id: number;
    user_id: string;
    category: string;
    subcategory?: string;
    name: string;
    description: string;
    price: number;
    release_option: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export default function ManageSellAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('seller_product_accounts')
        .select('*, seller_products(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        alert('Error fetching accounts');
        setAccounts([]);
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error fetching accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (productId: number, status: string) => {
    try {
      const { error } = await supabaseClient
        .from('seller_products')
        .update({ status })
        .eq('id', productId);

      if (error) {
        console.error('Update error:', error);
        alert('Failed to update status');
      } else {
        alert('Status updated');
        fetchAccounts(); // Refresh
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update status');
    }
  };

  const deleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabaseClient
        .from('seller_product_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete account');
      } else {
        alert('Account deleted');
        fetchAccounts(); // Refresh
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete account');
    }
  };

  const saveEdit = async () => {
    if (!editingAccount) return;

    try {
      const { error } = await supabaseClient
        .from('seller_product_accounts')
        .update({
          username: editingAccount.username,
          password: editingAccount.password,
          email: editingAccount.email,
          email_password: editingAccount.email_password,
          additional_info: editingAccount.additional_info,
          preview_link: editingAccount.preview_link,
        })
        .eq('id', editingAccount.id);

      if (error) {
        console.error('Update error:', error);
        alert('Failed to update account');
      } else {
        alert('Account updated');
        setEditingAccount(null);
        fetchAccounts(); // Refresh
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update account');
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
          <h2 className="text-lg font-medium text-gray-900">Submitted Accounts</h2>
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
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{account.seller_products.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{account.seller_products.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{account.seller_products.category}</div>
                    {account.seller_products.subcategory && <div className="text-sm text-gray-400">{account.seller_products.subcategory}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{account.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{account.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${account.seller_products.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      account.seller_products.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : account.seller_products.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.seller_products.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {account.seller_products.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(account.seller_products.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(account.seller_products.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
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

        {accounts.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            No accounts submitted yet.
          </div>
        )}
      </div>

      {editingAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Account</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={editingAccount.username}
                    onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="text"
                    value={editingAccount.password}
                    onChange={(e) => setEditingAccount({ ...editingAccount, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editingAccount.email || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Password</label>
                  <input
                    type="text"
                    value={editingAccount.email_password || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email_password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Info</label>
                  <textarea
                    value={editingAccount.additional_info || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, additional_info: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preview Link</label>
                  <input
                    type="url"
                    value={editingAccount.preview_link || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, preview_link: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
