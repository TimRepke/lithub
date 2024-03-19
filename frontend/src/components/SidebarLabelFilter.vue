<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import { computed, PropType } from "vue";
import InclusiveIcon from "@/components/InclusiveIcon.vue";

const uniq = crypto.randomUUID();
const pickedColour = defineModel("pickedColour");
const props = defineProps({
  maskKey: { type: String, required: true },
  colours: { type: Object as PropType<Record<number, string>>, required: true },
});

const dataStore = useDatasetStore();
const maskGroup = dataStore.dataset!.labelMaskGroups[props.maskKey];

const styleColours = computed(() =>
  Object.fromEntries(
    Object.entries(props.colours).map(([mKey, col]) => {
      return [
        mKey,
        maskGroup.masks[mKey].active ? { backgroundColor: col, borderColor: col } : { borderColor: col },
      ]
    }),
  ),
);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>{{ maskGroup.name }}</div>
      <div>
        <InclusiveIcon v-model:inclusive="maskGroup.inclusive" />

        <input
          type="radio"
          :id="`colour-${maskKey}-${uniq}`"
          :value="maskKey"
          v-model="pickedColour"
          name="colour-picker"
        />
        <label :for="`colour-${maskKey}-${uniq}`" class="icon">
          <font-awesome-icon icon="palette" />
        </label>

        <input type="checkbox" :id="`active-${maskKey}-${uniq}`" v-model="maskGroup.active" />
        <label :for="`active-${maskKey}-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </div>
    </div>
    <div class="filter-masks">
      <template v-for="(mask, mKey) in maskGroup.masks" :key="mKey">
        <input type="checkbox" :id="`active-${maskKey}-${mKey}-${uniq}`" v-model="mask.active" />
        <label :for="`active-${maskKey}-${mKey}-${uniq}`" :style="styleColours[mKey]">
          <span class="counts">
            <span>
              {{ mask.counts.countFiltered.toLocaleString() }} /
              {{ mask.counts.countTotal.toLocaleString() }}
            </span>
          </span>
          <span>
            {{ mask.name }}
          </span>
        </label>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter {
  .filter-masks {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25em 0.5em;

    input[type="checkbox"] {
      display: none;
    }

    > label {
      text-wrap: nowrap;
      border-width: 2px;
      border-style: solid;
      border-radius: 0.25em;
      padding: 0 0.25em;

      box-sizing: content-box;
      display: flex;
      flex-direction: column;

      .counts {
        display: flex;
        flex-direction: row;
        justify-content: right;
        align-items: center;
        font-size: 0.75em;
        margin-bottom: -0.5em;
        margin-top: 0.5em;
      }
    }
  }
}
</style>
