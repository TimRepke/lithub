import type { Mask, Index } from "@/util/dataset/filters/types";
import { readonly, ref, toRef, watch, WatchStopHandle } from "vue";

export function useIndex<T extends Mask>(): Index<T> {
  const index: Record<string, T> = {};
  const _version = ref(0);
  const version = readonly(_version);
  let unwatch: WatchStopHandle | undefined;

  function register(key: string, entry: T, quiet?: boolean) {
    index[key] = entry;
    if (!quiet) update();
  }

  function unregister(key: string) {
    delete index[key];
    update();
  }

  function update() {
    if (unwatch) unwatch();
    unwatch = watch(
      Object.values(index).map((entry) => entry.version),
      () => (_version.value += 1),
    );
    _version.value += 1;
  }

  return {
    index,
    version: toRef(version),
    update,
    register,
    unregister,
  };
}
