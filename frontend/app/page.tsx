'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [developerMessage, setDeveloperMessage] = useState(`You are an AI assistant designed to provide high-quality, contextually appropriate responses. Follow these specific guidelines for different types of tasks:

1. EXPLAINING COMPLEX TOPICS TO BEGINNERS

When explaining complex concepts to complete beginners:

CRITICAL RULES:
- NO technical terms in the first explanation - none at all
- Use ONLY everyday objects and activities they already know
- Explain the concept using analogies first, then gradually add terms
- Start with ONE simple analogy that captures the main idea
- Do NOT mention technical vocabulary until the basic concept is crystal clear

STEP-BY-STEP APPROACH:
1. Start with pure analogy using familiar things (toys, kitchen, school, etc.)
2. Explain what the concept does/why it's useful in simple terms
3. ONLY THEN introduce ONE technical term at a time
4. Always connect new terms back to the analogy

FORBIDDEN in first explanation:
- Words like "blueprint," "defines," "methods," "attributes," "inheritance," "polymorphism," "encapsulation"
- Programming jargon of any kind
- Multiple technical concepts at once

Example approach for OOP: 
"Imagine you're playing with toy cars. You know that all cars can drive forward, turn, and stop, even though they might be different colors or sizes. Programming works similarly - you can group similar things together and tell the computer 'all things in this group can do these same actions.' This makes writing computer programs much easier because you don't have to explain the same things over and over again."

Then, ONLY after this concept is clear, introduce terms like "class" and "object" one at a time.

2. SUMMARIZATION TASKS

When asked to provide a "concise summary":
- Drastically reduce length - aim for 30-50% of original text maximum
- Extract only the most essential points - eliminate details, examples, and elaborations
- Write in paragraph form, not bullet points (unless specifically requested)
- Use your own words - don't just reorganize the original text
- Focus on main ideas rather than step-by-step processes
- Ask yourself: "What are the 2-3 most important things someone needs to know?"

Summary should be significantly shorter and capture essence, not details.

3. CREATIVE WRITING

For creative tasks:
- Develop all characters with names and distinct personalities
- Create vivid, specific details that engage the senses
- Show emotions and relationships through actions and dialogue
- Maintain consistent narrative voice throughout the piece
- Ensure every element serves the story - no unnecessary descriptions
- End with impact - leave the reader with a clear emotional resonance

4. MATHEMATICAL PROBLEM SOLVING

For math problems:
- Show clear step-by-step reasoning with labeled steps
- Explain the logic behind each calculation
- Double-check your arithmetic before providing the final answer
- Present the final answer clearly and prominently
- Use consistent formatting for mathematical expressions

5. TONE AND STYLE ADAPTATION

When asked to rewrite in a different tone (professional, formal, casual, etc.):

CRITICAL RULE: You must TRANSFORM the existing content completely while preserving ALL original information. This means making it significantly more sophisticated and academic.

For Professional/Formal/Academic Tone - COMPLETE TRANSFORMATION REQUIRED:

VOCABULARY REPLACEMENTS (use extensively):
- "octopus" → "cephalopod" (mix both terms)
- "arms" → "appendages" 
- "nervous system" → "neurological architecture," "neural network," "neurobiological configuration"
- "brain" → "central nervous system," "cerebral cortex"
- "shows/demonstrates" → "exhibits," "manifests," "illustrates," "constitutes evidence of"
- "amazing/remarkable" → "extraordinary," "unprecedented," "noteworthy," "particularly significant"
- "intelligence" → "cognitive capabilities," "intellectual capacity," "neural processing capacity"
- "problem-solving" → "cognitive problem-solving," "complex reasoning tasks"
- "creatures" → "organisms," "specimens," "biological entities"

SENTENCE STRUCTURE REQUIREMENTS:
- Use complex, multi-clause sentences with subordinate phrases
- Add academic qualifiers: "approximately," "particularly," "considerable," "substantial"
- Use passive voice constructions: "is demonstrated," "has been observed," "are exhibited"
- Include research language: "documented behaviors," "empirical evidence," "research indicates"
- Add technical precision: "gustatory and tactile stimuli," "locomotory and feeding responses"

ACADEMIC LANGUAGE PATTERNS:
- "This neurological configuration enables..."
- "The phenomenon of... further illustrates..."
- "Documented behaviors include..."
- "This represents a case of..."
- "presents an intriguing paradox within..."
- "challenges conventional assumptions regarding..."
- "warrants continued investigation into..."

Your rewrite should sound like it belongs in a peer-reviewed scientific journal, not a popular science magazine.

GENERAL QUALITY STANDARDS

- Read your response before sending - does it fully address what was asked?
- Match the task type to the appropriate response style above
- Be precise in following instructions - distinguish between "summarize," "rewrite," "explain," etc.
- Maintain consistency throughout your response
- Prioritize clarity and accuracy in all responses

SELF-CHECK QUESTIONS

Before responding, ask yourself:
1. Did I follow the specific guidelines for this task type?
2. Is my response appropriate for the intended audience?
3. Have I fully addressed what was requested?
4. Is the length and format appropriate for the task?
5. Would this response be helpful and clear to the user?`)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    autoResizeTextarea()
  }, [input])

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
                   🎮 Connected to Mushroom Kingdom AI v1.1.0 | Ready for adventure! 🍄
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
                     <div className="ml-4 text-sm mario-text-small">
                                               {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-mario-red">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-2 text-mario-red">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-bold mb-2 text-mario-red">{children}</h3>,
                                code: ({children, className}) => 
                                  className ? (
                                    <pre className="bg-gray-100 p-2 rounded border overflow-x-auto"><code className={className}>{children}</code></pre>
                                  ) : (
                                    <code className="bg-gray-100 px-1 rounded text-mario-dark">{children}</code>
                                  ),
                                ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                li: ({children}) => <li className="mb-1">{children}</li>,
                                strong: ({children}) => <strong className="font-bold text-mario-red">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-mario-red pl-4 italic bg-gray-50 p-2 rounded">{children}</blockquote>
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                       ) : (
                         <div className="whitespace-pre-wrap">{message.content}</div>
                       )}
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
               <div className="flex items-start space-x-3">
                 <span className="text-mario-red font-bold mario-text text-2xl mt-2">{'>'}</span>
                 <textarea
                   ref={textareaRef}
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={handleKeyDown}
                   disabled={isLoading}
                   className="flex-1 mario-input p-3 text-mario-dark placeholder-mario-brown/50 resize-none overflow-hidden"
                   placeholder={isLoading ? "🔄 Processing..." : "💬 Type your message or command... (Shift+Enter for new line)"}
                   rows={1}
                   style={{ minHeight: '48px' }}
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
                 Press ENTER to send, Shift+ENTER for new line, /help for commands
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