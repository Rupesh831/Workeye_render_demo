import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Eye, EyeOff, Lock, Mail, Shield, Activity, 
  TrendingUp, Smartphone, Database, Loader2, AlertCircle
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Login successful - redirect to dashboard
        console.log('✅ Login successful, redirecting to dashboard...');
        navigate('/dashboard');
      } else {
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

  const features = [
    { icon: <Activity size={20} />, text: 'Real-time Monitoring', desc: 'Track activity with automated screenshots' },
    { icon: <Shield size={20} />, text: 'Enterprise Security', desc: 'Encrypted data storage & access controls' },
    { icon: <TrendingUp size={20} />, text: 'Productivity Analytics', desc: 'Detailed insights & visual reports' },
    { icon: <Smartphone size={20} />, text: 'Cross-platform', desc: 'Access from any device' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <div className="flex w-full max-w-6xl bg-gray-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        
        {/* Left Panel - Brand & Features */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-10 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <h1 className="text-2xl font-bold">WorkEye</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Employee Tracking
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                System
              </span>
            </h2>
            <p className="text-gray-300 mb-10">Enterprise-grade workforce analytics platform</p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-gray-800/50">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.text}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-800/30 rounded-xl">
            <p className="text-sm text-gray-300">
              <Database className="inline mr-2" size={16} />
              Secure admin access only
            </p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-right mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Activity size={18} />
                </div>
                <span className="font-bold">WorkEye</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to your admin account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="admin@company.com"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff size={20} className="text-gray-500 hover:text-gray-300" />
                      ) : (
                        <Eye size={20} className="text-gray-500 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-5 h-5 rounded border ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                      {rememberMe && (
                        <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-300">Remember me</span>
                </label>
                
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="py-3 px-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="py-3 px-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              <p className="text-center text-gray-400 mt-8">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };
export default LoginPage;
