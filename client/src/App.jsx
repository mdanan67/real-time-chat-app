import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import authApi from './api/auth';
import apiClient from './api/client';
import conversationsApi from './api/conversations';
import groupsApi from './api/groups';
import messagesApi from './api/messages';
import usersApi from './api/users';

// ============ ICONS COMPONENT ============
const Icons = {
  Cloud: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-full h-full"
    >
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  ),
  Search: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H5.25a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Chat: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
      <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
    </svg>
  ),
  Users: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  ),
  Logout: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Send: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
    </svg>
  ),
  Emoji: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Info: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Close: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Menu: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fillRule="evenodd"
        d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Edit: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
    </svg>
  ),
  Delete: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  More: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Leave: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

// ============ SOCKET SETUP ============
// Use the Vite proxy path - it will forward to the backend on port 3000
const SOCKET_URL = '/';

// ============ UTILITY FUNCTIONS ============
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getChatActivityTime(chat) {
  return new Date(
    chat?.lastMessageAt || chat?.messages?.[0]?.createdAt || chat?.updatedAt || chat?.createdAt || 0
  ).getTime();
}

function sortChatsByActivity(chats) {
  return [...chats].sort((a, b) => getChatActivityTime(b) - getChatActivityTime(a));
}

function upsertChat(chats, incoming) {
  const exists = chats.some((chat) => chat.id === incoming.id);
  const next = exists
    ? chats.map((chat) => (chat.id === incoming.id ? { ...chat, ...incoming } : chat))
    : [incoming, ...chats];

  return sortChatsByActivity(next);
}

// ============ AUTH SCREEN ============
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await authApi.login({ email, password });
      } else {
        result = await authApi.register({
          username,
          email,
          password,
          displayName: displayName || undefined,
        });
      }
      // result contains { user, accessToken, refreshToken }
      apiClient.setToken(result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('refresh_token', result.refreshToken);
      }
      onLogin(result.user);
    } catch (err) {
      console.error('Auth error:', err);
      console.error('Error status:', err.status);
      console.error('Error data:', err.data);
      // Use the most specific error message available
      setError(err.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 text-indigo-400">
            <Icons.Cloud />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Cloudary Messenger
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time messaging platform</p>
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <span className="text-indigo-400 mr-1">@</span>Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              <span className="text-indigo-400 mr-1">✉</span>Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              <span className="text-indigo-400 mr-1">🔒</span>Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 chars)'}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                <span className="text-indigo-400 mr-1">👤</span>Display Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others see you"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============ SIDEBAR ============
function Sidebar({
  user,
  conversations,
  groups,
  activeChat,
  onSelectChat,
  onNewChat,
  onNewGroup,
  onLogout,
}) {
  const [tab, setTab] = useState('conversations');
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((c) => {
    const other = c.conversationMembers?.find((m) => m.userId !== user.id)?.user;
    const name = other?.displayName || other?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <aside className="w-80 lg:w-96 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {(user.displayName || user.username)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100">
                {user.displayName || user.username}
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
              title="New Chat"
            >
              <Icons.Plus />
            </button>
            <button
              onClick={onNewGroup}
              className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
              title="Create Group"
            >
              <Icons.Users />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
              title="Logout"
            >
              <Icons.Logout />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-gray-900">
        <button
          onClick={() => setTab('conversations')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'conversations' ? 'bg-gray-800 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Icons.Chat /> Chats
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'groups' ? 'bg-gray-800 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Icons.Users /> Groups
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icons.Search />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'conversations' ? 'Search conversations...' : 'Search groups...'}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {tab === 'conversations'
          ? filteredConversations.map((conv) => {
              const other = conv.conversationMembers?.find((m) => m.userId !== user.id)?.user;
              const name = other?.displayName || other?.username || 'Unknown';
              const lastMsg = conv.messages?.[0];
              const preview = lastMsg?.isDeleted
                ? 'Message deleted'
                : lastMsg?.content || 'No messages yet';
              const time = lastMsg ? formatTime(lastMsg.createdAt) : '';
              const isActive = activeChat?.id === conv.id && activeChat?.type === 'conversation';
              const isOnline = other?.status === 'ONLINE';
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectChat({ ...conv, type: 'conversation' })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-0.5 text-left ${isActive ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-gray-800/50 border border-transparent'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {name[0].toUpperCase()}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-100 truncate">{name}</p>
                      <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{time}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>
                  </div>
                </button>
              );
            })
          : filteredGroups.map((group) => {
              const lastMsg = group.messages?.[0];
              const preview = lastMsg?.isDeleted
                ? 'Message deleted'
                : lastMsg?.content || 'No messages yet';
              const time = lastMsg ? formatTime(lastMsg.createdAt) : '';
              const isActive = activeChat?.id === group.id && activeChat?.type === 'group';
              return (
                <button
                  key={group.id}
                  onClick={() => onSelectChat({ ...group, type: 'group' })}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-0.5 text-left ${isActive ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-gray-800/50 border border-transparent'}`}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {group.name[0].toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-100 truncate">{group.name}</p>
                      <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{time}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>
                  </div>
                </button>
              );
            })}
      </div>
    </aside>
  );
}

// ============ CHAT AREA ============
function ChatArea({
  user,
  activeChat,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onTogglePanel,
}) {
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const startEdit = (msg) => {
    setEditingMessage(msg.id);
    setEditInput(msg.content);
    setSelectedMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditInput('');
  };

  const saveEdit = () => {
    if (!editInput.trim() || !editingMessage) return;
    onEditMessage(editingMessage, editInput.trim());
    cancelEdit();
  };

  const handleDeleteMessage = (msgId) => {
    onDeleteMessage(msgId);
    setSelectedMsgId(null);
  };

  if (!activeChat) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-indigo-500/30">
            <Icons.Cloud />
          </div>
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">Welcome to Cloudary</h2>
          <p className="text-gray-500 mb-6">Select a conversation or start a new chat</p>
        </div>
      </main>
    );
  }

  const isGroup = activeChat.type === 'group';
  const otherMember = !isGroup
    ? activeChat.conversationMembers?.find((m) => m.userId !== user.id)?.user
    : null;
  const title = isGroup
    ? activeChat.name
    : otherMember?.displayName || otherMember?.username || 'Unknown';
  const isOnline = !isGroup && otherMember?.status === 'ONLINE';
  const memberCount = isGroup ? activeChat.members?.length : 0;

  return (
    <main className="flex-1 flex flex-col bg-gray-950">
      {/* Chat Header */}
      <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isGroup ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}
          >
            {title[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
            <p
              className={`text-xs ${isGroup ? 'text-gray-400' : isOnline ? 'text-green-400' : 'text-gray-500'}`}
            >
              {isGroup ? `${memberCount} members` : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <button
          onClick={onTogglePanel}
          className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
          title="Info"
        >
          <Icons.Info />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.map((msg, idx) => {
          const isSent = msg.senderId === user.id;
          const isEditing = editingMessage === msg.id;
          const showDate =
            idx === 0 ||
            new Date(msg.createdAt).toDateString() !==
              new Date(messages[idx - 1]?.createdAt).toDateString();
          if (msg.isDeleted) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-xs text-gray-500 italic">Message deleted</span>
              </div>
            );
          }
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>
              )}
              <div
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1 relative group`}
                onMouseEnter={() => isSent && setSelectedMsgId(msg.id)}
                onMouseLeave={() => setSelectedMsgId(null)}
              >
                <div className={`max-w-[75%] ${isSent ? 'message-sent' : 'message-received'}`}>
                  {!isSent && isGroup && (
                    <p className="text-xs font-semibold text-indigo-400 mb-1 ml-1">
                      {msg.sender?.displayName || msg.sender?.username}
                    </p>
                  )}
                  {isEditing ? (
                    <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 rounded-br-md">
                      <textarea
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit();
                          }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-full bg-transparent text-white text-sm focus:outline-none resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-white/70 hover:text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isSent ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md' : 'bg-gray-800 text-gray-100 rounded-bl-md'}`}
                    >
                      {msg.content}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${isSent ? 'text-white/60' : 'text-gray-500'}`}
                      >
                        <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                        {msg.isEdited && <span className="text-[10px]">(edited)</span>}
                      </div>
                    </div>
                  )}
                </div>
                {/* Message actions (edit/delete) for sent messages */}
                {isSent && selectedMsgId === msg.id && !isEditing && (
                  <div className="absolute -top-8 right-0 flex gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1 shadow-lg z-10">
                    <button
                      onClick={() => startEdit(msg)}
                      className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded transition-all"
                      title="Edit"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-all"
                      title="Delete"
                    >
                      <Icons.Delete />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 bg-gray-900 border-t border-gray-800">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            onClick={handleSend}
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/25 flex-shrink-0"
          >
            <Icons.Send />
          </button>
        </div>
      </div>
    </main>
  );
}

// ============ RIGHT PANEL ============
function RightPanel({
  activeChat,
  user,
  onClose,
  onAddMembers,
  onRemoveMember,
  onUpdateRole,
  onLeaveGroup,
  onEditGroup,
  onRefresh,
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [searchAdd, setSearchAdd] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  if (!activeChat) return null;
  const isGroup = activeChat.type === 'group';

  const currentMember = activeChat.members?.find((m) => m.userId === user.id);
  const userRole = currentMember?.role || 'MEMBER';
  const isOwner = userRole === 'OWNER';
  const isAdmin = isOwner || userRole === 'ADMIN';

  const handleSearchUsers = (q) => {
    setSearchAdd(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSearchUsers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await usersApi.searchUsers(q.trim());
        setSearchUsers(
          (result.users || []).filter((u) => !activeChat.members?.find((m) => m.userId === u.id))
        );
      } catch {
        setSearchUsers([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleStartEdit = () => {
    setEditName(activeChat.name);
    setEditDescription(activeChat.description || '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await onEditGroup(activeChat.id, {
      name: editName.trim(),
      description: editDescription.trim(),
    });
    setEditing(false);
  };

  return (
    <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full animate-slide-in">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-100">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
        >
          <Icons.Close />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isGroup ? (
          <>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-3xl mb-3">
                {activeChat.name[0].toUpperCase()}
              </div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Group name"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Description"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-100">{activeChat.name}</h3>
                  {activeChat.description && (
                    <p className="text-sm text-gray-400 mt-1">{activeChat.description}</p>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="text-xs text-gray-500">
                      {activeChat.members?.length || 0} members
                    </p>
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={handleStartEdit}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {!isOwner && (
                    <button
                      onClick={() => onLeaveGroup(activeChat.id)}
                      className="mt-3 px-4 py-1.5 text-xs bg-red-900/50 text-red-300 border border-red-800 rounded-lg hover:bg-red-900 transition-all flex items-center gap-1.5 mx-auto"
                    >
                      <Icons.Leave /> Leave Group
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <Icons.Users /> Members
              </h4>
              <div className="space-y-1">
                {activeChat.members?.map((m) => {
                  const isSelf = m.userId === user.id;
                  return (
                    <div
                      key={m.userId}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(m.user?.displayName || m.user?.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {m.user?.displayName || m.user?.username || 'Unknown'}
                          {isSelf && <span className="text-xs text-gray-500 ml-1">(you)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${m.role === 'OWNER' ? 'text-yellow-400' : m.role === 'ADMIN' ? 'text-indigo-400' : 'text-gray-500'}`}
                          >
                            {m.role === 'OWNER'
                              ? '👑 Owner'
                              : m.role === 'ADMIN'
                                ? '⚙️ Admin'
                                : 'Member'}
                          </span>
                          {isAdmin && !isSelf && m.role !== 'OWNER' && (
                            <div className="flex gap-1">
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  onUpdateRole(activeChat.id, m.userId, e.target.value)
                                }
                                className="text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-300 px-1 py-0.5 focus:outline-none"
                              >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <button
                                onClick={() => onRemoveMember(activeChat.id, m.userId)}
                                className="text-red-400 hover:text-red-300 text-xs p-0.5"
                                title="Remove"
                              >
                                <Icons.Close />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Members */}
            {isAdmin && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Add Members
                </h4>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Icons.Search />
                  </span>
                  <input
                    type="text"
                    value={searchAdd}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search users to add..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {searchLoading && (
                  <p className="text-xs text-gray-500 text-center py-2">Searching...</p>
                )}
                {!searchLoading && searchAdd && searchUsers.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">No users found</p>
                )}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {searchUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onAddMembers(activeChat.id, [u.id]);
                        setSearchAdd('');
                        setSearchUsers([]);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-all text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {(u.displayName || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">
                          {u.displayName || u.username}
                        </p>
                      </div>
                      <span className="text-xs text-indigo-400 flex-shrink-0">
                        <Icons.Plus />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Group */}
            {isOwner && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to delete this group? This action cannot be undone.'
                    )
                  ) {
                    onRefresh('deleteGroup', activeChat.id);
                  }
                }}
                className="w-full py-2.5 text-sm bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/50 transition-all"
              >
                Delete Group
              </button>
            )}
          </>
        ) : (
          <>
            {(() => {
              const other = activeChat.conversationMembers?.find((m) => m.userId !== user.id)?.user;
              if (!other) return null;
              return (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl mb-3">
                    {(other.displayName || other.username || '?')[0].toUpperCase()}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {other.displayName || other.username}
                  </h3>
                  <p className="text-sm text-gray-400">{other.email}</p>
                  <p
                    className={`text-xs mt-2 flex items-center justify-center gap-1 ${other.status === 'ONLINE' ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${other.status === 'ONLINE' ? 'bg-green-400' : 'bg-gray-500'}`}
                    />
                    {other.status === 'ONLINE'
                      ? 'Online'
                      : other.status === 'AWAY'
                        ? 'Away'
                        : 'Offline'}
                  </p>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </aside>
  );
}

// ============ NEW CHAT MODAL ============
function NewChatModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await usersApi.searchUsers(search.trim());
        setUsers(result.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">New Conversation</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
          >
            <Icons.Close />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Icons.Search />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {loading && <p className="text-center text-gray-500 py-4 text-sm">Searching...</p>}
            {!loading &&
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelect(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(u.displayName || u.username)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">
                      {u.displayName || u.username}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === 'ONLINE' ? 'bg-green-400' : u.status === 'AWAY' ? 'bg-yellow-400' : 'bg-gray-500'}`}
                  />
                </button>
              ))}
            {!loading && search.trim() && users.length === 0 && (
              <p className="text-center text-gray-500 py-4 text-sm">No users found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ NEW GROUP MODAL ============
function NewGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await usersApi.searchUsers(search.trim());
        setUsers(result.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const toggleUser = (user) => {
    if (selected.find((s) => s.id === user.id)) {
      setSelected(selected.filter((s) => s.id !== user.id));
    } else {
      setSelected([...selected, user]);
    }
  };

  const filtered = users.filter((u) => !selected.find((s) => s.id === u.id));

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      memberIds: selected.map((s) => s.id),
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Create Group</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-all"
          >
            <Icons.Close />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 text-indigo-300 text-xs rounded-full border border-indigo-500/30"
                >
                  {u.displayName || u.username}
                  <button onClick={() => toggleUser(u)} className="hover:text-white transition-all">
                    <Icons.Close />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Add Members</label>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Icons.Search />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {loading && <p className="text-center text-gray-500 py-2 text-sm">Searching...</p>}
              {!loading &&
                filtered.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-800/50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {(u.displayName || u.username)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">
                        {u.displayName || u.username}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded border-2 border-gray-600 flex items-center justify-center flex-shrink-0">
                      {selected.find((s) => s.id === u.id) && (
                        <span className="text-indigo-400">
                          <Icons.Check />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  // Use refs to avoid stale closures in socket event handlers
  const activeChatRef = useRef(activeChat);
  const userRef = useRef(user);
  const conversationsRef = useRef(conversations);
  const groupsRef = useRef(groups);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  // Fetch conversations and groups
  const fetchData = useCallback(async () => {
    try {
      const [convResult, groupResult] = await Promise.all([
        conversationsApi.getAll(),
        groupsApi.getAll(),
      ]);
      setConversations(sortChatsByActivity(convResult.conversations || []));
      setGroups(sortChatsByActivity(groupResult.groups || []));
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, []);

  // Initialize socket connection (only once on mount)
  const initSocket = useCallback((token) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => console.log('Socket connected'));
    s.on('connect_error', (err) => console.error('Socket connection error:', err.message));
    s.on('user:online', ({ userId }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          conversationMembers: conv.conversationMembers?.map((m) =>
            m.userId === userId ? { ...m, user: { ...m.user, status: 'ONLINE' } } : m
          ),
        }))
      );
    });
    s.on('user:offline', ({ userId }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          conversationMembers: conv.conversationMembers?.map((m) =>
            m.userId === userId ? { ...m, user: { ...m.user, status: 'OFFLINE' } } : m
          ),
        }))
      );
    });
    s.on('new:message', (message) => {
      // Use refs to get latest activeChat/user without stale closures
      const currentActive = activeChatRef.current;
      const isForActiveChat =
        currentActive &&
        ((currentActive.type === 'conversation' && message.conversationId === currentActive.id) ||
          (currentActive.type === 'group' && message.groupId === currentActive.id));
      if (isForActiveChat) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
      // Update conversation/group last message in sidebar
      if (message.conversationId) {
        const isKnownConversation = conversationsRef.current.some(
          (conv) => conv.id === message.conversationId
        );
        if (!isKnownConversation) {
          fetchData();
        }
        setConversations((prev) =>
          sortChatsByActivity(
            prev.map((conv) => {
              if (conv.id === message.conversationId) {
                return { ...conv, lastMessageAt: message.createdAt, messages: [message] };
              }
              return conv;
            })
          )
        );
      } else if (message.groupId) {
        const isKnownGroup = groupsRef.current.some((group) => group.id === message.groupId);
        if (!isKnownGroup) {
          fetchData();
        }
        setGroups((prev) =>
          sortChatsByActivity(
            prev.map((g) => {
              if (g.id === message.groupId) {
                return { ...g, updatedAt: message.createdAt, messages: [message] };
              }
              return g;
            })
          )
        );
      }
    });
    s.on('message:edited', (message) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, content: message.content, isEdited: true } : m
        )
      );
    });
    s.on('message:deleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message deleted' } : m
        )
      );
    });
    s.on('conversation:updated', (conversation) => {
      setConversations((prev) => upsertChat(prev, conversation));
      setActiveChat((prev) => {
        if (prev?.id === conversation.id && prev?.type === 'conversation') {
          return { ...prev, ...conversation, type: 'conversation' };
        }
        return prev;
      });
    });
    s.on('group:updated', (group) => {
      setGroups((prev) => upsertChat(prev, group));
      setActiveChat((prev) => {
        if (prev?.id === group.id && prev?.type === 'group') {
          return { ...prev, ...group, type: 'group' };
        }
        return prev;
      });
    });
    s.on('group:memberAdded', ({ groupId, member }) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, members: [...(g.members || []), member] } : g))
      );
      if (member.userId === userRef.current?.id) {
        fetchData();
      }
    });
    s.on('group:memberRemoved', ({ groupId, memberId }) => {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, members: (g.members || []).filter((m) => m.userId !== memberId) }
            : g
        )
      );
      if (memberId === userRef.current?.id) {
        setActiveChat((prev) => (prev?.id === groupId && prev?.type === 'group' ? null : prev));
        fetchData();
      }
    });
    socketRef.current = s;
  }, [fetchData]);

  // Check for stored auth token on mount
  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      authApi
        .getMe()
        .then((data) => {
          setUser(data.user);
          initSocket(token);
        })
        .catch(() => {
          apiClient.setToken(null);
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [initSocket]);

  // Join socket rooms when active chat changes
  useEffect(() => {
    if (!socketRef.current || !activeChat) return;
    const s = socketRef.current;
    if (activeChat.type === 'conversation') {
      s.emit('conversation:join', activeChat.id);
    } else if (activeChat.type === 'group') {
      s.emit('group:join', activeChat.id);
    } else {
      return;
    }
    return () => {
      if (activeChat.type === 'conversation') {
        s.emit('conversation:leave', activeChat.id);
      } else if (activeChat.type === 'group') {
        s.emit('group:leave', activeChat.id);
      }
    };
  }, [activeChat]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    setMessages([]);
    const loadMessages = async () => {
      try {
        let result;
        if (activeChat.type === 'conversation') {
          result = await messagesApi.getConversationMessages(activeChat.id);
        } else if (activeChat.type === 'group') {
          result = await messagesApi.getGroupMessages(activeChat.id);
        } else {
          return;
        }
        // API returns oldest-to-newest so the newest message stays at the bottom.
        setMessages(result.messages || []);

        // Mark messages as read (mark all non-owned messages)
        const unreadIds = (result.messages || [])
          .filter((m) => m.senderId !== user?.id && !m.readBy?.some((r) => r.userId === user?.id))
          .map((m) => m.id);
        if (unreadIds.length > 0) {
          messagesApi.markAsRead(unreadIds).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [activeChat?.id, activeChat?.type, user?.id]);

  // Update activeChat data when conversations/groups change
  useEffect(() => {
    if (!activeChat) return;
    if (activeChat.type === 'conversation') {
      const updated = conversations.find((c) => c.id === activeChat.id);
      if (updated) setActiveChat((prev) => ({ ...prev, ...updated, type: 'conversation' }));
    } else if (activeChat.type === 'group') {
      const updated = groups.find((g) => g.id === activeChat.id);
      if (updated) setActiveChat((prev) => ({ ...prev, ...updated, type: 'group' }));
    }
  }, [conversations, groups, activeChat?.id, activeChat?.type]);

  const handleLogin = (userData) => {
    setUser(userData);
    initSocket(apiClient.getToken());
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowPanel(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    apiClient.setToken(null);
    localStorage.removeItem('refresh_token');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setUser(null);
    setActiveChat(null);
    setConversations([]);
    setGroups([]);
    setMessages([]);
  };

  const handleSendMessage = async (content) => {
    if (!activeChat || !content.trim() || !socketRef.current) return;
    try {
      const data = {
        content,
        type: 'TEXT',
      };
      if (activeChat.type === 'conversation') {
        data.conversationId = activeChat.id;
      } else if (activeChat.type === 'group') {
        data.groupId = activeChat.id;
      } else {
        return;
      }
      const result = await messagesApi.send(data);
      // Add the message locally immediately so the sender sees it
      const sentMessage = result?.message;
      if (sentMessage) {
        // Ensure sender info is set
        if (!sentMessage.sender) {
          sentMessage.sender = {
            id: user.id,
            displayName: user.displayName,
            username: user.username,
          };
        }
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === sentMessage.id);
          if (exists) return prev;
          return [...prev, sentMessage];
        });
        // Also update sidebar preview
        if (sentMessage.conversationId) {
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === sentMessage.conversationId) {
                return {
                  ...conv,
                  lastMessageAt: sentMessage.createdAt,
                  messages: [sentMessage],
                };
              }
              return conv;
            })
          );
        } else if (sentMessage.groupId) {
          setGroups((prev) =>
            prev.map((g) => {
              if (g.id === sentMessage.groupId) {
                return { ...g, messages: [sentMessage] };
              }
              return g;
            })
          );
        }
      }
      // The socket will also echo this back for the recipient
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    try {
      await messagesApi.edit(messageId, content);
      // Update locally instantly for better UX, socket will confirm
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content, isEdited: true } : m))
      );
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesApi.delete(messageId);
      // Update locally instantly
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message deleted' } : m
        )
      );
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleNewChat = async (user) => {
    try {
      const result = await conversationsApi.createOrGet(user.id);
      // Refresh conversations list
      await fetchData();
      if (result.conversation) {
        handleSelectChat({ ...result.conversation, type: 'conversation' });
      }
      setShowNewChat(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleCreateGroup = async (data) => {
    try {
      await groupsApi.create(data);
      await fetchData();
      setShowNewGroup(false);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleAddMembers = async (groupId, memberIds) => {
    try {
      await groupsApi.addMembers(groupId, memberIds);
      await fetchData();
    } catch (err) {
      console.error('Failed to add members:', err);
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    try {
      await groupsApi.removeMember(groupId, memberId);
      await fetchData();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleUpdateRole = async (groupId, memberId, role) => {
    try {
      await groupsApi.updateMemberRole(groupId, memberId, role);
      await fetchData();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupsApi.leave(groupId);
      if (activeChat?.id === groupId && activeChat?.type === 'group') {
        setActiveChat(null);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleEditGroup = async (groupId, data) => {
    try {
      await groupsApi.update(groupId, data);
      await fetchData();
    } catch (err) {
      console.error('Failed to edit group:', err);
    }
  };

  const handleRightPanelAction = async (action, ...args) => {
    if (action === 'deleteGroup') {
      try {
        await groupsApi.delete(args[0]);
        if (activeChat?.id === args[0] && activeChat?.type === 'group') {
          setActiveChat(null);
        }
        setShowPanel(false);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete group:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-indigo-400 animate-pulse">
            <Icons.Cloud />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-gray-950 text-gray-100 overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-gray-100"
      >
        <Icons.Menu />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block flex-shrink-0`}>
        <Sidebar
          user={user}
          conversations={conversations}
          groups={groups}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onNewChat={() => setShowNewChat(true)}
          onNewGroup={() => setShowNewGroup(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Chat Area */}
      <ChatArea
        user={user}
        activeChat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onTogglePanel={() => setShowPanel(!showPanel)}
      />

      {/* Right Panel */}
      {showPanel && activeChat && (
        <RightPanel
          activeChat={activeChat}
          user={user}
          onClose={() => setShowPanel(false)}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onUpdateRole={handleUpdateRole}
          onLeaveGroup={handleLeaveGroup}
          onEditGroup={handleEditGroup}
          onRefresh={handleRightPanelAction}
        />
      )}

      {/* Modals */}
      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onSelect={handleNewChat} />
      )}

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} onCreate={handleCreateGroup} />
      )}
    </div>
  );
}
