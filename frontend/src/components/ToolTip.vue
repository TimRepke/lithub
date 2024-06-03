<script setup lang="ts">
const { position } = defineProps({
  position: { type: String, required: false, default: "bottom" },
  text: { type: String, required: true },
  ttClass: { type: String, required: false, default: null },
});

const positionClass = {
  right: "tt-right",
  top: "tt-top",
  bottom: "tt-bottom",
  left: "tt-left",
}[position];
</script>

<template>
  <span class="lh-tooltip">
    <slot />
    <span class="lh-tooltiptext" :class="[positionClass, ttClass]">
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
    visibility: hidden;
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

  &:hover {
    font-weight: bold;

    .lh-tooltiptext {
      font-weight: normal;
      visibility: visible;
    }
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
