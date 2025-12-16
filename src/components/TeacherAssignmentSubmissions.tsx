import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../supabase';

interface Assignment {
  id: string;
  title: string;
  grade: string;
  created_at: string;
}

interface Submission {
  id: string;
  student_id: string;
  pdf_url: string;
  submitted_at: string;
  student_name: string;
}

export function TeacherAssignmentSubmissions() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  /* ---------------- FETCH ASSIGNMENTS ---------------- */

  const fetchAssignments = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('assignments')
      .select('id, title, grade, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAssignments(data);
  };

  /* ---------------- FETCH SUBMISSIONS ---------------- */

  const fetchSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);

    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(
        `
        id,
        student_id,
        pdf_url,
        submitted_at,
        users ( name )
      `
      )
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const formatted = data.map((s: any) => ({
      id: s.id,
      student_id: s.student_id,
      pdf_url: s.pdf_url,
      submitted_at: s.submitted_at,
      student_name: s.users?.name || 'Unknown'
    }));

    setSubmissions(formatted);
    setLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="mb-2">Assignment Submissions</h2>
        <p className="text-gray-600">
          Select an assignment to view and download student submissions
        </p>
      </div>

      {/* Assignment List */}
      {!selectedAssignment && (
        <div className="grid md:grid-cols-2 gap-6">
          {assignments.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchSubmissions(a)}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-purple-600" />
                <h3>{a.title}</h3>
              </div>
              <p className="text-sm text-gray-600">Grade: {a.grade}</p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}

          {assignments.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No assignments uploaded yet.
            </div>
          )}
        </div>
      )}

      {/* Submission List */}
      {selectedAssignment && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => {
              setSelectedAssignment(null);
              setSubmissions([]);
            }}
            className="text-purple-600 hover:underline mb-4"
          >
            ← Back to assignments
          </button>

          <h3 className="mb-4">
            Submissions for: <span className="text-purple-700">{selectedAssignment.title}</span>
          </h3>

          {loading && <p className="text-gray-500">Loading submissions...</p>}

          {!loading && submissions.length === 0 && (
            <p className="text-gray-500">No submissions yet.</p>
          )}

          {!loading && submissions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Submitted On</th>
                    <th className="text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">{s.student_name}</td>
                      <td className="py-3 px-4">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={
                            supabase.storage
                              .from('submissions')
                              .getPublicUrl(s.pdf_url).data.publicUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
