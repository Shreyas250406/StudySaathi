import { useState } from 'react';
import { User } from '../App';
import { TeacherHome } from './TeacherHome';
import { TeacherStudents } from './TeacherStudents';
import { TeacherAssignmentSubmissions } from './TeacherAssignmentSubmissions';
import { FeedbackSection } from './FeedbackSection';
import { Footer } from './Footer';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'home' | 'students' | 'submissions';

export function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50/50 to-indigo-50 relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 opacity-10 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1544191046-397b734b0891)'
        }}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 via-purple-700 to-purple-600 shadow-lg relative z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-center text-white">StudySaathi</h1>
        </div>

        {/* Info Strip */}
        <div className="bg-purple-900/30 backdrop-blur-sm border-t border-purple-400/30">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-white">
                {user.name || 'Teacher'}
              </span>
              <span className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm">
                Teacher
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-white hover:bg-purple-700/50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="bg-white/95 backdrop-blur-sm border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('home')}
                className={`py-4 px-2 relative ${
                  activeTab === 'home'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-2 relative ${
                  activeTab === 'students'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Students
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-4 px-2 relative ${
                  activeTab === 'submissions'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View Submissions
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {activeTab === 'home' && <TeacherHome />}

        {activeTab === 'students' && (
          <TeacherStudents teacherId={user.id} />
        )}

        {activeTab === 'submissions' && (
          <TeacherAssignmentSubmissions />
        )}
      </main>

      <FeedbackSection />
      <Footer />
    </div>
  );
}
