import type { Config } from 'prettier'

export default {
    plugins: ['prettier-plugin-vue'],
    semi: false,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
} satisfies Config
