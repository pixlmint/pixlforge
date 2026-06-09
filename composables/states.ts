import { useState } from 'nuxt/app'

type ForgeState = {
    viewingRepo?: string
}

export const useForgeState = () =>
    useState<ForgeState>('forge', () => {
        return {}
    })
