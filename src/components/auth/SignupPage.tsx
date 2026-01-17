import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Activity, AlertCircle, Mail, Lock, User, BarChart3, Users, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

export function SignupPage() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create company username from full name
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

      if (!result.success) {
        const errorMsg = result.error || 'Signup failed';
        
        if (errorMsg.includes('not found') || errorMsg.includes('endpoint')) {
          setError('⚠️ Backend service is currently unavailable. Please try again in a few moments.');
        } else if (errorMsg.includes('already exists')) {
          setError('This email is already registered. Please use a different email or sign in.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 flex">
      <div className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            
            {/* Left Side - Branding & Features (Takes 2 columns) */}
            <div className="hidden lg:block lg:col-span-2 space-y-10 pr-8">
              {/* Logo & Title */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">TrackPro</h1>
                    <p className="text-slate-600 text-sm">Employee Tracking System</p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Comprehensive Analytics</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Get detailed insights into team productivity with visual dashboards and reports
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-7 h-7 text-pink-600" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Team Management</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Manage multiple employees and track their activities from a single dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Secure & Private</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Enterprise-grade security with encrypted data storage and access controls
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form (Takes 3 columns) */}
            <div className="lg:col-span-3 w-full max-w-md mx-auto">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl font-bold text-slate-900">TrackPro</h1>
                    <p className="text-sm text-slate-600">Employee Tracking System</p>
                  </div>
                </div>
              </div>

              {/* Signup Card */}
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
                  <p className="text-slate-600">Set up your admin account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 font-medium text-sm">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-11 pr-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-sm">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pl-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                      disabled={loading}
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer font-normal">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                {/* Sign In Link */}
                <div className="mt-6 text-center text-sm">
                  <span className="text-slate-600">Already have an account? </span>
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
