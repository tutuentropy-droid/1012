import api from './api';
import type {
  User,
  Work,
  Note,
  NoteWithWork,
  Tag,
  StatsOverview,
  HeatmapData,
  MonthlyStat,
  AnnualReport,
  ChineseColor,
  PaginationResult,
  Rating,
  WorkStatus,
  TasteGraph,
  ImportPreviewResult,
  ImportConfirmResult,
  TasteSeal,
  WorkType,
} from '@/types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  getMe: () => api.get<User>('/auth/me').then((r) => r.data),
  updatePreferences: (preferences: Record<string, any>) =>
    api.put<User>('/auth/preferences', { preferences }).then((r) => r.data),
  addTasteSeal: (seal: Omit<TasteSeal, 'createdAt'>) =>
    api.post<User>('/auth/taste-seal', seal).then((r) => r.data),
  removeTasteSeal: (name: string, category: string) =>
    api.delete<User>(`/auth/taste-seal/${category}/${encodeURIComponent(name)}`).then((r) => r.data),
};

export const workApi = {
  list: (params?: Record<string, any>) =>
    api.get<PaginationResult<Work>>('/works', { params }).then((r) => r.data),
  detail: (id: string) => api.get<Work>(`/works/${id}`).then((r) => r.data),
  create: (data: Partial<Work>) => api.post<Work>('/works', data).then((r) => r.data),
  update: (id: string, data: Partial<Work>) =>
    api.put<Work>(`/works/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/works/${id}`).then((r) => r.data),
  updateProgress: (id: string, data: { currentEpisode?: number; currentPage?: number; status?: WorkStatus; moodColor?: string }) =>
    api.put<Work>(`/works/${id}/progress`, data).then((r) => r.data),
  updateRating: (id: string, rating: Rating, moodColor?: string) =>
    api.put<Work>(`/works/${id}/rating`, { rating, moodColor }).then((r) => r.data),
};

export const noteApi = {
  list: (params?: Record<string, any>) =>
    api.get<PaginationResult<NoteWithWork>>('/notes', { params }).then((r) => r.data),
  detail: (id: string) => api.get<NoteWithWork>(`/notes/${id}`).then((r) => r.data),
  create: (data: Partial<Note>) => api.post<Note>('/notes', data).then((r) => r.data),
  update: (id: string, data: Partial<Note>) =>
    api.put<Note>(`/notes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/notes/${id}`).then((r) => r.data),
};

export const tagApi = {
  list: () => api.get<Tag[]>('/tags').then((r) => r.data),
  create: (data: { name: string; color?: string }) =>
    api.post<Tag>('/tags', data).then((r) => r.data),
  update: (id: string, data: { name: string; color?: string }) =>
    api.put<Tag>(`/tags/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/tags/${id}`).then((r) => r.data),
};

export const statsApi = {
  overview: () => api.get<StatsOverview>('/stats/overview').then((r) => r.data),
  heatmap: (weeks?: number) =>
    api.get<HeatmapData>('/stats/weekly-heatmap', { params: { weeks } }).then((r) => r.data),
  monthly: (year?: number) =>
    api.get<{ year: number; months: MonthlyStat[] }>('/stats/monthly', { params: { year } }).then((r) => r.data),
  annualReport: (year: number) =>
    api.get<AnnualReport>(`/stats/annual-report/${year}`).then((r) => r.data),
  tasteGraph: () => api.get<TasteGraph>('/stats/taste-graph').then((r) => r.data),
};

export const importApi = {
  preview: (content: string, format: 'csv' | 'simple' = 'csv') =>
    api.post<ImportPreviewResult>('/import/preview', { content, format }).then((r) => r.data),
  confirm: (action: 'skip' | 'merge' | 'all', matchedItems: any[], unmatchedItems: any[]) =>
    api.post<ImportConfirmResult>('/import/confirm', { action, matchedItems, unmatchedItems }).then((r) => r.data),
};

export const searchApi = {
  global: (q: string, scope: 'all' | 'works' | 'notes' | 'tags' = 'all') =>
    api.get<{ works: Work[]; notes: Note[]; tags: Tag[] }>('/search', { params: { q, scope } }).then((r) => r.data),
  colors: () => api.get<ChineseColor[]>('/search/colors').then((r) => r.data),
};

import type {
  KnowledgeGraph,
  KGNodeDetail,
  KGNodeAnnotation,
  KGEdge,
} from '@/types';

export const kgApi = {
  getGraph: (refresh = false) =>
    api.get<KnowledgeGraph>('/kg', { params: { refresh } }).then((r) => r.data),
  refreshGraph: () =>
    api.post<KnowledgeGraph>('/kg/refresh').then((r) => r.data),
  getNodeDetail: (nodeId: string) =>
    api.get<KGNodeDetail>(`/kg/nodes/${nodeId}`).then((r) => r.data),
  updateNode: (nodeId: string, data: Partial<{ isHidden: boolean; synonyms: string[]; name: string; category: string }>) =>
    api.put<KnowledgeGraph>(`/kg/nodes/${nodeId}`, data).then((r) => r.data),
  toggleHidden: (nodeId: string) =>
    api.patch<{ isHidden: boolean }>(`/kg/nodes/${nodeId}/hidden`).then((r) => r.data),
  addAnnotation: (nodeId: string, content: string) =>
    api.post<KGNodeAnnotation>(`/kg/nodes/${nodeId}/annotations`, { content }).then((r) => r.data),
  removeAnnotation: (nodeId: string, annotationId: string) =>
    api.delete(`/kg/nodes/${nodeId}/annotations/${annotationId}`).then((r) => r.data),
  addManualEdge: (source: string, target: string) =>
    api.post<KGEdge>('/kg/edges', { source, target }).then((r) => r.data),
  removeEdge: (edgeId: string) =>
    api.delete(`/kg/edges/${edgeId}`).then((r) => r.data),
  exportData: (format: 'json' | 'csv') =>
    api.get(`/kg/export`, { params: { format }, responseType: 'blob' }).then((r) => r.data),
};
