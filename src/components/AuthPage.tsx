import { useState } from 'react';
import { User } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';


type AuthMode = 'login' | 'signup';
type SignupStep = 'email' | 'otp' | 'details' | 'success';

interface AuthPageProps {
  onLogin: (user: User) => void;
}



export function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('email');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('');
  const [teacherOrNgoName, setTeacherOrNgoName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  
  // Error states
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');

const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoginError('');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    setLoginError('Invalid email or password');
    return;
  }

  const userId = data.user.id;

  // 1️⃣ Get base user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    setLoginError('User record not found');
    return;
  }

  // 2️⃣ Get role-specific profile
  let profileData = null;

  if (user.role === 'student') {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', userId)
      .single();
    profileData = data;
  }

  if (user.role === 'teacher') {
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('teacher_id', userId)
      .single();
    profileData = data;
  }

  // 3️⃣ Send to App.tsx
  onLogin({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: profileData?.name,
    grade: profileData?.grade
  });
};

const handleEmailCheck = (e: React.FormEvent) => {
  e.preventDefault();
  setSignupError('');

  if (!email) {
    setSignupError('Please enter email');
    return;
  }

  setSignupStep('otp');
};


const handleOtpVerify = (e: React.FormEvent) => {
  e.preventDefault();
  setSignupError('');

  if (otp !== '1234') {
    setSignupError('Invalid OTP');
    return;
  }

  setSignupStep('details');
};



const handleSignupComplete = async (e: React.FormEvent) => {
  e.preventDefault();
  setSignupError('');

  // 1. Check if email already exists in users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    setSignupError('Email already registered. Please login.');
    return;
  }

  // 2. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error || !data.user) {
    setSignupError(error?.message || 'Signup failed');
    return;
  }

  const userId = data.user.id;

  // 3. Insert into users table
  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    email,
    role
  });

  if (userError) {
    setSignupError(userError.message);
    return;
  }

  // 4. Role specific insert
 if (role === 'student') {
  const { error } = await supabase.from('students').insert({
    student_id: userId,
    name: fullName,
    grade,
    teacher_name: teacherOrNgoName,
    difficulty_score: 100   // ✅ ADD THIS LINE
  });

  if (error) {
    setSignupError(error.message);
    return;
  }
}

    

  if (role === 'teacher') {
    const { error } = await supabase.from('teachers').insert({
      teacher_id: userId,
      name: fullName
    });

    if (error) {
      setSignupError(error.message);
      return;
    }
  }

  // 5. Success
  setSignupStep('success');

  setTimeout(() => {
    setMode('login');
    setSignupStep('email');
    setEmail('');
    setPassword('');
    setOtp('');
    setFullName('');
    setGrade('');
    setTeacherOrNgoName('');
  }, 1500);
};



 const switchToSignup = () => {
  setMode('signup');
  setSignupStep('email');
  setLoginError('');
  setSignupError('');
  setEmail('');
  setPassword('');
};


const switchToLogin = () => {
  setMode('login');
  setLoginError('');
  setSignupError('');
  setEmail('');
  setPassword('');
};


  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Diagonal Background */}
      <AnimatePresence mode="wait">
        {mode === 'login' ? (
          <motion.div
            key="login-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #9333ea 0%, #9333ea 50%, white 50%, white 100%)'
            }}
          />
        ) : (
          <motion.div
            key="signup-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(-135deg, white 0%, white 50%, #9333ea 50%, #9333ea 100%)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Form Container */}
      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <>
              {/* Login Form - Left Side */}
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="absolute left-0 top-0 h-full flex items-center justify-center w-1/2 px-8"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                  <h1 className="text-center text-purple-600 mb-8">Welcome Back to StudySaathi</h1>
              
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>

                    {loginError && (
                      <div className="text-red-500 text-sm">{loginError}</div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Login
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={switchToSignup}
                        className="text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  </form>


                </div>
              </motion.div>

              {/* Welcome Text - Right Side */}
              <motion.div
                key="login-welcome"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
                className="absolute right-0 top-0 h-full flex items-center justify-center w-1/2 px-8"
              >
                <div className="text-center max-w-md">
                  <h1 className="text-white mb-6">Welcome to StudySaathi</h1>
                  <p className="text-white text-lg leading-relaxed opacity-90">
                    Your personalized learning companion powered by AI. 
                    Adaptive learning that grows with you.
                  </p>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* Welcome Text - Left Side */}
              <motion.div
                key="signup-welcome"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="absolute left-0 top-0 h-full flex items-center justify-center w-1/2 px-8"
              >
                <div className="text-center max-w-md">
                  <h1 className="text-white mb-6">Welcome to StudySaathi</h1>
                  <p className="text-white text-lg leading-relaxed opacity-90">
                    Join thousands of students on a journey of personalized learning. 
                    Start your adventure today!
                  </p>
                </div>
              </motion.div>

              {/* Signup Form - Right Side */}
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
                className="absolute right-0 top-0 h-full flex items-center justify-center w-1/2 px-8"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                  <h1 className="text-center text-purple-600 mb-8">Create Your StudySaathi Account</h1>

                  {signupStep === 'email' && (
                    <form onSubmit={handleEmailCheck} className="space-y-6">
                      <div>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      {signupError && (
                        <div className="text-red-500 text-sm">{signupError}</div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Verify Email
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={switchToLogin}
                          className="text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          Back to Login
                        </button>
                      </div>
                    </form>
                  )}

                  {signupStep === 'otp' && (
                    <form onSubmit={handleOtpVerify} className="space-y-6">
                      <div>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center tracking-widest"
                          maxLength={6}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">An OTP has been sent to your email.</p>
                        <p className="text-sm text-purple-600 mt-1">Demo: Use "1234" as OTP</p>
                      </div>

                      {signupError && (
                        <div className="text-red-500 text-sm">{signupError}</div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Verify OTP
                      </button>
                    </form>
                  )}

                  {signupStep === 'details' && (
                    <form onSubmit={handleSignupComplete} className="space-y-6">
                      <div>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>

                      {role === 'student' && (
                        <div>
                          <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                          >
                            <option value="">Select Grade</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="Grade 7">Grade 7</option>
                            <option value="Grade 8">Grade 8</option>
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          placeholder="Teacher / NGO Name"
                          value={teacherOrNgoName}
                          onChange={(e) => setTeacherOrNgoName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                          minLength={6}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Create Account
                      </button>
                    </form>
                  )}

                  {signupStep === 'success' && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-green-600 mb-2">Account created successfully!</h2>
                      <p className="text-gray-500">Redirecting to login...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}