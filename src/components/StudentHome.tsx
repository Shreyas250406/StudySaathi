import { BookOpen, Brain, TrendingUp, Users } from 'lucide-react';

export function StudentHome() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white rounded-2xl p-8 mb-8 shadow-xl">
        <h2 className="mb-4">Welcome to StudySaathi</h2>
        <p className="text-lg opacity-90">
          Your personalized learning companion powered by AI
        </p>
      </div>

      {/* What is StudySaathi */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="mb-3 text-purple-900">What is StudySaathi?</h3>
          <p className="text-gray-600 leading-relaxed">
            StudySaathi is an innovative adaptive learning platform that personalizes your educational journey. 
            We combine cutting-edge AI technology with curriculum-aligned content to create a unique learning 
            experience tailored just for you.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 shadow-md">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="mb-3 text-purple-900">How AI Adapts Your Learning</h3>
          <p className="text-gray-600 leading-relaxed">
            Our intelligent system continuously analyzes your performance, identifies strengths and areas for 
            improvement, and adjusts the difficulty level accordingly. This ensures you're always challenged 
            at the right level - never too easy, never too hard.
          </p>
        </div>
      </div>

      {/* Student Benefits */}
      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 shadow-lg mb-8 border border-purple-200">
        <h3 className="mb-6 text-center text-purple-900">How You Benefit</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">Track Your Progress</h4>
            <p className="text-gray-600">
              Monitor your learning journey with detailed insights and performance metrics
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">Personalized Learning</h4>
            <p className="text-gray-600">
              Get content that adapts to your pace and learning style for better understanding
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4 className="mb-2 text-purple-900">Teacher Support</h4>
            <p className="text-gray-600">
              Your teachers can monitor your progress and provide targeted assistance
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 border-2 border-purple-200 shadow-md">
        <h3 className="mb-4 text-purple-900">Ready to Begin?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              1
            </div>
            <p className="text-gray-700">
              Navigate to the <span className="text-purple-700">Courses</span> tab to explore available subjects
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              2
            </div>
            <p className="text-gray-700">
              Select a language course and start learning with AI-adapted questions
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-md">
              3
            </div>
            <p className="text-gray-700">
              Check the <span className="text-purple-700">Assignments</span> tab for tasks from your teacher
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}