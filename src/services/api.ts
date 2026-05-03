import axios from 'axios'
import type { NotificationListResponse } from '@/features/notification/types/notification.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const getStoredAccessToken = () =>
  localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth_token')

// Attach Bearer token if exists
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Do not auto-clear tokens on every 401.
// Some endpoints (e.g. draft loading) may temporarily return 401 and should be handled by caller/UI.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error)
  }
)

export type AuthResponse = {
  token: string
  user: {
    userId: number
    fname: string
    minit: string
    lname: string
    email: string
    avatarUrl: string | null
  }
}

export const authApi = {
  login: (payload: { email: string; password: string }) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: { email: string; password: string; fname: string; lname: string }) =>
    api.post<AuthResponse>('/auth/register', payload),

  // THÊM DÒNG NÀY: API login bằng Google
  // Backend cần endpoint này để nhận googleToken, verify với Google và trả về JWT
  loginGoogle: (googleToken: string) => api.post<AuthResponse>('/auth/google-login', { token: googleToken })
}

export type ReviewMode = 'NO_REVIEW' | 'REVIEW_WITHOUT_ANSWERS' | 'REVIEW_WITH_ANSWERS'
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MATCHING' | 'SHORT_ANSWER'

export type CreateScormPackageRequest = {
  welcomeVideoUrl?: string
  themeJson?: string
  title: string
  description?: string
  passingScore?: number
  maxAttempts?: number
  reviewMode?: ReviewMode
  questions?: Array<{
    id?: number
    text: string
    questionType: QuestionType
    imageUrl?: string
    questionOrder?: number
    points?: number
    answers: Array<{
      id?: number
      matchValue?: string
      text: string
      correct: boolean
      answerOrder?: number
      imageUrl?: string
    }>
  }>
}

export type CreateCourseRequest = {
  title: string
  description?: string
  coverImageUrl?: string
  passingScore?: number
  attemptLimit?: number
  durationMin?: number
  status?: string
  tags?: string[] // Bổ sung trường tags cho yêu cầu tạo khóa học mới
  isFavorite?: boolean // Bổ sung trạng thái yêu thích (sẽ kế thừa cho cả UpdateCourseRequest)
  textHtml?: string
  themeOverride?: unknown
  layoutMode?: string
  layoutMeta?: unknown
  extraInfor?: unknown
  editorState?: unknown
  editorVersion?: string
  editorStatus?: string
}

export type UpdateCourseRequest = Partial<CreateCourseRequest>

export type CourseResponse = {
  courseId: number
  title: string
  description?: string | null
  coverImageUrl?: string | null
  passingScore?: number | null
  attemptLimit?: number | null
  durationMin?: number | null
  status?: string | null
  tags?: string[] // Bổ sung trường tags cho response khóa học trả về
  isFavorite?: boolean // Bổ sung trạng thái yêu thích
  editorState?: unknown
  editorStateSnapshot?: unknown
  themeOverride?: unknown
}

export type CreateCourseScormPackageRequest = {
  packageName: string
  packageType: string
  editorStateSnapshot?: unknown
  interfaceSnapshot?: unknown
}

export const courseApi = {
  createCourse: (payload: CreateCourseRequest) => api.post<CourseResponse>('/courses', payload),
  updateCourse: (courseId: number | string, payload: UpdateCourseRequest) =>
    api.patch<CourseResponse>(`/courses/${courseId}`, payload),
  listCourses: () => api.get<CourseResponse[]>('/courses'),
  getCourseById: (courseId: number | string) => api.get<CourseResponse>(`/courses/${courseId}`),
  deleteCourse: (courseId: number | string) => api.delete(`/courses/${courseId}`),
  importScormPackage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<CourseResponse>('/courses/import-scorm', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const scormApi = {
  createPackage: (payload: CreateScormPackageRequest) => api.post('/scorm-packages', payload),
  createCoursePackage: (courseId: number | string, payload: CreateCourseScormPackageRequest) =>
    api.post(`/courses/${courseId}/scorm-packages`, payload),
  listPackages: () => api.get('/scorm-packages'),
  getPackage: (id: number | string) => api.get(`/scorm-packages/${id}`),
  downloadPackage: (id: number | string) => api.get(`/scorm-packages/${id}/download`, { responseType: 'blob' }),
  deletePackage: (id: number | string) => api.delete(`/scorm-packages/${id}`)
}

// --- Media APIs ---
export const mediaApi = {
  // Upload image -> trả về thông tin ảnh đã lưu DB
  uploadFile: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{
      id: number
      name: string
      url: string
      size: number
      width?: number
      height?: number
      createdAt: string
    }>('/media/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Danh sách ảnh
  getImages: () =>
    api.get<
      Array<{
        id: number
        name: string
        url: string
        size: number
        width?: number
        height?: number
        createdAt: string
      }>
    >('/media/images'),

  // Tạo link nhúng video
  createVideoEmbed: (payload: { url: string; title: string }) =>
    api.post<{
      id: number
      embedUrl: string
      title: string
      thumbnailUrl?: string
      createdAt: string
      updatedAt: string
    }>('/media/video-embed', payload),

  // Danh sách video nhúng
  getVideoEmbeds: () =>
    api.get<Array<{ id: number; embedUrl: string; originalUrl: string; createdAt: string; updatedAt: string }>>(
      '/media/video-embeds'
    ),

  getVideoEmbed: (id: number | string) =>
    api.get<{ id: number; embedUrl: string; createdAt: string; updatedAt: string }>(`/media/video-embed/${id}`),

  deleteVideoEmbed: (id: number | string) => api.delete(`/media/video-embed/${id}`)
}

// --- Notification APIs ---
export const notificationApi = {
  // Lấy danh sách thông báo (có phân trang)
  getNotifications: (page: number = 0, size: number = 10) =>
    api.get<NotificationListResponse>(`/notifications?page=${page}&size=${size}`),

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: () => api.get<number>('/notifications/unread-count'),

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: (notificationId: number) => api.patch(`/notifications/${notificationId}/read`),

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: () => api.patch('/notifications/read-all')
}

// --- User APIs ---
export type UserProfile = {
  userId: number
  fname: string
  minit?: string
  lname: string
  email: string
  avatarUrl: string | null
}

export type UpdateProfilePayload = {
  fname: string
  lname: string
  avatarUrl?: string | null
}

export const userApi = {
  // Lấy thông tin user đang đăng nhập
  getCurrentUser: () => api.get<UserProfile>('/users/me'),

  // Cập nhật thông tin profile
  updateProfile: (payload: UpdateProfilePayload) => api.put<UserProfile>('/users/me', payload)
}
