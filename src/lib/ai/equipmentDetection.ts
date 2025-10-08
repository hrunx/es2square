import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface DetectionResult {
  equipment: string;
  confidence: number;
  specs?: {
    manufacturer?: string;
    model?: string;
    type?: string;
    capacity?: string;
  };
  efficiency?: number;
  recommendations?: string[];
}

class EquipmentDetectionAI {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await tf.ready();
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing equipment detection:', error);
      throw error;
    }
  }

  async detectEquipment(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // First, detect objects using COCO-SSD
      const predictions = await this.model.detect(imageElement);

      // Then, analyze each detection using DeepSeek for detailed analysis
      const detailedResults = await Promise.all(
        predictions.map(async (pred) => {
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "Analyze energy equipment specifications and provide efficiency insights."
                },
                {
                  role: "user",
                  content: `Analyze this detected equipment:
                    Type: ${pred.class}
                    Confidence: ${pred.score}
                    Location: ${JSON.stringify(pred.bbox)}`
                }
              ]
            })
          });

          if (!response.ok) {
            throw new Error('Failed to analyze equipment');
          }

          const result = await response.json();
          const analysis = JSON.parse(result.choices[0].message.content);

          return {
            equipment: pred.class,
            confidence: pred.score,
            ...analysis
          };
        })
      );

      return detailedResults;
    } catch (error) {
      console.error('Error detecting equipment:', error);
      throw error;
    }
  }

  async analyzeEquipmentImage(image: HTMLImageElement): Promise<{
    detections: DetectionResult[];
    recommendations: string[];
  }> {
    const detections = await this.detectEquipment(image);

    // Get overall recommendations based on all detected equipment
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Provide recommendations for improving energy efficiency of detected equipment."
          },
          {
            role: "user",
            content: `Provide recommendations for these equipment:
              ${JSON.stringify(detections)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    const result = await response.json();
    const recommendations = JSON.parse(result.choices[0].message.content);

    return {
      detections,
      recommendations
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isInitialized = false;
    }
  }
}

export const equipmentDetectionAI = new EquipmentDetectionAI();