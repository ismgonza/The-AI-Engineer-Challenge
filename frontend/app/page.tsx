'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  usedRAG?: boolean  // Track if this message was generated using RAG
  usedPowerUp?: boolean  // Track if this message was generated with power-up mode
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // New state for PDF RAG functionality
  const [useRAG, setUseRAG] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New state for collapsible sections - expanded when no API key, collapsed when set
  const [showSettings, setShowSettings] = useState(!apiKey)
  const [showDocumentManager, setShowDocumentManager] = useState(!apiKey)
  
  // New state for file selection
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  
  // New state for power-up mode (critical thinking vs quick answers)
  const [powerUpMode, setPowerUpMode] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Simple markdown renderer for better text formatting
  const renderMarkdown = (text: string) => {
    let html = text
      // Headers (process from most specific to least specific)
      .replace(/^### (.+)$/gm, '<h4 style="font-weight: bold; font-size: 1.05em; margin: 12px 0 6px 0; color: #8B4513;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="font-weight: bold; font-size: 1.1em; margin: 16px 0 8px 0; color: #8B4513;">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="font-weight: bold; font-size: 1.2em; margin: 20px 0 10px 0; color: #8B4513;">$1</h2>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')

    // Handle lists - replace the entire list block at once to avoid extra newlines
    html = html.replace(/((?:^[-•]\s.+(?:\n|$))+)/gm, (match) => {
      const listItems = match.trim().split('\n').map(line => {
        const itemMatch = line.match(/^[-•]\s(.+)$/)
        if (itemMatch) {
          return `<div style="margin: 2px 0; padding-left: 16px;">• ${itemMatch[1]}</div>`
        }
        return line
      }).join('')
      return listItems
    })

    // Handle numbered lists similarly
    html = html.replace(/((?:^\d+\.\s.+(?:\n|$))+)/gm, (match) => {
      const listItems = match.trim().split('\n').map(line => {
        const itemMatch = line.match(/^(\d+)\.\s(.+)$/)
        if (itemMatch) {
          return `<div style="margin: 2px 0; padding-left: 16px;">${itemMatch[1]}. ${itemMatch[2]}</div>`
        }
        return line
      }).join('')
      return listItems
    })

    // Handle paragraph breaks (double newlines)
    html = html.replace(/\n\n+/g, '<br><br>')
    
    // Convert remaining single newlines
    html = html.replace(/\n/g, '<br>')

    return { __html: html }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages([
      {
        role: 'system',
        content: 'SUPER MARIO WORLD RAG TERMINAL v2.2.0\n\n🍄 Welcome to the enhanced Mushroom Kingdom console!\n\n✨ FEATURES:\n🎯 **RAG Mode**: Upload documents (PDF, TXT, CSV, JSON, XML) and chat with them\n🔍 Smart document search with vector embeddings\n📚 Analyze files to get suggested questions and summaries\n🍄💪 **Power-Up Mode**: Toggle between critical thinking and quick answers\n🧠 **Conversation Memory**: Full context awareness across the session\n⚡ Use the toggles in the header to control modes!\n\nSupported file types: PDF, TXT, CSV, JSON, XML\n\nQuick commands:\n- **/help**: Show all available commands\n- **/clear**: Reset screen & conversation memory for fresh start\n- **/files**: Show uploaded files\n- **/files filename**: Analyze specific file\n- **/files #**: Analyze file by number\n\n💡 **Memory Feature**: I remember our entire conversation until you use `/clear`!\n\nLet\'s-a go! 🍄⭐',
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

  // Auto-collapse sections when API key is set, expand when not set
  useEffect(() => {
    const shouldExpand = !apiKey
    setShowSettings(shouldExpand)
    setShowDocumentManager(shouldExpand)
  }, [apiKey])

  const fetchUploadedFiles = async () => {
    if (!apiKey) return
    
    try {
      const response = await fetch(`/api/files?api_key=${encodeURIComponent(apiKey)}`)
      if (response.ok) {
        const data = await response.json()
        const newFiles = data.files || []
        setUploadedFiles(newFiles)
        // Clear selections if file list changed
        setSelectedFiles(prev => new Set(Array.from(prev).filter(file => newFiles.includes(file))))
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!apiKey) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '🔑 Please set your OpenAI API key first!',
        timestamp: new Date()
      }])
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    
    // Add all PDF files to formData
    // Supported file types and their MIME types
    const supportedTypes = {
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'application/csv': '.csv',
      'application/json': '.json',
      'text/json': '.json',
      'application/xml': '.xml',
      'text/xml': '.xml'
    } as const
    
    const supportedExtensions = ['.pdf', '.txt', '.csv', '.json', '.xml']
    
    Array.from(files).forEach(file => {
      // Check by MIME type or file extension
      const isSupportedMimeType = file.type in supportedTypes
      const isSupportedExtension = supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      
      if (isSupportedMimeType || isSupportedExtension) {
        formData.append('files', file)
      }
    })
    
    formData.append('api_key', apiKey)

    try {
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🎉 ${result.message}\n📁 Processed: ${result.processed_files.join(', ')}\n📊 Total files: ${result.total_files}\n\n🔍 You can now use RAG mode to chat with your documents!`,
        timestamp: new Date()
      }])

      // Refresh uploaded files list and clear selection
      await fetchUploadedFiles()
      setSelectedFiles(new Set())
      
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
        setSelectedFiles(new Set())
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

  const handleFileSelection = (filename: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(filename)
    } else {
      newSelected.delete(filename)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(uploadedFiles))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return
    
    if (selectedFiles.size === uploadedFiles.length) {
      // If all files selected, use clear all endpoint
      await clearFiles()
    } else {
      // For now, we'll show a message that individual file deletion needs backend support
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🚧 Individual file deletion not yet implemented. Select all files to delete everything, or we need to add backend support for individual file deletion.`,
        timestamp: new Date()
      }])
    }
  }

  const toggleSections = (expanded: boolean) => {
    setShowSettings(expanded)
    setShowDocumentManager(expanded)
  }

  // Generate enhanced developer message based on power-up mode
  const getEnhancedDeveloperMessage = () => {
    const baseMessage = developerMessage
    
    if (powerUpMode) {
      return `${baseMessage}

CRITICAL THINKING MODE ACTIVATED 🍄💪:
- Think deeply and analytically about each question
- Provide comprehensive, well-reasoned responses
- Consider multiple perspectives and potential implications
- Include step-by-step reasoning when appropriate
- Be thorough and educational in your explanations
- Take time to explore nuances and complexities
- Use detailed analysis and comprehensive coverage`
    } else {
      return `${baseMessage}

QUICK RESPONSE MODE ⚡:
- Provide concise, direct answers
- Focus on the most essential information only
- Be clear and to-the-point
- Minimize unnecessary elaboration
- Prioritize brevity and efficiency`
    }
  }

  const handleRAGToggle = () => {
    if (uploadedFiles.length === 0) {
      setMessages(prev => [...prev, {
        role: 'system',
                        content: '📁 No documents uploaded! Upload files (PDF, TXT, CSV, JSON, XML) first to use RAG mode. 🔍',
        timestamp: new Date()
      }])
      return
    }
    
    setUseRAG(!useRAG)
    // Silent toggle - no chat messages
  }

  const handleFilesCommand = async (command: string) => {
    const parts = command.trim().split(' ')
    
    if (uploadedFiles.length === 0) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: '📁 No files uploaded yet. Upload documents (PDF, TXT, CSV, JSON, XML) to get started! 🚀',
        timestamp: new Date()
      }])
      return
    }

    // If just "/files" without parameters, show list
    if (parts.length === 1) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `📚 Uploaded files (${uploadedFiles.length}):\n${uploadedFiles.map((file, index) => `${index + 1}. 📄 ${file}`).join('\n')}\n\n🔍 RAG mode: ${useRAG ? '✅ Active' : '❌ Inactive'}\n\n💡 Tip: Type "**/files filename.pdf**" or "**/files #**" to analyze a specific file!`,
        timestamp: new Date()
      }])
      return
    }

    // If "/files [filename/index]", analyze specific file
    if (parts.length === 2) {
      const target = parts[1]
      
      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🔑 Please set your OpenAI API key to analyze files!',
          timestamp: new Date()
        }])
        return
      }

      setMessages(prev => [...prev, {
        role: 'system',
        content: `🔍 Analyzing file: ${target}... Please wait!`,
        timestamp: new Date()
      }])

      try {
        const response = await fetch('/api/analyze-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: apiKey,
            filename_or_index: target,
            model: model
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        setMessages(prev => [...prev, {
          role: 'system',
          content: `📄 **Analysis for:** ${result.filename}\n📊 **Content length:** ${result.content_length} characters\n\n${result.analysis}`,
          timestamp: new Date()
        }])

      } catch (error) {
        console.error('Error analyzing file:', error)
        setMessages(prev => [...prev, {
          role: 'system',
          content: `❌ Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }])
      }
      return
    }

    // Invalid syntax
    setMessages(prev => [...prev, {
      role: 'system',
      content: '❓ Invalid syntax! Use:\n- **/files**: Show all files\n- **/files filename.pdf**: Analyze specific file\n- **/files #**: Analyze file by number',
      timestamp: new Date()
    }])
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
      
      // Prepare conversation history for the backend
      // Include the current user message in the messages array
      const conversationHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,  // Send full conversation history
          developer_message: getEnhancedDeveloperMessage(),
          user_message: userMessage,      // Keep for backward compatibility
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
        timestamp: new Date(),
        usedRAG: useRAG,  // Track whether RAG was used for this message
        usedPowerUp: powerUpMode  // Track whether power-up was active for this message
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
        // Note: system messages don't need usedRAG property
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

          const handleCommand = async (command: string) => {
          const commandParts = command.trim().toLowerCase().split(' ')
          const mainCommand = commandParts[0]
          
          switch (mainCommand) {
                          case '/help':
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: '🎯 Available commands:\n- **/help**: Show this help\n- **/clear**: Clear screen & reset conversation memory\n- **/status**: Show connection status\n- **/files**: Show uploaded files\n- **/files filename**: Analyze specific file\n- **/files #**: Analyze file by number\n\n📚 Features:\n- **RAG Mode**: Upload documents (PDF, TXT, CSV, JSON, XML) and chat with them (toggle in header)\n- **Power-Up Mode**: Critical thinking vs quick answers (toggle in header)\n- **File Analysis**: Get suggested questions and summaries\n- **Memory Reset**: Use `/clear` for fresh conversations\n- **Multi-Format Support**: PDF, TXT, CSV, JSON, XML files\n- Use toggles in header to switch between modes',
                  timestamp: new Date()
                }])
                break
            case '/clear':
              // Reset conversation completely - both visual and memory
              setMessages([{
                role: 'system',
                content: '🧹 **COMPLETE RESET PERFORMED**\n\n✅ **Screen cleared**\n✅ **Conversation memory wiped**\n✅ **Context history reset**\n\n🚀 Starting fresh! The AI will not remember any previous conversations.\n\n💡 **Welcome back to LUIGI RAG System!**\nYour files are still available if you had any uploaded.\nType **/help** for available commands. 🎮',
                timestamp: new Date()
              }])
              // Additional state resets for a truly fresh start
              // Note: We keep API key, uploaded files, and UI settings
              // but reset conversational context completely
              console.log('🧠 Conversation memory completely cleared!')
              break
                          case '/files':
                await handleFilesCommand(command.trim())
                break
            case '/status':
              setMessages(prev => [...prev, {
                role: 'system',
                content: `📊 Status:\n- API Key: ${apiKey ? '✅ Set' : '❌ Not set'}\n- Model: ${model}\n- RAG Mode: ${useRAG ? '🔍 Active' : '💬 Inactive'}\n- Uploaded Files: ${uploadedFiles.length}\n- Thinking Mode: ${powerUpMode ? '🍄💪 Critical Thinking' : '⚡ Quick Answers'}\n- Developer Message: ${developerMessage.substring(0, 50)}...`,
                timestamp: new Date()
              }])
              break

            default:
              setMessages(prev => [...prev, {
                role: 'system',
                content: `❓ Unknown command: ${mainCommand}. Type /help for available commands. 🎮`,
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
          <div className="h-screen flex flex-col mario-bg text-mario-dark" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div className="flex-shrink-0 mario-border m-4 mb-2">
              <div className="mario-header p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`mario-star text-mario-gold text-2xl ${powerUpMode ? 'animate-spin' : ''}`}>⭐</span>
                    <h1 className={`text-xl font-bold mario-text text-white ${powerUpMode ? 'animate-pulse' : ''}`}>
                      SUPER MARIO WORLD RAG TERMINAL
                    </h1>
                    <span className="mario-coin text-mario-gold text-2xl">🪙</span>
                    {powerUpMode && (
                      <>
                        <span className="text-yellow-400 text-xl animate-bounce">⭐</span>
                        <span className="text-yellow-300 text-lg animate-pulse">✨</span>
                        <span className="text-yellow-400 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>⭐</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-mario-red rounded-full animate-bounce-mario"></div>
                    <div className="w-4 h-4 bg-mario-yellow rounded-full animate-bounce-mario" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-4 h-4 bg-mario-green rounded-full animate-bounce-mario" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
                <div className="text-sm mt-2 text-white mario-text-small">
                  🎮 Connected to Mushroom Kingdom RAG AI v2.2.0 | 📁 {uploadedFiles.length} files loaded
                </div>
              </div>
            </div>

            {/* Settings and PDF Upload - Side by Side with Collapsible Headers */}
            <div className="flex-shrink-0 mx-4 mb-2">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                
                {/* Settings Panel - Takes 2 columns */}
                <div className="mario-border lg:col-span-2">
                  <div 
                    className="mario-header p-3 rounded-t-lg cursor-pointer hover:bg-mario-red/80 transition-colors"
                    onClick={() => toggleSections(!showSettings)}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold mario-text text-white">🍄 POWER-UP CONFIGURATION</h2>
                      <span className="text-white text-xl">
                        {showSettings ? '🔽' : '▶️'}
                      </span>
                    </div>
                  </div>
                  
                  {showSettings && (
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-sm mb-1 mario-text-small font-normal">🔑 OpenAI API Key:</label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full mario-input p-2 text-mario-dark focus:outline-none text-sm"
                          placeholder="sk-..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-1 mario-text-small font-normal">🤖 AI Model:</label>
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full mario-input p-2 text-mario-dark focus:outline-none text-sm"
                        >
                          <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm mb-1 mario-text-small font-normal">💬 Developer Message:</label>
                        <textarea
                          value={developerMessage}
                          onChange={(e) => setDeveloperMessage(e.target.value)}
                          rows={2}
                          className="w-full mario-input p-2 text-mario-dark focus:outline-none resize-none text-sm"
                          placeholder="Enter system prompt..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Upload Section - Takes 3 columns */}
                <div className="mario-border lg:col-span-3">
                  <div 
                    className="mario-header p-3 rounded-t-lg cursor-pointer hover:bg-mario-red/80 transition-colors"
                    onClick={() => toggleSections(!showDocumentManager)}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold mario-text text-white">📚 DOCUMENT MANAGER</h2>
                      <span className="text-white text-xl">
                        {showDocumentManager ? '🔽' : '▶️'}
                      </span>
                    </div>
                  </div>
                  
                  {showDocumentManager && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Left: File Upload Area - Takes 1 column */}
                        <div className="space-y-3 md:col-span-1">
                          <div className="mario-text-small font-normal text-sm font-bold">📤 Upload Documents</div>
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
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
                              <div className="text-2xl">📄</div>
                              <div className="mario-text-small font-normal text-sm">
                                {isUploading ? (
                                  <div className="text-mario-red">🔄 Processing PDFs...</div>
                                ) : (
                                  <>
                                    <div>Drag & drop documents here</div>
                                                                          <div className="text-xs text-mario-brown">or click to browse</div>
                                      <div className="text-xs text-mario-brown mt-1">Supports: PDF, TXT, CSV, JSON, XML</div>
                                  </>
                                )}
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.txt,.csv,.json,.xml"
                                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                className="hidden"
                              />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="mario-button p-2 text-white font-normal mario-text-small disabled:opacity-50 text-sm"
                              >
                                📁 BROWSE FILES
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right: Uploaded Files List - Takes 2 columns */}
                        <div className="space-y-3 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <div className="mario-text-small text-sm font-normal font-bold">
                              📚 Uploaded Documents ({uploadedFiles.length})
                            </div>
                            {uploadedFiles.length > 0 && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={deleteSelectedFiles}
                                  disabled={selectedFiles.size === 0}
                                  className="mario-button p-2 text-white font-normal mario-text-small bg-mario-red text-xs disabled:opacity-50"
                                >
                                  🗑️ DELETE
                                </button>
                              </div>
                            )}
                          </div>

                          {uploadedFiles.length > 0 ? (
                            <div className="mario-message p-3 max-h-32 overflow-y-auto">
                              {/* Select All Checkbox */}
                              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-mario-brown/30">
                                <input
                                  type="checkbox"
                                  checked={selectedFiles.size === uploadedFiles.length && uploadedFiles.length > 0}
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-xs font-bold">Select All</span>
                              </div>
                              
                              {/* File List */}
                              <div className="space-y-1">
                                {uploadedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={selectedFiles.has(file)}
                                      onChange={(e) => handleFileSelection(file, e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-mario-brown">{index + 1}.</span>
                                    <span>📄</span>
                                    <span className="truncate flex-1" title={file}>{file}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mario-message p-3 text-center text-mario-brown text-sm">
                              No files uploaded yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Display - Flexible Height */}
            <div className="flex-1 mx-4 mb-2 mario-border overflow-hidden flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                  {messages.map((message, index) => (
                                          <div key={index} className="mario-message p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-mario-red font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                              {message.role === 'user' ? '🎮 MARIO' : message.role === 'assistant' ? '🤖 LUIGI' : '🍄 SYSTEM'}
                            </span>
                            <span className="text-mario-brown text-xs font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                              [{message.timestamp.toLocaleTimeString()}]
                            </span>
                          </div>
                          
                          {/* Indicators on the right side */}
                          <div className="flex items-center space-x-2">
                            {message.role === 'assistant' && message.usedRAG && (
                              <span className="text-red-500 text-xs font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                                🔍 RAG
                              </span>
                            )}
                                                    {message.role === 'assistant' && message.usedPowerUp && (
                          <span className="text-xs font-normal animate-pulse" style={{ 
                            fontFamily: 'Arial, sans-serif',
                            color: '#FFD700',
                            textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
                          }}>
                            ⭐ POWER-UP
                          </span>
                        )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <div 
                            className="text-sm font-normal" 
                            style={{ fontFamily: 'Arial, sans-serif' }}
                            dangerouslySetInnerHTML={renderMarkdown(message.content)}
                          />
                          
                          {message.role === 'assistant' && index === messages.length - 1 && isLoading && (
                            <span className="animate-pulse text-mario-red">▋</span>
                          )}
                        </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Input Area - Stick to Bottom */}
            <div className="flex-shrink-0 mx-4 mb-4 mario-border">
              <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-mario-red font-normal mario-text text-2xl">{'>'}</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className={`flex-1 mario-input p-3 text-mario-dark placeholder-mario-brown/50 font-normal ${
                      powerUpMode ? 'border-2 bg-yellow-50' : ''
                    }`}
                    style={{ 
                      fontFamily: 'Arial, sans-serif',
                      ...(powerUpMode && {
                        borderColor: '#FFD700',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.3)',
                        animation: 'pulse 2s infinite'
                      })
                    }}
                    placeholder={
                      isLoading 
                        ? "🔄 Processing..." 
                        : powerUpMode 
                          ? "⭐ Power-up mode! Ask complex questions for deep analysis..."
                          : useRAG 
                            ? "🔍 Ask about your PDFs..." 
                            : "💬 Type your message or command..."
                    }
                  />
                  
                  {/* Mode Toggles */}
                  <div className="flex items-center space-x-4">
                    {/* RAG Toggle */}
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-mario-brown text-xs font-normal">🔍</span>
                        <button
                          onClick={handleRAGToggle}
                          disabled={uploadedFiles.length === 0}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                            useRAG ? 'bg-mario-green' : 'bg-mario-red'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              useRAG ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <span className={`text-xs font-normal ${useRAG ? 'text-mario-green' : 'text-mario-red'}`}>
                        RAG
                      </span>
                    </div>

                    {/* Power-Up Toggle */}
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-mario-brown text-xs font-normal">⭐</span>
                        <button
                          onClick={() => setPowerUpMode(!powerUpMode)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            powerUpMode ? 'bg-yellow-400' : 'bg-mario-red'
                          }`}
                          style={powerUpMode ? {
                            backgroundColor: '#FFD700',
                            boxShadow: '0 0 12px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)'
                          } : {}}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              powerUpMode ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <span className={`text-xs font-normal ${powerUpMode ? 'text-yellow-300' : 'text-mario-red'}`} style={powerUpMode ? {
                        color: '#FFD700',
                        textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
                      } : {}}>
                        POWER
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={`mario-button p-3 text-white font-normal mario-text-small disabled:opacity-50 disabled:cursor-not-allowed ${
                      powerUpMode ? 'hover:bg-yellow-600' : ''
                    }`}
                    style={powerUpMode ? {
                      backgroundColor: '#FFD700',
                      boxShadow: '0 0 15px rgba(255, 215, 0, 0.8), 0 0 25px rgba(255, 215, 0, 0.4)',
                      animation: 'pulse 1.5s infinite'
                    } : {}}
                  >
                    {powerUpMode 
                      ? '⭐ POWER' 
                      : useRAG 
                        ? '🔍 RAG' 
                        : '🚀 SEND'
                    }
                  </button>
                </div>
                <div className="text-xs mt-2 text-mario-brown font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Press ENTER to send, /help for commands 
                  {useRAG && ' | 🔍 RAG Active'}
                  {powerUpMode && (
                    <span style={{ color: '#FFD700', textShadow: '0 0 2px rgba(255, 215, 0, 0.6)' }}>
                      {' | ⭐ Power Active'}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 text-center pb-4 text-xs text-mario-brown mario-text-small font-normal">
                              <div className="flex items-center justify-center space-x-4">
                  <span>🍄 AI ENGINEER CHALLENGE</span>
                  <span className="mario-star">⭐</span>
                  <span>SUPER MARIO WORLD RAG v2.2.0</span>
                  <span className="mario-coin">🪙</span>
                  {useRAG && <span className="text-mario-yellow">🔍 RAG ACTIVE</span>}
                  {powerUpMode && <span className="text-yellow-400 animate-pulse">⭐ POWER-UP ACTIVE ⭐</span>}
                </div>
            </div>
   </div>
  )
}