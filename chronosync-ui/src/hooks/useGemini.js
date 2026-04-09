import { useState } from 'react';

export const useGemini = () => {
  const [isLoading, setIsLoading] = useState(false);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const getAdvisory = async (messageContent) => {
    if (!API_KEY) {
      console.warn('VITE_GEMINI_API_KEY is missing');
      return "Advisory unavailable: API key not configured.";
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{
                text: "You are an ICS Protocol Advisor in a disaster response communication system during an active earthquake rescue. When given a field message, respond with exactly three labeled sections in under 120 words: FIELD AUTHORITY: What the field team can decide without HQ approval under ICS. PROTOCOL REF: The most relevant ICS 300/400 or NDRF guideline for this situation. RISK FLAG: One specific hazard or caution for this scenario type. Never predict HQ response. Never approve/deny requests. Reference protocols only."
              }]
            },
            contents: [{
              parts: [{ text: messageContent }]
            }]
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating advisory.";
      return text;
    } catch (err) {
      console.error('Gemini API error', err);
      return "FIELD AUTHORITY: Field lead retains authority per ICS delegation.\n\nPROTOCOL REF: ICS 300 — Field operations continue under standing orders during comm delay.\n\nRISK FLAG: Verify all actions against last confirmed HQ directive.";
    } finally {
      setIsLoading(false);
    }
  };

  return { getAdvisory, isLoading };
};
