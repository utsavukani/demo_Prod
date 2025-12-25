import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Mail, Shield, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { sendOTP, login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp' | 'onboarding'>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Onboarding data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [allowanceAmount, setAllowanceAmount] = useState<number>(5000);
  const [hasPartTimeJob, setHasPartTimeJob] = useState(false);
  const [typicalSpendCategories, setTypicalSpendCategories] = useState<string[]>([]);

  const categories = ['Food', 'Transport', 'Academic', 'Entertainment', 'Shopping', 'Bills'];

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await sendOTP(email, role);
    if (success) {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check if this is a new user (for demo, assume emails not in our test data are new)
    const testEmails = [
      'aisha@example.com', 'rohit@example.com', 'meera@example.com', 'kunal@example.com',
      'farida@example.com', 'mahesh@example.com', 'priya@example.com', 'arun@example.com'
    ];
    
    const isExistingUser = testEmails.includes(email);
    
    if (isExistingUser) {
      // Existing user - login directly
      const success = await login(email, otp);
      if (!success) {
        setLoading(false);
      }
    } else {
      // New user - go to onboarding
      setStep('onboarding');
      setLoading(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const onboardingData = role === 'student' ? {
      name,
      phone,
      onboardingData: {
        allowanceAmount,
        hasPartTimeJob,
        typicalSpendCategories
      }
    } : {
      name,
      phone
    };
    
    const success = await login(email, otp, onboardingData);
    if (!success) {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setTypicalSpendCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <Wallet className="h-12 w-12 text-white" />
            <span className="ml-3 text-3xl font-bold text-white">FinanceApp</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-6">
            Smart Money Management for Indian Students
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Track expenses, save smartly, and stay connected with family. Built for the unique needs of Indian college students.
          </p>
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <Shield className="h-5 w-5 mr-3" />
              <span>AI-powered expense categorization</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Shield className="h-5 w-5 mr-3" />
              <span>Goal-based savings with micro-investments</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Shield className="h-5 w-5 mr-3" />
              <span>Parent connection for allowance management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <Wallet className="h-10 w-10 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">FinanceApp</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {step === 'email' && 'Welcome'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'onboarding' && 'Complete Setup'}
            </h2>
            <p className="mt-2 text-gray-600">
              {step === 'email' && 'Enter your email to get started'}
              {step === 'otp' && `We sent a code to ${email}`}
              {step === 'onboarding' && 'Tell us a bit about yourself'}
            </p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      role === 'student'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('parent')}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      role === 'parent'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Parent
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Demo OTP: <span className="font-mono font-bold">123456</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to email
              </button>
            </form>
          )}

          {step === 'onboarding' && (
            <form onSubmit={handleOnboarding} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Allowance (₹)
                    </label>
                    <input
                      type="number"
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5000"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Do you have a part-time job?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setHasPartTimeJob(true)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          hasPartTimeJob
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasPartTimeJob(false)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          !hasPartTimeJob
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      What do you typically spend on? (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                            typicalSpendCategories.includes(category)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              <br />
              <span className="font-semibold text-yellow-600">Demo Mode: No real money involved</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;