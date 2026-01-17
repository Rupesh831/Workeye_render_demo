import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Loader2, Activity, AlertCircle, Lock, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        const errorMsg = result.error || 'Login failed';
        
        if (errorMsg.includes('not found') || errorMsg.includes('endpoint')) {
          setError('⚠️ Backend service is currently unavailable. Please try again in a few moments.');
        } else if (errorMsg.includes('Invalid credentials') || errorMsg.includes('password')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (errorMsg.includes('not found')) {
          setError('No account found with this email. Please sign up first.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
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
                    <Activity className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-time Monitoring</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Track employee activity and productivity in real-time with automated screenshots
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-7 h-7 text-purple-600" />
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

            {/* Right Side - Login Form (Takes 3 columns) */}
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

              {/* Login Card */}
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-600">Sign in to your admin account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Alert */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

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
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        required
                        disabled={loading}
                        className="h-12 pl-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        required
                        disabled={loading}
                        className="h-12 pl-11 pr-11 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        autoComplete="current-password"
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

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-normal">
                      Remember me
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-6 text-center text-sm">
                  <span className="text-slate-600">Don't have an account? </span>
                  <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                    Sign up
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 text-sm text-slate-500">
                <p>Secure admin access only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
