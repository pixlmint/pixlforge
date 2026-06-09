import { useState } from 'nuxt/app'

type ForgeState = {
    viewingRepo?: string
    selectedFont: string
}

export const useForgeState = () =>
    useState<ForgeState>('forge', () => {
        return {
            selectedFont: 'Jetbrains Mono',
        }
    })
