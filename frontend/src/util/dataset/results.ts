import type { ComputedRef, Ref } from "vue";
import type { AnnotatedDocument } from "@/util/types";
import { computed, ref, toRef, watch } from "vue";
import { useDelay } from "@/util";
import { Dataset } from "@/util/dataset/index.ts";

export interface Results {
  documents: Ref<AnnotatedDocument[]>;
  page: Ref<number>;
  limit: Ref<number>;
  paused: Ref<boolean>;
  numPages: ComputedRef<number>;
  pages: ComputedRef<number[]>;
  next: () => void;
  prev: () => void;
  update: () => void;
  delayedUpdate: () => void;
  hasPrev: ComputedRef<boolean>;
  hasNext: ComputedRef<boolean>;
}

export function useResults(dataset: Dataset): Results {
  // const dataStore = useDatasetStore();
  const REQUEST_DELAY = 250;
  const MAX_PAGES = 8;

  const paused = ref(false);
  const page = ref(0);
  const limit = ref(10);
  const documents = ref<AnnotatedDocument[]>([]);

  const { call: update, delayedCall: delayedUpdate } = useDelay(async () => {
    if (!paused.value) {
      documents.value = await dataset.documents({ page: page.value, limit: limit.value });
    }
    return documents.value;
  }, REQUEST_DELAY);

  const hasNext = computed(() => page.value < numPages.value - 1);

  function next() {
    if (hasNext.value) page.value += 1;
  }

  const hasPrev = computed(() => page.value > 0);

  function prev() {
    if (hasPrev.value) page.value -= 1;
  }

  const numPages = computed(() => {
    const total = dataset.counts.value.countFiltered;
    return Math.ceil((total ?? 0) / limit.value);
  });
  const pages = computed(() => {
    if (numPages.value <= MAX_PAGES) {
      return [...Array(numPages.value).keys()];
    }
    if (page.value + MAX_PAGES / 2 > numPages.value) {
      const firstPage = Math.max(0, numPages.value - MAX_PAGES);
      return [...Array(MAX_PAGES).keys()].map((p) => p + firstPage);
    }
    const firstPage = Math.max(0, page.value - MAX_PAGES / 2);
    return [...Array(Math.min(MAX_PAGES)).keys()].map((p) => p + firstPage);
  });

  watch(dataset.version, delayedUpdate);
  watch([page, limit], update);

  return {
    documents: toRef(documents),
    paused: toRef(paused),
    page: toRef(page),
    limit: toRef(limit),
    numPages: toRef(numPages),
    pages: toRef(pages),
    hasPrev: toRef(hasPrev),
    hasNext: toRef(hasNext),
    next,
    prev,
    update,
    delayedUpdate,
  };
}
