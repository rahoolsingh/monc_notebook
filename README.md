# Monc Notebook

This full-stack app lets anyone upload a PDF, CSV, or paste a web link and instantly chat with an AI that understands that content. Each user gets a private session with isolated file storage and persisted chat history, so conversations stay organized, searchable, and secure. It’s your personal research assistant for reports, spreadsheets, and webpages—ask questions, extract insights, summarize sections, and cite sources, all in one place.


# LIVE DEMO [notebook.monc.space](https://notebook.monc.space/)
https://notebook.monc.space

## Features

-   **User Session Management**: Each user gets a unique UUID stored in localStorage
-   **Multi-Format Support**: Upload PDF, CSV files with real-time progress tracking
-   **Web Page Analysis**: Process and analyze content from web pages with smart content extraction
-   **AI Chat**: Chat with GPT about your uploaded documents with context awareness
-   **Chat History**: Conversation history is maintained per user session
-   **Session Management**: Create new sessions, clear chat, delete sessions
-   **Isolated Sessions**: Different users have completely separate file and chat contexts

## Setup Instructions

### Prerequisites

-   Node.js (v18+)
-   MongoDB running on localhost:27017
-   Qdrant vector database running on localhost:6333
-   OpenAI API key
-   Playwright browsers (automatically installed)

### Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Create a `.env` file with your configuration:

    ```
    OPENAI_API_KEY=your_openai_api_key_here
    MONGODB_URI=mongodb://localhost:27017/document-chat
    PORT=3000
    ```

4. Install Playwright browsers:

    ```bash
    npx playwright install chromium
    ```

5. Start the development server:
    ```bash
    pnpm run dev
    ```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

The frontend will run on `http://localhost:5173`

### Database Setup

#### MongoDB Setup

Make sure MongoDB is running on `localhost:27017`. You can use Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Or install MongoDB locally following the [official installation guide](https://docs.mongodb.com/manual/installation/).

#### Qdrant Setup

Make sure Qdrant is running on `localhost:6333`. You can use Docker:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

## Usage

1. **Access the Application**: Open `http://localhost:5173` in your browser
2. **Automatic Session**: A unique UUID is automatically generated and stored
3. **Upload Content**:
    - Upload files: PDF, CSV, TXT documents
    - Add URLs: YouTube videos or web pages
4. **Start Chatting**: Ask questions about your uploaded content
5. **Session Management**: Create new sessions, clear chat, or delete sessions
6. **Session Persistence**: Your files and chat history are maintained across browser sessions

## API Endpoints

-   `POST /api/upload` - Upload a file (PDF, CSV, TXT) for processing
-   `POST /api/upload-url` - Process YouTube video or web page URL
-   `POST /api/chat` - Send a chat message and get AI response
-   `GET /api/session/:userId` - Get user session data (files and chat history)
-   `DELETE /api/session/:userId/chat` - Clear user's chat history
-   `DELETE /api/session/:userId` - Delete entire user session
-   `GET /api/users` - Get all users (admin endpoint)

## Session Management

-   Each user gets a unique UUID on first visit
-   Files are stored in user-specific directories: `uploads/{userId}/`
-   Vector embeddings use user-specific collections: `user-{userId}-collection`
-   Chat history is maintained both in localStorage and MongoDB
-   User sessions are persisted in MongoDB with automatic timestamps
-   Sessions are isolated - users cannot access each other's files or conversations
-   Automatic cleanup and session management through MongoDB

## Technologies Used

### Backend

-   Express.js - Web framework
-   MongoDB + Mongoose - User session and data persistence
-   Multer - File upload handling
-   LangChain - Document processing and AI integration
-   Qdrant - Vector database for embeddings
-   OpenAI - GPT models for chat responses

### Frontend

-   React 18 - UI framework
-   TypeScript - Type safety
-   Vite - Build tool and dev server
-   Tailwind CSS - Styling
-   Lucide React - Icons
-   React Markdown - Markdown rendering with syntax highlighting

## File Structure

```
├── backend/
│   ├── src/
│   │   ├── controller.js    # API controllers
│   │   ├── routes.js        # Route definitions
│   │   └── utils.js         # Utility functions
│   ├── uploads/             # User file storage
│   └── server.js            # Express server setup
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   └── types/           # TypeScript type definitions
│   └── ...
└── README.md
```

## Development Notes

-   User sessions are now persisted in MongoDB for production-ready storage
-   File uploads support PDF, CSV, TXT formats with 10MB size limit
-   YouTube integration uses youtubei.js for transcript extraction
-   Web scraping uses Playwright for dynamic content loading
-   Large files are processed in batches to handle memory efficiently
-   Vector embeddings use OpenAI's text-embedding-3-large model
-   Chat responses use GPT-4o-mini model for cost efficiency
-   CORS is configured for development (localhost:5173)
-   MongoDB automatically handles user session creation and management
-   Chat history is synchronized between localStorage and MongoDB
-   Real-time upload progress tracking using XMLHttpRequest
-   Fixed-height UI containers prevent layout issues with large file lists
-   Comprehensive error handling for all content types and processing
-   AI responses formatted with Markdown for better readability and structure
-   Syntax highlighting for code blocks in AI responses
