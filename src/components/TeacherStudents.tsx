import { useState, useEffect } from 'react';
import { Users, Upload, List, X } from 'lucide-react';
import { supabase } from '../supabase';

interface Student {
  id: string;
  name: string;
  learningScore: number;
  status: 'to-be-focused' | 'doing-well';
}

interface GradeData {
  grade: string;
  students: Student[];
}

type ViewMode = 'assignments' | 'list' | null;

export function TeacherStudents() {
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchStudentsByGrade();
  }, []);

  /* ---------------- FETCH STUDENTS ---------------- */

  const fetchStudentsByGrade = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, grade, difficulty_score');

    if (error) {
      console.error(error);
      return;
    }

    const grouped: Record<string, Student[]> = {};

    data.forEach((u: any) => {
      if (!grouped[u.grade]) grouped[u.grade] = [];

      grouped[u.grade].push({
        id: u.id,
        name: u.name,
        learningScore: u.difficulty_score,
        status: u.difficulty_score < 60 ? 'to-be-focused' : 'doing-well'
      });
    });

    const formatted: GradeData[] = Object.keys(grouped).map(g => ({
      grade: g,
      students: grouped[g]
    }));

    setGradeData(formatted);
  };

  /* ---------------- HANDLERS ---------------- */

  const handleViewAssignments = (grade: string) => {
    setSelectedGrade(grade);
    setViewMode('assignments');
  };

  const handleViewList = (grade: string) => {
    setSelectedGrade(grade);
    setViewMode('list');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleAssignmentSubmit = async () => {
    if (!uploadedFile || !selectedGrade) return;

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const path = `${user.id}/${selectedGrade}/${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(path, uploadedFile);

    if (uploadError) {
      console.error(uploadError);
      return;
    }

    await supabase.from('assignments').insert({
      teacher_id: user.id,
      title: uploadedFile.name,
      grade: selectedGrade,
      pdf_url: path
    });

    alert(`Assignment uploaded for ${selectedGrade}`);

    setUploadedFile(null);
    setViewMode(null);
    setSelectedGrade(null);
  };

  const handleClose = () => {
    setViewMode(null);
    setSelectedGrade(null);
    setUploadedFile(null);
  };

  const currentGradeData = gradeData.find(g => g.grade === selectedGrade);

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="mb-2">Student Management</h2>
        <p className="text-gray-600">
          Manage students by grade, upload assignments, and view performance details
        </p>
      </div>

      {!viewMode ? (
        <div className="grid md:grid-cols-3 gap-6">
          {gradeData.map(grade => (
            <div
              key={grade.grade}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3>{grade.grade}</h3>
                  <p className="text-gray-600 text-sm">
                    {grade.students.length} students
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleViewAssignments(grade.grade)}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Assignments
                </button>

                <button
                  onClick={() => handleViewList(grade.grade)}
                  className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Student List
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3>
              {selectedGrade} –{' '}
              {viewMode === 'assignments'
                ? 'Assignment Management'
                : 'Student List'}
            </h3>
            <button onClick={handleClose}>
              <X />
            </button>
          </div>

          {viewMode === 'assignments' && (
            <div className="space-y-6">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
              />

              <button
                onClick={handleAssignmentSubmit}
                disabled={!uploadedFile}
                className="w-full bg-purple-600 text-white py-3 rounded-lg"
              >
                Assign to {selectedGrade}
              </button>
            </div>
          )}

          {viewMode === 'list' && currentGradeData && (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Score</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentGradeData.students.map(s => (
                  <tr key={s.id}>
                    <td className="py-3 px-4">{s.name}</td>
                    <td className="py-3 px-4">{s.learningScore}%</td>
                    <td className="py-3 px-4">
                      {s.status === 'doing-well'
                        ? 'Doing well'
                        : 'To be focused'}
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
