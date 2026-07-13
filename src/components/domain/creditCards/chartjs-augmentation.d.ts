import type { ChartType } from 'chart.js';
import type { AnnotationPluginOptions } from 'chartjs-plugin-annotation';

declare module 'chart.js' {
  // Augment the PluginOptionsByType interface to include the 'annotation' property
  export interface PluginOptionsByType<TType extends ChartType> {
    annotation?: AnnotationPluginOptions;
  }
}