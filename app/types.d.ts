export type TableColumnConfiguration = {
    width?: number | string
    member: string
    title?: string
    cellClassList?: string
}

export type PageWithLayoutColumn = {
    width: string
    components: {
        title: string
        content: VNode
    }[]
}
