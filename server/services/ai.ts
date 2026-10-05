import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIParsedBloodRequest {
  patientRef?: string;
  requiredBloodGroup?: string;
  unitsRequired?: number;
  urgency?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  clinicalNotes?: string;
  clinicalPriorityAnalysis?: string;
}

/**
 * Natural-language blood request parser using Gemini 3.8 Flash.
 * Deterministic fallback provided if API key is not present.
 */
export async function parseEmergencyBloodRequest(text: string): Promise<AIParsedBloodRequest> {
  const ai = getAIClient();
  if (!ai) {
    return fallbackRegexParser(text);
  }

  try {
    const prompt = `You are an AI Clinical Triage Assistant for BloodLink AI.
Extract structured blood request fields from this unstructured emergency message:
"${text}"

Respond in pure JSON matching this exact structure:
{
  "patientRef": "string or undefined",
  "requiredBloodGroup": "A+ | A- | B+ | B- | AB+ | AB- | O+ | O-",
  "unitsRequired": number (integer >= 1),
  "urgency": "NORMAL | URGENT | EMERGENCY",
  "clinicalNotes": "concise summary of medical urgency and notes",
  "clinicalPriorityAnalysis": "1-2 sentence medical urgency evaluation"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini request parsing fallback to regex:', err);
  }

  return fallbackRegexParser(text);
}

function fallbackRegexParser(text: string): AIParsedBloodRequest {
  const bloodMatch = text.match(/\b(A|B|AB|O)[+-]\b/i);
  const unitsMatch = text.match(/\b(\d+)\s*(units?|pints?|bags?|bottles?)\b/i);
  const isEmergency = /emergency|critical|trauma|immediately|urgent|bleeding|stat|icu/i.test(text);

  return {
    patientRef: 'Emergency Patient',
    requiredBloodGroup: bloodMatch ? bloodMatch[0].toUpperCase() : undefined,
    unitsRequired: unitsMatch ? parseInt(unitsMatch[1], 10) : 1,
    urgency: isEmergency ? 'EMERGENCY' : 'NORMAL',
    clinicalNotes: text,
    clinicalPriorityAnalysis: isEmergency
      ? 'High-priority clinical request flagged by triage parser.'
      : 'Standard blood replenishment request.',
  };
}
