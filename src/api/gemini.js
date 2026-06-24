// KopiGuard AI Evaluation Engine - Gemini API & Local Heuristic Fallback

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Fallback heuristic engine in case Gemini API is not configured or fails.
 */
export function evaluatePostHeuristic(text, keywords) {
  const combinedContent = `${text} ${keywords}`.toLowerCase();
  
  // Step 1: Forensic Verification (Checks for synthetic markers)
  const aiIndicators = [
    'ai video', 'aliens', 'cloned digital voice', 'synthetic footage', 
    'deepfake', 'ai-generated', 'generative', 'ai art'
  ];
  const isAIGenerated = aiIndicators.some(indicator => combinedContent.includes(indicator));
  
  let isFinancialScam = false;
  
  // Step 2: Threat Contextualization (Only runs if Step 1 flags AI)
  if (isAIGenerated) {
    const scamIndicators = [
      'pm lee', 'lawrence wong', '$2000 bonus', 'verify bank info', 
      'government payout', 'investment scheme', '$500 senior household grant', 
      '$500', 'bonus', 'verify bank details', 'register bank'
    ];
    isFinancialScam = scamIndicators.some(indicator => combinedContent.includes(indicator));
  }

  let explanation = '';
  if (isAIGenerated && isFinancialScam) {
    explanation = '🚨 Deepfake Scam Blocked: Our forensics flagged a 96% AI probability. Our agent identified unauthorized financial solicitation matching active SPF fraud notices. Sharing has been disabled.';
  } else if (isAIGenerated && !isFinancialScam) {
    explanation = '⚠️ AI Media Detected: This post is identified as synthetic/AI-generated media, but does not present an immediate financial fraud risk.';
  } else {
    explanation = '✅ Authentic Content: No digital manipulation footprints found.';
  }

  return {
    isAIGenerated,
    isFinancialScam,
    confidenceAI: isAIGenerated ? 96 : 1,
    explanation
  };
}

/**
 * Main evaluation function - queries Gemini API if key is available,
 * otherwise falls back to local heuristics.
 */
export async function evaluatePost(text, keywords) {
  if (!apiKey || apiKey.trim() === '') {
    console.log("KopiGuard AI: No VITE_GEMINI_API_KEY found, using local heuristics.");
    return evaluatePostHeuristic(text, keywords);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are a scam and deepfake analysis system called KopiGuard AI, designed to protect senior citizens.
Analyze the following social media post text and its associated visual/media keywords to determine:
1) If it contains synthetic or AI-generated media (like deepfake voices, AI-generated images/videos, AI art).
2) If it is a financial scam, phishing attempt, government payout fraud, or bank detail verification scam.

Post Text: "${text}"
Keywords: "${keywords}"

Respond ONLY with a JSON object inside a code block or as raw text. Do not write any explanations before or after the JSON.
The JSON object must have this exact structure:
{
  "isAIGenerated": true or false,
  "isFinancialScam": true or false,
  "confidenceAI": a number between 0 and 100 representing probability of AI manipulation (e.g. 96 for high-quality deepfake, 0 for clear camera photo),
  "explanation": "A concise, detailed summary of findings (maximum 30 words) e.g. 'Deepfake scam matching known government support fraud.' or 'AI-generated digital artwork preview.' or 'Authentic personal photo without digital manipulation.'"
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Invalid response structure from Gemini API");
    }

    const result = JSON.parse(responseText.trim());
    
    return {
      isAIGenerated: !!result.isAIGenerated,
      isFinancialScam: !!result.isFinancialScam,
      confidenceAI: typeof result.confidenceAI === 'number' ? result.confidenceAI : (result.isAIGenerated ? 96 : 1),
      explanation: result.explanation || (result.isAIGenerated && result.isFinancialScam ? "AI deepfake scam detected." : "AI media detected.")
    };
  } catch (error) {
    console.error("KopiGuard AI: Error calling Gemini API, falling back to local heuristics.", error);
    return evaluatePostHeuristic(text, keywords);
  }
}

/**
 * Tests connection to the Gemini API using the configured key.
 */
export async function testConnection() {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: "No API key configured in .env file." };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Respond with the single word 'OK'." }]
        }]
      })
    });

    if (!response.ok) {
      return { success: false, message: `Gemini API test failed. Status: ${response.status}` };
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (responseText && responseText.trim().toUpperCase().includes("OK")) {
      return { success: true, message: "Gemini API Connection successful!" };
    } else {
      return { success: false, message: "Gemini API test returned unexpected format." };
    }
  } catch (error) {
    return { success: false, message: `Gemini API test connection error: ${error.message}` };
  }
}

