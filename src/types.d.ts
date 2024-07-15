// types.d.ts

export as namespace UoC;

export interface UnitOfCompetency {
  code: string;
  title: string;
  release: string;
  elements: Array<Element>;
}

export type Element = {
  id: `${number}`;
  title: string;
  performance_criteria: Array<PerformanceCriteria>;
};

export type PerformanceCriteria = {
  id: `${number}.${number}`;
  criteria: string;
};

export type ScrapeFn = (unit_code: string) => Promise<UnitOfCompetency>;
