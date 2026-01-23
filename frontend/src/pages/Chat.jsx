import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './Chat.css'

const API_URL = 'http://localhost:5000/api'

function Chat() {
    const { language } = useLanguage()
    const { user, token } = useAuth()
    const [conversations, setConversations] = useState([])
    const [activeConversation, setActiveConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        fetchConversations()
    }, [])

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation._id)
        }
    }, [activeConversation])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (data.success) {
                setConversations(data.conversations || [])
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (conversationId) => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (data.success) {
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !activeConversation || sending) return

        const otherParticipant = activeConversation.participants.find(p => p._id !== user.id)

        setSending(true)
        try {
            const response = await fetch(`${API_URL}/chat/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverId: otherParticipant._id,
                    content: newMessage
                })
            })
            const data = await response.json()
            if (data.success) {
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find(p => p._id !== user?.id)
    }

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="chat-page">
            <div className="container">
                <div className="chat-container">
                    {/* Conversations List */}
                    <div className="conversations-panel">
                        <div className="panel-header">
                            <h2>{language === 'en' ? 'Messages' : 'செய்திகள்'}</h2>
                        </div>
                        <div className="conversations-list">
                            {loading ? (
                                <div className="loading-state">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="empty-state">
                                    <p>{language === 'en' ? 'No conversations yet' : 'இதுவரை உரையாடல்கள் இல்லை'}</p>
                                </div>
                            ) : (
                                conversations.map(conv => {
                                    const other = getOtherParticipant(conv)
                                    return (
                                        <div
                                            key={conv._id}
                                            className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''}`}
                                            onClick={() => setActiveConversation(conv)}
                                        >
                                            <div className="conv-avatar">
                                                {other?.avatar ? (
                                                    <img src={other.avatar} alt={other.name} />
                                                ) : (
                                                    <span>{other?.name?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div className="conv-info">
                                                <h4>{other?.name}</h4>
                                                <p>{conv.lastMessage?.content || (language === 'en' ? 'Start a conversation' : 'உரையாடலைத் தொடங்குங்கள்')}</p>
                                            </div>
                                            {conv.lastMessage?.createdAt && (
                                                <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Messages Panel */}
                    <div className="messages-panel">
                        {activeConversation ? (
                            <>
                                <div className="panel-header">
                                    <div className="chat-user-info">
                                        <div className="chat-avatar">
                                            {getOtherParticipant(activeConversation)?.avatar ? (
                                                <img src={getOtherParticipant(activeConversation).avatar} alt="" />
                                            ) : (
                                                <span>{getOtherParticipant(activeConversation)?.name?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3>{getOtherParticipant(activeConversation)?.name}</h3>
                                            <span className="user-role">{getOtherParticipant(activeConversation)?.role}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="messages-container">
                                    {messages.map(msg => (
                                        <div
                                            key={msg._id}
                                            className={`message ${msg.sender._id === user?.id ? 'sent' : 'received'}`}
                                        >
                                            <div className="message-content">
                                                <p>{msg.content}</p>
                                                <span className="message-time">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form className="message-input" onSubmit={sendMessage}>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={language === 'en' ? 'Type a message...' : 'செய்தியை உள்ளிடவும்...'}
                                        disabled={sending}
                                    />
                                    <button type="submit" disabled={!newMessage.trim() || sending}>
                                        {sending ? '...' : '➤'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="no-chat-selected">
                                <div className="no-chat-icon">💬</div>
                                <h3>{language === 'en' ? 'Select a conversation' : 'ஒரு உரையாடலைத் தேர்ந்தெடுக்கவும்'}</h3>
                                <p>{language === 'en' ? 'Choose from your existing conversations or start a new one' : 'உங்கள் தற்போதைய உரையாடல்களிலிருந்து தேர்வு செய்யவும்'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat
