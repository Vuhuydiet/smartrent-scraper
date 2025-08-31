/**
 * Request Data Transfer Objects
 * Used for validating incoming API requests
 */

import { z } from 'zod';
import { SUPPORTED_WEBSITES, SUPPORTED_EXPORTERS } from '../../utils/constants';

// Create scraping job request validation
export const CreateScrapingJobRequestSchema = z.object({
  url: z.url('Invalid URL format'),
  websiteCode: z.string().refine((val) => SUPPORTED_WEBSITES.includes(val as any), {
    message: `Website code must be one of: ${SUPPORTED_WEBSITES.join(', ')}`
  }),
  exporters: z.array(z.string().refine((val) => SUPPORTED_EXPORTERS.includes(val as any), {
    message: `Exporter must be one of: ${SUPPORTED_EXPORTERS.join(', ')}`
  })).min(1, 'At least one exporter must be specified'),
  start: z.coerce.number().int().positive().min(1).default(1),
  limit: z.coerce.number().int().positive().min(1).default(999),
});

export type ScrapingJobRequest = z.infer<typeof CreateScrapingJobRequestSchema>;

// Job list query parameters validation
export const JobListQuerySchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0)
});
