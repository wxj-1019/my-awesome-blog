/** AI 导向写作会话的前端类型定义（与后端 writing_session schema 对齐）。 */

export type WritingStage =
  | 'clarifying'
  | 'outline_review'
  | 'drafting'
  | 'draft_review'
  | 'editing'
  | 'completed';

export type WritingStatus = 'active' | 'completed' | 'abandoned';

/** 会话内的对话消息。 */
export interface WritingMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/** AI 改稿建议。 */
export interface WritingSuggestion {
  id: string;
  type: 'structure' | 'argument' | 'readability' | 'seo' | 'accuracy';
  title: string;
  reason: string;
  scope: string;
  status: 'pending' | 'previewed' | 'applied' | 'dismissed';
}

/** 单次改稿修订（来源：选区指令 / 建议应用）。 */
export interface WritingRevision {
  id: string;
  source: 'selection' | 'suggestion';
  suggestion_id: string | null;
  content_hash: string;
  selection_start: number;
  selection_end: number;
  original_text: string;
  replacement_text: string;
  status: 'previewed' | 'applied' | 'discarded';
}

/** 写作会话聚合根。 */
export interface WritingSession {
  id: string;
  user_id: string;
  article_id: string | null;
  stage: WritingStage;
  status: WritingStatus;
  requirements_summary: Record<string, string>;
  outline: string;
  draft: string;
  messages: WritingMessage[];
  suggestions: WritingSuggestion[];
  revisions: WritingRevision[];
  created_at: string;
  updated_at: string;
}

/** 基于正文选区的改稿请求体（revise-selection/stream）。 */
export interface WritingSelectionRevisionRequest {
  content: string;
  selected_text: string;
  selection_start: number;
  selection_end: number;
  instruction: string;
  content_hash: string;
}

/** 基于建议的改稿请求体（revise-suggestion/stream）。 */
export interface WritingSuggestionRevisionRequest {
  suggestion_id: string;
  content: string;
  content_hash: string;
}
