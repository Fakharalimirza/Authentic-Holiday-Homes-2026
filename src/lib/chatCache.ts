interface SerializedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientId?: string;
  channelId?: string;
  text: string;
  createdAtSeconds: number;
}

export const chatCache = {
  getMessages(channelId: string): any[] {
    try {
      const data = localStorage.getItem(`chat_cache_${channelId}`);
      if (!data) return [];
      const parsed = JSON.parse(data) as SerializedMessage[];
      return parsed.map((item) => ({
        id: item.id,
        senderId: item.senderId,
        senderName: item.senderName,
        senderRole: item.senderRole || '',
        recipientId: item.recipientId || '',
        channelId: item.channelId || '',
        text: item.text,
        createdAt: item.createdAtSeconds ? { seconds: item.createdAtSeconds, nanoseconds: 0 } : null
      }));
    } catch (e) {
      console.warn("Failed to retrieve local storage chat cache:", e);
      return [];
    }
  },

  saveMessages(channelId: string, messages: any[]): void {
    try {
      if (!messages || messages.length === 0) return;
      
      const formatted: SerializedMessage[] = messages.map((msg) => {
        let seconds = Math.floor(Date.now() / 1000);
        
        if (msg.createdAt) {
          if (typeof msg.createdAt.seconds === 'number') {
            seconds = msg.createdAt.seconds;
          } else if (msg.createdAt instanceof Date) {
            seconds = Math.floor(msg.createdAt.getTime() / 1000);
          } else if (typeof msg.createdAt === 'object' && typeof msg.createdAt.toDate === 'function') {
            seconds = Math.floor(msg.createdAt.toDate().getTime() / 1000);
          } else if (typeof msg.createdAt === 'string') {
            seconds = Math.floor(new Date(msg.createdAt).getTime() / 1000);
          } else if (typeof msg.createdAt === 'number') {
            seconds = Math.floor(msg.createdAt / 1000);
          }
        }

        return {
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: msg.senderRole || '',
          recipientId: msg.recipientId || '',
          channelId: msg.channelId || '',
          text: msg.text,
          createdAtSeconds: seconds
        };
      });

      // Keep only the last 100 messages for optimal storage management
      localStorage.setItem(`chat_cache_${channelId}`, JSON.stringify(formatted.slice(-100)));
    } catch (e) {
      console.warn("Failed to write to local storage chat cache:", e);
    }
  }
};
