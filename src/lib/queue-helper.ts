import { enqueueJob, isQStashAvailable } from './qstash-client';
import { getBaseUrl } from './get-base-url';

export type JobType = 'send_invoice' | 'send_reminder' | 'generate_pdf' | 'process_reminders';

export interface JobPayload {
  [key: string]: any;
}

export interface QueueResult {
  queued: boolean;
  jobId?: string;
  error?: string;
  fallbackToSync: boolean;
}

/**
 * Enqueue a background job using QStash
 * Falls back to sync if queue is unavailable
 */
export async function enqueueBackgroundJob(
  type: JobType,
  payload: JobPayload,
  options?: {
    delay?: number; // Delay in seconds
    retries?: number;
    deduplicationId?: string;
  }
): Promise<QueueResult> {
  // Feature flag check
  const useQueue = process.env.ENABLE_ASYNC_QUEUE === 'true';
  
  if (!useQueue) {
    return { 
      queued: false, 
      fallbackToSync: true,
      error: 'Queue disabled via feature flag' 
    };
  }

  // Check if QStash is available
  if (!isQStashAvailable()) {
    return { 
      queued: false, 
      fallbackToSync: true,
      error: 'QStash not configured' 
    };
  }

  // Build the queue handler URL
  // IMPORTANT: QStash cannot reach localhost - skip queue in local development
  const baseUrl = getBaseUrl();
  
  // Skip queue if running on localhost (QStash can't reach it)
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    console.log('⚠️ Queue skipped: QStash cannot reach localhost. Using sync mode.');
    return {
      queued: false,
      fallbackToSync: true,
      error: 'Queue not available for localhost - QStash requires public URL',
    };
  }
  
  const queueUrl = `${baseUrl}/api/queue/${type}`;

  // Enqueue job
  const result = await enqueueJob(
    queueUrl,
    payload,
    {
      delay: options?.delay,
      retries: options?.retries || 3,
      deduplicationId: options?.deduplicationId,
    }
  );

  if (result.success) {
    return {
      queued: true,
      jobId: result.messageId,
      fallbackToSync: false,
    };
  }

  // Queue failed, fallback to sync
  return {
    queued: false,
    error: result.error,
    fallbackToSync: true,
  };
}

