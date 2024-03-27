import { defineStore } from "pinia";
import { computed, ref, toRef } from "vue";
import { Dataset, loadDataset } from "@/util/dataset.ts";
import { DatasetInfo } from "@/util/types";
import { Indexes } from "@/util/dataset/masks/ids.ts";

type LoadInfo = { progressCols: number; progressArrow: number };

export function useDatasetStore<K extends Indexes>() {
  const useStore = defineStore("dataset", () => {
    const isLoading = ref(false);
    const isLoaded = ref(false);
    const loadingProgress = ref<LoadInfo>({
      progressCols: 0,
      progressArrow: 0,
    });
    const _dataset = { value: null } as { value: Dataset<K> | null };

    // let dataset: Dataset | null = null;

    async function load(info: DatasetInfo) {
      // Prevent multiple loads
      if (isLoading.value) throw Error("Already loading!");

      // Reset loading counter
      isLoading.value = true;
      loadingProgress.value = {
        progressCols: 0,
        progressArrow: 0,
      };

      _dataset.value = await loadDataset<K>({
        info: info,
        maskCallback: (colsLoaded) => {
          (loadingProgress.value as LoadInfo).progressCols = colsLoaded;
        },
        dataCallback: (bytesLoaded) => ((loadingProgress.value as LoadInfo).progressArrow = bytesLoaded),
      });

      // Stop loading counter
      isLoading.value = false;
      isLoaded.value = true;
    }

    const dataset = computed(() => _dataset.value);

    return {
      dataset,
      load,
      _dataset,
      loadingProgress: toRef(loadingProgress),
      isLoading: toRef(isLoading),
      isLoaded: toRef(isLoaded),
    };
  });

  return useStore();
}
