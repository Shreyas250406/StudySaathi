import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../supabase';

interface Assignment {
  id: string;
  title: string;
  grade: number;
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
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  /* ================= FETCH ASSIGNMENTS ================= */

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('assignments')
      .select('id, title, grade, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setAssignments(data || []);
  };

  /* ================= FETCH SUBMISSIONS ================= */

  const fetchSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);

    const { data: submissionRows } = await supabase
      .from('assignment_submissions')
      .select('id, student_id, pdf_url, submitted_at')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false });

    if (!submissionRows || submissionRows.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const studentIds = submissionRows.map(s => s.student_id);

    const { data: students } = await supabase
      .from('students')
      .select('student_id, name')
      .in('student_id', studentIds);

    const studentMap = new Map(
      (students || []).map(s => [s.student_id, s.name])
    );

    setSubmissions(
      submissionRows.map(s => ({
        id: s.id,
        student_id: s.student_id,
        pdf_url: s.pdf_url,
        submitted_at: s.submitted_at,
        student_name: studentMap.get(s.student_id) || 'Unknown'
      }))
    );

    setLoading(false);
  };

  /* ================= DOWNLOAD HANDLER (SIGNED URL) ================= */

  const handleDownload = async (path: string, id: string) => {
    setDownloading(id);

    const { data, error } = await supabase.storage
      .from('submissions')
      .createSignedUrl(path, 60); // valid for 60 seconds

    setDownloading(null);

    if (error || !data) {
      alert('Download failed');
      return;
    }

    window.open(data.signedUrl, '_blank');
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="mb-2">Assignment Submissions</h2>
      <p className="text-gray-600 mb-8">
        Select an assignment to view and download student submissions
      </p>

      {!selectedAssignment && (
        <div className="grid md:grid-cols-2 gap-6">
          {assignments.map(a => (
            <div
              key={a.id}
              onClick={() => fetchSubmissions(a)}
              className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md"
            >
              <FileText className="text-purple-600 mb-2" />
              <h3>{a.title}</h3>
              <p className="text-sm text-gray-500">Grade {a.grade}</p>
            </div>
          ))}
        </div>
      )}

      {selectedAssignment && (
        <div className="bg-white rounded-xl shadow p-6">
          <button
            onClick={() => setSelectedAssignment(null)}
            className="text-purple-600 mb-4"
          >
            ← Back
          </button>

          {loading && <p>Loading submissions...</p>}

          {!loading && submissions.length === 0 && (
            <p>No submissions yet.</p>
          )}

          {!loading && submissions.length > 0 && (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.student_name}</td>
                    <td className="p-3">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDownload(s.pdf_url, s.id)}
                        disabled={downloading === s.id}
                        className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg"
                      >
                        <Download size={16} />
                        {downloading === s.id ? 'Loading...' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
