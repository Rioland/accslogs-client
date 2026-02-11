"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../dashboard/Sidebar";
import { Menu, X, Home, Users, Folder, Settings } from "lucide-react";
import Navbar1 from "../components/Navbar1";
import Navbar2 from "../components/Navbar2";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import supabaseClient from "@/lib/supabaseClient";

interface Category {
  id: number;
  name: string;
  created_at: string;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  funds: number;
  is_admin: boolean;
}

const adminItems = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "users", label: "Users", icon: Users },
  { key: "categories", label: "Categories", icon: Folder },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const [activeKey, setActiveKey] = useState<string>(adminItems[0].key);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddSubcategory, setShowAddSubcategory] = useState<number | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
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

  const handleChange = async (key: string) => {
    if (key === "sign-out") {
      await supabase.auth.signOut();
      router.push('/login');
    } else {
      setActiveKey(key);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data: catData, error: catError } = await supabase
      .from('socialmedia_account_category')
      .select('*')
      .order('name');

    if (catError) {
      console.error('Error fetching categories:', catError);
      setLoading(false);
      return;
    }

    const { data: subData, error: subError } = await supabase
      .from('socialmedia_account_subcategory')
      .select('*')
      .order('name');

    if (subError) {
      console.error('Error fetching subcategories:', subError);
      setLoading(false);
      return;
    }

    setCategories(catData || []);
    setSubcategories(subData || []);
    setTotalCategories(catData?.length || 0);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        console.error('Failed to fetch users');
        return;
      }
      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.users?.length || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddCategory = () => {
    setCategoryName('');
    setShowAddCategory(true);
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryName(cat.name);
    setEditingCategory(cat);
  };

  const submitCategory = async () => {
    if (!categoryName.trim()) return;
    if (editingCategory) {
      await editCategory(editingCategory.id, categoryName.trim());
    } else {
      await addCategory(categoryName.trim());
    }
    setCategoryName('');
  };

  const addCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('socialmedia_account_category')
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
      return;
    }

    setCategories([...categories, data]);
    setShowAddCategory(false);
  };

  const editCategory = async (id: number, name: string) => {
    const { data, error } = await supabase
      .from('socialmedia_account_category')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      alert('Error updating category');
      return;
    }

    setCategories(categories.map(cat => cat.id === id ? data : cat));
    setEditingCategory(null);
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase
      .from('socialmedia_account_category')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
      return;
    }

    setCategories(categories.filter(cat => cat.id !== id));
    setSubcategories(subcategories.filter(sub => sub.category_id !== id));
  };

  const handleAddSubcategory = (categoryId: number) => {
    setSubcategoryName('');
    setShowAddSubcategory(categoryId);
  };

  const handleEditSubcategory = (sub: Subcategory) => {
    setSubcategoryName(sub.name);
    setEditingSubcategory(sub);
  };

  const submitSubcategory = async () => {
    if (!subcategoryName.trim()) return;
    if (editingSubcategory) {
      await editSubcategory(editingSubcategory.id, subcategoryName.trim());
    } else if (showAddSubcategory) {
      await addSubcategory(showAddSubcategory, subcategoryName.trim());
    }
    setSubcategoryName('');
  };

  const addSubcategory = async (categoryId: number, name: string) => {
    const { data, error } = await supabase
      .from('socialmedia_account_subcategory')
      .insert({ category_id: categoryId, name })
      .select()
      .single();

    if (error) {
      console.error('Error adding subcategory:', error);
      alert('Error adding subcategory');
      return;
    }

    setSubcategories([...subcategories, data]);
    setShowAddSubcategory(null);
  };

  const editSubcategory = async (id: number, name: string) => {
    const { data, error } = await supabase
      .from('socialmedia_account_subcategory')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subcategory:', error);
      alert('Error updating subcategory');
      return;
    }

    setSubcategories(subcategories.map(sub => sub.id === id ? data : sub));
    setEditingSubcategory(null);
  };

  const deleteSubcategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    const { error } = await supabase
      .from('socialmedia_account_subcategory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subcategory:', error);
      alert('Error deleting subcategory');
      return;
    }

    setSubcategories(subcategories.filter(sub => sub.id !== id));
  };

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
    const checkAdmin = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        router.push('/login');
        return;
      }

      // Fetch admin profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        const name = profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email;
        setAdminName(name);
      }

      setIsAdmin(true);
      // Fetch data after confirming admin
      await fetchCategories();
      await fetchUsers();
    };

    checkAdmin();
  }, [supabase, router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#e4e9ee] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      {/* Top bar for mobile with menu toggle */}
      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">Admin Panel</span>
        </div>
      </div>

      <div className="w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop static */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey={activeKey} onChange={handleChange} items={adminItems} />
        </div>

        {/* Sidebar: mobile off-canvas */}
        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">Menu</span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey={activeKey}
                    onChange={(key) => {
                      handleChange(key);
                      setMobileOpen(false);
                    }}
                    items={adminItems}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content column */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{adminName ? `${adminName}'s Admin Dashboard` : 'Admin Dashboard'}</h1>

          {activeKey === "overview" && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-amber-600 font-semibold">Welcome to Admin Panel</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Admin Access</span>
                </div>
              </div>

              {/* Overview content */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Total Users", icon: "👥", value: totalUsers },
                  { title: "Categories", icon: "📂", value: totalCategories },
                  { title: "Reports", icon: "📊", value: 0 },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl border border-amber-300/60 bg-white p-5 md:p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-amber-600">
                      <div className="text-2xl md:text-3xl" aria-hidden>{c.icon}</div>
                      <div className="font-semibold text-gray-800">{c.title}</div>
                      <div className="text-xl md:text-2xl font-bold">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeKey === "categories" && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Manage Categories & Subcategories</h2>
                <button onClick={handleAddCategory} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                  Add Category
                </button>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="border border-gray-200 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{cat.name}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditCategory(cat)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                            Edit
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                            Delete
                          </button>
                          <button onClick={() => handleAddSubcategory(cat.id)} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                            Add Subcategory
                          </button>
                        </div>
                      </div>
                      <div className="ml-4 space-y-1">
                        {subcategories.filter((sub) => sub.category_id === cat.id).map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{sub.name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditSubcategory(sub)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                Edit
                              </button>
                              <button onClick={() => deleteSubcategory(sub.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeKey === "users" && (
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
          )}

          {activeKey === "settings" && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
              <h2 className="text-lg font-semibold mb-4">Settings</h2>
              {/* Settings coming soon */}
              <p>Settings coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Category</h3>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Category name"
            />
            <div className="flex gap-2">
              <button onClick={submitCategory} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Add
              </button>
              <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Category name"
            />
            <div className="flex gap-2">
              <button onClick={submitCategory} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Update
              </button>
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Subcategory</h3>
            <input
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Subcategory name"
            />
            <div className="flex gap-2">
              <button onClick={submitSubcategory} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Add
              </button>
              <button onClick={() => setShowAddSubcategory(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Subcategory</h3>
            <input
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Subcategory name"
            />
            <div className="flex gap-2">
              <button onClick={submitSubcategory} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
                Update
              </button>
              <button onClick={() => setEditingSubcategory(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      <Footer />
    </div>
  );
}
