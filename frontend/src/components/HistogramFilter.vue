<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { percentFormatter, useDelay } from "@/util";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";
import { scaleBand, scaleLinear } from "d3-scale";
import { brushX, D3BrushEvent } from "d3-brush";
import { zoom as d3zoom, D3ZoomEvent } from "d3-zoom";
import { axisBottom } from "d3-axis";
import { create as d3create, pointer as d3pointer } from "d3-selection";
import { ClearFilterEvent, EventBus } from "@/util/events.ts";

type Stack = { year: number; count: number; colour: string; padding: number };
type Year = { year: number; stack: Stack[] };

const uniq = crypto.randomUUID();

const mask = defineModel<HistogramMask>("mask", { required: true });
const { masks, active, years, clear, selectRange, extent } = mask.value;

const middle = years[Math.ceil(years.length / 2)];
const margin = { top: 10, bottom: 15, left: 10, right: 10 };
const width = ref(400);
const height = ref(150 - margin.top - margin.bottom); // computed(() => Math.min(width.value / 1.618, 175) - margin.top - margin.bottom);

const colours = {
  handle: "#a6761d",
  barTotal: "#dadacd",
  barFiltered: "#e6ab02",
};
let focusYear: number | null = null;
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
const selectedYearFirst = computed(() => {
  for (const yr of years) {
    if (masks[yr].active.value) return yr;
  }
  return null;
});

const selectedYearLast = computed(() => {
  for (let i = years.length - 1; i >= 0; i--) {
    if (masks[years[i]].active.value) return years[i];
  }
  return null;
});

function cagr(span: number, valStart: number, valEnd: number) {
  return Math.pow(valEnd / valStart, 1 / span) - 1;
}
const cagrData = computed(() => {
  return years.map((_yr, index) => {
    const cagr5Total =
      index < 5
        ? "—"
        : percentFormatter.format(cagr(5, data.value[index - 5].stack[1].count, data.value[index].stack[1].count));
    const cagr10Total =
      index < 10
        ? "—"
        : percentFormatter.format(cagr(10, data.value[index - 10].stack[1].count, data.value[index].stack[1].count));
    const cagr5Filtered =
      index < 5 || data.value[index - 5].stack[2].count <= 0
        ? "—"
        : percentFormatter.format(cagr(5, data.value[index - 5].stack[2].count, data.value[index].stack[2].count));
    const cagr10Filtered =
      index < 10 || data.value[index - 10].stack[2].count <= 0
        ? "—"
        : percentFormatter.format(cagr(10, data.value[index - 10].stack[2].count, data.value[index].stack[2].count));
    return { cagr5Total, cagr10Total, cagr5Filtered, cagr10Filtered };
  });
});

function showTooltip(d: Year, index: number) {
  const cagr5 =
    index < 5
      ? "—"
      : percentFormatter.format(cagr(5, data.value[index - 5].stack[1].count, data.value[index].stack[1].count));
  const cagr10 =
    index < 10
      ? "—"
      : percentFormatter.format(cagr(10, data.value[index - 10].stack[1].count, data.value[index].stack[1].count));
  const cagr5f =
    index < 5
      ? "—"
      : percentFormatter.format(cagr(5, data.value[index - 5].stack[2].count, data.value[index].stack[2].count));
  const cagr10f =
    index < 10
      ? "—"
      : percentFormatter.format(cagr(10, data.value[index - 10].stack[2].count, data.value[index].stack[2].count));
  tooltip
    .html(
      `<strong>${d.year}</strong><br />
<strong>Total: ${d.stack[1].count}</strong><br />
5yr CAGR: ${cagr5}<br />
10yr CAGR: ${cagr10}<br />
<hr />
<strong>Filtered: ${d.stack[2].count}</strong><br />
5yr CAGR (filtered): ${cagr5f}<br />
10yr CAGR (filtered): ${cagr10f}`,
    )
    .classed("hidden", false)
    .style("top", "10px");

  const offset =
    d.year > middle ? -(tooltip.node()?.getBoundingClientRect().width ?? 100) - xScale.step() / 2 : xScale.step();
  tooltip.style("left", `${(xScale(d.year) ?? 0) + offset}px`);

  groupBars.selectAll("rect.bar").classed("hist-hl", false);
  const stackNode = groupBars.select(`g.barstack[year="${d.year}"]`).node() as SVGGElement | null;
  if (stackNode && stackNode.children) stackNode.children[0].classList.add("hist-hl");
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
const svg = d3create("svg")
  .attr("role", "img")
  .attr("aria-labelledby", `hist-title-${uniq}`)
  .attr("aria-describedby", `hist-summary-${uniq}`);
svg.append("title").attr("id", `hist-title-${uniq}`).text("Publication years histogram");

const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
// 3.25 = line width top + bottom of bar and axis; some extra because strokes are on center of edge
const groupBars = g.append("g").attr("transform", `translate(0, -${margin.bottom - margin.top - 3.25})`);
const groupAxis = g.append("g").attr("transform", `translate(0, ${height.value - margin.top})`);
const groupBrush = g
  .append("g")
  .attr("class", "brush")
  .on("wheel", (e) => e.preventDefault())
  .on("mousemove", (e: MouseEvent) => {
    // Use the pointer position relative to the plot group `g` (the space in
    // which xScale is defined) rather than the viewport-relative clientX, so
    // the detected bar is correct regardless of where the chart sits on screen.
    const [mx] = d3pointer(e, g.node());
    const hoverYear = Math.max(0, Math.min(years.length - 1, Math.floor(mx / xScale.step())));
    if (hoverYear !== focusYear) {
      focusYear = hoverYear;
      showTooltip(data.value[focusYear], hoverYear);
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
    groupBars
      .selectAll("g.barstack")
      .selectAll<SVGRectElement, Stack>("rect.bar")
      .attr("y", (d) => yScale(extent.value.total[1] - d.count * event.transform.k))
      .attr("height", (d) => Math.max(0, yScale(d.count * event.transform.k)));
  });

const brush = brushX<undefined>()
  // .handleSize(8)
  .extent([
    [0, 0],
    [width.value, height.value],
  ])
  .on("start brush end", (event: D3BrushEvent<undefined>) => {
    if (event.sourceEvent) {
      event.sourceEvent.preventDefault();
      event.sourceEvent.stopPropagation();
    }
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
    .attr("stroke", (d) => (d.colour !== "white" ? "black" : "none"))
    .attr("stroke-width", 1)
    .attr("opacity", 1);

  groupAxis.call(xAxis);
  groupBrush.call(brush); //.call(brush.move, xScale.range());
  // svg.call(zoom);
}, 50);

const histogramElement = ref<HTMLDivElement | null>(null);

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
EventBus.on(ClearFilterEvent, () => {
  brush.clear(groupBrush, new Event("click"));
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
    <div :id="`hist-summary-${uniq}`" class="screen-reader-only">
      <h3>Publication data by year</h3>
      <p>
        This chart shows the number of publications across {{ years.length }} years from {{ years[0] }} to
        {{ years[years.length - 1] }}. The total count ranges from {{ extent.total[0] }} to
        {{ extent.total[1] }} publications. Use the brush interaction or select start/end buttons to filter publications
        by year range. Currently selected the year range {{ selectedYearFirst }} to {{ selectedYearLast }}.
      </p>
      <table class="table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Total Pubs</th>
            <th>5yr CAGR</th>
            <th>10yr CAGR</th>
            <th>Filtered Pubs</th>
            <th>5yr CAGR (filtered)</th>
            <th>10yr CAGR (filtered)</th>
            <th>Range</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(yr, index) in years" :key="yr">
            <td>{{ yr }}</td>
            <td>{{ masks[yr].counts.value.countTotal }}</td>
            <td>{{ cagrData[index].cagr5Total }}</td>
            <td>{{ cagrData[index].cagr10Total }}</td>
            <td>{{ masks[yr].counts.value.countFiltered }}</td>
            <td>{{ cagrData[index].cagr5Filtered }}</td>
            <td>{{ cagrData[index].cagr10Filtered }}</td>
            <td>
              <button
                :aria-label="`Set ${yr} as start year`"
                @click="selectRange(yr, selectedYearLast || years[years.length - 1])"
                type="button">
                Start
              </button>
              <button
                :aria-label="`Set ${yr} as end year`"
                @click="selectRange(selectedYearFirst || years[0], yr)"
                type="button">
                End
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
