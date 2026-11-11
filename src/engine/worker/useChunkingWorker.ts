import { useState, useEffect, useRef } from 'react';
import { ChunkingConfig, ChunkingResult } from '../types';
import { executeChunking } from '../chunkers';
import { ChunkWorkerRequest, ChunkWorkerResponse } from './chunking.worker';

export interface UseChunkingWorkerResult {
  result: ChunkingResult;
  isProcessing: boolean;
}

/**
 * Custom React hook that offloads document chunking and BPE tokenization
 * to a dedicated background Web Worker, ensuring the UI remains at 60 FPS
 * during rapid parameter adjustments on large documents.
 * 
 * Falls back transparently to synchronous execution in non-Worker environments (Vitest/Node/SSR).
 */
export function useChunkingWorker(
  text: string,
  config: ChunkingConfig
): UseChunkingWorkerResult {
  // Synchronous initial result so first frame renders with valid state
  const [result, setResult] = useState<ChunkingResult>(() => {
    return executeChunking(text, config);
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef<number>(0);

  // Initialize Web Worker instance on mount
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    try {
      const worker = new Worker(
        new URL('./chunking.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<ChunkWorkerResponse>) => {
        const { id, result: workerResult } = event.data;
        // Ignore stale responses from earlier rapid slider moves
        if (id === requestIdRef.current) {
          setResult(workerResult);
          setIsProcessing(false);
        }
      };

      worker.onerror = (err) => {
        console.error('Chunking Worker error:', err);
        setIsProcessing(false);
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (e) {
      console.warn('Web Worker initialization failed; falling back to main-thread execution:', e);
      return undefined;
    }
  }, []);

  // Dispatch chunking request whenever input text or parameters change
  useEffect(() => {
    if (workerRef.current) {
      const nextId = ++requestIdRef.current;
      setIsProcessing(true);

      const request: ChunkWorkerRequest = {
        id: nextId,
        text,
        config,
      };

      workerRef.current.postMessage(request);
    } else {
      // Synchronous fallback for test/unsupported environments
      const directResult = executeChunking(text, config);
      setResult(directResult);
      setIsProcessing(false);
    }
  }, [text, config]);

  return { result, isProcessing };
}
