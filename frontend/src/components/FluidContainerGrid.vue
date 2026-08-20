<script setup lang="ts">
// Inspired by https://stackoverflow.com/questions/28767221/flexbox-resizing

import { onMounted, ref, useSlots } from "vue";

type Container = { name: string; state: boolean };
const slots = useSlots();
const containers = ref<Container[]>([]);

function manageKeyboardResize(ke: KeyboardEvent, sizeProp: "offsetWidth" | "offsetHeight") {
  const r = ke.target as HTMLDivElement;

  const prev = r.previousElementSibling as HTMLDivElement;
  let next = r.nextElementSibling as HTMLDivElement;

  while (next) {
    if (!next.classList.contains("closed") && !next.classList.contains("flex-resizer")) break;
    next = next.nextElementSibling as HTMLDivElement;
  }

  if (!prev || !next) return;

  const resizeAmount = 0.1; // 10% of combined size
  const prevSize = prev[sizeProp];
  const nextSize = next[sizeProp];
  const sumSize = prevSize + nextSize;
  const prevGrow = Number(prev.style.flexGrow);
  const nextGrow = Number(next.style.flexGrow);
  const sumGrow = prevGrow + nextGrow;

  const delta = sumSize * resizeAmount;
  let prevSize_ = prevSize;
  let nextSize_ = nextSize;

  if (ke.key === "ArrowLeft" || ke.key === "ArrowUp") {
    prevSize_ = Math.max(0, prevSize - delta);
    nextSize_ = sumSize - prevSize_;
  } else if (ke.key === "ArrowRight" || ke.key === "ArrowDown") {
    prevSize_ = Math.min(sumSize, prevSize + delta);
    nextSize_ = sumSize - prevSize_;
  }

  prev.style.flexGrow = `${sumGrow * (prevSize_ / sumSize)}`;
  next.style.flexGrow = `${sumGrow * (nextSize_ / sumSize)}`;

  ke.preventDefault();
}

function manageResize(md: MouseEvent, sizeProp: "offsetWidth" | "offsetHeight", posProp: "pageX" | "pageY") {
  const r = md.target as HTMLDivElement;

  const prev = r.previousElementSibling as HTMLDivElement;
  let next = r.nextElementSibling as HTMLDivElement;

  // Skip closed elements and find the next opened column
  while (next) {
    if (!next.classList.contains("closed") && !next.classList.contains("flex-resizer")) break;
    next = next.nextElementSibling as HTMLDivElement;
  }

  if (!prev || !next) {
    return;
  }

  md.preventDefault();

  const prevSize = prev[sizeProp];
  const nextSize = next[sizeProp];
  const sumSize = prevSize + nextSize;
  const prevGrow = Number(prev.style.flexGrow);
  const nextGrow = Number(next.style.flexGrow);
  const sumGrow = prevGrow + nextGrow;
  const startPos = md[posProp];

  function onMouseMove(mm: MouseEvent) {
    const d = mm[posProp] - startPos;

    let prevSize_ = prevSize + d;
    let nextSize_ = nextSize - d;

    if (prevSize_ < 0) {
      prevSize_ = 0;
      nextSize_ = sumSize;
    }
    if (nextSize < 0) {
      nextSize_ = 0;
      prevSize_ = sumSize;
    }

    prev.style.flexGrow = `${sumGrow * (prevSize_ / sumSize)}`;
    next.style.flexGrow = `${sumGrow * (nextSize_ / sumSize)}`;
  }

  function onMouseUp() {
    // Change cursor to signal a state's change: stop resizing.
    const html = document.querySelector("html") as HTMLHtmlElement;
    html.style.cursor = "default";

    if (posProp === "pageX") {
      r.style.cursor = "ew-resize";
    } else {
      r.style.cursor = "ns-resize";
    }

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

onMounted(() => {
  containers.value = Object.keys(slots)
    .toSorted()
    .map((name) => ({ name, state: false }));

  // Used to avoid cursor's flickering
  const html = document.querySelector("html") as HTMLHtmlElement;

  document.body.addEventListener("mousedown", function (md: MouseEvent) {
    const target = md.target as HTMLDivElement;
    const parent = target.parentNode as HTMLDivElement;

    if (!target.classList.contains("flex-resizer")) return;

    const h = parent.classList.contains("h");
    const v = parent.classList.contains("v");
    if (h) {
      // Change cursor to signal a state's change: begin resizing on H.
      target.style.cursor = "col-resize";
      html.style.cursor = "col-resize"; // avoid cursor's flickering

      // use offsetWidth versus scrollWidth (and clientWidth) to avoid splitter's jump on resize when a column-container
      // content overflow (overflow: auto).
      manageResize(md, "offsetWidth", "pageX");
    } else if (v) {
      // Change cursor to signal a state's change: begin resizing on V.
      target.style.cursor = "row-resize";
      html.style.cursor = "row-resize"; // avoid cursor's flickering

      manageResize(md, "offsetHeight", "pageY");
    }
  });

  document.body.addEventListener("keydown", function (ke: KeyboardEvent) {
    const target = ke.target as HTMLDivElement;

    if (!target.classList.contains("flex-resizer")) return;

    const parent = target.parentNode as HTMLDivElement;
    const h = parent.classList.contains("h");
    const v = parent.classList.contains("v");

    if (
      (h && (ke.key === "ArrowLeft" || ke.key === "ArrowRight")) ||
      (v && (ke.key === "ArrowUp" || ke.key === "ArrowDown"))
    ) {
      const sizeProp = h ? "offsetWidth" : "offsetHeight";
      manageKeyboardResize(ke, sizeProp);
    }
  });
});
</script>

<template>
  <div class="flex h" style="flex: 1">
    <template v-for="(container, ci) in containers" :key="container.name">
      <slot :name="container.name" />
      <div
        v-if="ci < containers.length - 1"
        class="flex-resizer"
        tabindex="0"
        role="button"
        aria-label="Resize panels: use arrow keys to adjust width/height" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.flex {
  display: flex;
  flex-flow: nowrap;
  overflow: hidden;
}

.flex.h {
  flex-direction: row;
}

.flex.v {
  flex-direction: column;
}

.flex > .flex-resizer {
  flex: 0 0 0.5ch;
  background-color: #ffffff;
  background-repeat: no-repeat;
  background-position: center;
}

.flex.h > .flex-resizer {
  cursor: ew-resize;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='30'><path d='M2 0 v30 M5 0 v30 M8 0 v30' fill='none' stroke='black'/></svg>");
}

.flex.v > .flex-resizer {
  cursor: ns-resize;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='10'><path d='M0 2 h30 M0 5 h30 M0 8 h30' fill='none' stroke='black'/></svg>");
}

.closed + .flex-resizer {
  display: none;
}

.flex-resizer:focus {
  outline: 3px solid #0d6efd;
  outline-offset: -2px;
  background-color: #e7f1ff;
}
</style>
