import { Users, TrendingUp, Brain, ClipboardList } from 'lucide-react';

export function TeacherHome() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-purple-600 text-white rounded-2xl p-8 mb-8 shadow-xl">
        <h2 className="mb-4">Welcome to StudySaathi Teacher Portal</h2>
        <p className="text-lg opacity-90">
          Empower your students with AI-driven personalized learning
        </p>
      </div>

      {/* What is StudySaathi for Teachers */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="mb-3 text-purple-900">AI-Driven Insights</h3>
          <p className="text-gray-600 leading-relaxed">
            StudySaathi analyzes each student's performance and provides intelligent insights about 
            their learning patterns. Our AI identifies students who need extra attention and those 
            who are excelling, helping you personalize your teaching approach.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="mb-3 text-purple-900">Monitor Student Progress</h3>
          <p className="text-gray-600 leading-relaxed">
            Track every student's learning journey in real-time. View detailed performance metrics, 
            learning scores, and progress trends to understand how each student is performing across 
            different subjects and difficulty levels.
          </p>
        </div>
      </div>

      {/* Teacher Benefits */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 shadow-lg mb-8 border border-purple-200">
        <h3 className="mb-6 text-center text-purple-900">How StudySaathi Helps You</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">Performance Analytics</h4>
            <p className="text-gray-600">
              Get comprehensive analytics on student performance and learning trends
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">Easy Assignment Management</h4>
            <p className="text-gray-600">
              Upload and distribute assignments effortlessly to different grades
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">AI Recommendations</h4>
            <p className="text-gray-600">
              Receive AI-powered suggestions on which students need focused attention
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 border-2 border-purple-200 shadow-md">
        <h3 className="mb-4 text-purple-900">Key Features</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              ✓
            </div>
            <p className="text-gray-700">
              <span className="text-purple-800">Student Lists:</span> View all students organized by grade with their current learning scores
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              ✓
            </div>
            <p className="text-gray-700">
              <span className="text-purple-800">Assignment Distribution:</span> Upload Word or PDF assignments and assign them to specific grades
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              ✓
            </div>
            <p className="text-gray-700">
              <span className="text-purple-800">AI Status Indicators:</span> Automatically identify students who are "To be focused" or "Doing well"
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              ✓
            </div>
            <p className="text-gray-700">
              <span className="text-purple-800">Simplified Management:</span> Manage your entire classroom from one intuitive interface
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}