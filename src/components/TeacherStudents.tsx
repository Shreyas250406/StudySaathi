import { useEffect, useState } from 'react';
import { Users, Upload, List, X } from 'lucide-react';
import { supabase } from '../supabase';

interface Student {
  id: string;
  name: string;
  score: number;
  status: 'to-be-focused' | 'doing-well';
}

interface GradeGroup {
  grade: number;
  students: Student[];
}

type ViewMode = 'assignments' | 'list' | null;

export function TeacherStudents() {
  const [grades, setGrades] = useState<GradeGroup[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ================= FETCH STUDENTS ================= */

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('students')
      .select('student_id,name,grade,difficulty_score')
      .eq('teacher_id', user.id);

    if (error) {
      console.error(error);
      return;
    }

    const grouped: Record<number, Student[]> = {};

    data.forEach((s) => {
      if (!grouped[s.grade]) grouped[s.grade] = [];
      grouped[s.grade].push({
        id: s.student_id,
        name: s.name,
        score: s.difficulty_score,
        status: s.difficulty_score < 60 ? 'to-be-focused' : 'doing-well'
      });
    });

    setGrades(
      Object.keys(grouped).map((g) => ({
        grade: Number(g),
        students: grouped[Number(g)]
      }))
    );
  };

  /* ================= FILE HANDLER ================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  /* ================= UPLOAD ================= */

  const handleUploadAssignment = async () => {
    if (!file || selectedGrade === null) return;

    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${user.id}/grade-${selectedGrade}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(path, file);

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('assignments').insert({
      teacher_id: user.id,
      grade: selectedGrade,
      title: file.name,
      pdf_url: path
    });

    if (dbError) {
      alert(dbError.message);
    } else {
      alert(`Assignment uploaded for Grade ${selectedGrade}`);
    }

    setFile(null);
    setUploading(false);
    setViewMode(null);
    setSelectedGrade(null);
  };

  const currentGrade = grades.find((g) => g.grade === selectedGrade);

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-1">Student Management</h2>
      <p className="text-gray-600 mb-6">
        Manage students by grade, upload assignments, and monitor performance
      </p>

      {/* ================= GRADE CARDS ================= */}
      {!viewMode && (
        <div className="grid md:grid-cols-3 gap-6">
          {grades.map((g) => (
            <div key={g.grade} className="bg-white shadow rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Grade {g.grade}</h3>
                  <p className="text-sm text-gray-600">
                    {g.students.length} students
                  </p>
                </div>
              </div>

              <button
                className="w-full mb-2 bg-purple-600 text-white py-2 rounded-lg"
                onClick={() => {
                  setSelectedGrade(g.grade);
                  setViewMode('assignments');
                }}
              >
                <Upload className="inline w-4 h-4 mr-2" />
                Assignments
              </button>

              <button
                className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg"
                onClick={() => {
                  setSelectedGrade(g.grade);
                  setViewMode('list');
                }}
              >
                <List className="inline w-4 h-4 mr-2" />
                Student List
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL ================= */}
      {viewMode && (
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex justify-between mb-6">
            <h3 className="font-semibold">
              Grade {selectedGrade} – {viewMode === 'assignments' ? 'Assignments' : 'Students'}
            </h3>
            <button
              onClick={() => {
                setViewMode(null);
                setSelectedGrade(null);
                setFile(null);
              }}
            >
              <X />
            </button>
          </div>

          {/* ================= ASSIGNMENTS ================= */}
          {viewMode === 'assignments' && (
            <div className="space-y-4">

              {/* Upload File button (only before file selection) */}
              {!file && (
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="cursor-pointer bg-purple-600 text-white px-6 py-2 rounded-lg inline-flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </span>
                </label>
              )}

              {/* After file is chosen */}
              {file && (
                <>
                  <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                    <span className="text-sm">
                      Selected: <b>{file.name}</b>
                    </span>
                    <button
                      onClick={() => setFile(null)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <button
                    onClick={handleUploadAssignment}
                    disabled={uploading}
                    className={`w-full py-3 rounded-lg text-white font-semibold ${
                      uploading
                        ? 'bg-gray-400'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Upload Assignment'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ================= STUDENT LIST ================= */}
          {viewMode === 'list' && currentGrade && (
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentGrade.students.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.score}</td>
                    <td className="p-3">
                      {s.status === 'doing-well' ? (
                        <span className="text-green-600 font-medium">Doing well</span>
                      ) : (
                        <span className="text-red-600 font-medium">To be focused</span>
                      )}
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
