export interface AIAnalysis {

  intent: string;

  confidence: number;

  sentiment: string;

  ragSources: string[];

  visionResult?: string;

  speechTranscript?: string;

}