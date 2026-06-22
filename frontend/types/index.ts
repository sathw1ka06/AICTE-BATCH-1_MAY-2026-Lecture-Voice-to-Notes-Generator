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
  duration: string | null;
  status: string;
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
