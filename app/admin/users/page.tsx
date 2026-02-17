"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  funds: number;
  is_admin: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userFunds, setUserFunds] = useState(0);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => supabaseClient, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        console.error('Failed to fetch users');
        return;
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const handleAddUser = () => {
    setUserEmail('');
    setUserPassword('');
    setUserFirstName('');
    setUserLastName('');
    setUserFunds(0);
    setUserIsAdmin(false);
    setShowAddUser(true);
  };

  const handleEditUser = (user: User) => {
    setUserEmail(user.email);
    setUserFirstName(user.first_name);
    setUserLastName(user.last_name || '');
    setUserFunds(user.funds);
    setUserIsAdmin(user.is_admin);
    setEditingUser(user);
  };

  const submitUser = async () => {
    if (!userEmail.trim() || !userFirstName.trim()) {
      alert('Email and first name are required');
      return;
    }

    if (editingUser) {
      // Update user
      try {
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail.trim(),
            first_name: userFirstName.trim(),
            last_name: userLastName.trim() || null,
            funds: userFunds,
            is_admin: userIsAdmin,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(`Error updating user: ${error.error}`);
          return;
        }

        alert('User updated successfully');
        setEditingUser(null);
        fetchUsers();
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user');
      }
    } else {
      // Create user
      if (!userPassword.trim()) {
        alert('Password is required for new users');
        return;
      }

      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail.trim(),
            password: userPassword.trim(),
            first_name: userFirstName.trim(),
            last_name: userLastName.trim() || null,
            funds: userFunds,
            is_admin: userIsAdmin,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(`Error creating user: ${error.error}`);
          return;
        }

        alert('User created successfully');
        setShowAddUser(false);
        fetchUsers();
      } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user');
      }
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error deleting user: ${error.error}`);
        return;
      }

      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Manage Users</h1>

      <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Manage Users</h2>
          <button onClick={handleAddUser} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
            Create User
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between border border-gray-200 rounded p-4">
                <div>
                  <p className="font-semibold">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">Role: {user.is_admin ? 'Admin' : 'User'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Funds: ${user.funds}</span>
                  <button onClick={() => handleEditUser(user)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Edit
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Modals */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create User</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Email"
              />
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Password"
              />
              <input
                type="text"
                value={userFirstName}
                onChange={(e) => setUserFirstName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="First Name"
              />
              <input
                type="text"
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Last Name (optional)"
              />
              <input
                type="number"
                value={userFunds}
                onChange={(e) => setUserFunds(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Funds"
                min="0"
                step="0.01"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={userIsAdmin}
                  onChange={(e) => setUserIsAdmin(e.target.checked)}
                  className="mr-2"
                />
                Admin
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitUser} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Create
              </button>
              <button onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Email"
              />
              <input
                type="text"
                value={userFirstName}
                onChange={(e) => setUserFirstName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="First Name"
              />
              <input
                type="text"
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Last Name (optional)"
              />
              <input
                type="number"
                value={userFunds}
                onChange={(e) => setUserFunds(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Funds"
                min="0"
                step="0.01"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={userIsAdmin}
                  onChange={(e) => setUserIsAdmin(e.target.checked)}
                  className="mr-2"
                />
                Admin
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitUser} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Update
              </button>
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
