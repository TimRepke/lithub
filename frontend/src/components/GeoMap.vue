<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { DATA_BASE } from "@/util/api.ts";

import {
  scaleSequential as d3scaleSequential,
  scaleSqrt as d3scaleSqrt,
  interpolateBlues as d3interpolateBlues,
  interpolateReds as d3interpolateReds,
  extent as d3extent,
  create as d3create,
  select as d3select,
  selectAll as d3selectAll,
  max as d3max,
  pointer as d3pointer,
  zoomIdentity as d3zoomIdentity,
  zoom as d3zoom,
  zoomTransform as d3zoomTransform,
} from "d3";
import { hexbin as d3hexbin, type HexbinBin } from "d3-hexbin";
import { Feature, GeometryObject } from "geojson";
import { IndexMask } from "@/util/dataset/masks/ids.ts";
import type { Bitmask } from "@/util/dataset/masks/bitmask.ts";
import type { None } from "@/util";
import { CountryProp, ProjectedEntry, ProjectedEntry_, useGeodata } from "@/util/geo.ts";

const uniq = crypto.randomUUID();
const mask = defineModel<IndexMask>("mask", { required: true });
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const { selectIds, clear: clearSelection } = mask.value;

const data = useGeodata(`${DATA_BASE}/policymap/geocodes.minimal.arrow`, `${DATA_BASE}/policymap/geocodes.full.arrow`);

const focusCountry = ref<number | null>(null);
const focusPlaces = ref<ProjectedEntry[]>();

const hexSize = ref<number>(0.5);
const showAdmin0 = ref<boolean>(true);
const showAdmin1 = ref<boolean>(true);

const mapElement = ref<HTMLDivElement | null>(null);
let full: Record<number, ProjectedEntry_[]> = {};
// HEXBIN:
// https://observablehq.com/@d3/hexbin-map?collection=@d3/d3-geo

// console.time("full geo");
// await data.full();
// console.timeEnd("full geo");

onMounted(async () => {
  if (mapElement.value) {
    const width = 928;
    const height = width / 1.61803;
    const { counts, documents } = await data.slim();
    const { projection, path, topo } = await data.geo();

    projection
      .scale(70)
      .center([0, 20])
      .translate([width / 2, height / 2]);

    const colorScale = d3scaleSequential(d3extent(Object.values(counts)) as [number, number], d3interpolateBlues);

    const svg = d3create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")
      .on("click", resetZoom);

    const g = svg.append("g");

    const countriesGroup = g
      .append("g")
      .selectAll("path")
      .data(topo.features)
      .join("path")
      .attr("d", path)
      .attr("fill", (d) => colorScale(counts[d.id as number]) ?? "#fff")
      .attr("class", "country")
      .on("mouseover", mouseOverCountry)
      .on("mouseleave", mouseLeavingCountry)
      .on("click", mouseClickCountry);
    countriesGroup
      .append("title")
      .text((d) => `${d.properties.name}\n${(counts[d.id as number] ?? 0).toLocaleString()}`);

    const hexGroup = g.append("g");
    const placesGroup = g.append("g");

    function redraw(locations: ProjectedEntry_[], w: number, h: number) {
      // A.PCLI - 18
      // A.ADM1 -  1
      focusPlaces.value = locations.filter(
        (d): d is ProjectedEntry =>
          !!d.xy &&
          ((!showAdmin0.value && d.feature !== 18) || showAdmin0.value) &&
          ((!showAdmin1.value && d.feature !== 1) || showAdmin1.value),
      );
      const adjustedMaxExtent = Math.max(w, h) / 2 / 0.866;
      hexSize.value = Math.max(
        Math.min(adjustedMaxExtent / focusPlaces.value.length, adjustedMaxExtent / 4),
        adjustedMaxExtent / 12,
      );

      const hexbin = d3hexbin<ProjectedEntry>()
        .extent([
          [0, 0],
          [width, height],
        ])
        .radius(hexSize.value)
        .x((d) => d.xy[0])
        .y((d) => d.xy[1]);

      const bins = hexbin(focusPlaces.value);
      const colour = d3scaleSequential(d3extent(bins, (d) => d.length) as [number, number], d3interpolateReds);

      const hexagons = hexGroup
        .selectAll("path")
        .data(bins)
        .join("path")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .attr("d", hexbin.hexagon())
        .attr("fill", (d) => colour(d.length))
        .attr("class", "hexagon")
        .on("click", mouseClickHexagon);
      hexagons
        .append("title")
        .text((d) => `${d.length.toLocaleString()} places:\n${[...new Set(d.map((p) => p.name))].join(", ")}`);

      placesGroup
        .selectAll("circle")
        .data(focusPlaces.value)
        .join("circle")
        .attr("cx", (d) => d.xy[0])
        .attr("cy", (d) => d.xy[1])
        .attr("r", "0.1pt")
        .attr("fill", "red")
        .attr("class", "place");
    }

    function mouseClickHexagon(event, d: HexbinBin<ProjectedEntry>) {
      event.stopPropagation();
      const selectedIds = [...new Set(d.map((p) => p.idx))];
      focusPlaces.value = d;
      selectIds(selectedIds);

      d3selectAll(".hexagon").classed("focus", false);
      // d3selectAll(".place").transition().duration(200).style("opacity", 0.5);

      d3select(this).classed("focus", true);
    }

    function mouseOverCountry() {
      d3selectAll(".country").transition().duration(200).style("opacity", 0.5);
      d3select(this).transition().duration(200).style("opacity", 1).style("stroke-width", "var(--stroke-width-focus)");
    }

    function mouseLeavingCountry() {
      d3selectAll(".country").transition().duration(200).style("opacity", 1);
      d3select(this).transition().duration(200).style("stroke-width", "var(--stroke-width-default)");
    }

    function mouseClickCountry(event, d: Feature<GeometryObject, CountryProp>) {
      if (focusCountry.value === d.id) {
        // clicked already in-focus country; resetting zoom
        resetZoom();
        focusCountry.value = null;
        return;
      }
      if (!counts[d.id as number]) {
        // country has no counts, nothing to focus on.
        return;
      }
      focusCountry.value = d.id as number;

      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      // states.transition().style("fill", null);
      // d3.select(this).transition().style("fill", "red");
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
      // console.log(mask.value);
      selectIds(documents[d.id as number]);
      redraw(full[d.id as number] ?? [], x1 - x0, y1 - y0);
      // setActive(true);
    }

    function resetZoom() {
      // setActive(false);
      clearSelection();
      redraw([], 0);

      // states.transition().style("fill", null);
      svg
        .transition()
        .duration(450)
        .call(zoom.transform, d3zoomIdentity, d3zoomTransform(g.node()!).invert([width / 2, height / 2]));
    }

    const zoom = d3zoom()
      .scaleExtent([1, 30])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);
    mapElement.value.appendChild(svg.node()!);

    // load the full data at the very end so we can draw first and wait for it for later
    full = await data.full();
  }
});

const focusedPlaceCounts = computed(() => {
  const ret: Record<string, number> = {};
  focusPlaces.value?.forEach((p) => {
    if (p.name in ret) ret[p.name] += 1;
    else ret[p.name] = 1;
  });
  return Object.entries(ret).toSorted((a, b) => b[1] - a[1]);
});
</script>

<template>
  <div class="d-flex flex-column">
    <div ref="mapElement" />
    <div class="map-info">
      <label for="hexSize">Hexagon size: {{ hexSize }}</label>
      <input type="range" class="form-range" min="0" max="1" step="0.01" v-model="hexSize" id="hexSize" />
      <input type="checkbox" v-model="showAdmin0" />
      <input type="checkbox" v-model="showAdmin1" />
      <ul class="list-inline">
        <li v-for="place in focusedPlaceCounts" :key="place[0]" class="list-inline-item">
          {{ place[0] }}
          ({{ place[1] }})
        </li>
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
  --stroke-width-focus: 0.6pt;

  stroke: #333;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-width: var(--stroke-width-default);
  vector-effect: non-scaling-stroke;
}

.hexagon {
  stroke: #444;
  stroke-opacity: 0.6;
  stroke-width: 0.005pt;

  &.focus {
    stroke: #640d33;
    stroke-width: 0.2pt;
  }
}
</style>
