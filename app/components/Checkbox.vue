<template>
    <label class="container"
        >{{ label }}
        <input
            type="checkbox"
            @change="emit('change', checkedRef)"
            v-model="checkedRef"
            :disabled="disabled"
        />
        <span class="crossmark" />
    </label>
</template>

<script lang="ts" setup>
const { disabled, checked, label } = defineProps({
    disabled: {
        type: Boolean,
        default: false,
    },
    checked: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        required: false,
    },
})

const checkedRef = ref(checked)

const emit = defineEmits<{
    change: [newValue: boolean]
}>()
</script>

<style lang="scss">
.container {
    display: block;
    position: relative;
    padding-left: 17px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
    }

    .crossmark {
        position: absolute;
        top: 0.2rem;
        left: 0;
        height: 12px;
        width: 12px;
        border: 1px solid white;

        &:after,
        &:before {
            content: '';
            position: absolute;
            display: none;
        }
    }

    input:checked ~ .crossmark {
        &:after,
        &:before {
            display: block;
        }
    }

    &:hover {
        cursor: default;

        input:not(:disabled) {
            & ~ .crossmark {
                cursor: pointer;

                &:before,
                &:after {
                    display: block;
                }
            }

            &:not(:checked) ~ .crossmark {
                &:before,
                &:after {
                    background-color: #ccc;
                }
            }

            &:checked ~ .crossmark {
                &:before,
                &:after {
                    background-color: white;
                }
            }
        }
    }

    .crossmark {
        &:after,
        &:before {
            left: 2px;
            top: 6px;
            width: 10px;
            height: 2px;
            background-color: white;
        }

        &:after {
            transform: rotate(45deg);
        }

        &:before {
            transform: rotate(-45deg);
        }
    }
}
</style>
