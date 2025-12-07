import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not defined");
    }
    return new GoogleGenAI({ apiKey });
};

export const draftMessage = async (lead: Lead, tone: 'formal' | 'casual' | 'persuasive'): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
            You are a real estate agent assistant. 
            Draft a short, professional WhatsApp message for a lead with the following details:
            Name: ${lead.lead_name}
            Interest: ${lead.service_type} for ${lead.property_type}
            Status: ${lead.status}

            Tone: ${tone}.
            Include a placeholder for a meeting time if appropriate.
            Do not include subject lines or placeholders for signature, just the message body.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Could not generate message.";
    } catch (error) {
        console.error("Error generating message:", error);
        return "Error generating message. Please check API key.";
    }
};

export const analyzeLead = async (lead: Lead, comments: string[]): Promise<string> => {
  try {
      const ai = getClient();
      const prompt = `
          Analyze the following real estate lead and provide a brief 2-sentence sentiment analysis and a recommended next step.
          
          Lead: ${lead.lead_name} (${lead.service_type} - ${lead.property_type})
          Current Status: ${lead.status}
          History of comments:
          ${comments.length > 0 ? comments.map(c => `- ${c}`).join('\n') : "No comments yet."}
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });

      return response.text || "Analysis unavailable.";
  } catch (error) {
      console.error("Error analyzing lead:", error);
      return "Error analyzing lead.";
  }
};