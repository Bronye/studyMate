import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, BookOpen, Trash2, Search, Calendar } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { NoteUpload, getNoteUploads } from '../db/database';

export default function Notes() {
  const navigate = useNavigate();
  const { currentStudent } = useAppStore();
  const [notes, setNotes] = useState<NoteUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<NoteUpload | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    if (!currentStudent?.studentId) return;
    
    try {
      const uploads = await getNoteUploads(currentStudent.studentId);
      // Filter to only show completed uploads with content
      const completedNotes = uploads.filter(n => n.status === 'completed' && n.extractedText);
      setNotes(completedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    return (
      note.fileName.toLowerCase().includes(searchLower) ||
      note.extractedText?.toLowerCase().includes(searchLower) ||
      note.generatedQuiz?.topic.toLowerCase().includes(searchLower) ||
      note.generatedQuiz?.subject?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-primary">My Notes</h1>
          <p className="text-sm text-text-secondary">
            {notes.length} note{notes.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search your notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur border-0 shadow-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        // Loading skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/80 backdrop-blur rounded-xl p-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        // Empty state
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-white/80 backdrop-blur rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-text-secondary" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            {searchTerm ? 'No notes found' : 'No Notes Yet'}
          </h3>
          <p className="text-text-secondary mb-6 max-w-xs mx-auto">
            {searchTerm 
              ? 'Try a different search term'
              : 'Start by snapping your study notes to create your first note!'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/note-upload')}
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl"
            >
              Snap Notes
            </button>
          )}
        </div>
      ) : (
        // Notes list
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <motion.button
              key={note.uploadId}
              onClick={() => setSelectedNote(note)}
              className="w-full bg-white/80 backdrop-blur rounded-xl p-4 text-left shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text-primary truncate">
                      {note.generatedQuiz?.topic || note.fileName}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary truncate mb-2">
                    {note.generatedQuiz?.subject || 'General Notes'}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(note.createdAt)}
                  </p>
                </div>
                {note.generatedQuiz && (
                  <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full">
                    Quiz
                  </span>
                )}
              </div>
              {note.extractedText && (
                <p className="mt-3 text-sm text-text-secondary line-clamp-2">
                  {note.extractedText.substring(0, 150)}...
                </p>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedNote(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-text-primary">
                {selectedNote.generatedQuiz?.topic || selectedNote.fileName}
              </h3>
              <button
                onClick={() => setSelectedNote(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            {selectedNote.generatedQuiz && (
              <div className="mb-4 p-3 bg-primary/10 rounded-xl">
                <p className="text-sm font-bold text-primary">
                  {selectedNote.generatedQuiz.subject} • {selectedNote.generatedQuiz.questions.length} questions
                </p>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-bold text-text-secondary mb-2">Extracted Text</h4>
              <p className="text-sm text-text-primary whitespace-pre-wrap bg-slate-50 p-3 rounded-xl max-h-40 overflow-y-auto">
                {selectedNote.extractedText || 'No text extracted'}
              </p>
            </div>

            {selectedNote.generatedQuiz && (
              <button
                onClick={() => {
                  setSelectedNote(null);
                  navigate(`/quiz/${selectedNote.generatedQuiz?.quizId}`);
                }}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl"
              >
                Start Quiz
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
