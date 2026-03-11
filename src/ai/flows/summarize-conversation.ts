'use server';
/**
 * @fileOverview A Genkit flow for summarizing message threads or daily channel activity.
 *
 * - summarizeConversation - A function that handles the conversation summarization process.
 * - SummarizeConversationInput - The input type for the summarizeConversation function.
 * - SummarizeConversationOutput - The return type for the summarizeConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  author: z.string().describe('The author of the message.'),
  content: z.string().describe('The content of the message.'),
  timestamp: z.string().optional().describe('The timestamp of the message (e.g., ISO 8601 string).'),
});

const SummarizeConversationInputSchema = z.object({
  messages: z.array(MessageSchema).describe('An array of messages to be summarized.'),
});
export type SummarizeConversationInput = z.infer<typeof SummarizeConversationInputSchema>;

const SummarizeConversationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation.'),
});
export type SummarizeConversationOutput = z.infer<typeof SummarizeConversationOutputSchema>;

export async function summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {schema: SummarizeConversationInputSchema},
  output: {schema: SummarizeConversationOutputSchema},
  prompt: `You are an AI assistant that summarizes conversations.

Summarize the following conversation into a concise and informative overview, highlighting the main topics, key decisions, and any action items. Present the summary in paragraph format.

Conversation:
{{#each messages}}
{{this.author}}{{#if this.timestamp}} ({{this.timestamp}}){{/if}}: {{this.content}}
{{/each}}`,
});

const summarizeConversationFlow = ai.defineFlow(
  {
    name: 'summarizeConversationFlow',
    inputSchema: SummarizeConversationInputSchema,
    outputSchema: SummarizeConversationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
