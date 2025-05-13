import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { User, UserListResponse } from '@kanora/shared-types';
import { useAuth } from '../../contexts/AuthContext';

interface UserListState {
  users: User[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const UserList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<UserListState>({
    users: [],
    loading: true,
    error: null,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchUsers = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await ApiService.listUsers(
        state.page,
        state.pageSize,
        state.sortBy,
        state.sortOrder,
      );

      if (response.success && response.data) {
        const data = response.data as UserListResponse;
        setState((prev) => ({
          ...prev,
          users: data.users || [],
          totalPages: data.pagination?.totalPages || 0,
          totalCount: data.pagination?.totalCount || 0,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: response.error || 'Failed to fetch users',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setState((prev) => ({
        ...prev,
        error: 'An unexpected error occurred',
        loading: false,
      }));
    }
  };

  useEffect(() => {
    // Only allow admins to access this component
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchUsers();
  }, [
    state.page,
    state.pageSize,
    state.sortBy,
    state.sortOrder,
    user,
    navigate,
  ]);

  const handleSort = (field: string) => {
    setState((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage: number) => {
    setState((prev) => ({ ...prev, page: newPage }));
  };

  const handleDisableUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to disable this user?')) {
      return;
    }

    try {
      const response = await ApiService.disableUser(id);

      if (response.success) {
        // Refresh the user list
        fetchUsers();
      } else {
        setState((prev) => ({
          ...prev,
          error: response.error || 'Failed to disable user',
        }));
      }
    } catch (error) {
      console.error('Error disabling user:', error);
      setState((prev) => ({
        ...prev,
        error: 'An unexpected error occurred',
      }));
    }
  };

  const handleEditUser = (id: string) => {
    navigate(`/admin/users/${id}`);
  };

  const handleCreateUser = () => {
    navigate('/admin/users/new');
  };

  if (state.loading && state.users.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Create User
        </button>
      </div>

      {state.error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-300 rounded-md">
          {state.error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {state.sortBy === 'email' && (
                      <span className="ml-1">
                        {state.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('displayName')}
                >
                  <div className="flex items-center">
                    Display Name
                    {state.sortBy === 'displayName' && (
                      <span className="ml-1">
                        {state.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    {state.sortBy === 'role' && (
                      <span className="ml-1">
                        {state.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    {state.sortBy === 'createdAt' && (
                      <span className="ml-1">
                        {state.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('disabled')}
                >
                  <div className="flex items-center">
                    Status
                    {state.sortBy === 'disabled' && (
                      <span className="ml-1">
                        {state.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.displayName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {user.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditUser(user.id)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </button>
                    {!user.disabled && (
                      <button
                        onClick={() => handleDisableUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Disable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {state.users.length > 0
                    ? (state.page - 1) * state.pageSize + 1
                    : 0}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(state.page * state.pageSize, state.totalCount)}
                </span>{' '}
                of <span className="font-medium">{state.totalCount}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(state.page - 1)}
                  disabled={state.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                    state.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: state.totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        state.page === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() => handlePageChange(state.page + 1)}
                  disabled={state.page === state.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                    state.page === state.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
