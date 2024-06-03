<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed, ref, watch } from "vue";
import InclusiveIcon from "@/components/InclusiveIcon.vue";
import { DEFAULT_THRESHOLD, type LabelMaskGroup } from "@/util/dataset/masks/labels.ts";
import { useDelay } from "@/util";
import ToolTip from "@/components/ToolTip.vue";

const uniq = crypto.randomUUID();
const groupMask = defineModel<LabelMaskGroup>("groupMask", { required: true });
const pickedColour = defineModel("pickedColour");

const threshold = ref<number>(DEFAULT_THRESHOLD);
const editThreshold = ref<boolean>(false);

const { name, masks, inclusive, active, key: maskKey, setThresholds } = groupMask.value;

const styleColours = computed(() =>
  Object.fromEntries(
    Object.values(masks).map((mask) => [
      mask.value,
      mask.active.value
        ? { backgroundColor: mask.colourHex, borderColor: mask.colourHex }
        : { borderColor: mask.colourHex },
    ]),
  ),
);

const { delayedCall: delayedSetThresholds } = useDelay(async () => await setThresholds(threshold.value), 250);

watch(threshold, delayedSetThresholds);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>{{ name }}</div>
      <div>
        <InclusiveIcon v-model:inclusive="inclusive" />

        <ToolTip text="Set minimum label score" position="left">
          <input type="checkbox" :id="`eth-${maskKey}-${uniq}`" v-model="editThreshold" />
          <label :for="`eth-${maskKey}-${uniq}`" class="icon">
            <font-awesome-icon icon="sliders" />
          </label>
        </ToolTip>

        <ToolTip text="Use in map colour" position="left">
          <input
            type="radio"
            :id="`colour-${maskKey}-${uniq}`"
            :value="maskKey"
            v-model="pickedColour"
            name="colour-picker" />
          <label :for="`colour-${maskKey}-${uniq}`" class="icon">
            <font-awesome-icon icon="palette" />
          </label>
        </ToolTip>

        <ToolTip :text="`Toggle '${name}' filter`" position="left">
          <input type="checkbox" :id="`active-${maskKey}-${uniq}`" v-model="active" />
          <label :for="`active-${maskKey}-${uniq}`" class="icon">
            <font-awesome-icon icon="filter" />
          </label>
        </ToolTip>
      </div>
    </div>

    <div v-if="editThreshold">
      <label :for="`th-${maskKey}-${uniq}`" class="form-label">Threshold >= {{ threshold }}</label>
      <div class="form-text" id="basic-addon4">
        Human annotations exactly 0 or 1; automated annotations scores 0.01-0.99.
      </div>
      <input
        type="range"
        class="form-range"
        min="0"
        max="1"
        step="0.05"
        v-model="threshold"
        :id="`th-${maskKey}-${uniq}`" />
    </div>

    <div class="filter-masks">
      <template v-for="(mask, mKey) in masks" :key="mKey">
        <input type="checkbox" :id="`active-${maskKey}-${mKey}-${uniq}`" v-model="mask.active.value" />
        <label :for="`active-${maskKey}-${mKey}-${uniq}`" :style="styleColours[mKey]">
          <span class="counts">
            <span>
              {{ mask.counts.value.countFiltered.toLocaleString() }} /
              {{ mask.counts.value.countTotal.toLocaleString() }}
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
