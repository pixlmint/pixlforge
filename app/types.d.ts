import type { Component, VNode } from 'vue'

export type TableColumnConfiguration = {
    width?: number | string
    member: string
    title?: string
    cellClassList?: string
}

export type BaseLayoutColumnComponent = {
    title: string
    heading?: VNode
    createHeading?: () => VNode
    createHeading?: (data: any) => VNode
}

export type SyncLayoutColumnComponent = BaseLayoutColumnComponent & {
    content: VNode
}

export type AsyncLayoutColumnComponent = BaseLayoutColumnComponent & {
    loadContent: () => ReturnType<typeof useFetch>
    createComponent: (data: any) => VNode
}

export type PageWithLayoutColumn = {
    width: string
    components: (AsyncLayoutColumnComponent | SyncLayoutColumnComponent)[]
}

export type LayoutColumnComponent = BaseLayoutColumnComponent &
    Partial<SyncLayoutColumnComponent> &
    Partial<AsyncLayoutColumnComponent>
