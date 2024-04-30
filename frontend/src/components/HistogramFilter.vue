<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useDelay } from "@/util";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";
import { scaleBand, scaleLinear } from "d3-scale";
import { brushX, D3BrushEvent } from "d3-brush";
import { zoom as d3zoom, D3ZoomEvent } from "d3-zoom";
import { axisBottom } from "d3-axis";
import { create as d3create } from "d3-selection";

const mask = defineModel<HistogramMask>("mask", { required: true });
const { masks, active, years, clear, selectRange, extent } = mask.value;
const middle = years[Math.ceil(years.length / 2)];
const margin = { top: 5, bottom: 15, left: 10, right: 10 };
const width = ref(400);
const height = ref(150 - margin.top - margin.bottom); // computed(() => Math.min(width.value / 1.618, 175) - margin.top - margin.bottom);

const colours = {
  handle: "#a6761d",
  barTotal: "#dadacd",
  barFiltered: "#e6ab02",
};
type Stack = { year: number; count: number; colour: string; padding: number };
type Year = { year: number; stack: Stack[] };
const data = computed(() =>
  years.map((yr) => ({
    year: yr,
    stack: [
      {
        year: yr,
        count: extent.value.total[1],
        colour: "white",
        padding: 1,
      },
      {
        year: yr,
        count: masks[yr].counts.value.countTotal,
        colour: colours.barTotal,
        padding: 0,
      } as Stack,
      {
        year: yr,
        count: masks[yr].counts.value.countFiltered,
        colour: colours.barFiltered,
        padding: 0,
      } as Stack,
    ],
  })),
);

let focusYear: number | null = null;

function showTooltip(d: Year) {
  tooltip
    .html(`<strong>${d.year}</strong><br />Total: ${d.stack[1].count}<br />Filtered: ${d.stack[2].count}`)
    .classed("hidden", false)
    .style("top", "10px");

  const offset =
    d.year > middle ? -(tooltip.node()?.getBoundingClientRect().width ?? 100) - xScale.step() / 2 : xScale.step();
  tooltip.style("left", `${(xScale(d.year) ?? 0) + offset}px`);

  groupBars.selectAll("rect.bar").classed("hist-hl", false);
  (groupBars.select(`g.barstack[year="${d.year}"]`).node() as SVGGElement).children[0].classList.add("hist-hl");
  clearTooltipDelay();
}

const { delayedCall: hideTooltip, clear: clearTooltipDelay } = useDelay(() => {
  groupBars.selectAll("rect.bar").classed("hist-hl", false);
  tooltip.classed("hidden", true);
}, 300);

const yScale = scaleLinear().domain(extent.value.total);
const xScale = scaleBand<number>() //
  .domain(years)
  .padding(0.2);
const xAxis = axisBottom<number>(xScale);

const tooltip = d3create("div").attr("class", "hist-tooltip hidden");
const svg = d3create("svg");
const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
const groupBars = g.append("g").attr("transform", `translate(0, -5)`);
const groupAxis = g.append("g").attr("transform", `translate(0, ${height.value - 5})`);
const groupBrush = g
  .append("g")
  .attr("class", "brush")
  .on("wheel", (e) => e.preventDefault())
  .on("mousemove", (e: MouseEvent) => {
    const hoverYear = Math.max(0, Math.min(years.length - 1, Math.floor(e.clientX / xScale.step()) - 1));
    if (hoverYear !== focusYear) {
      focusYear = hoverYear;
      showTooltip(data.value[focusYear]);
    }
  })
  .on("mouseleave", hideTooltip);

const zoom = d3zoom<SVGSVGElement, undefined>()
  .scaleExtent([1, 100])
  .translateExtent([
    [0, 0],
    [width.value, height.value],
  ])
  .extent([
    [0, 0],
    [width.value, height.value],
  ])
  .on("zoom", (event: D3ZoomEvent<SVGSVGElement, undefined>) => {
    if (event.sourceEvent && event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    groupBars.attr(
      "transform",
      // -5 to account for margin + axis; the rest term adjusts weird offset side effects
      `translate(0, ${-(height.value * (event.transform.k - 1)) - 5 + 5 * (event.transform.k / 10)})
               scale(1, ${event.transform.k})`,
    );
  });

const brush = brushX<undefined>()
  // .handleSize(8)
  .extent([
    [0, 0],
    [width.value, height.value],
  ])
  .on("start brush end", (event: D3BrushEvent<undefined>) => {
    event.sourceEvent.preventDefault();
    event.sourceEvent.stopPropagation();
    if (event.sourceEvent && event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    // var s = d3.event.selection || x2.range();
    if (event.type === "end") {
      if (!event.selection) {
        clear();
      } else {
        const [x0, x1] = event.selection as [number, number];
        const domain = xScale
          .domain()
          .slice(
            Math.ceil(Math.max(0, x0 - xScale.step() / 2) / xScale.step()),
            Math.floor(Math.min(width.value, x1 + xScale.step() / 2) / xScale.step()),
          );

        if (domain.length === 0) {
          clear();
        } else if (domain.length === 1) {
          selectRange(domain[0], domain[0]);
        } else {
          selectRange(domain[0], domain[domain.length - 1]);
        }
      }
    }
  });

const { call: delayedRedraw } = useDelay(() => {
  // Update container sizes (height/width)
  svg //
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);
  // groupZoom.attr("width", width.value).attr("height", height.value);
  yScale.range([0, height.value]);
  xScale.range([0, width.value]);
  brush.extent([
    [0, 0],
    [width.value, height.value],
  ]);

  const numTicks = Math.floor(Math.max(16 - width.value / 50, 2));
  xAxis.scale(xScale).tickValues(xScale.domain().filter((_y, i) => !(i % numTicks)));

  // Bars
  groupBars
    .selectAll("g")
    .data(data.value)
    .join("g")
    .attr("class", "barstack")
    .attr("year", (d) => d.year)
    .selectAll("rect")
    .data((d) => d.stack)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => (xScale(d.year) ?? 0) - d.padding)
    .attr("y", (d) => yScale(extent.value.total[1] - d.count))
    .attr("width", (d) => xScale.bandwidth() + d.padding * 2)
    .attr("height", (d) => Math.max(0, yScale(d.count)))
    .attr("fill", (d) => d.colour)
    .attr("opacity", 1);

  groupAxis.call(xAxis);
  groupBrush.call(brush); //.call(brush.move, xScale.range());
  // svg.call(zoom);
}, 50);

const histogramElement = ref<HTMLDivElement | null>(null);
const uniq = crypto.randomUUID();

onMounted(async () => {
  if (histogramElement.value) {
    const containerObserver = new ResizeObserver((r) => {
      width.value = Math.max(0, r[0].contentRect.width - margin.left - margin.right);
    });
    containerObserver.observe(histogramElement.value);
    delayedRedraw();
    histogramElement.value.appendChild(svg.node() as SVGSVGElement);
    histogramElement.value.appendChild(tooltip.node() as HTMLDivElement);
  }
});

svg.call(zoom);
watch([data, width], delayedRedraw);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>Publication years</div>
      <div>
        <input type="checkbox" :id="`active-pyhist-${uniq}`" v-model="active" />
        <label :for="`active-pyhist-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </div>
    </div>
    <div ref="histogramElement" class="hist" />
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
}

.hist {
  position: relative;
}
</style>
<style>
.hist-tooltip {
  position: absolute;
  display: block;
  background-color: #ffffffc4;
  border: 1px solid black;
  border-radius: 5px;
  padding: 10px;
  color: black;
  margin: 10px;
  opacity: 1;
  font-size: 0.8em;
}

.hist-tooltip.hidden {
  display: none;
}

.hist-hl {
  fill: #f8ede2;
  stroke: #5b4b4b;
}

.zoom {
  cursor: move;
  fill: none;
  pointer-events: all;
}
</style>
