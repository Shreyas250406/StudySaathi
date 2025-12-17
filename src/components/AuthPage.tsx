import { useState } from 'react';
import { User } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

type AuthMode = 'login' | 'signup';
type SignupStep = 'email' | 'otp' | 'details';

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

  const resetAuthFields = () => {
    setEmail('');
    setPassword('');
    setOtp('');
    setFullName('');
    setGrade('');
    setTeacherOrNgoName('');
    setLoginError('');
    setSignupError('');
  };

  const switchToSignup = () => {
    resetAuthFields();
    setMode('signup');
    setSignupStep('email');
  };

  const switchToLogin = () => {
    resetAuthFields();
    setMode('login');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // 1. Auth login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      setLoginError('Invalid email or password');
      return;
    }

    const userId = data.user.id;

    // 2. Fetch role
    const { data: baseUser, error: baseError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (baseError || !baseUser) {
      setLoginError('User role not found');
      return;
    }

    // 3. Role-specific fetch and login
    if (baseUser.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('name, grade')
        .eq('student_id', userId)
        .single();

      onLogin({
        id: userId,
        email,
        role: 'student',
        name: student?.name,
        grade: student?.grade
      });
      resetAuthFields();
    } else if (baseUser.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('name')
        .eq('teacher_id', userId)
        .single();

      onLogin({
        id: userId,
        email,
        role: 'teacher',
        name: teacher?.name
      });
      resetAuthFields();
    }
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

    // 1. Check duplicate email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      setSignupError('Email already registered. Please login.');
      return;
    }

    // 2. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }
    });

    if (error) {
      console.error('SIGNUP ERROR:', error);
      setSignupError(error.message);
      return;
    }

    if (!data.user) {
      setSignupError('Signup succeeded but user not returned');
      return;
    }

    const userId = data.user.id;

    // 3. Save role
    const { error: userError } = await supabase
      .from('users')
      .upsert({ id: userId, email, role });

    if (userError) {
      console.error('USER INSERT FAILED:', userError);
      setSignupError('Failed to save user role');
      return;
    }

    // 4. Role-specific tables
    if (role === 'student') {
      // Check teacher exists
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('name', teacherOrNgoName)
        .maybeSingle();

      if (teacherError) {
        setSignupError('Failed to verify teacher');
        return;
      }

      if (!teacher) {
        setSignupError('No such teacher found. Please check the name.');
        return;
      }

      // Insert student ONLY if teacher exists
      const { error: studentError } = await supabase.from('students').insert({
        student_id: userId,
        name: fullName,
        grade: Number(grade),
        teacher_id: teacher.teacher_id,
        difficulty_score: 100
      });

      if (studentError) {
        setSignupError(studentError.message);
        return;
      }
    } else if (role === 'teacher') {
      const { error: teacherError } = await supabase.from('teachers').insert({
        teacher_id: userId,
        name: fullName
      });

      if (teacherError) {
        setSignupError(teacherError.message);
        return;
      }
    }

    // Success - redirect to login
    toast.success('Account created successfully! Please login.');
    setSignupStep('email');
    setMode('login');
    resetAuthFields();
  };

  const renderSignupForm = () => {
    if (signupStep === 'email') {
      return (
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
      );
    }

    if (signupStep === 'otp') {
      return (
        <form onSubmit={handleOtpVerify} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Enter OTP (use 1234)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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
            Verify OTP
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setSignupStep('email');
                setOtp('');
                setSignupError('');
              }}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      );
    }

    if (signupStep === 'details') {
      return (
        <>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
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

            {signupError && (
              <div className="text-red-500 text-sm">{signupError}</div>
            )}

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setSignupStep('otp');
                setSignupError('');
              }}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              Back
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Diagonal Background */}
      <AnimatePresence>
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
                  {renderSignupForm()}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}