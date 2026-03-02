# Frontend Setup Guide for AI Agent Chat

This guide explains how to use the AI Agent Chat interface in the Zithmi frontend.

## 🎯 What's Been Implemented

The frontend implementation includes:

1. **Agent Service** - API client for communicating with the backend agent
2. **Chat Component** - Full-featured chat interface with streaming support
3. **Chat Page** - Complete page with chat UI and helpful sidebar
4. **Navigation Integration** - Added to the main navigation menu

## 📁 Files Created

```
z-internal-app/src/
├── services/
│   └── agentService.ts          # API client for agent communication
├── components/
│   └── agent/
│       └── AgentChat.tsx        # Main chat component
└── app/
    └── agent-chat/
        └── page.tsx             # Chat page with sidebar
```

## 🚀 How to Use

### Accessing the Chat

1. **Start the frontend:**
   ```bash
   cd z-internal-app
   npm run dev
   ```

2. **Navigate to AI Assistant:**
   - Look for "AI Assistant" in the HOME section of the navigation
   - Or go directly to `/agent-chat`

### Chat Interface Features

**Main Features:**
- 💬 Real-time streaming responses
- 🔧 Tool usage visualization
- 📜 Conversation history
- 🔄 Reload conversation
- 🗑️ Clear history
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

**UI Elements:**
1. **Message Bubbles** - User messages (blue) and agent responses (gray)
2. **Tool Tags** - Shows which tools the agent used
3. **Typing Indicator** - Shows when agent is thinking
4. **Input Area** - Type your message
5. **Action Buttons** - Reload and Clear history

### Example Queries

Try these in the chat:

```
Show me all active projects
```

```
What tickets are assigned to me?
```

```
Create a high priority bug ticket in the Mobile App project
```

```
Show dashboard statistics
```

```
Get details for project ABC-123
```

## 🔧 Component Usage

### Using AgentChat Component

If you want to embed the chat elsewhere:

```typescript
import AgentChat from '@/components/agent/AgentChat';

export default function MyPage() {
  return (
    <div style={{ height: '600px' }}>
      <AgentChat />
    </div>
  );
}
```

### Agent Service API

Direct API usage:

```typescript
import { agentService } from '@/services/agentService';

// Non-streaming chat
const response = await agentService.chat('Show me all projects');
console.log(response.message);

// Streaming chat
await agentService.chatStream(
  'Show me all projects',
  (chunk) => console.log('Text:', chunk),
  (tools) => console.log('Using tools:', tools),
  () => console.log('Done'),
  (error) => console.error('Error:', error)
);

// Get history
const history = await agentService.getHistory();

// Clear history
await agentService.clearHistory();
```

## 🎨 Customization

### Styling

The chat uses Ant Design components. To customize:

1. **Colors** - Edit inline styles in `AgentChat.tsx`
2. **Layout** - Modify the page structure in `page.tsx`
3. **Theme** - Use Ant Design theme configuration

### Agent Instructions

Backend agent instructions can be modified in:
```
z-backend-v2/src/mastra/agent/project-assistant.ts
```

## 🔒 Security

The frontend automatically:
- ✅ Includes JWT token in requests
- ✅ Passes tenant ID in headers
- ✅ Stores conversation per user
- ✅ Validates responses from backend

## 🐛 Troubleshooting

### Chat not loading

**Check:**
1. Backend is running (`http://localhost:3001`)
2. You're logged in with valid token
3. API_URL is configured correctly

**Fix:**
```typescript
// Check environment variable
console.log(process.env.NEXT_PUBLIC_API_URL);

// Should be: http://localhost:3001 (or your backend URL)
```

### Messages not appearing

**Check:**
1. Browser console for errors
2. Network tab shows successful API calls
3. Backend logs show agent responses

### Streaming not working

**Common causes:**
1. Backend not set up for SSE
2. Proxy/nginx buffering enabled
3. Browser blocking EventSource

**Fix:** Check backend response headers include:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Tool calls failing

**Check:**
1. User has required permissions
2. Backend API endpoints are working
3. Auth token is valid

## 📱 Mobile Responsiveness

The chat is responsive and works on:
- ✅ Desktop (optimal experience)
- ✅ Tablet (adjusted layout)
- ✅ Mobile (full-screen chat)

On mobile, the sidebar is hidden for more space.

## 🔄 State Management

The component uses React hooks for state:
- `messages` - Chat history
- `loading` - Request in progress
- `streamingMessage` - Current streaming text
- `activeTool` - Tools being used

No external state management (Redux, Zustand) required!

## ⚡ Performance

**Optimizations:**
- Streaming for instant feedback
- Local message state (no global store)
- Lazy history loading
- Efficient re-renders with proper keys

**Memory usage:**
- ~2-5 KB per message
- History stored in backend (not frontend)
- Old messages can be cleared

## 🎯 Next Steps

1. ✅ Frontend is ready to use
2. 🔲 Ensure backend is running with Mastra
3. 🔲 Test the chat interface
4. 🔲 Customize agent instructions if needed
5. 🔲 Train users on available queries
6. 🔲 Monitor usage and feedback

## 📚 Related Documentation

- **Backend Setup**: `z-backend-v2/MASTRA_SETUP.md`
- **Agent README**: `z-backend-v2/AGENT_README.md`
- **Implementation Plan**: `plans/MASTRA_AI_AGENT_IMPLEMENTATION_PLAN.md`

## 🆘 Support

**Common Questions:**

**Q: Can I change the AI model?**
A: Yes, edit the backend agent configuration to use GPT-4o-mini, Claude, or Gemini

**Q: How do I add more capabilities?**
A: Add new tools in the backend `z-backend-v2/src/mastra/tools/`

**Q: Is the chat history private?**
A: Yes, each user has their own thread ID, conversations are not shared

**Q: Can I integrate with voice?**
A: Yes! Mastra supports voice - see Mastra voice docs

---

**Status**: ✅ Frontend Implementation Complete  
**Version**: 1.0  
**Last Updated**: March 1, 2026
