<script setup lang="ts">
import { onMounted, ref } from "vue";
import { tableFromIPC } from "apache-arrow";
import { DATA_BASE, request } from "@/util/api.ts";
import { DataType, TypeMap } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";
import * as d3 from "d3";
import * as topojson from "topojson";
import { WorldAtlas } from "topojson";
import {Legend} from "@/util/color-legend"

interface PlacesSchema extends TypeMap {
  idx: DataType<Type.Uint32>;
  // country: DataType<Type.Utf8>;
  country_num: DataType<Type.Uint16>;
}

const mapElement = ref<HTMLDivElement | null>(null);

onMounted(async () => {
  if (mapElement.value) {
    const req = await request({ method: "GET", path: `${DATA_BASE}/policymap/geocodes.minimal.arrow` });
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

    d3.json("world-110m.json").then((world: WorldAtlas) => {
      // Specify the chart’s dimensions.
      const width = 928;
      const marginTop = 46;
      const height = width / 2 + marginTop;

      const countrymesh = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
      const countries = topojson.feature(world, world.objects.countries);

      // Fit the projection.
      const projection = d3.geoMercator().fitExtent([[2, marginTop + 2], [width - 2, height]], { type: "Sphere" });
      const path = d3.geoPath(projection);

      // Index the values and create the color scale.
      // const valuemap = new Map(Object.entries(counts));
      const color = d3.scaleSequential(d3.extent(Object.values(counts)), d3.interpolateYlGnBu);

      // Create the SVG container.
      const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");
      const g = svg.append("g");

      const legend = Legend(color, { title: "Number of studies", width: 400 });
      console.log(legend)
      // Append the legend.
      svg.append("g")
        .attr("transform", "translate(20,0)")
        .append(() => legend);

      // Add a white sphere with a black border.
      g.append("path")
        .datum({ type: "Sphere" })
        .attr("fill", "white")
        .attr("stroke", "currentColor")
        .attr("d", path);
console.log(counts)
      // Add a path for each country and color it according te this data.
      g.append("g")
        .selectAll("path")
        .data(countries.features)
        .join("path")
        .attr("fill", (d,i) => {
          // console.log(d, i)
          return color(counts[d.id])
        })
        .attr("d", path)
        .append("title")
        .text(d => `${d.properties.name}\n${counts[d.id]}`);

      // Add a white mesh.
      g.append("path")
        .datum(countrymesh)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("d", path);

      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [width, height],
        ])
        .on("zoom", zoomed);

      function zoomed(event) {
        g.selectAll("path") // To prevent stroke width from scaling
          .attr("transform", event.transform);
      }

      svg.call(zoom);
      mapElement.value.appendChild(svg.node());
    });

    // const projection = geoMercator()
    //   .translate([width / 2, height / 2])
    //   .scale((width - 1) / 2 / Math.PI);
    //
    // const path = geoPath().projection(projection);
    //
    // const zoom = d3zoom()
    //   .scaleExtent([1, 8])
    //   .translateExtent([
    //     [0, 0],
    //     [width, height],
    //   ])
    //   .on("zoom", zoomed);
    //
    // const svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
    //
    // const g = svg.append("g");
    //
    // svg.call(zoom);
    //
    // d3.json("world-110m.json").then((world: WorldAtlas) => {
    //   console.log(world);
    //   g.append("path").datum({ type: "Sphere" }).attr("class", "sphere").attr("d", path);
    //
    //   g.append("path")
    //     .datum(topojson.merge(world, world.objects.countries.geometries))
    //     .attr("class", "land")
    //     .attr("d", path);
    //
    //   g.append("path")
    //     .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    //     .attr("class", "boundary")
    //     .attr("d", path);
    // });
    //
    // function zoomed(event) {
    //   g.selectAll("path") // To prevent stroke width from scaling
    //     .attr("transform", event.transform);
    // }
  }
});
</script>

<template>
  <div ref="mapElement" style="height: 0" />
</template>

<style scoped>

svg {
  background: #eee;
}

.sphere {
  fill: #fff;
}

.land {
  fill: #000;
}

.boundary {
  fill: none;
  stroke: #fff;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
</style>
