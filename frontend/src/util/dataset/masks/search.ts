import type { Ref } from "vue";
import { ref, toRef } from "vue";
import { request } from "@/util/api.ts";
import { MaskBase, useBase } from "@/util/dataset/masks/base.ts";
import { useDelay } from "@/util";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";

const SEARCH_DELAY = 1000;
const MIN_LEN = 3;

export interface SearchMask extends MaskBase {
  fields: Ref<string[]>;
  search: Ref<string>;

  fetch: () => void;
  delayedFetch: () => void;
  clear: () => void;
}

export function useSearchMask(dataset: string): SearchMask {
  const base = useBase({});
  const { _mask, active, counts } = base;
  const fields = ref(["title", "abstract"]);
  const search = ref("");

  const { delayedCall: delayedFetch, call: fetch } = useDelay(async () => {
    active.value = search.value.length >= MIN_LEN;
    if (search.value.length <= MIN_LEN) {
      // to not run update() here (no need to trigger a redraw when clearing the search bar)
      return;
    }
    const rawMask = await request({
      method: "GET",
      path: `/basic/search/bitmask/${dataset}`,
      params: { query: search.value, fields: fields.value },
    });
    _mask.value = Bitmask.fromBase64(await rawMask.text());
    base.update();
  }, SEARCH_DELAY);

  function clear() {
    active.value = false;
    search.value = "";
    fields.value = ["title", "abstract"];
    base.update();
  }

  function updateCounts(globalMask: Bitmask | null): void {
    if (base.mask !== null) {
      base.setTotalCount(base.mask.count);
      base.setFilterCount(and(globalMask, base.mask)?.count ?? counts.value.countTotal);
    }
  }

  // watch(this.search, () => this.delayedFetch()); // uncomment this for searching as you type
  //   watch(this.fields, () => this.fetchSearch());
  //   // this is just a hack; calling fetchSearch would otherwise loose this.* context
  //   this.trigger = () => this.fetchSearch();
  return {
    ...base,
    fields: toRef(fields),
    search: toRef(search),
    fetch,
    delayedFetch,
    clear,
    updateCounts,
    get mask() {
      if (!active.value) return null;
      return _mask.value;
    },
  };
}
