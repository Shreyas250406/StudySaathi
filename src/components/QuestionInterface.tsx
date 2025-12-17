import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../supabase';

interface Course {
  id: string;
  language: string;
  title: string;
  description: string;
  icon: string;
}

interface QuestionInterfaceProps {
  course: Course;
  userGrade: number;
  onBack: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_option: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AnswerPayload {
  question_id: string;
  difficulty: string;
  correct: boolean;
}

export function QuestionInterface({
  course,
  userGrade,
  onBack
}: QuestionInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [learningScore, setLearningScore] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerPayload[]>([]);
  const [loading, setLoading] = useState(true);

  const currentQuestion = questions[currentIndex];

  /* --------------------------------------------------
     FETCH QUESTIONS FROM AI
  -------------------------------------------------- */
  useEffect(() => {
    fetchNextSet([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNextSet = async (answerPayload: AnswerPayload[]) => {
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/next-set`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: user.id,
            teacher_id: null,
            grade: String(userGrade), // ✅ IMPORTANT
            language: course.language.toLowerCase(),
            answers: answerPayload
          })
        }
      );

      if (!res.ok) {
        console.error('AI API error:', await res.text());
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        console.warn('No questions returned from AI');
        setLoading(false);
        return;
      }

      setQuestions(data.questions);
      setLearningScore(data.score);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers([]);
    } catch (err) {
      console.error('Failed to fetch AI questions', err);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     HANDLERS
  -------------------------------------------------- */
  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_option;

    setAnswers(prev => [
      ...prev,
      {
        question_id: currentQuestion.id,
        difficulty: currentQuestion.difficulty,
        correct: isCorrect
      }
    ]);

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      fetchNextSet(answers);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return 'bg-green-100 text-green-700';
    if (difficulty === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  if (loading) {
    return <p className="text-center">Loading AI questions...</p>;
  }

  if (!currentQuestion) {
    return <p className="text-center">No questions available.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">{course.language} Practice</h2>
            <p className="text-gray-600">
              Grade: {userGrade} | Learning Score: {learningScore}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Difficulty */}
        <div className="flex items-center justify-between mb-6">
          <span
            className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(
              currentQuestion.difficulty
            )}`}
          >
            {currentQuestion.difficulty.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            AI-adapted question
          </span>
        </div>

        {/* Question */}
        <h3 className="mb-6">{currentQuestion.question}</h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((opt, idx) => {
            const isCorrect = idx === currentQuestion.correct_option;
            const isSelected = selectedAnswer === idx;

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={showResult}
                className={`w-full p-4 rounded-lg border-2 text-left ${
                  showResult && isCorrect
                    ? 'border-green-500 bg-green-50'
                    : showResult && isSelected && !isCorrect
                    ? 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{opt}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showResult && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              selectedAnswer === currentQuestion.correct_option
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {selectedAnswer === currentQuestion.correct_option
              ? '✓ Correct!'
              : '✗ Incorrect'}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={showResult ? handleNext : handleSubmit}
          disabled={!showResult && selectedAnswer === null}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {showResult
            ? currentIndex < questions.length - 1
              ? 'Next Question'
              : 'Get Next AI Set'
            : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}
