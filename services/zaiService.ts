/**
 * Z.AI Service for AI letter generation using GLM-4.6
 */

interface LetterGenerationRequest {
  title: string;
  senderName: string;
  recipientName: string;
  matter: string;
  desiredResolution: string;
  letterType: string;
  priority: string;
}

interface ZAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ZAIService {
  private apiKey: string;
  private baseUrl: string;
  private rateLimitUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ZAI_API_KEY;
    this.baseUrl = import.meta.env.VITE_ZAI_API_BASE_URL || 'https://docs.z.ai/guides/llm/glm-4.6';
    this.rateLimitUrl = import.meta.env.VITE_ZAI_RATE_LIMIT_URL || 'https://z.ai/manage-apikey/rate-limits';

    if (!this.apiKey) {
      console.warn('Z.AI API key not found in environment variables');
    }
  }

  /**
   * Generate a legal letter using Z.AI GLM-4.6
   */
  async generateLetter(request: LetterGenerationRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Z.AI API key is required for letter generation');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'glm-4.6',
          messages: [
            {
              role: 'system',
              content: 'You are a professional legal letter writer. Generate formal, professional legal correspondence that is clear, concise, and legally appropriate. Always maintain a professional tone and include proper letter formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Z.AI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: ZAIResponse = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from Z.AI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating letter with Z.AI:', error);
      throw new Error(`Failed to generate letter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for letter generation
   */
  private buildPrompt(request: LetterGenerationRequest): string {
    const priorityText = {
      low: 'standard',
      medium: 'priority',
      high: 'urgent',
      urgent: 'immediate attention required'
    }[request.priority] || 'standard';

    const letterTypeText = {
      demand: 'demand letter',
      notice: 'legal notice',
      formal_request: 'formal request letter',
      complaint: 'complaint letter',
      other: 'formal correspondence'
    }[request.letterType] || 'formal letter';

    return `Generate a professional ${letterTypeText} with the following details:

Title: ${request.title}
From: ${request.senderName}
To: ${request.recipientName}
Subject: ${request.matter}
Desired Resolution: ${request.desiredResolution}
Priority Level: ${priorityText}

Please create a well-structured legal letter that includes:
1. Proper letter formatting with date and addresses
2. Clear subject line
3. Professional introduction
4. Detailed explanation of the matter
5. Specific requests or demands
6. Call to action with reasonable timeline
7. Professional closing

The letter should be formal, legally appropriate, and ready for professional use. Use standard legal letter format and maintain a professional tone throughout.`;
  }

  /**
   * Check API rate limits
   */
  async checkRateLimits(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Z.AI API key is required');
    }

    try {
      const response = await fetch(this.rateLimitUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check rate limits: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking Z.AI rate limits:', error);
      throw new Error(`Failed to check rate limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const testRequest: LetterGenerationRequest = {
        title: 'Test Letter',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        matter: 'Test matter',
        desiredResolution: 'Test resolution',
        letterType: 'demand',
        priority: 'low'
      };

      await this.generateLetter(testRequest);
      return true;
    } catch (error) {
      console.error('Z.AI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const zaiService = new ZAIService();