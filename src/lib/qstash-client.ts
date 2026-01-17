import { Client } from '@upstash/qstash';

let qstashClient: Client | null = null;

/**
 * Get QStash client instance (singleton)
 * Returns null if QStash is not configured (will fallback to sync)
 */
export function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  
  if (!token) {
    return null; // Queue unavailable, will fallback to sync
  }
  
  if (!qstashClient) {
    qstashClient = new Client({ token });
  }
  
  return qstashClient;
}

export interface EnqueueOptions {
  delay?: number; // Delay in seconds
  retries?: number; // Number of retries (default: 3)
  deduplicationId?: string; // For idempotency
}

export interface EnqueueResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enqueue a job to QStash
 * Returns immediately - job will be processed asynchronously
 */
export async function enqueueJob(
  url: string,
  body: any,
  options?: EnqueueOptions
): Promise<EnqueueResult> {
  const client = getQStashClient();
  
  if (!client) {
    return { 
      success: false, 
      error: 'QStash not configured - QSTASH_TOKEN missing' 
    };
  }
  
  try {
    const result = await client.publishJSON({
      url,
      body,
      delay: options?.delay || 0,
      retries: options?.retries || 3,
      deduplicationId: options?.deduplicationId,
    });
    
    // Extract messageId from response
    const messageId = typeof result === 'string' ? result : (result as any)?.messageId || '';
    
    return { success: true, messageId };
  } catch (error) {
    console.error('Failed to enqueue job to QStash:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Check if QStash is available
 */
export function isQStashAvailable(): boolean {
  return getQStashClient() !== null;
}

