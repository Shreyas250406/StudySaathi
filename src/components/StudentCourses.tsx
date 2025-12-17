import { useState } from 'react';
import { User } from '../App';
import { BookOpen, ArrowRight } from 'lucide-react';
import { QuestionInterface } from './QuestionInterface';

interface StudentCoursesProps {
  user: User;
}

interface Course {
  id: string;
  language: string;
  title: string;
  description: string;
  icon: string;
}

const courses: Course[] = [
  {
    id: 'english',
    language: 'English',
    title: 'English Language',
    description: 'Master grammar, vocabulary, comprehension and writing skills with adaptive exercises tailored to your level.',
    icon: '🇬🇧'
  },
  {
    id: 'german',
    language: 'German',
    title: 'German Language',
    description: 'Learn German from basics to advanced with interactive lessons and AI-powered practice sessions.',
    icon: '🇩🇪'
  },
  {
    id: 'french',
    language: 'French',
    title: 'French Language',
    description: 'Explore French language and culture through personalized learning paths designed for your progress.',
    icon: '🇫🇷'
  }
];

export function StudentCourses({ user }: StudentCoursesProps) {
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  const handleStartLearning = (courseId: string) => {
    setActiveCourse(courseId);
  };

  const handleBackToCourses = () => {
    setActiveCourse(null);
  };

  if (activeCourse) {
    const course = courses.find(c => c.id === activeCourse);
    return (
      <QuestionInterface 
        course={course!} 
        userGrade={user.grade ?? 10}

        onBack={handleBackToCourses}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="mb-2">Available Courses</h2>
        <p className="text-gray-600">
          Choose a language course to begin your personalized learning journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-center">
              <div className="text-6xl mb-2">{course.icon}</div>
              <h3 className="text-white">{course.language}</h3>
            </div>

            <div className="p-6">
              <h4 className="mb-3">{course.title}</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {course.description}
              </p>

              <button
                onClick={() => handleStartLearning(course.id)}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Features */}
      <div className="mt-12 bg-purple-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="mb-2">Adaptive Learning Experience</h4>
            <p className="text-gray-700 leading-relaxed">
              Our AI-powered system analyzes your performance and adjusts question difficulty in real-time. 
              Based on your grade level and individual learning score, you'll receive questions that are 
              perfectly suited to help you grow - whether you need easier questions to build confidence 
              or challenging ones to push your limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
