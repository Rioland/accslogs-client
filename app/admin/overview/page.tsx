"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import supabaseClient from "@/lib/supabaseClient";

export default function AdminOverviewPage() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [adminName, setAdminName] = useState<string>('');
  const router = useRouter();
  const supabase = useMemo(() => supabaseClient, []);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch users count
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          console.error('Failed to fetch users');
          return;
        }
        const data = await response.json();
        setTotalUsers(data.users?.length || 0);
      } catch (error) {
        console.error('Error fetching users:', error);
      }

      // Fetch categories count
      const { data: catData, error: catError } = await supabase
        .from('socialmedia_account_category')
        .select('*')
        .order('name');

      if (catError) {
        console.error('Error fetching categories:', catError);
        return;
      }

      setTotalCategories(catData?.length || 0);

      // Fetch admin profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }

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
    };

    fetchData();
  }, [supabase, router]);

  return (
    <>
      <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{adminName ? `${adminName}'s Admin Dashboard` : 'Admin Dashboard'}</h1>

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
    </>
  );
}
