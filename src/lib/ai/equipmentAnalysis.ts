import { talkToDeepSeek } from '../deepseek';
import type { Equipment } from '../../types/equipment';

export async function analyzeEquipment(equipment: Equipment, customerType: string): Promise<string> {
  const prompt = `
As an energy efficiency expert, analyze this ${customerType} equipment and provide specific recommendations:

Equipment Details:
- Name: ${equipment.name}
- Type: ${equipment.category} (${equipment.subType})
- Age: ${equipment.age} years
- Condition: ${equipment.condition}
- Operating Hours: ${equipment.operatingHours} hours/day
- Operating Days: ${equipment.operatingDays} days/week
- Rated Power: ${equipment.ratedPower} kW
- Efficiency: ${equipment.efficiency}%
- Control System: ${equipment.controlSystem}
- Load Factor: ${equipment.loadFactor}
- Energy Metered: ${equipment.energyMetered ? 'Yes' : 'No'}
- IoT Connected: ${equipment.iotConnected ? 'Yes' : 'No'}

Provide 3-5 specific recommendations focusing on:
1. Immediate operational improvements
2. Maintenance and efficiency optimization
3. Control system enhancements
4. Potential upgrades or replacements (if applicable)
5. Energy monitoring and verification

For each recommendation, include:
- Expected energy savings (%)
- Implementation cost (Low/Medium/High)
- Payback period estimate
- Priority level

Format as a clear, structured list with specific actionable items.
`.trim();

  try {
    const analysis = await talkToDeepSeek(prompt);
    return analysis;
  } catch (error) {
    console.error('Error analyzing equipment:', error);
    throw new Error('Failed to analyze equipment');
  }
}

export function calculateAnnualEnergy(equipment: Equipment): number {
  const loadFactorMultiplier = {
    Low: 0.3,
    Medium: 0.6,
    High: 0.9
  }[equipment.loadFactor];

  return equipment.ratedPower * equipment.operatingHours * equipment.operatingDays * 52 * loadFactorMultiplier;
}

export function calculateSavingsPotential(equipment: Equipment): number {
  let potential = 0;

  // Age-based inefficiency
  if (equipment.age > 15) {
    potential += 0.25; // 25% potential savings
  } else if (equipment.age > 10) {
    potential += 0.15; // 15% potential savings
  } else if (equipment.age > 5) {
    potential += 0.08; // 8% potential savings
  }

  // Condition-based inefficiency
  if (equipment.condition === 'Needs Maintenance') {
    potential += 0.15; // 15% potential savings
  }

  // Control system opportunity
  if (equipment.controlSystem === 'Manual') {
    potential += 0.12; // 12% potential savings
  } else if (equipment.controlSystem === 'Thermostat') {
    potential += 0.05; // 5% potential savings
  }

  // Efficiency-based opportunity
  const thresholds = getEfficiencyThresholds(equipment.category);
  if (equipment.efficiency < thresholds.fair) {
    potential += 0.20; // 20% potential savings
  } else if (equipment.efficiency < thresholds.good) {
    potential += 0.10; // 10% potential savings
  }

  // Monitoring opportunity
  if (!equipment.energyMetered) {
    potential += 0.05; // 5% potential savings from monitoring
  }

  return potential * calculateAnnualEnergy(equipment);
}