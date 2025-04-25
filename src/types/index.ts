
export interface TelegramUser {
  id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  joined_at: string;
  last_active_at: string;
}

export interface Collection {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number | null;
  status: 'active' | 'finished' | 'cancelled';
  created_at: string | null;
  deadline: string;
  last_updated_at: string | null;
}

export interface Payment {
  id: string;
  collection_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'confirmed';
  created_at: string | null;
  confirmed_at: string | null;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  context: Record<string, any> | null;
  created_at: string | null;
}
