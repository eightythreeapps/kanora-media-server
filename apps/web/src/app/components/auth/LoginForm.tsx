import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormData {
  username: string;
  pin?: string;
}

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const success = await login(data.username, data.pin || undefined);
      if (success) {
        navigate('/dashboard');
      } else {
        setError(
          "Hmm, those credentials don't match our records. Give it another try?",
        );
      }
    } catch (err) {
      setError('Oops! Something went wrong on our end. Try again in a moment.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your music collection is ready for you
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
              placeholder="Enter your username"
              className={`w-full px-3 py-2 border ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('username', {
                required: 'Username is required',
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
            htmlFor="pin"
            className="block text-sm font-medium text-gray-700"
          >
            PIN (if required)
          </label>
          <div className="mt-1">
            <input
              id="pin"
              type="password"
              autoComplete="current-password"
              placeholder="Your PIN"
              className={`w-full px-3 py-2 border ${
                errors.pin ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              {...register('pin')}
            />
            {errors.pin && (
              <p className="mt-1 text-sm text-red-600">{errors.pin.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label
            htmlFor="remember-me"
            className="block ml-2 text-sm text-gray-900"
          >
            Remember me
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div className="text-xs text-center text-gray-600">
        Kanora - Your personal music collection
      </div>
    </div>
  );
};
