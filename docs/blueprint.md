# **App Name**: DevTalk

## Core Features:

- User Authentication & Workspace Management: Enable user registration, login, profile management (avatar, display name), and the creation/joining of collaborative workspaces.
- Channel Management: Allow users to create public and private channels, browse existing channels, and join or leave them.
- Direct Messaging: Facilitate one-on-one private conversations between users within the same workspace.
- Real-time Messaging with Rich Text: Implement real-time sending, display, and rich text formatting for messages (bold, italic, code blocks, links, emojis) within channels and direct messages. This includes saving messages to Firestore.
- Message History & Persistence: Store and retrieve full message history for channels and direct messages using Firestore, maintaining conversational context.
- AI Conversation Summarization Tool: Provide an AI tool to automatically summarize long message threads or daily channel activity, allowing users to quickly catch up on important discussions.
- Search Functionality: Implement basic search capabilities for messages, channels, and users across the workspace.

## Style Guidelines:

- Dark color scheme with a prominent violet-blue primary color (#6B6BFF) for interaction and key elements.
- Background color: A very dark purplish-grey (#1A1A1F), providing a subdued and modern canvas for content.
- Accent color: A soft, light sky blue (#ACE1FF) for highlights, subtle distinctions, and complementary information.
- All text uses 'Inter', a grotesque-style sans-serif font, for a modern, objective, and highly readable appearance across both headlines and body text.
- Use clean, geometric, and minimalist outline icons for navigation and actions, maintaining a sleek and functional aesthetic.
- A classic two-pane layout featuring a fixed left sidebar for navigation (channels, direct messages) and a prominent main content area for real-time messaging, with a persistent header and a message input at the bottom.
- Subtle and smooth transitions for state changes, such as channel switching, hover effects on interactive elements, and new message arrival indicators.