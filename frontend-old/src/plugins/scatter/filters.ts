import type {MetaData, RowSchema} from "@/plugins/scatter";

export default () => {
  const hiddenYears: Map<number, null> = new Map();
  const hiddenCategories: Map<number, null> = new Map();

  const filters = () => {

  }

  filters.hideYear = (year: number): void => {
    hiddenYears.set(year, null);
  }
  filters.unHideYear = (year: number): void => {
    hiddenYears.delete(year);
  }

  filters.hideCategory = (cat: number): void => {
    hiddenCategories.set(cat, null);
  }
  filters.unHideCategory = (cat: number): void => {
    hiddenCategories.delete(cat);
  }

  filters.isHidden = (d: RowSchema): boolean => {
    return hiddenYears.has(d.year) || hiddenCategories.has(d.label_0);
  }

  return filters;
}