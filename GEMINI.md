# Gemini Collaboration Guide

This document outlines the conventions and guidelines for collaborating with Gemini on this project.

## Project Overview

This project is an AI-powered language learning assistant designed to provide a comprehensive and effective learning experience. The goal is to create a real-world product that helps users learn new languages in a practical and engaging way.

## Developer Profile

The developer is a product-oriented engineer who focuses on creating high-quality, feature-rich applications with a strong emphasis on user experience. Key characteristics of the developer's approach include:

*   **Meticulous and Thorough:** Considers all possible features and UI/UX implications.
*   **Product-Focused:** Aims to build real-world products, not just code.
*   **User-Centric:** Prioritizes a smooth and intuitive user journey.
*   **Pragmatic:** Leverages existing tools and services to build powerful features efficiently.

## Technical Conventions

*   **Framework:** Next.js with TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Radix UI and custom components
*   **State Management:** React hooks
*   **API:** Next.js API routes
*   **Database:** MongoDB
*   **AI Services:**
    *   **LLM:** Groq
    *   **Text-to-Speech:** ElevenLabs
    *   **Structured Data Extraction:** Instructor

## Coding Style

*   **Component-Based:** Structure the UI into small, reusable components.
*   **Functional Components:** Use functional components with hooks.
*   **TypeScript:** Use TypeScript for static typing.
*   **Clear Naming:** Use descriptive names for variables, functions, and components.
*   **Comments:** Add comments to explain complex logic or non-obvious code.

## Existing Features

### Onboarding and User Profiles

*   **Onboarding:** The application features a comprehensive onboarding process that collects user information, including their name, email, language learning goals, and preferences.
*   **User Profiles:** User data is stored in a MongoDB database, with the email serving as the unique identifier. The application can create new user profiles and update existing ones.

### Core Learning Features

*   **Sentence Generation:** Users can generate sentences based on a topic or phrase.
*   **Interactive Sentence Learning:** The application provides an interactive interface for learning sentences, which includes:
    *   **Text-to-Speech:** Users can listen to the pronunciation of sentences and individual words.
    *   **Translation:** Users can translate sentences into different languages.
    *   **Phonetic Pronunciation:** Users can view the phonetic spelling of sentences.
    *   **Speech Validation:** Users can record themselves speaking a sentence and receive feedback on their pronunciation.

### Authentication

*   **No Formal Authentication:** The application does not currently have a formal authentication system. There is no login/logout functionality, and all pages are publicly accessible.
*   **User Identification:** Users are identified by their email address, which is collected during the onboarding process.

## Database Services

The application uses MongoDB as its database, and the interaction is managed through a set of services in the `lib/services` directory. These services provide a clear and organized way to interact with the database, and they are responsible for all CRUD (Create, Read, Update, Delete) operations.

The main database services are:

*   **`ScenarioService`:** Manages the creation, retrieval, and modification of learning scenarios.
*   **`UserScenarioService`:** Handles the relationship between users and scenarios, including tracking user progress.
*   **`LessonService`:** Manages the lessons within each scenario, including their content and structure.
*   **`DatabaseUtils`:** Provides utility functions for managing the database, such as creating indexes and cleaning up data.

The application connects to the database using the `connectToDatabase` function in `lib/mongodb.ts`, which uses the `mongodb` driver to establish a connection to the MongoDB server.

## Implemented Features

### AI Conversation Partner (The "Duet" Feature)

*   **Concept:** A dynamic, AI-powered conversation partner that allows users to practice real-time conversations in various scenarios.
*   **Current State:** This feature is fully implemented and includes:
    *   **Scenario Selection:** Users can choose from predefined conversation scenarios.
    *   **Dynamic AI Responses:** The AI generates responses using Groq's `llama-3-70b-8192` model.
    *   **Rolling Conversation Summary:** The AI maintains context over long conversations by generating and incorporating a rolling summary of the conversation history into its prompts.
    *   **ElevenLabs TTS Integration:** AI responses are converted to speech using ElevenLabs, providing an immersive audio experience.
    *   **User Speech-to-Text:** Users can record their responses, which are transcribed using Whisper (via Groq) with accurate language detection.
    *   **Phonetics Display:** Users can view the phonetic transcription of AI messages to aid pronunciation.
    *   **Structured Learning Takeaways:** At the end of a conversation, the system generates personalized feedback, corrections, new vocabulary, and grammar tips using Groq and Instructor.
*   **Implementation Steps Completed:**
    1.  **Create Scenario API (`/api/scenarios`):** API route created to return conversation scenarios.
    2.  **Create Conversation UI (`ConversationBox.tsx`):** Frontend component created to display scenarios and initiate conversations.
    3.  **Create Conversation Engine API (`/api/conversation`):** API route created to manage conversation flow and generate AI responses.
    4.  **Integrate ElevenLabs TTS:** AI responses are now spoken using ElevenLabs.
    5.  **Enhance Transcription API (`/api/validateSpeech`):** The API now correctly handles language parameters for accurate transcription.
    6.  **Implement User Recording:** Users can record their speech, which is transcribed and used as their input.
    7.  **Dynamic Conversations with Rolling Summary:** The conversation API now uses Groq's `llama-3-70b-8192` and implements a rolling summary for context management.
    8.  **Create Takeaways API (`/api/conversation/takeaways`):** API created to generate structured learning takeaways using Groq and Instructor.
    9.  **Build Takeaways UI:** The frontend now displays the structured learning takeaways in a user-friendly dialog.

## Future Features

### 1. AI Conversation Partner (The "Duet" Feature)

*   **Concept:** A dynamic, AI-powered conversation partner that allows users to practice real-time conversations in various scenarios.
*   **User Experience:**
    1.  The user selects a scenario (e.g., "Ordering a coffee," "Asking for directions").
    2.  The AI starts the conversation with a spoken line.
    3.  The user responds by speaking.
    4.  The AI validates the user's response and continues the conversation with a relevant reply.
*   **Implementation Plan:**
    1.  **Scenario Generation:** Create a new API endpoint (`/api/scenarios`) that uses Groq to generate a list of conversation scenarios based on the user's profile.
    2.  **Conversation State Management:** In the frontend, manage the conversation state, including the current turn, the conversation history, and the user's responses.
    3.  **AI Conversation Engine:** Create a new API endpoint (`/api/conversation`) that takes the user's response and the conversation history as input, and returns the AI's next line.
    4.  **UI/UX:** Design a new UI for the conversation feature, including a chat-like interface to display the conversation history.

### 2. "Real-World Reels" - Learn from Authentic Content

*   **Concept:** An interactive learning experience based on short, engaging video clips.
*   **User Experience:**
    1.  The user selects a video clip from a curated library.
    2.  The user watches the clip with subtitles.
    3.  The application extracts key vocabulary and grammar concepts from the clip.
    4.  The user practices the lines from the clip using the existing `SentenceBox` and speech validation features.
*   **Implementation Plan:**
    1.  **Content Sourcing (Legal & Ethical):**
        *   **Phase 1 (MVP):** Build a library of content using royalty-free stock videos (e.g., from Pexels, Pixabay) or videos with Creative Commons licenses. This is legally sound and allows for rapid prototyping.
        *   **Phase 2 (Growth):** Partner with language-learning content creators on platforms like TikTok and YouTube. License their content to provide exclusive and authentic material for the app.
        *   **Phase 3 (Scale):** Produce original content by hiring freelance actors or voice artists to create custom scenarios.
    2.  **Content Management:** Create a system for storing and managing the video content and its metadata (transcripts, licenses, etc.). This could start as a JSON file and evolve into a more robust database solution.
    3.  **AI Analysis:** Create a new API endpoint (`/api/analyzeVideo`) that takes a video transcript as input and uses Groq/Instructor to extract key learning points.
    4.  **Interactive Player:** Develop a new UI component that combines a video player with interactive learning elements.

## Collaboration Guidelines

*   **Proactive:** When asked to add a new feature, consider the entire user flow and suggest improvements or related features.
*   **Thorough:** When implementing a feature, consider all edge cases and provide a complete solution.
*   **UX-Focused:** Pay attention to the user experience and suggest ways to improve it.
*   **Respect Conventions:** Adhere to the existing coding style and conventions.