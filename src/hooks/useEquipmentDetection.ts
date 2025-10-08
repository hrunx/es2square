import { useState, useEffect } from 'react';
import { equipmentDetectionModel, DetectionResult } from '../lib/models/equipmentDetection';

export function useEquipmentDetection() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeModel() {
      try {
        await equipmentDetectionModel.initialize();
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to initialize equipment detection model');
          console.error(err);
        }
      }
    }

    initializeModel();

    return () => {
      mounted = false;
      equipmentDetectionModel.dispose();
    };
  }, []);

  async function detectEquipment(image: HTMLImageElement): Promise<DetectionResult[]> {
    if (!isInitialized) {
      throw new Error('Model not initialized');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const results = await equipmentDetectionModel.detectEquipment(image);
      return results;
    } catch (err) {
      setError('Error detecting equipment');
      console.error(err);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    detectEquipment,
    isInitialized,
    isProcessing,
    error
  };
}