/**
 * Application Constants
 * Contains website code names and other system constants
 */

export enum WebsiteCode {
  BSD = 'bsd'
}

export const SUPPORTED_WEBSITES = Object.values(WebsiteCode);

// Exporter type constants
export enum ExporterType {
  DATABASE = 'database',
  JSON = 'json',
  CSV = 'csv'
}

export const SUPPORTED_EXPORTERS = Object.values(ExporterType);
