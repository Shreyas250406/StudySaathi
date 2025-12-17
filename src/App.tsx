import { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { Toaster } from 'react-hot-toast';

/* ===== TYPES (OUTSIDE COMPONENT) ===== */


export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher';
  name?: string;
  grade?: string;
}


/* ===== APP COMPONENT ===== */
export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {/* Toast Notifications */}
      <Toaster position="top-center" />

      {/* Auth / Dashboard Switch */}
      {!user ? (
        <AuthPage onLogin={handleLogin} />
      ) : user.role === 'student' ? (
        <StudentDashboard user={user} onLogout={handleLogout} />
      ) : (
        <TeacherDashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}
