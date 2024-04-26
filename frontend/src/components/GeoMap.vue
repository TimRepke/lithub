<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { scaleSequential as d3scaleSequential } from "d3-scale";
import { extent as d3extent } from "d3-array";
import { create as d3create, pointer as d3pointer } from "d3-selection";
import { zoom as d3zoom, zoomTransform as d3zoomTransform, zoomIdentity as d3zoomIdentity } from "d3-zoom";
import { interpolateBlues as d3interpolateBlues } from "d3-scale-chromatic";

import type { Selection, BaseType } from "d3";
import { d3lasso, type ItemSelection } from "@/util/lasso";
import type { Feature, GeometryObject } from "geojson";
import { isNone } from "@/util";
import type { None } from "@/util";
import { useGeodata } from "@/util/geo";
import type { Countries, CountryProp, ProjectedEntry } from "@/util/geo";
import type { IndexMask } from "@/util/dataset/masks/ids";
import type { Bitmask } from "@/util/dataset/masks/bitmask";

type AnnotatedEntry = ProjectedEntry & {
  filterInclude: boolean;
  inSelection: boolean;
  filterCount: number;
};
type PlaceSelection = ItemSelection<SVGCircleElement, AnnotatedEntry, SVGSVGElement, undefined>;
const uniq = crypto.randomUUID();
const loading = ref<boolean>(true);
const mapElement = ref<HTMLDivElement | null>(null);

const { slimUrl, fullUrl } = defineProps({
  slimUrl: { type: String, required: true },
  fullUrl: { type: String, required: true },
});

const mask = defineModel<IndexMask>("mask", { required: true });
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const { selectIds, clear: clearSelection, active } = mask.value;

const data = useGeodata(slimUrl, fullUrl);
let full: Record<number, ProjectedEntry[]> = {};
let topo: Countries;

let countryDocuments: Record<number, number[]> = {};
let countryTotalCounts: Record<number, number> = {};

const focusCountry = ref<number | null>(null);
const selectedGeonameIds = ref<number[]>([]);

const showAdmin0 = ref<boolean>(true);
const showAdmin1 = ref<boolean>(true);
const showTotalCounts = ref<boolean>(true);

const isSelectionActive = computed<boolean>(() => selectedGeonameIds.value.length > 0);

const annotatedPlaces = computed<AnnotatedEntry[]>(() => {
  if (isNone(focusCountry.value)) return [];
  const entries = full[focusCountry.value];
  if (!entries) return [];
  const filtering = (globalMask.value?.count ?? 0) > 0;
  return entries.map((entry) => {
    const filterCount = entry.idxs.filter((idx) => !filtering || (filtering && !!globalMask.value?.get(idx))).length;
    return {
      ...entry,
      filterCount,
      filterInclude: filterCount > 0,
      inSelection: selectedGeonameIds.value.indexOf(entry.geonameid) >= 0,
    };
  });
});

const countryFilterCounts = computed<Record<number, number>>(() => {
  return Object.fromEntries(
    Object.entries(countryDocuments).map(([country, idxs]) => [
      country,
      idxs.filter((i) => globalMask.value?.get(i) ?? true).length,
    ]),
  );
});

const countryCounts = computed<Record<number, number>>(() => {
  return showTotalCounts.value ? countryTotalCounts : countryFilterCounts.value;
});

const width = 928;
const height = width / 1.61803;

const { projection, path } = data;
projection
  .scale(70)
  .center([0, 20])
  .translate([width / 2, height / 2]);

const svg = d3create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto;")
  .on("click", resetZoom);

const containerGroup = svg.append("g");
const countriesGroup = containerGroup.append("g");
const placesGroup = containerGroup.append("g");

let countryPaths: Selection<SVGPathElement | BaseType, Feature<GeometryObject, CountryProp>, SVGGElement, undefined>;
let placeCircles: Selection<SVGCircleElement | BaseType, AnnotatedEntry, SVGGElement, undefined>;

const zoom = d3zoom<SVGSVGElement, undefined>()
  .translateExtent([
    [0, 0],
    [width, height],
  ])
  .on("zoom", (event: any) => {
    containerGroup.attr("transform", event.transform);
    // on high zoom levels, make points smaller
    if (placeCircles) placeCircles.classed("small", event.transform.k > 125);
  });

const lasso = d3lasso<SVGCircleElement, AnnotatedEntry, SVGSVGElement, undefined>()
  .targetArea(svg)
  .on("end", () => {
    const selection = lasso.selectedItems().data();
    selectIds(selection.flatMap((d) => d.idxs));
    selectedGeonameIds.value = selection.map((d) => d.geonameid);
  });

function mouseClickCountry(event: MouseEvent, d: Feature<GeometryObject, CountryProp>) {
  // Shift key down; lasso in action
  if (event.shiftKey) return;

  // clicked already in-focus country; resetting zoom
  if (focusCountry.value === d.id) {
    resetZoom();
    focusCountry.value = null;
    return;
  }
  if (!countryTotalCounts[d.id as number]) {
    // country has no counts, nothing to focus on.
    return;
  }
  focusCountry.value = d.id as number;

  const [[x0, y0], [x1, y1]] = path.bounds(d);
  event.stopPropagation();

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(100, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3pointer(event, svg.node()),
    );

  selectIds(countryDocuments[d.id as number]);
  redrawCountries();
}

function resetZoom() {
  focusCountry.value = null;
  selectedGeonameIds.value = [];

  clearSelection();
  redrawCountries();
  redrawPlaces();

  svg
    .transition()
    .duration(450)
    .call(zoom.transform, d3zoomIdentity, d3zoomTransform(containerGroup.node()!).invert([width / 2, height / 2]));
}

function redrawCountries() {
  if (!topo) return; // Stop right here if topography is not loaded yet
  const colorScale = d3scaleSequential(
    d3extent(Object.values(countryCounts.value)) as [number, number],
    d3interpolateBlues,
  );

  countryPaths = countriesGroup //
    .selectAll("path")
    .data(topo.features)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => colorScale(countryCounts.value[d.id as number]) ?? "#fff")
    .attr("class", "country")
    .classed("selected", (d) => d.id === focusCountry.value)
    // .on("mouseover", () => {
    //   d3selectAll(".country").transition().duration(200).style("opacity", 0.5);
    //   d3select(this).transition().duration(200).style("opacity", 1).style("stroke-width", "var(--stroke-width-focus)");
    // })
    // .on("mouseleave", () => {
    //   d3selectAll(".country").transition().duration(200).style("opacity", 1);
    //   d3select(this).transition().duration(200).style("stroke-width", "var(--stroke-width-default)");
    // })
    .on("click", mouseClickCountry);

  countryPaths //
    .append("title")
    .text(
      (d) => `${d.properties.name}\n
      ${(countryFilterCounts.value[d.id as number] ?? 0).toLocaleString()} /
      ${(countryTotalCounts[d.id as number] ?? 0).toLocaleString()}`,
    );
}

function redrawPlaces() {
  const places = annotatedPlaces.value.filter(
    (d) =>
      ((!showAdmin0.value && d.feature !== 18) || showAdmin0.value) && // A.PCLI - 18
      ((!showAdmin1.value && d.feature !== 1) || showAdmin1.value), // A.ADM1 -  1
  );

  placeCircles = placesGroup
    .selectAll("circle")
    .data(places)
    .join("circle")
    .attr("cx", (d) => d.xy[0])
    .attr("cy", (d) => d.xy[1])
    .classed("place", true)
    .classed("selected", (d) => d.inSelection)
    .classed("filtered", (d) => !d.filterInclude);

  placeCircles //
    // .selectAll("title")
    // .data((d) => {
    //   console.log(d);
    //   return d
    // })
    .append("title")
    .text((d) => d.name);

  lasso.items(placeCircles as PlaceSelection);
}

svg.call(lasso).call(zoom);
// .call(zoom.transform, d3zoomIdentity.translate(-width/2, -height/2).scale(1));

watch(annotatedPlaces, redrawPlaces);
watch(countryCounts, redrawCountries);

onMounted(async () => {
  if (mapElement.value) {
    mapElement.value.appendChild(svg.node()!);

    Promise
      //
      .all([
        //
        data.slim(),
        data.topo(),
      ])
      .then(async (prom) => {
        [{ counts: countryTotalCounts, documents: countryDocuments }, topo] = prom;

        // force recomputing of `countryCounts` (this also implicitly triggers initial drawing of map)
        countryCounts.effect.trigger();
        countryCounts.effect.dirty = true;

        // mark data as loaded, so map will be revealed
        loading.value = false;

        // load the full data at the very end, so we can draw first and wait for it for later
        full = await data.fullClean();
      });
  }
});

function clearAll() {
  selectedGeonameIds.value = [];
  if (!isNone(focusCountry.value)) selectIds(countryDocuments[focusCountry.value]);
}
</script>

<template>
  <div class="d-flex flex-column">
    <div v-if="loading">
      <font-awesome-icon icon="globe" />
      Loading map data...
    </div>
    <div style="font-size: 0.85em" class="ms-auto" v-if="!loading">
      <font-awesome-icon icon="filter-circle-xmark" class="icon" @click="clearAll" />

      <span class="icon-toggle ms-auto">
        <input type="checkbox" :id="`active-geo-${uniq}`" v-model="active" />
        <label :for="`active-geo-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </span>
    </div>

    <div ref="mapElement" v-show="!loading" />

    <div class="map-info" v-if="!loading">
      <div class="small text-muted">
        Select a country to reveal more details; lasso-select places while holding the shift key.
      </div>
      <input type="checkbox" v-model="showAdmin0" />
      <input type="checkbox" v-model="showAdmin1" />
      <input type="checkbox" v-model="showTotalCounts" />
      <ul class="list-inline">
        <template v-for="place in annotatedPlaces" :key="place.geonameid">
          <li
            class="list-inline-item"
            v-if="place.filterInclude && (!isSelectionActive || (isSelectionActive && place.inSelection))"
          >
            {{ place.name }}
            ({{ place.filterCount }}/{{ place.count }})
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.map-info {
  flex-grow: 1;
  height: 0;
  overflow-y: auto;
}
</style>

<style lang="scss">
.country {
  --stroke-width-default: 0.2pt;
  --stroke-width-focus: 2.5pt;

  stroke: #333;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-width: var(--stroke-width-default);
  vector-effect: non-scaling-stroke;

  &.selected {
    stroke-width: var(--stroke-width-focus);
    stroke: #32831e;
  }
}

.place {
  r: 0.1pt;
  fill: red;

  &.small {
    r: 0.02pt;
  }

  &.selected {
    stroke: #640d33;
    stroke-width: 0.1pt;
  }

  &.filtered {
    fill-opacity: 0.2;
  }
}

.lasso path {
  stroke: rgb(80, 80, 80);
  stroke-width: 2px;
}

.lasso .drawn {
  fill-opacity: 0.05;
}

.lasso .loop_close {
  fill: none;
  stroke-dasharray: 4, 4;
}

.lasso .origin {
  fill: #3399ff;
  fill-opacity: 0.5;
}
</style>
