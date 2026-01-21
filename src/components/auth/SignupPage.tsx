// UPDATED: 2026-01-21 18:11 IST - Neumorphic Design
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, UserPlus } from 'lucide-react';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const companyUsername = formData.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const result = await signup({
        company_username: companyUsername,
        company_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName
      });

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err: any) {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-[#e8ecf3] rounded-3xl p-8"
        style={{ boxShadow: '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '6px 6px 12px rgba(99, 102, 241, 0.4), -3px -3px 8px rgba(255, 255, 255, 0.8)' }}
          >
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-gray-600">Start your free trial today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start space-x-3"
            style={{ boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name / Company Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe or Acme Corp"
                className="w-full pl-12 pr-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full pl-12 pr-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-3">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="sr-only"
                disabled={loading}
              />
              <div 
                onClick={() => !loading && setAgreeToTerms(!agreeToTerms)}
                className={`w-5 h-5 rounded cursor-pointer transition-all ${
                  agreeToTerms 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                    : 'bg-[#e8ecf3]'
                }`}
                style={{ 
                  boxShadow: agreeToTerms 
                    ? '3px 3px 6px rgba(99, 102, 241, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)'
                    : 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff' 
                }}
              >
                {agreeToTerms && (
                  <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <label className="text-sm text-gray-700 leading-relaxed">
              I agree to the{' '}
              <span className="font-semibold text-indigo-600">Terms of Service</span>
              {' '}and{' '}
              <span className="font-semibold text-indigo-600">Privacy Policy</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            style={{ boxShadow: '6px 6px 12px rgba(99, 102, 241, 0.4), -3px -3px 8px rgba(255, 255, 255, 0.7)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
