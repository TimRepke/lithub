import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as Arrow from 'apache-arrow';
import type {ScaleLinear} from "d3";
import {knn} from "@/plugins/scatter/knn";


export const LoadingState = {
  EMPTY: 'EMPTY',
  LOADING: 'LOADING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;
export type LoadingStateT = typeof LoadingState[keyof typeof LoadingState];

export type SchemaReceivedCallback = (numTotalRows: number) => void;
export type BatchReceivedCallback = (currentBatchSize: number, currentNumLoadedRows: number, numTotalRows: number) => void;
export type DataCompleteCallback = (d: Array<RowSchema>) => void;
export type HoveredCallback = (d: RowSchema, neighbours: Array<RowSchema>) => void;
export type UnhoverCallback = (d: RowSchema) => void;


export type MetaData = {
  extent: { x: [number, number], y: [number, number] };
  total_points: number;
  schemes: Record<number, { scheme_id: number, column: string, label: number, choices: Array<string>, description: string }>;
}

export type RowSchema = {
  x: number;
  y: number;
  title: string;
  dbid: number;
  year: number;
  size: number;
  label_0: number;
  label_1?: number;
  label_2?: number;
  opacity: number;
  highlight?: boolean;
  keepOnFilter?: boolean;
}
export type Chart = {
  chart: any;
  overlay: any;
  fill: WebGLFillColor;
}
type RowToColourFunc = (d: RowSchema) => [number, number, number, number];

export interface WebGLFillColor {
  value(x: RowToColourFunc): WebGLFillColor;

  data(x: Array<RowSchema>): WebGLFillColor;

  (program: any): void;
}

export const cat20 = Array(20).fill(undefined).map((v, i) => {
  const t = i / 20;
  const ts = Math.abs(t - 0.5);
  return d3.cubehelix(
    360 * t - 100,
    1.5 - 1.5 * ts,
    0.8 - 0.9 * ts,
    1
  ).rgb();
})

export class ScatterPlot {
  state: LoadingStateT;
  url: string;
  container: HTMLDivElement;
  table: Arrow.Table;
  metadata?: MetaData;

  data: Array<RowSchema>;
  private xScale: ScaleLinear<number, number, never>;
  private yScale: ScaleLinear<number, number, never>;
  private zoomScaling: number;
  private chart?: Chart;
  private quadTree?: d3.Quadtree<RowSchema>;
  private debounceTimer?: any;
  private highlight?: any;
  private hasActiveFilter: boolean;

  private readonly schemaReceivedCallback: SchemaReceivedCallback;
  private readonly batchReceivedCallback: BatchReceivedCallback;
  private readonly dataCompleteCallback: DataCompleteCallback;
  private readonly hoveredCallback: HoveredCallback;
  private readonly unhoverCallback: UnhoverCallback;

  constructor(url: string, node: HTMLDivElement,
              schemaReceivedCallback: SchemaReceivedCallback,
              batchReceivedCallback: BatchReceivedCallback,
              dataCompleteCallback: DataCompleteCallback,
              hoveredCallback: HoveredCallback,
              unhoverCallback: UnhoverCallback) {
    this.url = url;
    this.container = node;
    this.state = LoadingState.EMPTY;
    this.table = new Arrow.Table();
    this.data = [];
    this.hasActiveFilter = false;

    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.zoomScaling = 1.0;

    this.schemaReceivedCallback = schemaReceivedCallback;
    this.batchReceivedCallback = batchReceivedCallback;
    this.dataCompleteCallback = dataCompleteCallback;
    this.hoveredCallback = hoveredCallback;
    this.unhoverCallback = unhoverCallback;
  }

  pickFillColor(field: string) {
    if (this.chart) {
      let func: RowToColourFunc;
      if (field == 'year') {
        const scale = d3.scaleSequential()
          .domain([1950, 2030])
          .interpolator(d3.interpolateRdYlGn);
        func = (d: RowSchema) => {
          if (d.highlight) return [1, 0, 0, 1];

          const color: d3.RGBColor = d3.rgb(scale(d.year));
          return [color.r / 255, color.g / 255, color.b / 255, d.opacity];
        }
      } else {
        const cat20 = Array(20).fill(undefined).map((v, i) => {
          const t = i / 20;
          const ts = Math.abs(t - 0.5);
          const c = d3.cubehelix(
            360 * t - 100,
            1.5 - 1.5 * ts,
            0.8 - 0.9 * ts,
            1
          ).rgb();
          return [c.r / 255, c.g / 255, c.b / 255, c.opacity]
        })
        func = (d: RowSchema) => {
          if (d.highlight) return [1, 0, 0, 1];
          const col = [...cat20[d[field as keyof RowSchema] as number]];
          col[3] = d.opacity;
          return col as [number, number, number, number];
        }
      }
      this.chart.fill.value(func)
    }
  }

  render() {
    const zoom = fc.zoom().on('zoom', this.redraw.bind(this));

    const fillColor: WebGLFillColor = fc
      .webglFillColor()
    // .value((d: RowSchema) => rgb2lst(yearColour(d.year)))
    // .value((d: RowSchema) => cat20[d.label_0])
    // .data(this.data);


    const starChart = fc
      .seriesWebglPoint()
      .type(d3.symbolCircle)
      .xScale(this.xScale)
      .yScale(this.yScale)
      .crossValue((d: RowSchema) => d.x)
      .mainValue((d: RowSchema) => d.y)
      .size((d: RowSchema) => (d.highlight ? 15 : d.size) * this.zoomScaling)
      .defined(() => true)
      // .equals((previousData, data) => previousData.length > 0)
      .decorate((program: any) => {
        // Set the color of the points.
        fillColor(program);

        // Enable blending of transparent colors.
        const context = program.context();
        context.enable(context.BLEND);
        context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
      });

    const chart = fc
      .chartCartesian(this.xScale, this.yScale)
      // .svgPlotArea(informationOverlay)
      .webglPlotArea(starChart)
      .decorate(selection => {
        selection
          .enter()
          .call(zoom, this.xScale, this.yScale);
        selection
          .on('mousemove', this.handleMouseMove.bind(this))
      });

    this.chart = {
      fill: fillColor,
      // points: starChart,
      overlay: null,
      // overlay: informationOverlay,
      chart: chart,
    }
    this.pickFillColor('label_0');
  }

  private handleMouseMove(event: MouseEvent) {
    if (this.quadTree) {
      // clear any scheduled reads
      clearTimeout(this.debounceTimer);

      // clear the annotation if the pointer leaves the area
      // otherwise let it linger until it is updated
      // if (point == null) {
      //   this.annotations = [];
      //   return;
      // }
      if (this.highlight) {
        this.unhoverCallback(this.highlight);
        this.highlight.highlight = false;
        this.highlight = undefined;
      }

      this.debounceTimer = setTimeout(() => {
        const x = this.xScale.invert(event.offsetX)
        const y = this.yScale.invert(event.offsetY)

        const hit = this.quadTree!.find(x, y, 1)
        if (hit !== undefined) {
          this.highlight = hit;
          hit.highlight = true;
          this.redraw()
          this.hoveredCallback(hit, knn(this.quadTree!, x, y, 10));
        }
      }, 100);
    }
  }

  resetFilter() {
    this.data.forEach((d) => {
      d.keepOnFilter = undefined;
    });
  }

  setFilter() {
    this.hasActiveFilter = true;
    this.redraw();
  }

  onLoadFinished() {
    this.quadTree = d3.quadtree<RowSchema>()
      .x((d: RowSchema) => d.x)
      .y((d: RowSchema) => d.y)
      .addAll(this.data)

    this.dataCompleteCallback(this.data);
  }

  redraw() {
    if (this.chart) {
      this.chart.fill.data(this.data)
      const scale = (this.xScale.domain()[1] - this.xScale.domain()[0]) / 100;
      this.zoomScaling = 1 / (1 + (scale - 0.9) * 1.2);
      d3.select(this.container)
        .datum(this.data)
        .call(this.chart.chart);
    }
  }

  public get numLoadedPoints(): number {
    return this.table.numRows;
  }

  public get numTotalPoints(): number | undefined {
    if (this.metadata?.total_points) return this.metadata?.total_points;
    return undefined;
  }

  async load() {
    this.state = LoadingState.LOADING;
    const response = await fetch(this.url);
    const reader = await Arrow.RecordBatchReader.from(response);
    await reader.open();

    this.table = new Arrow.Table(reader.schema);
    this.metadata = {
      extent: JSON.parse(reader.schema.metadata.get('extent') as string),
      total_points: JSON.parse(reader.schema.metadata.get('total_points') as string),
      schemes: JSON.parse(reader.schema.metadata.get('schemes') as string),
    };
    console.log(this.metadata)
    this.xScale = d3.scaleLinear(this.metadata.extent.x, [0, this.container.getBoundingClientRect().width]);
    this.yScale = d3.scaleLinear(this.metadata.extent.y, [0, this.container.getBoundingClientRect().height]);


    this.schemaReceivedCallback(this.metadata.total_points)

    const schema = Object.fromEntries(this.table.schema.fields.map((field, index) => [field.name, index]));
    this.render()
    for await (const recordBatch of reader) {
      //@ts-ignore // FIXME
      this.table = this.table.concat(recordBatch);
      this.batchReceivedCallback(recordBatch.numRows, this.numLoadedPoints, this.numTotalPoints as number)

      this.data = this.data.concat(Array(recordBatch.numRows).fill(undefined).map((value, rowIndex) => {
        const row = Object.fromEntries(Object.entries(schema).map(([field, colIndex]) => {
          return [field, recordBatch.data.children[colIndex].values[rowIndex]];
        })) as RowSchema;
        row.size = 1 + Math.random() * 3;
        row.opacity = 1.0;
        return row;
      }));

      // this.render();
      this.redraw();

    }
    this.onLoadFinished();
  }
}