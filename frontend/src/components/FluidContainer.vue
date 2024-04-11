<script setup lang="ts">
import { ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emit = defineEmits<{ (e: "visibilityUpdated", newState: boolean): void }>();
const { initialState } = defineProps({
  initialState: { type: Boolean, required: false, default: true },
  title: { type: String, required: true },
});
const open = ref(initialState);
const uniq = crypto.randomUUID();
watch(open, () => emit("visibilityUpdated", open.value));
</script>

<template>
  <div class="column-container" style="flex: 1" :class="{ closed: !open }">
    <label class="column-head" :for="`col-open-${uniq}`">
      {{ title }}
      <font-awesome-icon class="text-muted small ms-auto" :icon="open ? 'eye' : 'eye-slash'" />
    </label>
    <input type="checkbox" v-model="open" :id="`col-open-${uniq}`" style="display: none" />
    <div class="column-body" v-if="open">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.column-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  border: {
    left: 1px solid var(--socdr-grey);
    right: 1px solid var(--socdr-grey);
  }

  &.closed {
    flex: none !important;

    .column-head {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      height: 100%;
      width: 1em;
      margin: 0 0.15em 0 0;
      padding: 0.25em 0 0 0;
      line-height: 1;
      flex-direction: row-reverse;
      justify-content: flex-end;

      svg {
        transform: rotate(90deg);
        margin-bottom: 0.25em;
      }
    }

    & + .flex-resizer {
      display: none;
    }
  }
}

.column-head {
  background-color: var(--socdr-grey);
  font-variant-caps: small-caps;
  font-weight: bold;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  display: flex;
  align-items: center;
}

.column-body {
  overflow-x: hidden;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
