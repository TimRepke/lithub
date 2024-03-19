import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Dataset, loadDataset } from "@/util/dataset.ts";
import { DatasetInfo } from "@/util/types";

type LoadInfo = { progressCols: number; progressArrow: number };
export const useDatasetStore = defineStore("dataset", () => {
  const isLoading = ref(false);
  const loadingProgress = ref<LoadInfo>({
    progressCols: 0,
    progressArrow: 0,
  });
  const dataset = ref<Dataset | null>(null);
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

    dataset.value = await loadDataset({
      info: info,
      dataset: info.key,
      scheme: info.scheme,
      arrowFile: info.arrow_filename,
      maskCallback: (colsLoaded) => {
        (loadingProgress.value as LoadInfo).progressCols = colsLoaded;
      },
      dataCallback: (bytesLoaded) => ((loadingProgress.value as LoadInfo).progressArrow = bytesLoaded),
      startYear: info.start_year,
      endYear: info.end_year,
    });

    // Stop loading counter
    isLoading.value = false;
  }

  const isLoaded = computed(() => dataset.value !== null);
  return { dataset, load, loadingProgress, isLoading, isLoaded };
});
