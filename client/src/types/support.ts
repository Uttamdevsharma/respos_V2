export type LiveChatDepartment = 'SALES' | 'TECH_SUPPORT' | 'BILLING' | 'GENERAL';
export type LiveChatStatus = 'WAITING' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
export type LiveChatSenderType = 'VISITOR' | 'AGENT' | 'SYSTEM';

export interface LiveChatMessageAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface LiveChatMessage {
  _id: string;
  session_id: string;
  sender_type: LiveChatSenderType;
  sender_name: string;
  message: string;
  attachments?: LiveChatMessageAttachment[];
  is_read: boolean;
  created_at: string;
  createdAt?: string;
}

export interface LiveChatSession {
  _id: string;
  session_token: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  department: LiveChatDepartment;
  status: LiveChatStatus;
  current_url?: string;
  user_agent?: string;
  assigned_user_id?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  last_message_at: string;
  created_at: string;
  updated_at?: string;
  lastMessagePreview?: string;
  lastMessageSender?: string;
}

export type TicketCategory = 'BUG' | 'FEATURE' | 'QUERY';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'PENDING' | 'CHECKING' | 'WORKING' | 'TESTING' | 'SOLVED' | 'CLOSED';

export interface TicketAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface SupportTicket {
  _id: string;
  ticket_no: string;
  restaurant_id: {
    _id: string;
    name: string;
    contact_number?: string;
    email?: string;
  } | string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  } | string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  attachments: TicketAttachment[];
  is_admin_read: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketReply {
  _id: string;
  ticket_id: string;
  sender_id: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | string;
  sender_type: 'SUPER_ADMIN' | 'TENANT_USER';
  message: string;
  attachments: TicketAttachment[];
  is_read: boolean;
  created_at: string;
  createdAt?: string;
}

