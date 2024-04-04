import { Selection } from "d3-selection";

export type Events = "start" | "drag" | "end";

export interface LassoProps {
  possible?: boolean;
  selected?: boolean;
  hoverSelect?: boolean;
  loopSelect?: boolean;
  lassoPoint?: [number, number];
}

export type LassoedElementBaseType = Element;
export type LassoElement<LassoRefElement extends LassoedElementBaseType> = LassoRefElement & { __lasso?: LassoProps };
export type ItemSelection<
  LassoRefElement extends LassoedElementBaseType,
  Datum,
  LassoPRefElement extends LassoedElementBaseType,
  PDatum,
> = Selection<LassoElement<LassoRefElement>, Datum, LassoPRefElement, PDatum>;

export interface LassoBehavior<
  LassoRefElement extends LassoedElementBaseType,
  Datum,
  LassoPRefElement extends LassoedElementBaseType,
  PDatum,
  // eslint-disable-next-line @typescript-eslint/ban-types
> extends Function {
  (selection: Selection<LassoPRefElement, PDatum, null, undefined>): void;

  targetArea(): Selection<LassoPRefElement, PDatum, null, undefined>;

  targetArea(area: Selection<LassoPRefElement, PDatum, null, undefined>): this;

  selectedItems(): ItemSelection<LassoRefElement, Datum, LassoPRefElement, PDatum>;

  notSelectedItems(): ItemSelection<LassoRefElement, Datum, LassoPRefElement, PDatum>;

  possibleItems(): ItemSelection<LassoRefElement, Datum, LassoPRefElement, PDatum>;

  notPossibleItems(): ItemSelection<LassoRefElement, Datum, LassoPRefElement, PDatum>;

  on(type: Events, fn: (event: any) => void): this;

  items(selection?: ItemSelection<LassoRefElement, Datum, LassoPRefElement, PDatum>): this;

  active(active?: boolean): this;
}

export function d3lasso<
  LassoRefElement extends LassoedElementBaseType,
  Datum,
  LassoPRefElement extends LassoedElementBaseType,
  PDatum,
>(): LassoBehavior<LassoRefElement, Datum, LassoPRefElement, PDatum>;
