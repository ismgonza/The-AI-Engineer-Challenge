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
        content: 'SUPER MARIO WORLD TERMINAL v1.0.0\n\nWelcome to the Mushroom Kingdom console!\nType your message and press ENTER to begin your adventure!\n\nAvailable commands:\n- /help - Show available commands\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n- /status - Show connection status\n\nLet\'s-a go! 🍄\n',
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
                 content: '🎯 Available commands:\n- /help - Show this help\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n- /status - Show connection status\n- /powerup - Get a power-up! 🍄',
                 timestamp: new Date()
               }])
               break
             case '/clear':
               setMessages([{
                 role: 'system',
                 content: '🧹 Terminal cleared! Ready for new adventures! 🎮\n',
                 timestamp: new Date()
               }])
               break
             case '/settings':
               setShowSettings(!showSettings)
               break
             case '/status':
               setMessages(prev => [...prev, {
                 role: 'system',
                 content: `📊 Status:\n- API Key: ${apiKey ? '✅ Set' : '❌ Not set'}\n- Model: ${model}\n- Developer Message: ${developerMessage.substring(0, 50)}...\n- Power Level: ${apiKey ? '🔥 Super!' : '🍄 Normal'}`,
                 timestamp: new Date()
               }])
               break
             case '/powerup':
               setMessages(prev => [...prev, {
                 role: 'system',
                 content: '🍄 Power-up activated! You\'re now Super Mario! 💪\n⭐ Extra strength and wisdom unlocked! ⭐',
                 timestamp: new Date()
               }])
               break
             default:
               setMessages(prev => [...prev, {
                 role: 'system',
                 content: `❓ Unknown command: ${command}. Type /help for available commands. 🎮`,
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
           <div className="min-h-screen mario-bg text-mario-dark font-mario-text p-4">
             {/* Header */}
             <div className="mario-border p-4 mb-4">
               <div className="mario-header p-4 rounded-t-lg">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <span className="mario-star text-mario-gold text-2xl">⭐</span>
                     <h1 className="text-xl font-bold mario-text text-white">SUPER MARIO WORLD TERMINAL</h1>
                     <span className="mario-coin text-mario-gold text-2xl">🪙</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="w-4 h-4 bg-mario-red rounded-full animate-bounce-mario"></div>
                     <div className="w-4 h-4 bg-mario-yellow rounded-full animate-bounce-mario" style={{animationDelay: '0.1s'}}></div>
                     <div className="w-4 h-4 bg-mario-green rounded-full animate-bounce-mario" style={{animationDelay: '0.2s'}}></div>
                   </div>
                 </div>
                 <div className="text-sm mt-2 text-white mario-text-small">
                   🎮 Connected to Mushroom Kingdom AI v1.0.0 | Ready for adventure! 🍄
                 </div>
               </div>
             </div>

                   {/* Settings Panel */}
             {showSettings && (
               <div className="mario-border p-4 mb-4">
                 <div className="mario-header p-4 rounded-t-lg mb-4">
                   <div className="flex items-center justify-between">
                     <h2 className="text-lg font-bold mario-text text-white">🍄 POWER-UP CONFIGURATION 🍄</h2>
                     <button
                       onClick={() => setShowSettings(false)}
                       className="text-white hover:text-mario-yellow text-xl"
                     >
                       ❌
                     </button>
                   </div>
                 </div>

                 <div className="space-y-4 p-4">
                   <div>
                     <label className="block text-sm mb-2 mario-text-small font-bold">🔑 OpenAI API Key:</label>
                     <input
                       type="password"
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       className="w-full mario-input p-3 text-mario-dark focus:outline-none"
                       placeholder="sk-..."
                     />
                   </div>

                   <div>
                     <label className="block text-sm mb-2 mario-text-small font-bold">🤖 AI Model:</label>
                     <select
                       value={model}
                       onChange={(e) => setModel(e.target.value)}
                       className="w-full mario-input p-3 text-mario-dark focus:outline-none"
                     >
                       <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                       <option value="gpt-4">GPT-4</option>
                       <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm mb-2 mario-text-small font-bold">💬 Developer Message:</label>
                     <textarea
                       value={developerMessage}
                       onChange={(e) => setDeveloperMessage(e.target.value)}
                       rows={3}
                       className="w-full mario-input p-3 text-mario-dark focus:outline-none resize-none"
                       placeholder="Enter system prompt..."
                     />
                   </div>
                 </div>
               </div>
             )}

                   {/* Messages Display */}
             <div className="mario-border p-4 mb-4 h-96 overflow-y-auto">
               <div className="space-y-3">
                 {messages.map((message, index) => (
                   <div key={index} className="mario-message p-3">
                     <div className="flex items-start space-x-2 mb-2">
                       <span className="text-mario-red font-bold mario-text-small">
                         {message.role === 'user' ? '🎮 MARIO' : message.role === 'assistant' ? '🤖 LUIGI' : '🍄 SYSTEM'}
                       </span>
                       <span className="text-mario-brown text-xs mario-text-small">
                         [{message.timestamp.toLocaleTimeString()}]
                       </span>
                     </div>
                     <div className="ml-4 whitespace-pre-wrap text-sm mario-text-small">
                       {message.content}
                       {message.role === 'assistant' && index === messages.length - 1 && isLoading && (
                         <span className="animate-pulse text-mario-red">▋</span>
                       )}
                     </div>
                   </div>
                 ))}
                 <div ref={messagesEndRef} />
               </div>
             </div>

                   {/* Input Area */}
             <form onSubmit={handleSubmit} className="mario-border p-4">
               <div className="flex items-center space-x-3">
                 <span className="text-mario-red font-bold mario-text text-2xl">{'>'}</span>
                 <input
                   type="text"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={handleKeyPress}
                   disabled={isLoading}
                   className="flex-1 mario-input p-3 text-mario-dark placeholder-mario-brown/50"
                   placeholder={isLoading ? "🔄 Processing..." : "💬 Type your message or command..."}
                 />
                 <button
                   type="submit"
                   disabled={isLoading || !input.trim()}
                   className="mario-button p-3 text-white font-bold mario-text-small disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   🚀 SEND
                 </button>
               </div>
               <div className="text-xs mt-2 text-mario-brown mario-text-small">
                 Press ENTER to send, /help for commands
               </div>
             </form>

                   {/* Footer */}
             <div className="text-center mt-4 text-xs text-mario-brown mario-text-small">
               <div className="flex items-center justify-center space-x-4">
                 <span>🍄 AI ENGINEER CHALLENGE</span>
                 <span className="mario-star">⭐</span>
                 <span>SUPER MARIO WORLD v1.0.0</span>
                 <span className="mario-coin">🪙</span>
               </div>
             </div>
    </div>
  )
}