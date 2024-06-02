import { type Ref, type ComputedRef, readonly, ref, toRef, watch, computed } from "vue";
import { type Table, tableFromIPC } from "apache-arrow";
import { None, useDelay } from "@/util/index.ts";
import { DATA_BASE, POST, request } from "@/util/api.ts";
import type {
  ReadonlyRef,
  AnnotatedDocument,
  ArrowSchema,
  DatasetInfo,
  Keyword,
  KeywordArrowSchema,
  SchemeLabel,
} from "@/util/types";
import { type Bitmask, and, or, isSame, loadMask } from "@/util/dataset/filters/bitmask.ts";
import type { Mask } from "@/util/dataset/filters/types";

export type BufferEntry = SchemeLabel & { mask: Bitmask };

// get filtered array from mask (like np.array([1,2,3,4])[[True, True, False, True]]
// Array.prototype.maskFilter = function(mask) {
//   return this.filter((item, i) => mask[i]);
// }

export interface Dataset {
  info: DatasetInfo;
  arrow: Table<ArrowSchema>;
  masks: Ref<Record<string, Mask>>;

  countTotal: ReadonlyRef<number>;
  countFiltered: ReadonlyRef<number>;
  version: ReadonlyRef<number>;

  registerMask: () => void;
  registerGroup: () => void;

  bitmask: Ref<Bitmask | None>; // aggregate global mask
  inclusive: Ref<boolean>; // when true, use OR for combination, else AND
  keywords: Ref<Keyword[]>;
  pickedColour: Ref<string>;

  documents: (docParams: { ids?: string[] | null; page?: number; limit?: number }) => Promise<AnnotatedDocument[]>;
  /*
    hasActiveMask(): boolean;

    masks(): Generator<AnyMask, void, any>;

    activeMasks(): Generator<AnyMask, void, any>;

    activeLabelMasks(): Generator<LabelValueMask, void, any>;

    activeBitmasks(): Generator<Bitmask | None, void, any>;

    activeLabelMaskColumns(): Generator<string, void, any>;

    */
}

export function useDataset(params: { info: DatasetInfo; arrow: Table<ArrowSchema>; masks: BufferEntry[] }): Dataset {
  const {
    groups,
    labels,
    start_year: startYear,
    end_year: endYear,
    key: name,
    default_colour: defaultColour,
    keywords_filename,
    total,
  } = params.info;

  const inclusive = ref(false);
  const _counts = ref({
    countFiltered: total,
    countTotal: total,
  });
  const counts = readonly(_counts);
  const _version = ref(0);
  const version = readonly(_version);

  const pyYears = params.arrow.getChild("publication_year");
  if (!pyYears) throw new Error("Missing publication_years column in arrow file!");
  // @ts-ignore
  const pyMask = useHistogramMask(startYear, endYear, pyYears);
  const searchMask = useSearchMask(name);
  const indexMasks = useIndexMasks(total);

  const bitmask = ref<Bitmask | None>();

  const keywords = ref<Keyword[]>([]);
  if (params.info.keywords_filename) {
    request({ method: "GET", path: `${DATA_BASE}/${name}/${keywords_filename}`, keepPath: true }).then(
      async (response) => {
        const keywordsArrow = await tableFromIPC<KeywordArrowSchema>(response.arrayBuffer());
        const xs = keywordsArrow.getChild("x")!;
        const ys = keywordsArrow.getChild("y")!;
        const levels = keywordsArrow.getChild("level")!;
        const kws = keywordsArrow.getChild("keyword")!;

        const _keywords: Keyword[] = new Array(keywordsArrow.numRows);
        for (let i = 0; i < keywordsArrow.numRows; i++) {
          _keywords[i] = { x: xs.get(i), y: ys.get(i), level: levels.get(i), keyword: kws.get(i) };
        }
        // sort by level so later on we can just grab the first N keywords and get from top to bottom
        _keywords.sort((a, b) => a.level - b.level);
        keywords.value = _keywords;
      },
    );
  }

  const pickedColour = ref(defaultColour);

  function update() {
    const newMask = inclusive.value ? or(...activeBitmasks()) : and(...activeBitmasks());
    if (isNew(bitmask.value, newMask)) {
      bitmask.value = newMask;
      for (const mask of masks()) {
        mask.updateCounts(hasActiveMask() ? bitmask.value : null);
      }
      _counts.value.countFiltered = bitmask.value?.count ?? _counts.value.countTotal;
      _version.value += 1;
    }
  }

  function hasActiveMask(): boolean {
    return [...activeMasks()].length > 0;
  }

  function* masks() {
    for (const mask of Object.values(params.labelMasks)) yield mask;
    for (const mask of Object.values(indexMasks.masks)) yield mask;
    yield searchMask;
    yield pyMask;
  }

  function* activeMasks() {
    for (const mask of masks()) if (mask.active?.value ?? mask.active) yield mask;
  }

  function* activeBitmasks() {
    for (const mask of activeMasks()) if (mask.bitmask?.value) yield mask.bitmask.value;
  }

  function* activeLabelMasks() {
    for (const mask of Object.values(params.labelMasks)) {
      if (mask.active.value) {
        for (const labelMask of Object.values(mask.masks)) {
          if (labelMask.active.value) {
            yield labelMask;
          }
        }
      }
    }
  }

  function* activeLabelMaskColumns() {
    for (const mask of activeLabelMasks()) yield mask.key;
  }

  async function documents(docParams: {
    ids?: string[] | null;
    page?: number;
    limit?: number;
  }): Promise<AnnotatedDocument[]> {
    const orderBy = [...activeLabelMaskColumns()];
    const mask = (!docParams.ids || docParams.ids.length === 0) && hasActiveMask() ? bitmask.value?.toBase64() : undefined;
    return await POST<AnnotatedDocument[]>({
      path: "/basic/documents",
      params: {
        limit: docParams.limit ?? 10,
        page: docParams.page ?? 0,
        dataset: name,
      },
      payload: {
        ids: docParams.ids,
        bitmask: mask,
        order_by: orderBy,
      },
    });
  }

  // set up watchers so we can bubble up changes
  watch(
    [...masks()].map((mask) => mask.version),
    update,
  );
  watch(inclusive, update);

  return {
    info: params.info,
    name: name,
    groups,
    labels,
    arrow: params.arrow,
    counts: toRef(counts),
    version: toRef(version),
    inclusive: toRef(inclusive),
    pickedColour: toRef(pickedColour),
    pyMask,
    searchMask,
    indexMasks,
    labelMaskGroups: params.labelMasks,
    bitmask: toRef(bitmask),
    keywords: toRef(keywords),
    hasActiveMask,
    masks,
    activeMasks,
    activeBitmasks,
    activeLabelMasks,
    activeLabelMaskColumns,
    documents,
  };
}
