//file: frontend/static/js/components/ChatPanel.js

export class ChatPanel {
    constructor(onSendMessage) {
        this.onSendMessage = onSendMessage;
    }

    render() {
        return `
            <div id="chat-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div class="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
                    <div class="p-4 border-b flex justify-between items-center">
                        <h3 class="text-lg font-semibold">游戏聊天</h3>
                        <button id="close-chat" class="text-gray-500 hover:text-gray-700">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    <div id="chat-messages" class="flex-1 overflow-y-auto p-4"></div>
                    <div class="p-4 border-t flex gap-2">
                        <input id="chat-input" type="text" placeholder="输入消息..." 
                            class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            发送
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('close-chat')?.addEventListener('click', () => {
            document.getElementById('chat-modal').classList.add('hidden');
        });
        
        document.getElementById('send-btn')?.addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            if (input.value.trim()) {
                this.onSendMessage(input.value.trim());
                input.value = '';
            }
        });
        
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.onSendMessage(e.target.value.trim());
                e.target.value = '';
            }
        });
    }

    addMessage(message, isSelf = true) {
        const chatContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `mb-3 last:mb-0 ${isSelf ? 'text-right' : 'text-left'}`;
        messageElement.innerHTML = `
            <div class="inline-block max-w-xs px-4 py-2 rounded-lg ${isSelf ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}">
                <div class="text-xs font-semibold mb-1">${isSelf ? '你' : '对手'}</div>
                <div>${message}</div>
                <div class="text-xs text-gray-500 mt-1">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    destroy() {
        document.getElementById('close-chat')?.removeEventListener('click', this.onClose);
        document.getElementById('send-btn')?.removeEventListener('click', this.onSendMessage);
    }
}