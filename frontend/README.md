# AI Engineer Challenge - Retro Terminal Frontend

A retro-future style console terminal interface for the AI Engineer Challenge, built with Next.js and featuring a cyberpunk aesthetic.

## Features

- 🎮 Retro-future terminal interface with glowing green text
- ⚡ Real-time streaming chat with AI models
- 🔧 Configurable settings panel for API keys and model selection
- 📝 Built-in terminal commands (`/help`, `/clear`, `/settings`, `/status`)
- 🎨 CRT scan line effects and animations
- 🔒 Secure password input for API keys

## Prerequisites

- Node.js 18+ 
- npm or yarn
- The backend API running on `http://localhost:8000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Configuration

1. Open the application in your browser
2. Type `/settings` in the terminal to open the configuration panel
3. Enter your OpenAI API key (required for chat functionality)
4. Select your preferred AI model
5. Customize the developer message/system prompt
6. Close the settings panel and start chatting!

## Available Commands

- `/help` - Show available commands
- `/clear` - Clear the terminal
- `/settings` - Toggle settings panel
- `/status` - Show connection and configuration status

## API Integration

The frontend connects to the FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before using the chat functionality.

## Deployment

This frontend is optimized for deployment on Vercel. The `next.config.js` includes API route rewrites to proxy requests to the backend.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom retro-future theme
- **Icons**: Lucide React
- **Language**: TypeScript
- **Animations**: CSS animations and Tailwind utilities

## Troubleshooting

- **API Connection Issues**: Ensure the backend is running on port 8000
- **Styling Issues**: Make sure all dependencies are installed correctly
- **TypeScript Errors**: Run `npm install` to ensure all type definitions are available