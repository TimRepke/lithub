import { createPinia } from "pinia";
import { Indexes } from "@/util/dataset/masks/ids.ts";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import { useApiStore } from "@/stores/apistore.ts";

export const pinia = createPinia();

export const apiStore = useApiStore(pinia);
export const datasetStore = useDatasetStore<Indexes>()(pinia);
export { type DatasetStore } from "@/stores/datasetstore.ts";
