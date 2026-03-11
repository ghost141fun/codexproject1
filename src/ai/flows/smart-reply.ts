'use server';
/**
 * @fileOverview A Genkit flow for generating AI-powered smart reply suggestions based on conversation context.
 *
 * - smartReply - A function that generates reply suggestions.
 * - SmartReplyInput - The input type for the smartReply function.
 * - SmartReplyOutput - The return type for the smartReply function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartReplyInputSchema = z.object({
  conversationHistory: z.array(
    z.object({
      sender: z.string().describe('The name or ID of the message sender.'),
      content: z.string().describe('The content of the message.'),
    })
  ).describe('A list of recent messages in the conversation.'),
  currentUserInput: z.string().describe('The current partial message being typed by the user.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of AI-generated reply suggestions.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function smartReply(input: SmartReplyInput): Promise<SmartReplyOutput> {
  return smartReplyFlow(input);
}

const smartReplyPrompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: { schema: SmartReplyInputSchema },
  output: { schema: SmartReplyOutputSchema },
  prompt: `You are an AI assistant that provides quick and relevant reply suggestions for a chat conversation.
Generate three short, distinct, and natural-sounding reply suggestions based on the provided conversation history and the user's current partial input.

Conversation History:
{{#each conversationHistory}}
{{sender}}: {{{content}}}
{{/each}}

User is currently typing: "{{{currentUserInput}}}"

Generate three brief reply suggestions that continue the conversation naturally.
Do not include any conversational filler like "Here are some suggestions". Just provide the JSON array of suggestions.`,
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async (input) => {
    const { output } = await smartReplyPrompt(input);
    return output!;
  }
);
