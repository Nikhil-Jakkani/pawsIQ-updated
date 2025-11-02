import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaComments, FaPaperPlane, FaSearch, FaSpinner } from 'react-icons/fa';
import useChat from '../../hooks/useChat.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useChatSocket from '../../hooks/useChatSocket.js';

const normalizeRole = (role) => (role || '').toLowerCase();

const toComparable = (value) => {
  if (value === null || value === undefined) return undefined;
  return String(value);
};

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const shortDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const shortTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${shortDate} · ${shortTime}`;
};

const getParticipantLabel = (participant) => {
  if (!participant) return 'Unknown';
  const role = normalizeRole(participant.role);

  if (role === 'user') {
    return (
      participant.user?.user_full_name ||
      participant.user?.user_email_id ||
      `User #${participant.user_id}`
    );
  }

  if (role === 'provider') {
    return (
      participant.provider?.serv_provider_name ||
      `Provider #${participant.provider_id}`
    );
  }

  return (
    participant.admin?.admin_full_name ||
    `Admin #${participant.admin_id}`
  );
};

const buildConversationTitle = (conversation, currentUser) => {
  const participants = conversation?.participants || [];
  const currentRole = normalizeRole(currentUser?.role);

  const relevantParticipants = participants.filter((participant) => {
    const role = normalizeRole(participant.role);
    if (role !== currentRole) return true;

    if (role === 'user') {
      return toComparable(participant.user_id) !== toComparable(currentUser?.user_id);
    }
    if (role === 'provider') {
      return toComparable(participant.provider_id) !== toComparable(currentUser?.service_provider_id || currentUser?.provider_id);
    }
    if (role === 'admin') {
      return toComparable(participant.admin_id) !== toComparable(currentUser?.admin_id);
    }
    return true;
  });

  if (!relevantParticipants.length) {
    return conversation?.topic || `Conversation #${conversation?.conversation_id}`;
  }

  return relevantParticipants.map(getParticipantLabel).join(', ');
};

const lastMessagePreview = (conversation) => {
  const lastMessage = conversation?.messages?.[0];
  return lastMessage?.message_body || conversation?.topic || 'No messages yet';
};

const messageFromCurrentUser = (message, currentUser) => {
  const role = normalizeRole(message?.author_role);
  if (!role) return false;

  if (role === 'user') {
    return toComparable(message.author_user_id) === toComparable(currentUser?.user_id);
  }
  if (role === 'provider') {
    const currentProviderId = currentUser?.service_provider_id || currentUser?.provider_id;
    return toComparable(message.author_provider_id) === toComparable(currentProviderId);
  }
  if (role === 'admin') {
    return toComparable(message.author_admin_id) === toComparable(currentUser?.admin_id);
  }
  return false;
};

const serializeConversation = (conversation) => {
  if (!conversation) {
    return conversation;
  }
  return {
    ...conversation,
    participants: Array.isArray(conversation.participants) ? conversation.participants : [],
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
  };
};

const LiveChat = () => {
  const { currentUser } = useAuth();
  const { listConversations, listMessages, sendMessage, markRead } = useChat();
  const { connected: socketConnected, on, joinConversation, leaveConversation, emitTyping, disconnect: disconnectSocket } = useChatSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingParticipants, setTypingParticipants] = useState({});

  const previousConversationRef = useRef(null);
  const typingStateRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const currentActorId = useMemo(() => {
    const role = normalizeRole(currentUser?.role);
    if (role === 'user') {
      return currentUser?.user_id !== undefined && currentUser?.user_id !== null
        ? String(currentUser.user_id)
        : undefined;
    }
    if (role === 'provider') {
      const providerId = currentUser?.service_provider_id ?? currentUser?.provider_id;
      return providerId !== undefined && providerId !== null ? String(providerId) : undefined;
    }
    if (role === 'admin') {
      return currentUser?.admin_id !== undefined && currentUser?.admin_id !== null
        ? String(currentUser.admin_id)
        : undefined;
    }
    return undefined;
  }, [currentUser]);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    setConversationsError('');
    try {
      const response = await listConversations();
      const items = response?.data?.items || [];
      setConversations(items);

      if (!items.some((item) => item.conversation_id === activeConversationId)) {
        setActiveConversationId(items[0]?.conversation_id ?? null);
      }
    } catch (error) {
      setConversationsError(error?.message || 'Unable to load conversations right now.');
    } finally {
      setConversationsLoading(false);
    }
  }, [listConversations, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const upsertConversation = useCallback(
    (incoming) => {
      if (!incoming?.conversation_id) {
        return;
      }

      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.conversation_id === incoming.conversation_id
        );

        const mergedConversation = existingIndex === -1
          ? serializeConversation(incoming)
          : {
              ...prev[existingIndex],
              ...serializeConversation(incoming),
            };

        const withoutExisting = existingIndex === -1 ? prev : prev.filter((_, idx) => idx !== existingIndex);
        return [mergedConversation, ...withoutExisting];
      });
    },
    []
  );

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const title = buildConversationTitle(conversation, currentUser).toLowerCase();
      const preview = lastMessagePreview(conversation).toLowerCase();
      return title.includes(term) || preview.includes(term);
    });
  }, [conversations, currentUser, searchTerm]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversation_id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    setMessagesError('');
    try {
      const response = await listMessages(conversationId, { limit: 100 });
      const items = response?.data?.items || [];
      setMessages(items);
      await markRead(conversationId);
    } catch (error) {
      setMessagesError(error?.message || 'Unable to load messages for this conversation.');
    } finally {
      setMessagesLoading(false);
    }
  }, [listMessages, markRead]);

  useEffect(() => {
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    const prev = previousConversationRef.current;
    if (prev && prev !== activeConversationId) {
      leaveConversation(prev);
      setTypingParticipants((state) => {
        if (!state[prev]) {
          return state;
        }
        const next = { ...state };
        delete next[prev];
        return next;
      });
    }
    if (activeConversationId) {
      joinConversation(activeConversationId);
    }
    previousConversationRef.current = activeConversationId;

    return () => {
      if (activeConversationId) {
        leaveConversation(activeConversationId);
      }
    };
  }, [activeConversationId, joinConversation, leaveConversation]);

  useEffect(() => {
    const prev = previousConversationRef.current;
    if (prev && typingStateRef.current) {
      emitTyping(prev, false);
      typingStateRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeConversationId, emitTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const lastConversation = previousConversationRef.current;
      if (lastConversation && typingStateRef.current) {
        emitTyping(lastConversation, false);
      }
      disconnectSocket();
    };
  }, [disconnectSocket, emitTyping]);

  useEffect(() => {
    const unsubscribes = [];

    const handleConversationUpdated = (conversation) => {
      upsertConversation(conversation);
    };

    const handleMessageCreated = (message) => {
      if (!message || !message.conversation_id) {
        return;
      }

      const conversationId = Number(message.conversation_id);

      setMessages((prev) => {
        if (conversationId !== activeConversationId) {
          return prev;
        }
        if (prev.some((item) => item.message_id === message.message_id)) {
          return prev;
        }
        return [...prev, message];
      });

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.conversation_id === conversationId);
        if (index === -1) {
          return prev;
        }
        const updatedConversation = {
          ...prev[index],
          messages: [message],
          last_message_at: message.created_at,
        };
        const others = prev.filter((_, idx) => idx !== index);
        return [updatedConversation, ...others];
      });
    };

    const handleParticipantRead = (payload) => {
      const { conversationId, actor } = payload || {};
      if (!conversationId || !actor) {
        return;
      }

      setConversations((prev) => prev.map((item) => {
        if (item.conversation_id !== conversationId) {
          return item;
        }
        if (!Array.isArray(item.participants)) {
          return item;
        }
        const participants = item.participants.map((participant) => {
          const role = normalizeRole(participant?.role);
          const matches =
            (role === 'user' && participant.user_id !== null && participant.user_id !== undefined && String(participant.user_id) === actor.id) ||
            (role === 'provider' && participant.provider_id !== null && participant.provider_id !== undefined && String(participant.provider_id) === actor.id) ||
            (role === 'admin' && participant.admin_id !== null && participant.admin_id !== undefined && String(participant.admin_id) === actor.id);
          if (!matches) {
            return participant;
          }
          return {
            ...participant,
            last_read_at: payload.timestamp,
          };
        });
        return {
          ...item,
          participants,
        };
      }));
    };

    const handleTyping = (payload) => {
      if (!payload || !payload.conversationId || !payload.actor) {
        return;
      }

      const conversationId = Number(payload.conversationId);
      if (conversationId !== activeConversationId) {
        return;
      }

      if (payload.actor.id === currentActorId && normalizeRole(payload.actor.role) === normalizeRole(currentUser?.role)) {
        return;
      }

      const conversation = conversations.find((item) => item.conversation_id === conversationId);
      let label = 'Someone';
      if (conversation && Array.isArray(conversation.participants)) {
        const participantMatch = conversation.participants.find((participant) => {
          const role = normalizeRole(participant?.role);
          if (role !== normalizeRole(payload.actor.role)) {
            return false;
          }
          if (role === 'user') {
            return participant?.user_id !== null && participant?.user_id !== undefined && String(participant.user_id) === payload.actor.id;
          }
          if (role === 'provider') {
            return participant?.provider_id !== null && participant?.provider_id !== undefined && String(participant.provider_id) === payload.actor.id;
          }
          if (role === 'admin') {
            return participant?.admin_id !== null && participant?.admin_id !== undefined && String(participant.admin_id) === payload.actor.id;
          }
          return false;
        });
        if (participantMatch) {
          label = getParticipantLabel(participantMatch);
        } else {
          const normalizedRole = normalizeRole(payload.actor.role);
          label = normalizedRole === 'admin' ? 'Admin' : normalizedRole === 'provider' ? 'Provider' : 'User';
        }
      }

      setTypingParticipants((prev) => {
        const existing = prev[conversationId] || [];
        const filtered = existing.filter((item) => item.role !== payload.actor.role || item.id !== payload.actor.id);
        if (!payload.typing) {
          if (!filtered.length) {
            if (!prev[conversationId]) {
              return prev;
            }
            const next = { ...prev };
            delete next[conversationId];
            return next;
          }
          return {
            ...prev,
            [conversationId]: filtered,
          };
        }

        return {
          ...prev,
          [conversationId]: [...filtered, { role: payload.actor.role, id: payload.actor.id, label }],
        };
      });
    };

    unsubscribes.push(on('conversation:updated', handleConversationUpdated));
    unsubscribes.push(on('conversation:created', handleConversationUpdated));
    unsubscribes.push(on('message:created', handleMessageCreated));
    unsubscribes.push(on('participant:read', handleParticipantRead));
    unsubscribes.push(on('participant:typing', handleTyping));

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [on, activeConversationId, upsertConversation, conversations, currentUser, currentActorId]);

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
  };

  const handleSendMessage = useCallback(async (event) => {
    event.preventDefault();
    if (!activeConversationId) return;
    const trimmed = messageInput.trim();
    if (!trimmed) return;

    setSending(true);
    setMessagesError('');
    try {
      const response = await sendMessage(activeConversationId, { message_body: trimmed });
      const newMessage = response?.data;
      if (newMessage) {
        setMessages((prev) => {
          if (prev.some((item) => item.message_id === newMessage.message_id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        setConversations((prev) => {
          const index = prev.findIndex((item) => item.conversation_id === activeConversationId);
          if (index === -1) {
            return prev;
          }
          const updated = {
            ...prev[index],
            messages: [newMessage],
            last_message_at: newMessage.created_at,
          };
          const others = prev.filter((_, idx) => idx !== index);
          return [updated, ...others];
        });
      }
      setMessageInput('');
      if (typingStateRef.current) {
        emitTyping(activeConversationId, false);
        typingStateRef.current = false;
      }
    } catch (error) {
      setMessagesError(error?.message || 'Unable to send message right now.');
    } finally {
      setSending(false);
    }
  }, [activeConversationId, messageInput, sendMessage, emitTyping]);

  const handleMessageInputChange = (event) => {
    const value = event.target.value;
    setMessageInput(value);
    if (!activeConversationId) {
      return;
    }

    if (!typingStateRef.current) {
      emitTyping(activeConversationId, true);
      typingStateRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (typingStateRef.current) {
        emitTyping(activeConversationId, false);
        typingStateRef.current = false;
      }
    }, 2500);
  };

  const activeTypingParticipants = activeConversationId ? typingParticipants[activeConversationId] || [] : [];

  const renderMessages = () => {
    if (!activeConversationId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaComments className="text-indigo-300 text-5xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
            <p className="text-gray-500 mt-1">Select a conversation from the list to start chatting.</p>
          </div>
        </div>
      );
    }

    if (messagesLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <FaSpinner className="animate-spin text-indigo-500 text-2xl" />
        </div>
      );
    }

    if (messagesError) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500 text-sm">{messagesError}</p>
        </div>
      );
    }

    if (!messages.length) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 text-sm">No messages yet. Start the conversation below.</div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((message) => {
            const fromCurrentUser = messageFromCurrentUser(message, currentUser);
            return (
              <div
                key={message.message_id}
                className={`flex ${fromCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                    fromCurrentUser
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.message_body}</p>
                  <span
                    className={`text-xs block mt-1 ${fromCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}
                  >
                    {formatTimestamp(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FaComments className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Live Chat Support</h1>
            <p className="text-gray-500">Manage real-time customer conversations</p>
          </div>
          <div className="ml-auto text-xs">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${socketConnected ? 'border-green-200 text-green-600 bg-green-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              {socketConnected ? 'Live updates on' : 'Live updates offline'}
            </span>
          </div>
        </div>

        {conversations.length ? (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
            <div className="flex h-[calc(100vh-220px)]">
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {conversationsLoading ? (
                    <div className="p-6 flex justify-center"><FaSpinner className="animate-spin text-indigo-500" /></div>
                  ) : conversationsError ? (
                    <div className="p-4 text-sm text-red-500 text-center">{conversationsError}</div>
                  ) : filteredConversations.length ? (
                    filteredConversations.map((conversation) => {
                      const isActive = conversation.conversation_id === activeConversationId;
                      return (
                        <button
                          key={conversation.conversation_id}
                          type="button"
                          className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                            isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectConversation(conversation.conversation_id)}
                        >
                          <h3 className="text-sm font-semibold text-gray-800 truncate">
                            {buildConversationTitle(conversation, currentUser)}
                          </h3>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {lastMessagePreview(conversation)}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimestamp(conversation.last_message_at || conversation.updated_at)}
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-sm">No conversations found.</div>
                  )}
                </div>
              </div>

              <div className="w-2/3 flex flex-col">
                {activeConversation ? (
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-800">
                      {buildConversationTitle(activeConversation, currentUser)}
                    </h2>
                    {activeConversation.context_type && (
                      <p className="text-xs text-gray-500 mt-1">{activeConversation.context_type}</p>
                    )}
                  </div>
                ) : (
                  <div className="border-b border-gray-200 p-4 text-sm text-gray-500">
                    Select a conversation to view messages.
                  </div>
                )}

                {renderMessages()}

                <div className="p-4 border-t border-gray-200">
                  {activeConversationId && activeTypingParticipants.length ? (
                    <div className="text-xs text-indigo-500 mb-2">
                      {activeTypingParticipants.map((participant, index) => (
                        <span key={`${participant.role}-${participant.id}`}>
                          {participant.label || 'Someone'}
                          {index === activeTypingParticipants.length - 1 ? ' is typing…' : ', '}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={activeConversationId ? 'Type your message...' : 'Select a conversation to send messages'}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                      value={messageInput}
                      onChange={handleMessageInputChange}
                      disabled={!activeConversationId || sending}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!activeConversationId || sending || !messageInput.trim()}
                    >
                      {sending ? 'Sending…' : (
                        <span className="flex items-center gap-2"><FaPaperPlane /> Send</span>
                      )}
                    </button>
                  </form>
                  {messagesError && (
                    <p className="text-xs text-red-500 mt-2">{messagesError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-10 text-center text-gray-500 text-sm">
            No conversations yet.
          </div>
        )}
      </div>
  </DashboardLayout>
);
};

export default LiveChat;