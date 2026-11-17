import { executeChunking } from '../chunkers';
import { ChunkingConfig, ChunkingResult } from '../types';

export interface ChunkWorkerRequest {
  id: number;
  text: string;
  config: ChunkingConfig;
}

export interface ChunkWorkerResponse {
  id: number;
  result?: ChunkingResult;
  error?: string;
  durationMs: number;
}

self.onmessage = (event: MessageEvent<ChunkWorkerRequest>) => {
  const { id, text, config } = event.data;
  const start = performance.now();

  try {
    const result = executeChunking(text, config);
    const durationMs = Math.round((performance.now() - start) * 10) / 10;

    const response: ChunkWorkerResponse = {
      id,
      result: {
        ...result,
        executionTimeMs: durationMs,
      },
      durationMs,
    };

    self.postMessage(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const durationMs = Math.round((performance.now() - start) * 10) / 10;
    console.error('Worker chunking execution failed:', errorMsg);

    const errorResponse: ChunkWorkerResponse = {
      id,
      error: errorMsg,
      durationMs,
    };

    self.postMessage(errorResponse);
  }
};
