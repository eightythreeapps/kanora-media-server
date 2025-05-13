import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';
import { useAuth } from '../../contexts/AuthContext';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from '@kanora/shared-types';

interface UserFormData {
  email: string;
  displayName: string;
  role: string;
  password: string;
  confirmPassword: string;
}

export const UserForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    displayName: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data if in edit mode
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (isEditMode && id) {
      const fetchUser = async () => {
        try {
          const response = await ApiService.getUserById(id);

          if (response.success && response.data) {
            const userData = response.data as User;
            setFormData((prev) => ({
              ...prev,
              email: userData.email || '',
              displayName: userData.displayName || '',
              role: userData.role || 'user',
            }));
          } else {
            setError(response.error || 'Failed to fetch user');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
          setError('An unexpected error occurred');
        } finally {
          setLoadingUser(false);
        }
      };

      fetchUser();
    }
  }, [id, isEditMode, navigate, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (
        !formData.email ||
        !formData.displayName ||
        (!isEditMode && !formData.password)
      ) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!isEditMode && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Prepare data for API
      let response;

      if (isEditMode && id) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
        };

        // Only add password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        response = await ApiService.updateUser(id, updateData);
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
          password: formData.password,
        };

        response = await ApiService.createUser(createData);
      }

      if (response.success) {
        setSuccess(`User ${isEditMode ? 'updated' : 'created'} successfully`);

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/admin/users');
        }, 1500);
      } else {
        setError(
          response.error ||
            `Failed to ${isEditMode ? 'update' : 'create'} user`,
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} user:`,
        error,
      );
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit' : 'Create'} User
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Update user information'
              : 'Add a new user to the system'}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-300 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 text-green-700 bg-green-100 border border-green-300 rounded-md">
            {success}
          </div>
        )}

        <div className="p-6 bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="displayName"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="role"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="mt-6 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditMode ? 'Change Password' : 'Set Password'}
              </h3>
              {isEditMode && (
                <p className="text-sm text-gray-600 mb-4">
                  Leave blank to keep the current password
                </p>
              )}

              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Password{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required={!isEditMode}
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Confirm Password{' '}
                  {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required={!isEditMode}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={loading}
              >
                {loading
                  ? 'Saving...'
                  : isEditMode
                    ? 'Update User'
                    : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
