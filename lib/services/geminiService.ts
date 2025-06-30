import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateHash } from '../utils/helpers';

export interface GeminiScenarioData {
  metadata: {
    language: string;
    purpose: string;
    focus: string;
    generated_at: string;
    total_words: number;
    total_sentences: number;
    json_file_path?: string;
  };
  vocabulary: Array<{
    id: string;
    hash: string;
    word: string;
    translation: string;
    phonetic: string;
    language: string;
  }>;
  sentences: Array<{
    id: string;
    hash: string;
    sentence: string;
    translation: string;
    phonetic: string;
    language: string;
    difficulty: string;
  }>;
}

export class GeminiService {
  private static genAI: GoogleGenerativeAI;

  static initialize() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
 * Test Gemini connection
 */
  static async testConnection(): Promise<boolean> {
    try {
      this.initialize();
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Simple test prompt
      const testPrompt = "Say 'Hello, Gemini is working!' in one sentence.";
      
      const result = await model.generateContent(testPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Check if we got a valid response
      return text != null && text.trim().length > 0;
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }


  /**
   * Generate clarification response (enhanced version)
   */
  static async generateClarification(
    language: string,
    purpose: string,
    userInput: string,
    previousInputs: string[] = []
  ): Promise<string> {
    this.initialize();

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You're a smart, efficient language tutor helping someone learn ${language}.

  CONTEXT:
  - User wants to learn ${language} for: "${purpose}"
  - Previous focus areas discussed: ${previousInputs.length > 0 ? previousInputs.join(', ') : 'None'}
  - User just added: "${userInput}"

  YOUR JOB:
  1. Acknowledge their new focus area
  2. Suggest 2-3 specific sub-areas or situations within this focus
  3. Ask if they want to add more focus areas or if they're ready to generate their learning scenario
  4. Keep it conversational and encouraging

  EXAMPLE RESPONSE FORMAT:
  "Great! [acknowledge their input]. For [their focus area], you'll probably want to focus on:
  • [specific situation 1]
  • [specific situation 2] 
  • [specific situation 3]

  This will give you practical ${language} for real-world situations. Want to add more focus areas, or shall we create your personalized learning scenario?"

  Keep it brief, specific, and actionable.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini clarification error:', error);
      throw new Error('Failed to generate clarification');
    }
  }


  /**
   * Generate lesson content (like your Flask lesson_chain)
   */
  static async generateLessonContent(
    language: string,
    purpose: string,
    focus: string
  ): Promise<GeminiScenarioData> {
    this.initialize();

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are creating ${language} learning content for someone who wants to: "${purpose}"
    Their specific focus areas are: "${focus}"

    Generate exactly 30 vocabulary words and 20 sentences that are ESSENTIAL for their goals.

    VOCABULARY REQUIREMENTS:
    - 30 words total
    - Must be directly relevant to their purpose and focus areas
    - Include practical, high-frequency words they'll actually use
    - Provide English translation and simple phonetic pronunciation

    SENTENCE REQUIREMENTS:
    - 20 sentences total
    - Use ONLY the vocabulary words you provided above
    - Make sentences practical for their specific scenarios
    - Include English translation and phonetic pronunciation
    - Keep sentences short and useful

    **IMPORTANT: Use this format exactly:**

    VOCABULARY:
    - palabra1 | [ENGLISH] translation1 | [PHONETIC] pronunciation1
    - palabra2 | [ENGLISH] translation2 | [PHONETIC] pronunciation2
    ...

    SENTENCES:
    1. sentence 1 | [ENGLISH] translation1 | [PHONETIC] pronunciation1
    2. sentence 2 | [ENGLISH] translation2 | [PHONETIC] pronunciation2
    ...

    Make everything relevant to: ${purpose} - ${focus}`;


    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
    
      // Parse the response and return structured data instead of raw string
      const parsedData = this.parseGeminiResponse(rawText, language, purpose, focus);
      return parsedData;
    } catch (error) {
      console.error('Gemini lesson generation error:', error);
      throw new Error('Failed to generate lesson content');
    }
  }

  /**
   * Parse Gemini response into structured data (like your Flask parse_vocab_and_sentences)
   */
  static parseGeminiResponse(
    lessonText: string,
    language: string,
    purpose: string,
    focus: string
  ): GeminiScenarioData {
    const vocabulary: GeminiScenarioData['vocabulary'] = [];
    const sentences: GeminiScenarioData['sentences'] = [];
    
    const lines = lessonText.trim().split('\n');
    let parsingVocab = false;
    let parsingSentences = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toUpperCase().includes('WORDS')) {
        parsingVocab = true;
        parsingSentences = false;
        continue;
      } else if (trimmedLine.toUpperCase().includes('SENTENCES')) {
        parsingVocab = false;
        parsingSentences = true;
        continue;
      }

      if (parsingVocab && trimmedLine.startsWith('-')) {
        const parts = trimmedLine.substring(1).split('|');
        if (parts.length >= 2) {
          const word = parts[0].trim();
          const translation = parts[1].replace('[ENGLISH]', '').trim();
          const phonetic = parts.length >= 3 ? parts[2].replace('[PHONETIC]', '').trim() : '';
          
          const hash = generateHash(`${word}||${translation}`, language);
          
          vocabulary.push({
            id: hash,
            hash: hash,
            word: word,
            translation: translation,
            phonetic: phonetic,
            language: language
          });
        }
      }

      if (parsingSentences && trimmedLine.includes('|')) {
        try {
          // Handle numbered sentences like "1. sentence | translation | phonetic"
          const withoutNumber = trimmedLine.replace(/^\d+\.\s*/, '');
          const parts = withoutNumber.split('|');
          
          if (parts.length >= 2) {
            const sentence = parts[0].trim();
            const translation = parts[1].replace('[ENGLISH]', '').trim();
            const phonetic = parts.length >= 3 ? parts[2].replace('[PHONETIC]', '').trim() : '';
            
            const hash = generateHash(`${sentence}||${translation}`, language);
            
            sentences.push({
              id: hash,
              hash: hash,
              sentence: sentence,
              translation: translation,
              phonetic: phonetic,
              language: language,
              difficulty: 'contextual'
            });
          }
        } catch (error) {
          // Skip malformed lines
          continue;
        }
      }
    }

    console.log(`📚 Parsed ${vocabulary.length} vocabulary words and ${sentences.length} sentences`);
    return {
      metadata: {
        language: language,
        purpose: purpose,
        focus: focus,
        generated_at: new Date().toISOString(),
        total_words: vocabulary.length,
        total_sentences: sentences.length,
      },
      vocabulary: vocabulary,
      sentences: sentences
    };
  }

  /**
   * Complete scenario generation pipeline
   */
  static async generateCompleteScenario(
    language: string,
    purpose: string,
    focus: string
  ): Promise<GeminiScenarioData> {
    console.log(`🧠 Generating scenario for ${language}: ${purpose} - ${focus}`);
    
    const scenarioData = await this.generateLessonContent(language, purpose, focus);
    
    console.log(`✅ Generated ${scenarioData.vocabulary.length} words and ${scenarioData.sentences.length} sentences`);
    
    return scenarioData;
  }
}