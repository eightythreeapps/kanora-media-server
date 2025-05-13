import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '@kanora/data-access';

interface SetupFormData {
  username: string;
  email: string;
  displayName: string;
  pin: string;
  confirmPin: string;
}

export const SetupForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    defaultValues: {
      username: 'admin',
      email: '',
      displayName: 'Administrator',
      pin: '',
      confirmPin: '',
    },
  });

  const pin = watch('pin');

  const onSubmit = async (data: SetupFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Validate PIN match
    if (data.pin !== data.confirmPin) {
      setError("The PINs you entered don't match. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Create admin user
      const response = await ApiService.createUser({
        username: data.username,
        email: data.email,
        displayName: data.displayName,
        pin: data.pin,
        role: 'admin',
      });

      if (response.success) {
        // Try to log in with the new credentials
        const loginResponse = await ApiService.login({
          username: data.username,
          pin: data.pin,
        });

        if (loginResponse.success) {
          navigate('/dashboard');
        } else {
          navigate('/login', {
            state: {
              message:
                'Setup complete! You can now log in with your new account.',
            },
          });
        }
      } else {
        setError(
          response.error ||
            'Something went wrong during setup. Please try again.',
        );
      }
    } catch (err) {
      setError(
        'We encountered an error setting up your account. Please try again.',
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Kanora</h1>
        <p className="mt-2 text-sm text-gray-600">
          Let's set up your music server
        </p>
      </div>

      {error && (
        <div
          className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
          role="alert"
        >
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <div className="mt-1">
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              className={`w-full px-3 py-2 border ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('username', {
                required: 'Username is required',
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Letters, numbers, and underscores only',
                },
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700"
          >
            Display Name
          </label>
          <div className="mt-1">
            <input
              id="displayName"
              type="text"
              placeholder="Your name as shown in the app"
              className={`w-full px-3 py-2 border ${
                errors.displayName ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('displayName', {
                required: 'Display name is required',
              })}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.displayName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email (optional)
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="For account recovery"
              className={`w-full px-3 py-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="pin"
            className="block text-sm font-medium text-gray-700"
          >
            PIN
          </label>
          <div className="mt-1">
            <input
              id="pin"
              type="password"
              placeholder="4-8 digits"
              className={`w-full px-3 py-2 border ${
                errors.pin ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('pin', {
                required: 'Please set a PIN for security',
                pattern: {
                  value: /^\d{4,8}$/,
                  message: 'PIN must be 4-8 digits',
                },
              })}
            />
            {errors.pin && (
              <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPin"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm PIN
          </label>
          <div className="mt-1">
            <input
              id="confirmPin"
              type="password"
              placeholder="Enter the same PIN again"
              className={`w-full px-3 py-2 border ${
                errors.confirmPin ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('confirmPin', {
                required: 'Please confirm your PIN',
                validate: (value) => value === pin || "PINs don't match",
              })}
            />
            {errors.confirmPin && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPin.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting Up...' : 'Complete Setup'}
          </button>
        </div>
      </form>

      <div className="text-xs text-center text-gray-600">
        Kanora - Your personal music collection
      </div>
    </div>
  );
};
