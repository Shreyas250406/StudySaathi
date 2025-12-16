import { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  grade?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <>
      {user.role === 'student' ? (
        <StudentDashboard user={user} onLogout={handleLogout} />
      ) : (
        <TeacherDashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}
