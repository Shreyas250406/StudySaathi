import { useState } from 'react';
import { User } from '../App';
import { StudentHome } from './StudentHome';
import { StudentCourses } from './StudentCourses';
import { StudentAssignments } from './StudentAssignments';
import { FeedbackSection } from './FeedbackSection';
import { Footer } from './Footer';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'home' | 'courses' | 'assignments';

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/50 to-white relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 opacity-10 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1758270704384-9df36d94a29d)'
        }}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 shadow-lg relative z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-center text-white">StudySaathi</h1>
        </div>

        {/* Info Strip */}
        <div className="bg-purple-800/30 backdrop-blur-sm border-t border-purple-400/30">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-white">{user.name}</span>
              <span className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm">
                Student
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
                {activeTab === 'home' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('courses')}
                className={`py-4 px-2 relative ${
                  activeTab === 'courses'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Courses
                {activeTab === 'courses' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-4 px-2 relative ${
                  activeTab === 'assignments'
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Assignments
                {activeTab === 'assignments' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {activeTab === 'home' && <StudentHome />}
        {activeTab === 'courses' && <StudentCourses user={user} />}
        {activeTab === 'assignments' && <StudentAssignments />}
      </main>

      {/* Feedback Section */}
      <FeedbackSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
