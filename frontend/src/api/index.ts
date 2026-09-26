import { TrainState, TrainConditions } from '../types';

export const api = {
  async getTrains(): Promise<Record<string, TrainState>> {
    const response = await fetch('/api/trains');
    if (!response.ok) throw new Error('Failed to fetch trains');
    return response.json();
  },

  async getTrain(trainNumber: string): Promise<TrainState> {
    const response = await fetch(`/api/trains/${trainNumber}`);
    if (!response.ok) throw new Error(`Failed to fetch train ${trainNumber}`);
    return response.json();
  },

  async updateConditions(trainNumber: string, conditions: Partial<TrainConditions>): Promise<TrainState> {
    const response = await fetch(`/api/admin/trains/${trainNumber}/conditions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conditions),
    });
    if (!response.ok) throw new Error(`Failed to update conditions for train ${trainNumber}`);
    return response.json();
  },
  
  async getPrediction(trainNumber: string, explain: boolean = false): Promise<any> {
    const response = await fetch(`/api/trains/${trainNumber}/prediction?explain=${explain}`);
    if (!response.ok) throw new Error(`Failed to fetch prediction for train ${trainNumber}`);
    return response.json();
  }
};
