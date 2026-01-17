import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Building2, CheckCircle2, AlertCircle, Sparkles, Shield, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

export function SignupPage() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    companyUsername: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset username availability check when typing
    if (field === 'companyUsername') {
      setUsernameAvailable(null);
      setError(''); // Clear errors when user starts typing
    }
  };

  const validateUsername = (username: string) => {
    // Username validation: lowercase letters, numbers, hyphens only
    const regex = /^[a-z0-9-]+$/;
    return regex.test(username) && username.length >= 3 && username.length <= 50;
  };

  const handleUsernameBlur = () => {
    const { companyUsername } = formData;
    if (companyUsername && validateUsername(companyUsername)) {
      setUsernameAvailable(true);
    } else if (companyUsername) {
      setUsernameAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (!validateUsername(formData.companyUsername)) {
      setError('Company username must be 3-50 characters and contain only lowercase letters, numbers, and hyphens');
      return;
    }

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
      const result = await signup({
        company_username: formData.companyUsername,
        company_name: formData.companyName,
        email: formData.email,
        password: formData.password,
        full_name: formData.companyName
      });

      if (!result.success) {
        // Better error messages
        const errorMsg = result.error || 'Signup failed';
        
        if (errorMsg.includes('not found') || errorMsg.includes('endpoint')) {
          setError('⚠️ Backend service is currently unavailable. Please try again in a few moments.');
        } else if (errorMsg.includes('already exists')) {
          setError('This company username or email is already registered. Please try a different one.');
        } else {
          setError(errorMsg);
        }
      }
      // Success is handled by AuthContext (auto-login and redirect)
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Marketing Content */}
          <div className="hidden lg:block text-white space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">Trusted by 1000+ Companies</span>
              </div>
              
              <h1 className="text-5xl font-bold leading-tight">
                Start Monitoring Your Team's
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Productivity Today
                </span>
              </h1>
              
              <p className="text-xl text-blue-100">
                Get real-time insights, track activities, and boost team performance with Work-Eye's comprehensive monitoring solution.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure & Private</h3>
                  <p className="text-blue-100 text-sm">Enterprise-grade security with end-to-end encryption</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Team Management</h3>
                  <p className="text-blue-100 text-sm">Manage unlimited team members with role-based access</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Custom Dashboard</h3>
                  <p className="text-blue-100 text-sm">Get your own branded dashboard URL</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full">
            {/* Logo & Header for Mobile */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 shadow-lg border border-white/20">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Work-Eye</h1>
              <p className="text-blue-200">Start your free trial today</p>
            </div>

            {/* Signup Form Card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h2>
                <p className="text-slate-600">Get started with your company dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Company Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="companyUsername" className="text-slate-700 font-medium">
                    Company Username <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyUsername"
                      type="text"
                      placeholder="your-company"
                      value={formData.companyUsername}
                      onChange={(e) => handleChange('companyUsername', e.target.value.toLowerCase())}
                      onBlur={handleUsernameBlur}
                      required
                      disabled={loading}
                      className="h-12 pr-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {usernameAvailable !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameAvailable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Your dashboard: <span className="font-medium text-slate-700">workeye.com/{formData.companyUsername || 'your-company'}</span>
                  </p>
                </div>

                {/* Company Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-slate-700 font-medium">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Corporation"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Admin Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Password Fields Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 pr-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Company Account
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Already have an account?</span>
                </div>
              </div>

              {/* Sign In Link */}
              <Link to="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 font-semibold transition-all"
                >
                  Sign In to Existing Account
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-sm text-blue-200">
              <p>© 2026 Work-Eye. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
