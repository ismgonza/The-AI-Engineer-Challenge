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

  // New state for PDF RAG functionality
  const [useRAG, setUseRAG] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        content: 'SUPER MARIO WORLD RAG TERMINAL v2.0.0\n\n🍄 Welcome to the enhanced Mushroom Kingdom console!\n\n✨ NEW FEATURES:\n🎯 Upload PDFs and chat with your documents using RAG!\n🔍 Smart document search with vector embeddings\n📚 Ask questions about your uploaded content\n\nAvailable commands:\n- /help - Show available commands\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n- /status - Show connection status\n- /rag - Toggle RAG mode\n- /files - Show uploaded files\n\nLet\'s-a go! 🍄⭐\n',
        timestamp: new Date()
      }
    ])
  }, [])

  // Load uploaded files when API key changes
  useEffect(() => {
    if (apiKey) {
      fetchUploadedFiles()
    }
  }, [apiKey])

  const fetchUploadedFiles = async () => {
    if (!apiKey) return
    
    try {
      const response = await fetch(`/api/files?api_key=${encodeURIComponent(apiKey)}`)
      if (response.ok) {
        const data = await response.json()
        setUploadedFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!apiKey) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '🔑 Please set your OpenAI API key in settings first!',
        timestamp: new Date()
      }])
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    
    // Add all PDF files to formData
    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        formData.append('files', file)
      }
    })
    
    formData.append('api_key', apiKey)

    try {
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🎉 ${result.message}\n📁 Processed: ${result.processed_files.join(', ')}\n📊 Total files: ${result.total_files}\n\n🔍 You can now use RAG mode to chat with your PDFs!`,
        timestamp: new Date()
      }])

      // Refresh uploaded files list
      await fetchUploadedFiles()
      
    } catch (error) {
      console.error('Error uploading files:', error)
      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }])
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const clearFiles = async () => {
    if (!apiKey) return

    try {
      const formData = new FormData()
      formData.append('api_key', apiKey)
      
      const response = await fetch('/api/files', {
        method: 'DELETE',
        body: formData,
      })

      if (response.ok) {
        setUploadedFiles([])
        setUseRAG(false)
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🧹 All files cleared! RAG mode disabled. Ready for new documents! 📁',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Error clearing files:', error)
    }
  }

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
      // Choose endpoint based on RAG mode
      const endpoint = useRAG ? '/api/rag-chat' : '/api/chat'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model: model,
          api_key: apiKey,
          use_rag: useRAG
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
                content: '🎯 Available commands:\n- /help - Show this help\n- /clear - Clear terminal\n- /settings - Toggle settings panel\n- /status - Show connection status\n- /rag - Toggle RAG mode\n- /files - Show uploaded files\n- /powerup - Get a power-up! 🍄\n\n📚 RAG Features:\n- Upload PDFs to chat with documents\n- RAG mode searches your uploaded content\n- Regular mode uses standard AI chat',
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
            case '/rag':
              if (uploadedFiles.length === 0) {
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: '📁 No PDFs uploaded! Upload PDFs first to use RAG mode. 🔍',
                  timestamp: new Date()
                }])
              } else {
                setUseRAG(!useRAG)
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: `🔍 RAG mode ${!useRAG ? 'ACTIVATED' : 'DEACTIVATED'}! ${!useRAG ? 'Now chatting with your PDFs 📚' : 'Now using regular chat 💬'}`,
                  timestamp: new Date()
                }])
              }
              break
            case '/files':
              if (uploadedFiles.length === 0) {
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: '📁 No files uploaded yet. Upload some PDFs to get started! 🚀',
                  timestamp: new Date()
                }])
              } else {
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: `📚 Uploaded files (${uploadedFiles.length}):\n${uploadedFiles.map(file => `📄 ${file}`).join('\n')}\n\n🔍 RAG mode: ${useRAG ? '✅ Active' : '❌ Inactive'}`,
                  timestamp: new Date()
                }])
              }
              break
            case '/status':
              setMessages(prev => [...prev, {
                role: 'system',
                content: `📊 Status:\n- API Key: ${apiKey ? '✅ Set' : '❌ Not set'}\n- Model: ${model}\n- RAG Mode: ${useRAG ? '🔍 Active' : '💬 Inactive'}\n- Uploaded Files: ${uploadedFiles.length}\n- Developer Message: ${developerMessage.substring(0, 50)}...\n- Power Level: ${apiKey ? '🔥 Super!' : '🍄 Normal'}`,
                timestamp: new Date()
              }])
              break
            case '/powerup':
              setMessages(prev => [...prev, {
                role: 'system',
                content: '🍄 Power-up activated! You\'re now Super Mario! 💪\n⭐ Extra strength and wisdom unlocked! ⭐\n🔍 RAG powers enhanced for document understanding! 📚',
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
                    <h1 className="text-xl font-bold mario-text text-white">SUPER MARIO WORLD RAG TERMINAL</h1>
                    <span className="mario-coin text-mario-gold text-2xl">🪙</span>
                    {useRAG && (
                      <span className="text-mario-yellow text-lg animate-pulse">🔍</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-mario-red rounded-full animate-bounce-mario"></div>
                    <div className="w-4 h-4 bg-mario-yellow rounded-full animate-bounce-mario" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-4 h-4 bg-mario-green rounded-full animate-bounce-mario" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                <div className="text-sm mt-2 text-white mario-text-small">
                  🎮 Connected to Mushroom Kingdom RAG AI v2.0.0 | 
                  {useRAG ? ' 🔍 RAG Mode Active' : ' 💬 Chat Mode Active'} | 
                  📁 {uploadedFiles.length} files loaded
                </div>
              </div>
            </div>

            {/* PDF Upload Section */}
            <div className="mario-border p-4 mb-4">
              <div className="mario-header p-4 rounded-t-lg mb-4">
                <h2 className="text-lg font-bold mario-text text-white">📚 PDF DOCUMENT MANAGER 📚</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive 
                      ? 'border-mario-yellow bg-mario-yellow/20' 
                      : 'border-mario-brown hover:border-mario-red'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="space-y-2">
                    <div className="text-4xl">📄</div>
                    <div className="mario-text-small font-bold">
                      {isUploading ? (
                        <div className="text-mario-red">🔄 Processing PDFs...</div>
                      ) : (
                        <>
                          <div>Drag & drop PDF files here</div>
                          <div className="text-sm text-mario-brown">or click to browse</div>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="mario-button p-2 text-white font-bold mario-text-small disabled:opacity-50"
                    >
                      📁 BROWSE FILES
                    </button>
                  </div>
                </div>

                {/* File Management */}
                <div className="flex items-center justify-between">
                  <div className="mario-text-small">
                    📁 <strong>{uploadedFiles.length}</strong> files uploaded
                  </div>
                  
                  <div className="flex space-x-2">
                    {uploadedFiles.length > 0 && (
                      <>
                        <button
                          onClick={() => setUseRAG(!useRAG)}
                          className={`mario-button p-2 text-white font-bold mario-text-small ${
                            useRAG ? 'bg-mario-green' : 'bg-mario-red'
                          }`}
                        >
                          {useRAG ? '🔍 RAG ON' : '💬 RAG OFF'}
                        </button>
                        <button
                          onClick={clearFiles}
                          className="mario-button p-2 text-white font-bold mario-text-small bg-mario-red"
                        >
                          🧹 CLEAR ALL
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mario-message p-3">
                    <div className="mario-text-small font-bold mb-2">📚 Uploaded Documents:</div>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span>📄</span>
                          <span>{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                        {message.role === 'user' ? '🎮 MARIO' : message.role === 'assistant' ? (useRAG ? '🔍 LUIGI-RAG' : '🤖 LUIGI') : '🍄 SYSTEM'}
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
                  placeholder={isLoading ? "🔄 Processing..." : useRAG ? "🔍 Ask about your PDFs..." : "💬 Type your message or command..."}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="mario-button p-3 text-white font-bold mario-text-small disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {useRAG ? '🔍 RAG' : '🚀 SEND'}
                </button>
              </div>
              <div className="text-xs mt-2 text-mario-brown mario-text-small">
                Press ENTER to send, /help for commands {useRAG && '| 🔍 RAG Mode Active'}
              </div>
            </form>

                  {/* Footer */}
            <div className="text-center mt-4 text-xs text-mario-brown mario-text-small">
              <div className="flex items-center justify-center space-x-4">
                <span>🍄 AI ENGINEER CHALLENGE</span>
                <span className="mario-star">⭐</span>
                <span>SUPER MARIO WORLD RAG v2.0.0</span>
                <span className="mario-coin">🪙</span>
                {useRAG && <span className="text-mario-yellow">🔍 RAG ACTIVE</span>}
              </div>
            </div>
   </div>
  )
}