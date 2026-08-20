<script setup lang="ts">
import { ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emit = defineEmits<{ (e: "visibilityUpdated", newState: boolean): void }>();
const { initialState } = defineProps({
  initialState: { type: Boolean, required: false, default: true },
  title: { type: String, required: true },
});
const open = ref(initialState);
watch(open, () => emit("visibilityUpdated", open.value));

function toggleOpen(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    open.value = !open.value;
  }
}
</script>

<template>
  <div class="column-container" style="flex: 1" :class="{ closed: !open }">
    <h2
      class="column-head"
      @click="open = !open"
      @keydown="toggleOpen"
      :aria-expanded="open"
      :aria-label="`${title}, press Enter or Space to ${open ? 'collapse' : 'expand'}`"
      role="button"
      :tabindex="0">
      {{ title }}
      <font-awesome-icon class="text-muted small ms-auto" :icon="open ? 'eye' : 'eye-slash'" />
    </h2>
    <input type="checkbox" v-model="open" style="display: none" />
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
  margin: 0;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
}

.column-head:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: -1px;
}

.column-body {
  overflow-x: hidden;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

// B026 reflow: when panels stack vertically, each open panel takes the full
// width and a usable min-height, and collapsed panels show a normal
// horizontal header instead of the rotated vertical one.
@media (max-width: 700px) {
  .column-container {
    flex: none;
    width: 100% !important;
    min-height: 60vh;
  }

  .column-container.closed {
    flex: none !important;
    min-height: 0;

    .column-head {
      writing-mode: horizontal-tb;
      transform: none;
      height: auto;
      width: 100%;
      margin: 0;
      padding: 0.25rem;
      flex-direction: row;
      justify-content: flex-start;

      svg {
        transform: none;
        margin-bottom: 0;
      }
    }
  }
}
</style>
