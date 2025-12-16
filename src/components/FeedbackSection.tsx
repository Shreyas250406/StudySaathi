import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../supabase';

export function FeedbackSection() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Please login to submit feedback');
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: user.id,
        user_name: userData?.email ?? 'Anonymous',
        feedback_text: feedback
      });

    setLoading(false);

    if (error) {
      alert('Failed to submit feedback');
      console.error(error);
      return;
    }

    setFeedback('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="bg-white border-t border-gray-200 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="mb-2">We Value Your Feedback</h3>
          <p className="text-gray-600">
            Help us improve StudySaathi by sharing your thoughts
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience, suggestions, or issues..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[120px]"
            disabled={submitted || loading}
          />

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-700">
                Thank you for your feedback! 💜
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!feedback.trim() || loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
