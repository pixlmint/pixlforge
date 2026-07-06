import type { Component, VNode } from 'vue'

export type TableColumnConfiguration = {
    width?: number | string
    member: string
    title?: string
    cellClassList?: string
    transform?: (value: any) => any
}

export type BaseLayoutColumnComponent = {
    title: string
    heading?: VNode
    createHeading?: () => VNode
    createHeading?: (data: any) => VNode
    columnIndex?: number
    gridArea: string
}

export type SyncLayoutColumnComponent = BaseLayoutColumnComponent & {
    content: VNode
}

export type AsyncLayoutColumnComponent = BaseLayoutColumnComponent & {
    loadContent: () => ReturnType<typeof useFetch>
    createComponent: (data: any) => VNode
}

export type LayoutColumnComponent = BaseLayoutColumnComponent &
    Partial<SyncLayoutColumnComponent> &
    Partial<AsyncLayoutColumnComponent>

export type PageWithLayoutColumn = {
    columns: string[]
    gridTemplateAreas: string[]
    components: LayoutColumnComponent[]
}
