import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, Mail, Lock, Shield, CheckCircle, 
  BarChart3, Users, Activity, Database, Loader2, AlertCircle, Eye, EyeOff
} from 'lucide-react';

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

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

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
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
      // If successful, navigation happens automatically via AuthContext
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: <BarChart3 size={20} />, text: 'Comprehensive Analytics', desc: 'Visual dashboards & detailed reports' },
    { icon: <Users size={20} />, text: 'Team Management', desc: 'Manage multiple employees easily' },
    { icon: <Shield size={20} />, text: 'GDPR Compliant', desc: 'Full data protection compliance' },
    { icon: <Activity size={20} />, text: 'Real-time Updates', desc: 'Live activity tracking' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-gray-800/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        
        {/* Top Header for Mobile */}
        <div className="lg:hidden p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">WorkEye</h1>
                <p className="text-xs text-gray-400">Employee Tracking System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Panel - Signup Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="text-3xl font-bold mb-2">Create Account</h2>
              <p className="text-gray-400">Set up your admin account</p>
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
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="admin@company.com"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CheckCircle size={20} className="text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div 
                    onClick={() => !loading && setAgreeToTerms(!agreeToTerms)}
                    className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center ${agreeToTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {agreeToTerms && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer">
                  I agree to the{' '}
                  <button type="button" className="text-emerald-400 hover:text-emerald-300">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="text-emerald-400 hover:text-emerald-300">
                    Privacy Policy
                  </button>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={!agreeToTerms || loading}
                className={`w-full py-3 px-4 font-semibold rounded-xl transition-all shadow-lg ${(agreeToTerms && !loading)
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-emerald-500/25' 
                  : 'bg-gray-700 cursor-not-allowed opacity-70'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </motion.button>

              <p className="text-center text-gray-400 mt-6">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Panel - Benefits */}
        <div className="w-full lg:w-2/5 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="hidden lg:flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Activity size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">WorkEye</h1>
                <p className="text-sm text-gray-300">Employee Tracking System</p>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-4">
                Start Tracking
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Productivity
                </span>
              </h2>
              <p className="text-gray-300">
                Join thousands of companies optimizing their workforce with our enterprise-grade tracking platform.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-2 rounded-lg bg-gray-800/30 mt-1">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{benefit.text}</h3>
                    <p className="text-sm text-gray-300">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-10 p-4 bg-gray-800/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Secure & Private</p>
                <p className="text-xs text-gray-300">
                  Enterprise-grade security with end-to-end encryption
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              <Database className="inline mr-1" size={12} />
              Secure admin access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SignupPage };
export default SignupPage;
