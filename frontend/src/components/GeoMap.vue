<script setup lang="ts">
import { onMounted, ref } from "vue";
import { tableFromIPC } from "apache-arrow";
import { DATA_BASE, GET, request } from "@/util/api.ts";
import { DataType, TypeMap } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";
import * as d3 from "d3";
import { WorldAtlas, feature } from "topojson";
import { GeometryCollection } from "topojson-specification";
import { Feature, GeometryObject } from "geojson";
import { zoomTransform } from "d3-zoom";

interface PlacesSchema extends TypeMap {
  idx: DataType<Type.Uint32>;
  // country: DataType<Type.Utf8>;
  country_num: DataType<Type.Uint16>;
}

interface CountryProp {
  name: string;
}

const mapElement = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  if (mapElement.value) {
    const req = await request({ method: "GET", path: `${DATA_BASE}/policymap/geocodes.minimal.arrow` });
    const world = await GET<WorldAtlas>({ path: "countries-50m.json", keepPath: true }); //world-110m-named.json
    const places = await tableFromIPC<PlacesSchema>(req.arrayBuffer());

    // const idxs = places.getChild("idx")!;
    const countries = places.getChild("country_num")!;
    const { numRows } = places;
    const counts: Record<number, number> = {};
    let _country: number;
    for (let i = 0; i < numRows; i++) {
      _country = countries.get(i);
      if (!(_country in counts)) counts[_country] = 1;
      else counts[_country] += 1;
    }

    const width = 928;
    const height = width / 1.61803;

    const topo = feature<CountryProp>(world, world.objects.countries as GeometryCollection<CountryProp>);

    const projection = d3
      .geoMercator()
      .scale(70)
      .center([0, 20])
      .translate([width / 2, height / 2]);
    const colorScale = d3.scaleSequential(d3.extent(Object.values(counts)) as [number, number], d3.interpolateBlues);
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    const g = svg.append("g");

    g.append("g")
      .selectAll("path")
      .data(topo.features)
      .join("path")
      .attr("d", d3.geoPath().projection(projection))
      .attr("fill", (d) => colorScale(counts[d.id as number]) ?? "#fff")
      .attr("class", "country")
      .on("mouseover", mouseOverCountry)
      .on("mouseleave", mouseLeavingCountry)
      .on("click", mouseClickCountry)
      .append("title")
      .text((d) => `${d.properties.name}\n${(counts[d.id as number] ?? 0).toLocaleString()}`);

    function mouseOverCountry() {
      d3.selectAll(".country").transition().duration(200).style("opacity", 0.5);
      d3.select(this).transition().duration(200).style("opacity", 1).style("stroke-width", "var(--stroke-width-focus)");
    }

    function mouseLeavingCountry() {
      d3.selectAll(".country").transition().duration(200).style("opacity", 1);
      d3.select(this).transition().duration(200).style("stroke-width", "var(--stroke-width-default)");
    }

    function mouseClickCountry(event, d: Feature<GeometryObject, CountryProp>) {
      console.log(zoomTransform(this))
      console.log(d3.select(this))
      // console.log(d)
      // var t = d3.geoTransform(d3.select(this).attr("transform")),
      // x = t.translate[0],
      // y = t.translate[1];

      var scale = 10;

      g.transition().duration(3000)
        .call(zoom.translate([((x * -scale) + (svgWidth / 2)), ((y * -scale) + svgHeight / 2)])
          .scale(scale).event);
      // console.log(event)
      // console.log(d)
    }

    const zoom = d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => g.attr("transform", event.transform));


    svg.call(zoom);
    mapElement.value.appendChild(svg.node()!);
  }
});
</script>

<template>
  <div ref="mapElement" style="height: 0" />
</template>

<style scoped></style>

<style>
.country {
  --stroke-width-default: 0.2pt;
  --stroke-width-focus: 0.6pt;

  stroke: #333;
  stroke-linejoin: round;
  stroke-linecap: round;
  stroke-width: var(--stroke-width-default);
  vector-effect: non-scaling-stroke;
}
</style>
