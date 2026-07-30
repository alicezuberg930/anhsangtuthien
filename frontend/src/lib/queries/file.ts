import { mutationOptions } from '@tanstack/react-query'
import { httpClient } from '../repository/http-client'
import type { UploadFileParams, UploadFileResponse } from '@/@types/file'

const keys = {
    upload: () => ['file', 'upload'],
}

export const files = () => ({
    upload: {
        mutationKey: keys.upload(),
        mutationOptions: () =>
            mutationOptions({
                mutationKey: keys.upload(),
                mutationFn: async (input: UploadFileParams) => {
                    return httpClient.post<UploadFileResponse>('/file/upload', input)
                },
            }),
    },
})