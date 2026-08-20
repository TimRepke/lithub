<script setup lang="ts">
import { onUnmounted, ref } from "vue";

const { position } = defineProps({
  position: { type: String, required: false, default: "bottom" },
  text: { type: String, required: true },
  ttClass: { type: String, required: false, default: null },
});

const tooltipId = `tooltip-${crypto.randomUUID()}`;
const visible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const positionClass = {
  right: "tt-right",
  top: "tt-top",
  bottom: "tt-bottom",
  left: "tt-left",
}[position];

function clearTimer() {
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

// B005: dismiss the tooltip with Escape without moving the pointer. Listen on
// the document because a hover-triggered tooltip's element is not focused, so
// key events would not otherwise reach it.
function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && visible.value) hideNow();
}

// Show immediately, cancelling any pending hide. Moving from the trigger onto
// the tooltip itself keeps it open (B006).
function show() {
  clearTimer();
  if (!visible.value) {
    visible.value = true;
    document.addEventListener("keydown", onDocumentKeydown);
  }
}

// Grace period before hiding so the pointer can cross the gap between trigger
// and tooltip without dismissing it prematurely (B006).
function scheduleHide() {
  clearTimer();
  hideTimer = setTimeout(hideNow, 200);
}

function hideNow() {
  clearTimer();
  if (visible.value) {
    visible.value = false;
    document.removeEventListener("keydown", onDocumentKeydown);
  }
}

onUnmounted(() => {
  clearTimer();
  document.removeEventListener("keydown", onDocumentKeydown);
});
</script>

<template>
  <span
    class="lh-tooltip"
    :aria-describedby="tooltipId"
    @mouseenter="show"
    @mouseleave="scheduleHide"
    @focusin="show"
    @focusout="scheduleHide">
    <slot />
    <span
      v-show="visible"
      :id="tooltipId"
      role="tooltip"
      class="lh-tooltiptext"
      :class="[positionClass, ttClass]"
      @mouseenter="show"
      @mouseleave="scheduleHide">
      {{ text }}
    </span>
  </span>
</template>

<style scoped lang="scss">
.lh-tooltip {
  position: relative;
  display: inline-block;
  cursor: help;

  --tooltip-margin-x: 1rem;
  --tooltip-margin-y: -1rem;
  --tooltip-padding-x: 1rem;
  --tooltip-padding-y: 0.5rem;

  & > .lh-tooltiptext {
    text-align: left;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: var(--tooltip-padding-y) var(--tooltip-padding-x);
    margin: var(--tooltip-margin-y) var(--tooltip-margin-x);
    border-radius: 0.5em;

    /* Position the tooltip text - see examples below! */
    position: absolute;
    inline-size: max-content;
    z-index: 1000;
  }

  .tt-top {
    transform: translate(calc(50% - var(--tooltip-padding-y) + var(--tooltip-margin-y)), 100%);
  }

  .tt-right {
    transform: translate(-1em, 0);
  }

  .tt-bottom {
    transform: translate(calc(-50% - var(--tooltip-padding-y) + var(--tooltip-margin-y)), 100%);
  }

  .tt-left {
    transform: translate(
      calc(-100% - 3 * var(--tooltip-padding-y) + var(--tooltip-margin-y)),
      calc(100% - var(--tooltip-padding-x) - var(--tooltip-margin-x))
    );
  }
}
</style>
