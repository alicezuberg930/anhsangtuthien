import { httpClient } from '@/lib/repository/http-client'
import type {
    LoginParams,
    LoginResponse,
    ProfileResponse,
} from '@/@types/auth'
import type {
    BannerDetailsResponse,
    BannerListResponse,
    BannerMutationResponse,
    CreateBannerParams,
    DeleteBannerParams,
    GetBannerDetailsParams,
    GetBannersParams,
    ReorderBannersParams,
    UpdateBannerParams,
} from '@/@types/banner'
import type {
    CreateEventParams,
    DeleteEventParams,
    EventListResponse,
    EventMutationResponse,
    GetEventsParams,
    UpdateEventParams,
} from '@/@types/event'
import { API } from '../lib/api'

// auth
export const login = async (params: LoginParams) => {
    return httpClient.post<LoginResponse>(API.AUTH.LOGIN, params)
}

export const getProfile = async () => {
    return httpClient.get<ProfileResponse>(API.USERS.PROFILE)
}

// banner
export const createBanner = async ({ banner }: CreateBannerParams) => {
    return httpClient.post<BannerMutationResponse>(API.BANNERS, banner)
}

export const updateBanner = async ({ id, banner }: UpdateBannerParams) => {
    return httpClient.patch<BannerMutationResponse>(`${API.BANNERS}/${id}`, banner)
}

export const reorderBanners = async ({ ids }: ReorderBannersParams) => {
    return httpClient.patch<BannerMutationResponse>(`${API.BANNERS}/reorder`, { ids })
}

export const deleteBanner = async ({ id }: DeleteBannerParams) => {
    return httpClient.delete<BannerMutationResponse>(`${API.BANNERS}/${id}`)
}

export const getBanners = async (params?: GetBannersParams) => {
    return httpClient.get<BannerListResponse>(API.BANNERS, params)
}

export const getBannerDetails = async ({ id }: GetBannerDetailsParams) => {
    return httpClient.get<BannerDetailsResponse>(`${API.BANNERS}/${id}`)
}

// event
export const createEvent = async ({ event }: CreateEventParams) => {
    return httpClient.post<EventMutationResponse>(API.EVENTS, event)
}

export const updateEvent = async ({ id, event }: UpdateEventParams) => {
    return httpClient.patch<EventMutationResponse>(`${API.EVENTS}/${id}`, event)
}

export const deleteEvent = async ({ id }: DeleteEventParams) => {
    return httpClient.delete<EventMutationResponse>(`${API.EVENTS}/${id}`)
}

export const getEvents = async ({ filter }: GetEventsParams = {}) => {
    return httpClient.get<EventListResponse>(API.EVENTS, filter)
}
