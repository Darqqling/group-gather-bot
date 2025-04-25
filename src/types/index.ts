
export interface TelegramUser {
  id: string;
  telegram_id: string;
  username: string;
  first_name: string;
  last_name: string;
  joined_at: string;
  last_active_at: string;
}

export interface Collection {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  status: 'active' | 'finished' | 'cancelled';
  created_at: string;
  deadline: string;
  last_updated_at: string;
}

export interface Payment {
  id: string;
  collection_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'confirmed';
  created_at: string;
  confirmed_at: string | null;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  context: Record<string, any>;
  created_at: string;
}
