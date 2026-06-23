export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Lecture {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  duration: number | null;
  status: string;
  progress: number;
  error_message: string | null;
  created_at: string;
}

export interface LectureDetail {
  id: number;
  title: string;
  status: string;
  progress: number;
  duration: number | null;
  error_message: string | null;
}

export interface Transcript {
  id: number;
  lecture_id: number;
  transcript_text: string;
  created_at: string;
}

export interface NotesData {
  overview: string;
  key_concepts: string[];
  definitions: string[];
  important_points: string[];
  exam_notes: string[];
}

export interface Notes {
  id: number;
  lecture_id: number;
  notes_json: NotesData;
  created_at: string;
}

export interface Flashcard {
  id: number;
  lecture_id: number;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  lecture_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Stats {
  total_lectures: number;
  total_notes: number;
  total_flashcards: number;
  total_quizzes: number;
}
