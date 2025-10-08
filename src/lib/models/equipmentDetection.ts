import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Equipment categories matching our application needs
export const EQUIPMENT_CATEGORIES = [
  'HVAC_unit',
  'water_heater',
  'lighting_fixture',
  'electrical_panel',
  'thermostat',
  'ventilation_fan',
  'solar_panel',
  'battery_storage',
  'generator',
  'pump'
] as const;

export type EquipmentCategory = typeof EQUIPMENT_CATEGORIES[number];

export interface DetectionResult {
  category: EquipmentCategory;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Map COCO-SSD classes to our equipment categories
const COCO_TO_EQUIPMENT_MAP: Record<string, EquipmentCategory> = {
  'tv': 'electrical_panel',
  'oven': 'water_heater',
  'refrigerator': 'HVAC_unit',
  'clock': 'thermostat',
  'fan': 'ventilation_fan',
  'cell phone': 'electrical_panel',
  'microwave': 'electrical_panel',
  'sink': 'pump'
};

class EquipmentDetectionModel {
  private model: cocoSsd.ObjectDetection | null = null;

  async initialize(): Promise<void> {
    try {
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2'  // Use a lighter model for better performance
      });
      console.log('Equipment detection model initialized');
    } catch (error) {
      console.error('Error initializing equipment detection model:', error);
      throw error;
    }
  }

  async detectEquipment(imageElement: HTMLImageElement): Promise<DetectionResult[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Run detection
      const predictions = await this.model.detect(imageElement);

      // Process and filter results
      const results: DetectionResult[] = [];
      
      for (const prediction of predictions) {
        const equipmentCategory = COCO_TO_EQUIPMENT_MAP[prediction.class];
        
        if (equipmentCategory) {
          results.push({
            category: equipmentCategory,
            confidence: prediction.score,
            boundingBox: {
              x: prediction.bbox[0],
              y: prediction.bbox[1],
              width: prediction.bbox[2],
              height: prediction.bbox[3]
            }
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error during equipment detection:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model = null;
    }
  }
}

export const equipmentDetectionModel = new EquipmentDetectionModel();