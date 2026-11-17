import { useState, useEffect, useRef, useCallback } from 'react';
import { ChunkingConfig, ChunkingResult } from '../types';
import { executeChunking } from '../chunkers';
import { ChunkWorkerRequest, ChunkWorkerResponse } from './chunking.worker';

export interface UseChunkingWorkerResult {
  result: ChunkingResult;
  isProcessing: boolean;
  error: string | null;
}

const WATCHDOG_TIMEOUT_MS = 30000;

/**
 * Custom React hook that offloads document chunking and BPE tokenization
 * to a dedicated background Web Worker, ensuring the UI remains at 60 FPS
 * during rapid parameter adjustments on large documents.
 * 
 * Features:
 * - Explicit error reporting when worker throws exceptions
 * - 30-second watchdog timer to recover from hanging calculations
 * - Automatic recovery on next input/parameter change
 * - Synchronous fallback in non-Worker environments (Vitest/Node/SSR)
 */
export function useChunkingWorker(
  text: string,
  config: ChunkingConfig
): UseChunkingWorkerResult {
  // Synchronous initial result so first frame renders with valid state
  const [result, setResult] = useState<ChunkingResult>(() => {
    try {
      return executeChunking(text, config);
    } catch {
      return {
        strategy: config.strategy,
        chunks: [],
        totalChars: 0,
        totalTokens: 0,
        totalChunkTokens: 0,
        avgTokensPerChunk: 0,
        minTokensPerChunk: 0,
        maxTokensPerChunk: 0,
        estimatedCostUsd: 0,
        executionTimeMs: 0,
      };
    }
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef<number>(0);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current !== null) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const createWorkerInstance = useCallback((): Worker | null => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return null;
    }

    try {
      const worker = new Worker(
        new URL('./chunking.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<ChunkWorkerResponse>) => {
        const { id, result: workerResult, error: workerError } = event.data;
        // Ignore stale responses from earlier rapid slider moves
        if (id === requestIdRef.current) {
          clearWatchdog();
          setIsProcessing(false);

          if (workerError) {
            setError(workerError);
          } else if (workerResult) {
            setResult(workerResult);
            setError(null);
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Chunking Worker runtime error:', err);
        clearWatchdog();
        setError(err.message || 'Worker thread encountered an unhandled error.');
        setIsProcessing(false);
      };

      return worker;
    } catch (e) {
      console.warn('Web Worker initialization failed; falling back to main-thread execution:', e);
      return null;
    }
  }, [clearWatchdog]);

  // Initialize Web Worker instance on mount
  useEffect(() => {
    const worker = createWorkerInstance();
    workerRef.current = worker;

    return () => {
      clearWatchdog();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [createWorkerInstance, clearWatchdog]);

  // Dispatch chunking request whenever input text or parameters change
  useEffect(() => {
    clearWatchdog();

    if (workerRef.current) {
      const nextId = ++requestIdRef.current;
      setIsProcessing(true);
      setError(null); // Clear previous error to allow clean recovery

      const request: ChunkWorkerRequest = {
        id: nextId,
        text,
        config,
      };

      // Set 30-second watchdog timer
      watchdogTimerRef.current = setTimeout(() => {
        if (requestIdRef.current === nextId) {
          console.error(`Chunking worker timed out after ${WATCHDOG_TIMEOUT_MS / 1000}s. Terminating and recovering.`);
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = createWorkerInstance();
          }
          setIsProcessing(false);
          setError('Chunking worker timed out after 30 seconds; worker was restarted to protect responsiveness.');
        }
      }, WATCHDOG_TIMEOUT_MS);

      workerRef.current.postMessage(request);
    } else {
      // Synchronous fallback for test/unsupported environments
      try {
        const directResult = executeChunking(text, config);
        setResult(directResult);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    }
  }, [text, config, clearWatchdog, createWorkerInstance]);

  return { result, isProcessing, error };
}
