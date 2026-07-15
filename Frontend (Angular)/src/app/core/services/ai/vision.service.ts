import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface VisionResult {
  intent: string;
  confidence: number;
  sentiment: string;
  detectedObjects: string[];
  recommendation: string;
  possibleDamage: boolean;
  damageScore: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisionService {

  private api = 'http://127.0.0.1:8000';

  constructor(
    private http: HttpClient
  ) {}

  async analyzeImage(file: File): Promise<VisionResult> {

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    const response = await firstValueFrom(
      this.http.post<any>(
        `${this.api}/vision/analyze`,
        formData
      )
    );

    const analysis = response.analysis;

    return {
      intent: analysis.intent,
      confidence: analysis.confidence,
      sentiment: analysis.sentiment,
      detectedObjects: analysis.possible_damage
        ? ['Possible Damaged Product']
        : ['No Strong Damage Detected'],
      recommendation: analysis.recommendation,
      possibleDamage: analysis.possible_damage,
      damageScore: analysis.damage_score,
      description: analysis.description
    };

  }

}