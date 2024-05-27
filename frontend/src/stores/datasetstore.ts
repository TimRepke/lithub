import { defineStore } from "pinia";
import { computed, type ComputedRef, readonly, type Ref, ref, toRef } from "vue";
import { Dataset, loadDataset } from "@/util/dataset";
import { DatasetInfo } from "@/util/types";

type LoadInfo = { progressCols: number; progressArrow: number };

export interface DatasetStore {
  _dataset: { value: Dataset | null };
  dataset: ComputedRef<Dataset | null>;
  load: (info: DatasetInfo) => Promise<void>;
  loadingProgress: Ref<LoadInfo>;
  isLoading: Ref<boolean>;
  isLoaded: Ref<boolean>;
  awaitReady: () => Promise<void>;
}

const _version = ref(0);
export const version = readonly(_version);

export const useDatasetStore = defineStore<"dataset", DatasetStore>("dataset", () => {
  const isLoading = ref(false);
  const isLoaded = ref(false);

  let loadingPromise: Promise<void> | null = null;
  const loadingProgress = ref<LoadInfo>({
    progressCols: 0,
    progressArrow: 0,
  });
  const _dataset = { value: null } as { value: Dataset | null };
  const dataset = computed(() => _dataset.value);

  async function awaitReady() {
    if (loadingPromise) return loadingPromise;
    if (!isLoaded.value) return Promise.reject();
    return Promise.resolve();
  }

  async function load(info: DatasetInfo, threshold?: number) {
    // Prevent multiple loads
    if (isLoading.value) throw Error("Already loading!");

    _dataset.value = null;
    isLoaded.value = false;

    // Reset loading counter
    loadingPromise = new Promise<void>(async (resolve) => {
      isLoading.value = true;
      _version.value += 1;
      loadingProgress.value = {
        progressCols: 0,
        progressArrow: 0,
      };

      _dataset.value = await loadDataset({
        info: info,
        maskCallback: (colsLoaded) => {
          (loadingProgress.value as LoadInfo).progressCols = colsLoaded;
        },
        dataCallback: (bytesLoaded) => ((loadingProgress.value as LoadInfo).progressArrow = bytesLoaded),
        threshold,
      });

      // force refresh
      dataset.effect.trigger();
      dataset.effect.dirty = true;

      // Stop loading counter
      isLoading.value = false;
      isLoaded.value = true;
      _version.value += 1;

      // mark promise as resolved
      resolve();
    });
  }

  return {
    dataset,
    load,
    awaitReady,
    _dataset,
    loadingProgress: toRef(loadingProgress),
    isLoading: toRef(isLoading),
    isLoaded: toRef(isLoaded),
  } as DatasetStore;
});
