import { DeepReadonly, Ref } from "vue";
import { DataType, TypeMap } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";
import * as rspt from "regl-scatterplot/src/types";

export interface SchemeLabelValue {
  name: string;
  value: boolean | number;
  colour: [number, number, number];
}

export type SchemeLabelType = "single" | "bool" | "multi";

export interface SchemeLabel {
  name: string;
  key: string;
  type: SchemeLabelType;
  values: SchemeLabelValue[];

  parent_key?: string | null;
  parent_val?: boolean | number | null;
}

export type Scheme = Record<string, SchemeLabel>;

export interface DatasetInfo {
  name: string;
  teaser: string;

  total: number;
  key: string;
  columns: string[];

  authors?: string[] | null;
  contributors?: string[] | null;

  start_year: number;
  end_year: number;

  created_date: date;
  last_update: date;

  db_filename: string;
  arrow_filename: string;
  keywords_filename?: string | null;
  figure?: string | null;
  default_colour: string;
  scheme: Scheme;
}

export interface ArrowSchema extends TypeMap {
  x: DataType<Type.Float16>;
  y: DataType<Type.Float16>;
  publication_year: DataType<Type.Uint16>;
}

export type ReadonlyRef<T> = DeepReadonly<Ref<T>>;

export interface Document {
  idx: number;
  title?: string | null;
  abstract?: string | null;
  publication_year?: number | null;
  openalex_id?: string | null;
  nacsos_id?: string | null;
  doi?: string | null;
  authors?: string | null;
  institutions?: string | null;
}

export interface AnnotatedDocument extends Document {
  manual: boolean;
  labels: Record<string, number>;
}

export type HSLColour = [number, number, number];

export interface KeywordArrowSchema extends TypeMap {
  x: DataType<Type.Float16>;
  y: DataType<Type.Float16>;
  level: DataType<Type.Uint16>;
  keyword: DataType<Type.Utf8>;
}

export interface Keyword {
  x: number;
  y: number;
  level: number;
  keyword: string;
}

export interface ReglScatterplot {
  readonly isSupported: boolean;
  clear: () => void;
  createTextureFromUrl: (url: string, timeout?: number) => Promise<import("regl").Texture2D>;
  deselect: ({ preventEvent }?: { preventEvent?: boolean }) => void;
  destroy: () => void;
  draw: (newPoints: rspt.Points, options?: rspt.ScatterplotMethodOptions["draw"]) => Promise<void>;
  filter: (pointIdxs: number | number[], { preventEvent }?: rspt.ScatterplotMethodOptions["filter"]) => Promise<any>;
  get: <
    Key extends | "canvas"
      | "points"
      | "camera"
      | "regl"
      | "pointColor"
      | "pointColorActive"
      | "pointColorHover"
      | "pointOutlineWidth"
      | "pointSize"
      | "pointSizeSelected"
      | "pointConnectionColor"
      | "pointConnectionColorActive"
      | "pointConnectionColorHover"
      | "pointConnectionOpacity"
      | "pointConnectionOpacityActive"
      | "pointConnectionSize"
      | "pointConnectionSizeActive"
      | "pointConnectionMaxIntPointsPerSegment"
      | "pointConnectionTolerance"
      | "pointConnectionColorBy"
      | "pointConnectionOpacityBy"
      | "pointConnectionSizeBy"
      | "lassoColor"
      | "lassoLineWidth"
      | "lassoMinDelay"
      | "lassoMinDist"
      | "lassoClearEvent"
      | "lassoInitiator"
      | "lassoInitiatorParentElement"
      | "lassoOnLongPress"
      | "lassoLongPressTime"
      | "lassoLongPressAfterEffectTime"
      | "lassoLongPressEffectDelay"
      | "lassoLongPressRevertEffectTime"
      | "cameraTarget"
      | "cameraDistance"
      | "cameraRotation"
      | "cameraView"
      | "renderer"
      | "syncEvents"
      | "version"
      | "lassoInitiatorElement"
      | "performanceMode"
      | "opacityByDensityDebounceTime"
      | "pointsInView"
      | "isDestroyed"
      | "isPointsDrawn"
      | "isPointsFiltered"
      | "hoveredPoint"
      | "filteredPoints"
      | "selectedPoints"
      | keyof rspt.BaseOptions,
  >(
    property: Key,
  ) => rspt.Properties[Key];
  getScreenPosition: (pointIdx: number) => [number, number] | undefined;
  hover: (point: number, { showReticleOnce, preventEvent }?: rspt.ScatterplotMethodOptions["hover"]) => void;
  redraw: () => void;
  refresh: () => void;
  reset: (
    args_0?: Partial<{
      preventEvent: boolean;
    }>,
  ) => void;
  select: (pointIdxs: number | number[], { merge, preventEvent }?: rspt.ScatterplotMethodOptions["select"]) => void;
  set: (properties: Partial<rspt.Settable>) => void;
  export: () => ImageData;
  subscribe: <
    EventName extends | "view"
      | "select"
      | "focus"
      | "destroy"
      | "points"
      | "lassoEnd"
      | "deselect"
      | "init"
      | "backgroundImageReady"
      | "unfilter"
      | "lassoStart"
      | "transitionStart"
      | "pointConnectionsDraw"
      | "lassoExtend"
      | "pointOver"
      | "pointOut"
      | "transitionEnd"
      | "draw",
  >(
    eventName: EventName,
    eventHandler: (payload: rspt.EventMap[EventName]) => void,
    times?: number,
  ) => void;
  unfilter: ({ preventEvent }?: rspt.ScatterplotMethodOptions["filter"]) => Promise<any>;
  unsubscribe: (
    eventName:
      | "view"
      | "select"
      | "focus"
      | "destroy"
      | "points"
      | "lassoEnd"
      | "deselect"
      | "init"
      | "backgroundImageReady"
      | "unfilter"
      | "lassoStart"
      | "transitionStart"
      | "pointConnectionsDraw"
      | "lassoExtend"
      | "pointOver"
      | "pointOut"
      | "transitionEnd"
      | "draw",
  ) => void;
  view: (cameraView: number[], { preventEvent }?: rspt.ScatterplotMethodOptions["preventEvent"]) => void;
  zoomToLocation: (
    target: number[],
    distance: number,
    options?: rspt.ScatterplotMethodOptions["draw"],
  ) => Promise<void>;
  zoomToArea: (rect: rspt.Rect, options?: rspt.ScatterplotMethodOptions["draw"]) => Promise<void>;
  zoomToPoints: (pointIdxs: number[], options?: rspt.ScatterplotMethodOptions["zoomToPoints"]) => Promise<void>;
  zoomToOrigin: (options?: rspt.ScatterplotMethodOptions["draw"]) => Promise<void>;
}
