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
  username: string;
  email?: string;
  displayName: string;
  role: string;
  pin?: string;
  confirmPin?: string;
}

export const UserForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = id !== 'new';

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    displayName: '',
    role: 'user',
    pin: '',
    confirmPin: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removePin, setRemovePin] = useState<boolean>(false);

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
              username: userData.username || '',
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
      if (!formData.username || !formData.displayName) {
        setError('Username and display name are required');
        setLoading(false);
        return;
      }

      if (formData.pin && formData.pin !== formData.confirmPin) {
        setError('PINs do not match');
        setLoading(false);
        return;
      }

      // Validate PIN if provided
      if (formData.pin) {
        // PIN should be numeric
        if (!/^\d+$/.test(formData.pin)) {
          setError('PIN must contain only digits');
          setLoading(false);
          return;
        }

        // PIN length validation
        if (formData.pin.length < 4) {
          setError('PIN must be at least 4 digits');
          setLoading(false);
          return;
        }

        if (formData.pin.length > 8) {
          setError('PIN must not exceed 8 digits');
          setLoading(false);
          return;
        }
      }

      // Prepare data for API
      let response;

      if (isEditMode && id) {
        // Update existing user
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
        };

        // Handle PIN changes
        if (formData.pin) {
          updateData.pin = formData.pin;
        } else if (removePin) {
          updateData.removePin = true;
        }

        response = await ApiService.updateUser(id, updateData);
      } else {
        // Create new user
        const createData: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
        };

        if (formData.pin) {
          createData.pin = formData.pin;
        }

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
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isEditMode} // Username shouldn't be editable once created
              />
              {!isEditMode && (
                <p className="mt-1 text-sm text-gray-500">
                  Username must contain only letters, numbers, and underscores
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                {isEditMode ? 'PIN Settings' : 'Set PIN'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                PIN is optional. Users without a PIN can login with just their username.
              </p>

              {isEditMode && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="removePin"
                      checked={removePin}
                      onChange={(e) => {
                        setRemovePin(e.target.checked);
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, pin: '', confirmPin: '' }));
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="removePin" className="ml-2 text-sm text-gray-700">
                      Remove PIN (Allow login without PIN)
                    </label>
                  </div>
                </div>
              )}

              {!removePin && (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="pin"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      PIN
                    </label>
                    <input
                      type="password"
                      id="pin"
                      name="pin"
                      value={formData.pin || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="4-8 digits"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      PIN must be 4-8 digits
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="confirmPin"
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      id="confirmPin"
                      name="confirmPin"
                      value={formData.confirmPin || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </>
              )}
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
