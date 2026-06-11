# Codex Teams

Welcome to Codex Teams! This is a real-time chat application designed to help teams communicate easily. 

---

## 🧑‍💻 User Guide (How to use Codex Teams)

Codex Teams is built to be simple and easy to use. Here is how you can get started:

### 1. Sign In / Sign Up
Create an account or log in securely to access your messages.

### 2. Workspaces & Channels
- **Workspaces:** Think of this as your main office. You can have different workspaces for different teams or projects.
- **Channels:** Inside a workspace, you can create channels for specific topics (like #general, #marketing, or #project-x).
- **Direct Messages (DMs):** You can also send private messages directly to another person.

### 3. Chat in Real-Time
Just type your message and hit send! Everyone in the channel or DM will see it instantly.

### 4. AI Superpowers 🤖
- **Smart Replies:** If you're in a hurry, Codex Teams will suggest quick replies based on the conversation.
- **AI Summaries:** If you missed a lot of messages while you were away, you can use the AI to quickly summarize what you missed!

---

## 🛠️ Developer Guide (How to build and run)

This section is for developers who want to run the project locally, contribute, or modify the code.

### Technologies Used
- **Frontend/Backend:** Next.js (React Framework)
- **Language:** TypeScript
- **AI Integration:** Genkit (@genkit-ai/google-genai)
- **UI Components:** Shadcn/ui & Radix UI
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase & Firebase Data Connect
- **Mobile/Native:** Capacitor (for Android)

### Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd codexproject1
   ```

2. **Install dependencies:**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   You will need to configure your `.env` file with the necessary API keys for Supabase, Firebase, and Genkit/Google GenAI. (Check the existing `.env` file for the required keys).

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002) (or the port specified in your terminal) in your browser.

### Available Scripts
- `npm run dev`: Starts the Next.js development server (using Turbopack on port 9002).
- `npm run genkit:dev`: Starts the Genkit UI for AI development.
- `npm run build`: Builds the Next.js app for production.
- `npm run build:android`: Builds the app and syncs it with Capacitor for Android.
- `npm run test`: Runs Jest tests.
- `npm run typecheck`: Runs TypeScript type checking.
