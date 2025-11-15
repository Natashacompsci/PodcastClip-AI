import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Clip } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const clipGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A short, catchy, hook-style title for the clip (max 10 words)." },
      summary: { type: Type.STRING, description: "A concise one-sentence summary of the clip's content." },
      transcript: { type: Type.STRING, description: "The full transcript of the audio segment for this clip." },
      timestamp: { type: Type.STRING, description: "The start and end time of the clip in MM:SS format (e.g., '01:23 - 02:05'). Clip duration must be between 30 and 60 seconds." },
      quote: { type: Type.STRING, description: "The single most memorable and powerful quote from the clip." },
      hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 3 relevant hashtags, starting with '#' (e.g., ['#AI', '#FutureTech', '#PodcastClips'])." },
      speaker: { type: Type.STRING, description: "The name or label of the primary speaker in this clip (e.g., 'Interviewer', 'Dr. Sharma')." },
      platform: { type: Type.STRING, description: "The suggested social media platform for this clip (e.g., 'TikTok', 'Instagram Reels', 'YouTube Shorts')." }
    },
    required: ["title", "summary", "transcript", "timestamp", "quote", "hashtags", "speaker", "platform"]
  }
};

const PODCAST_DETAILS = {
  name: "The Digital Frontier",
  episode: 42,
};

async function generateImageForClip(clip: Clip): Promise<string> {
  const prompt = `Create a visually stunning social media card for an Instagram story (1080x1920). The card should feature a vibrant, abstract gradient background with colors like purple, blue, and pink. Prominently display the following quote in a large, bold, modern sans-serif font: "${clip.quote}". At the bottom, in smaller text, include the speaker's name '${clip.speaker}' and then the podcast details: '${PODCAST_DETAILS.name}, Ep. ${PODCAST_DETAILS.episode}'. Also, incorporate a subtle, abstract audio waveform visualization. The overall aesthetic should be modern, clean, and eye-catching.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("Image generation failed to return an image.");
}

export const transcribeAudio = async (audio: {mimeType: string, data: string}): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { inlineData: audio },
          { text: "You are an expert audio transcriptionist. Transcribe the following audio content accurately. Identify and label each speaker clearly (e.g., 'Speaker 1:', 'Speaker 2:', 'Interviewer:', 'Dr. Sharma:')." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio. The file might be corrupted or in an unsupported format.");
  }
};

export const generateClipsFromTranscript = async (transcript: string): Promise<Clip[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following podcast transcript. Identify the different speakers (e.g., 'Interviewer', 'Dr. Sharma'). Then, generate 3 engaging clips. For each clip, identify the primary speaker. The podcast is called '${PODCAST_DETAILS.name}', Episode ${PODCAST_DETAILS.episode}. Here's the transcript: "${transcript}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: clipGenerationSchema,
      },
    });

    const clipsData: Clip[] = JSON.parse(response.text);

    const clipsWithImages = await Promise.all(
      clipsData.slice(0, 3).map(async (clip) => {
        const imageData = await generateImageForClip(clip);
        return {
          ...clip,
          cardImageUrl: `data:image/png;base64,${imageData}`,
        };
      })
    );

    return clipsWithImages;
  } catch (error) {
    console.error("Error generating clips:", error);
    throw new Error("Failed to generate clips. Please try again.");
  }
};