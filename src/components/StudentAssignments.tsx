import { useState, useEffect } from 'react';
import { FileText, Download, Upload, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../supabase';

interface Assignment {
  id: string;
  title: string;
  pdf_url: string;
  created_at: string;
  status: 'pending' | 'submitted';
  submittedFile?: string;
}

export function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('id, title, pdf_url, created_at');

    if (error) {
      console.error(error);
      return;
    }

    setAssignments(
      data.map(a => ({
        ...a,
        status: 'pending'
      }))
    );
  };

  const handleFileUpload = async (
    assignmentId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingId(assignmentId);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const path = `${assignmentId}/${user.id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setUploadingId(null);
      return;
    }

    await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId,
      student_id: user.id,
      pdf_url: path
    });

    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? { ...a, status: 'submitted', submittedFile: file.name }
          : a
      )
    );

    setUploadingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="mb-2">Your Assignments</h2>
        <p className="text-gray-600">
          Download assignments from your teacher and submit your completed work
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map(assignment => (
          <div
            key={assignment.id}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3>{assignment.title}</h3>

                  {assignment.status === 'submitted' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Submitted
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    PDF
                  </span>
                  <span>
                    Uploaded:{' '}
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={
                  supabase.storage
                    .from('assignments')
                    .getPublicUrl(assignment.pdf_url).data.publicUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Assignment
              </a>

              {assignment.status === 'pending' && (
                <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploadingId === assignment.id
                    ? 'Uploading...'
                    : 'Upload Answer'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => handleFileUpload(assignment.id, e)}
                    className="hidden"
                    disabled={uploadingId === assignment.id}
                  />
                </label>
              )}

              {assignment.status === 'submitted' && assignment.submittedFile && (
                <div className="flex-1 bg-green-50 px-4 py-2 rounded-lg">
                  <p className="text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Submitted: {assignment.submittedFile}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-500 mb-2">No assignments yet</h3>
          <p className="text-gray-400">
            Your teacher will upload assignments here. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
