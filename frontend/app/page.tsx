'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages([
      {
        role: 'system',
        content: 'AI ENGINEER CHALLENGE TERMINAL v1.0.0\n\nWelcome to the retro-future console interface.\nType your message and press ENTER to begin.\n\nAvailable commands:\n- /help - Show available commands\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n\n',
        timestamp: new Date()
      }
    ])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model: model,
          api_key: apiKey
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let assistantMessage = ''
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newAssistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        assistantMessage += chunk
        
        setMessages(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: assistantMessage }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'system',
        content: `ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommand = (command: string) => {
    switch (command.toLowerCase()) {
      case '/help':
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Available commands:\n- /help - Show this help\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n- /status - Show connection status',
          timestamp: new Date()
        }])
        break
      case '/clear':
        setMessages([{
          role: 'system',
          content: 'Terminal cleared.\n',
          timestamp: new Date()
        }])
        break
      case '/settings':
        setShowSettings(!showSettings)
        break
      case '/status':
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Status:\n- API Key: ${apiKey ? '✓ Set' : '✗ Not set'}\n- Model: ${model}\n- Developer Message: ${developerMessage.substring(0, 50)}...`,
          timestamp: new Date()
        }])
        break
      default:
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Unknown command: ${command}. Type /help for available commands.`,
          timestamp: new Date()
        }])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.startsWith('/')) {
        handleCommand(input)
        setInput('')
      } else {
        handleSubmit(e)
      }
    }
  }

  return (
    <div className="min-h-screen bg-terminal-dark text-terminal-green font-mono p-4">
      {/* Header */}
      <div className="border-2 border-terminal-green rounded-lg p-4 mb-4 bg-terminal-gray">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold terminal-text">AI ENGINEER CHALLENGE TERMINAL</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-sm mt-2 opacity-70">
          Connected to AI Engine v1.0.0 | Ready for input...
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-2 border-terminal-green rounded-lg p-4 mb-4 bg-terminal-gray">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">SYSTEM CONFIGURATION</h2>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-red-500 hover:text-yellow-500"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">OpenAI API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-terminal-dark border border-terminal-green p-2 rounded text-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green"
                placeholder="sk-..."
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-terminal-dark border border-terminal-green p-2 rounded text-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green"
              >
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Developer Message:</label>
              <textarea
                value={developerMessage}
                onChange={(e) => setDeveloperMessage(e.target.value)}
                rows={3}
                className="w-full bg-terminal-dark border border-terminal-green p-2 rounded text-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green resize-none"
                placeholder="Enter system prompt..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages Display */}
      <div className="border-2 border-terminal-green rounded-lg p-4 mb-4 bg-terminal-gray h-96 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <div className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">
                  {message.role === 'user' ? 'USER' : message.role === 'assistant' ? 'AI' : 'SYS'}
                </span>
                <span className="text-yellow-400 text-xs">
                  [{message.timestamp.toLocaleTimeString()}]
                </span>
              </div>
              <div className="ml-4 mt-1 whitespace-pre-wrap text-sm">
                {message.content}
                {message.role === 'assistant' && index === messages.length - 1 && isLoading && (
                  <span className="animate-pulse">▋</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-2 border-terminal-green rounded-lg p-4 bg-terminal-gray">
        <div className="flex items-center space-x-2">
          <span className="text-terminal-green font-bold">></span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-terminal-green placeholder-green-500/50"
            placeholder={isLoading ? "Processing..." : "Type your message or command..."}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-terminal-green text-black rounded hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SEND
          </button>
        </div>
        <div className="text-xs mt-2 opacity-70">
          Press ENTER to send, /help for commands
        </div>
      </form>

      {/* Footer */}
      <div className="text-center mt-4 text-xs opacity-50">
        <div className="flex items-center justify-center space-x-4">
          <span>AI ENGINEER CHALLENGE</span>
          <span>⚡</span>
          <span>RETRO TERMINAL v1.0.0</span>
        </div>
      </div>
    </div>
  )
}