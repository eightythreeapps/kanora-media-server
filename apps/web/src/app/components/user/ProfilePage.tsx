import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiService } from '@kanora/data-access';

interface ProfileFormData {
  displayName: string;
  email?: string;
  currentPin?: string;
  newPin?: string;
  confirmPin?: string;
  removePin?: boolean;
}

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    currentPin: '',
    newPin: '',
    confirmPin: '',
    removePin: false,
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));

      // If removePin is checked, clear the PIN fields
      if (name === 'removePin' && checked) {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
          currentPin: '',
          newPin: '',
          confirmPin: '',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.displayName) {
        setError('Display name is required');
        setLoading(false);
        return;
      }

      // Validate PIN if changing it
      if (formData.newPin && formData.newPin !== formData.confirmPin) {
        setError('New PINs do not match');
        setLoading(false);
        return;
      }

      // Validate PIN format if provided
      if (formData.newPin) {
        // PIN should be numeric
        if (!/^\d+$/.test(formData.newPin)) {
          setError('PIN must contain only digits');
          setLoading(false);
          return;
        }

        // PIN length validation
        if (formData.newPin.length < 4) {
          setError('PIN must be at least 4 digits');
          setLoading(false);
          return;
        }

        if (formData.newPin.length > 8) {
          setError('PIN must not exceed 8 digits');
          setLoading(false);
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        displayName: formData.displayName,
        email: formData.email,
      };

      // Handle PIN changes
      if (formData.removePin) {
        updateData.removePin = true;
      } else if (formData.newPin) {
        updateData.newPin = formData.newPin;
        if (user?.hasPin) {
          updateData.currentPin = formData.currentPin;
        }
      }

      // Call API to update profile
      const response = await ApiService.updateProfile(updateData);

      if (response.success) {
        setSuccess('Profile updated successfully');

        // Update local user data
        if (updateUser && response.data) {
          updateUser(response.data);
        }

        // Reset form
        setFormData((prev) => ({
          ...prev,
          currentPin: '',
          newPin: '',
          confirmPin: '',
          removePin: false,
        }));

        // Exit edit mode
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
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
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="displayName"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Display Name
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

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Email (optional)
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

              <div className="py-4 mb-6 border-t border-b border-gray-200">
                <h3 className="mb-4 text-lg font-medium text-gray-900">
                  PIN Settings
                </h3>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="removePin"
                      name="removePin"
                      checked={formData.removePin}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label
                      htmlFor="removePin"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Remove PIN (allow login without PIN)
                    </label>
                  </div>
                </div>

                {!formData.removePin && (
                  <>
                    {user?.hasPin && (
                      <div className="mb-4">
                        <label
                          htmlFor="currentPin"
                          className="block mb-2 text-sm font-medium text-gray-700"
                        >
                          Current PIN
                        </label>
                        <input
                          type="password"
                          id="currentPin"
                          name="currentPin"
                          value={formData.currentPin || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}

                    <div className="mb-4">
                      <label
                        htmlFor="newPin"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        {user?.hasPin ? 'New PIN' : 'PIN'}
                      </label>
                      <input
                        type="password"
                        id="newPin"
                        name="newPin"
                        value={formData.newPin || ''}
                        onChange={handleChange}
                        placeholder="4-8 digits"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  onClick={() => setIsEditing(false)}
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Display Name
                    </p>
                    <p className="text-gray-900">{user.displayName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      PIN Protected
                    </p>
                    <p className="text-gray-900">{user.hasPin ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Account Role
                    </p>
                    <p className="text-gray-900">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Member Since
                    </p>
                    <p className="text-gray-900">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
