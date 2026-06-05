import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Shield, User, Landmark, Briefcase, Wrench, Search, Crown, Check, AlertCircle, Trash2 } from 'lucide-react';

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  role?: string;
  createdAt?: any;
}

interface UsersTableProps {
  currentRole?: string;
}

export default function UsersTable({ currentRole }: UsersTableProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("UsersTable: Error listening to users:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert("Only Super Administrators can modify access levels.");
      return;
    }
    setUpdatingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err: any) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user profile: " + err.message);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'super_admin':
      case 'host':
        return <Crown size={14} className="text-amber-500 shrink-0" />;
      case 'admin':
        return <Shield size={14} className="text-rose-500 shrink-0" />;
      case 'agent':
        return <Briefcase size={14} className="text-indigo-505 shrink-0" />;
      case 'landlord':
        return <Landmark size={14} className="text-emerald-505 shrink-0" />;
      case 'maintenance':
        return <Wrench size={14} className="text-cyan-505 shrink-0" />;
      default:
        return <User size={14} className="text-zinc-405 shrink-0" />;
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'super_admin':
      case 'host':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-805';
      case 'admin':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-805';
      case 'agent':
        return 'bg-indigo-100 text-indigo-805 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-805';
      case 'landlord':
        return 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-805';
      case 'maintenance':
        return 'bg-cyan-100 text-cyan-805 dark:bg-cyan-950/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-805';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-705';
    }
  };

  const filteredUsers = users.filter(u => {
    const term = search.toLowerCase();
    const nameMatch = (u.displayName || '').toLowerCase().includes(term);
    const emailMatch = (u.email || '').toLowerCase().includes(term);
    const phoneMatch = (u.phone || '').toLowerCase().includes(term);
    const roleMatch = roleFilter === 'all' || u.role === roleFilter;

    return (nameMatch || emailMatch || phoneMatch) && roleMatch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const isSuperAdmin = currentRole === 'super_admin' || currentRole === 'host';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-950 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-850">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden md:inline">Filter Role:</span>
          {['all', 'super_admin', 'admin', 'agent', 'landlord', 'maintenance', 'guest'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                roleFilter === r
                  ? 'bg-zinc-900 text-white border-zinc-905 dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
              }`}
            >
              {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users grid / table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">
              <th className="px-6 py-2">Member / Contact</th>
              <th className="px-6 py-2 text-center">Current Role</th>
              <th className="px-6 py-2 text-right">Actions / Role Assignment</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.uid} className="bg-white dark:bg-zinc-900 group border border-zinc-100 dark:border-zinc-850 hover:shadow-sm transition-all rounded-2xl">
                <td className="px-6 py-4 rounded-l-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center shrink-0 text-brand font-black text-sm uppercase">
                      {u.displayName ? u.displayName.slice(0, 2) : 'US'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {u.displayName || 'Anonymous Member'}
                      </h4>
                      <p className="text-xs text-zinc-405 dark:text-zinc-500">{u.email}</p>
                      {u.phone && <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">{u.phone}</p>}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getRoleBadgeClass(u.role)}`}>
                      {getRoleIcon(u.role)}
                      {u.role ? u.role.replace('_', ' ') : 'guest'}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 rounded-r-2xl text-right">
                  <div className="flex items-center justify-end gap-2">
                    {updatingId === u.uid ? (
                      <span className="text-[10px] font-bold text-zinc-400 animate-pulse">Assigning...</span>
                    ) : (
                      <>
                        <select
                          value={u.role || 'guest'}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          disabled={!isSuperAdmin || updatingId !== null}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-brand cursor-pointer"
                        >
                          <option value="guest">Guest</option>
                          <option value="landlord">Landlord</option>
                          <option value="agent">Agent</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="admin">Admin</option>
                          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                        </select>

                        {/* Super Admin-Only Deletion capability */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.uid)}
                            title="Remove User"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-950/40 border-2 border-dashed border-zinc-100 dark:border-zinc-805 rounded-3xl p-6">
            <AlertCircle size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">No matching users found</p>
          </div>
        )}

        {/* Elegant Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-4 border border-zinc-100 dark:border-zinc-805 bg-zinc-50/40 dark:bg-zinc-900/40 rounded-2xl">
            <span className="text-[11px] text-zinc-500 font-medium font-sans uppercase tracking-wider">
              Showing <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> to{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
              </strong>{" "}
              of <strong className="text-zinc-800 dark:text-zinc-200">{filteredUsers.length}</strong> registered users
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? "bg-brand text-white shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
