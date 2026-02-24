'use client';

import { Message } from '@/types';

export type WebSocketEvent = 
  | { type: 'new_message'; data: Message }
  | { type: 'new_reply'; data: { parentMessageId: string; reply: Message } }
  | { type: 'message_liked'; data: { messageId: string; likes: number } }
  | { type: 'message_pinned'; data: { messageId: string; isPinned: boolean } }
  | { type: 'message_featured'; data: { messageId: string; isFeatured: boolean } }
  | { type: 'user_online'; data: { userId: string; username: string } }
  | { type: 'user_offline'; data: { userId: string } };

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<WebSocketEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private shouldReconnect = true;
  private simulationMode: boolean;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 根据环境配置 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8989';
    this.url = `${protocol}//${host}/ws/notifications`;
    
    // 如果未定义 NEXT_PUBLIC_WS_HOST，则启用模拟模式
    this.simulationMode = !process.env.NEXT_PUBLIC_WS_HOST;
    
    if (this.simulationMode) {
      console.log('WebSocket 模拟模式已启用 - 使用模拟通知');
    }
  }

  public connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    // 模拟模式：不连接真实 WebSocket，而是启动模拟
    if (this.simulationMode) {
      console.log('WebSocket 模拟模式 - 启动模拟通知');
      this.isConnecting = false;
      this.startSimulation();
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket 连接关闭，代码: ${event.code}, 原因: ${event.reason}`);
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private startSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // 每 30 秒发送一个模拟通知
    this.simulationInterval = setInterval(() => {
      this.sendSimulatedEvent();
    }, 30000);

    // 立即发送一个模拟通知
    setTimeout(() => this.sendSimulatedEvent(), 1000);
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private sendSimulatedEvent(): void {
    const events: WebSocketEvent['type'][] = [
      'new_message',
      'new_reply',
      'message_liked',
      'user_online',
      'user_offline'
    ];
    const randomEventType = events[Math.floor(Math.random() * events.length)];

    const simulateEvent = (): WebSocketEvent => {
      const now = new Date().toISOString();
      const randomId = () => Math.random().toString(36).substring(2, 10);
      const randomUsername = () => ['用户A', '用户B', '用户C', '用户D'][Math.floor(Math.random() * 4)];

      switch (randomEventType) {
        case 'new_message':
          return {
            type: 'new_message',
            data: {
              id: randomId(),
              content: '这是一条模拟的新留言，用于测试实时通知功能。',
              author: {
                id: randomId(),
                username: randomUsername(),
                avatar: undefined
              },
              created_at: now,
              color: '#00D9FF',
              isDanmaku: Math.random() > 0.5,
              likes: 0,
              replies: [],
              level: Math.floor(Math.random() * 10) + 1
            }
          };
        case 'new_reply':
          return {
            type: 'new_reply',
            data: {
              parentMessageId: randomId(),
              reply: {
                id: randomId(),
                content: '这是一条模拟的回复。',
                author: {
                  id: randomId(),
                  username: randomUsername(),
                  avatar: null
                },
                created_at: now,
                color: '#FF6B9D',
                isDanmaku: false,
                likes: 0,
                replies: [],
                level: Math.floor(Math.random() * 10) + 1
              }
            }
          };
        case 'message_liked':
          return {
            type: 'message_liked',
            data: {
              messageId: randomId(),
              likes: Math.floor(Math.random() * 50) + 1
            }
          };
        case 'user_online':
          return {
            type: 'user_online',
            data: {
              userId: randomId(),
              username: randomUsername()
            }
          };
        case 'user_offline':
          return {
            type: 'user_offline',
            data: {
              userId: randomId()
            }
          };
        default:
          return {
            type: 'new_message',
            data: {
              id: randomId(),
              content: '模拟消息',
              author: {
                id: randomId(),
                username: randomUsername(),
                avatar: null
              },
              created_at: now,
              color: '#00D9FF',
              isDanmaku: false,
              likes: 0,
              replies: [],
              level: 1
            }
          };
      }
    };

    const event = simulateEvent();
    console.log('发送模拟 WebSocket 事件:', event.type);
    this.notifyHandlers(event);
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('停止尝试重新连接');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`将在 ${delay}ms 后尝试重新连接 (尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private handleMessage(data: any): void {
    // 根据后端消息格式转换为前端事件
    let event: WebSocketEvent | null = null;

    switch (data.type) {
      case 'new_message':
        event = {
          type: 'new_message',
          data: this.transformMessage(data.message)
        };
        break;
      case 'new_reply':
        event = {
          type: 'new_reply',
          data: {
            parentMessageId: data.parent_message_id,
            reply: this.transformMessage(data.reply)
          }
        };
        break;
      case 'message_liked':
        event = {
          type: 'message_liked',
          data: {
            messageId: data.message_id,
            likes: data.likes
          }
        };
        break;
      case 'message_pinned':
        event = {
          type: 'message_pinned',
          data: {
            messageId: data.message_id,
            isPinned: data.is_pinned
          }
        };
        break;
      case 'message_featured':
        event = {
          type: 'message_featured',
          data: {
            messageId: data.message_id,
            isFeatured: data.is_featured
          }
        };
        break;
      case 'user_online':
        event = {
          type: 'user_online',
          data: {
            userId: data.user_id,
            username: data.username
          }
        };
        break;
      case 'user_offline':
        event = {
          type: 'user_offline',
          data: {
            userId: data.user_id
          }
        };
        break;
      default:
        console.warn('未知的 WebSocket 消息类型:', data.type);
        return;
    }

    if (event) {
      this.notifyHandlers(event);
    }
  }

  private transformMessage(msg: any): Message {
    // 将后端消息格式转换为前端 Message 类型
    return {
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author?.id || '',
        username: msg.author?.username || '匿名用户',
        avatar: msg.author?.avatar
      },
      created_at: msg.created_at,
      color: msg.color || '#00D9FF',
      isDanmaku: msg.is_danmaku ?? true,
      likes: msg.likes || 0,
      replies: [],
      level: msg.level || 1,
      isEdited: msg.is_edited || false,
      editedAt: msg.edited_at,
      isPinned: msg.is_pinned || false,
      isFeatured: msg.is_featured || false,
      tags: msg.tags || []
    };
  }

  public addHandler(handler: WebSocketEventHandler): void {
    this.handlers.add(handler);
  }

  public removeHandler(handler: WebSocketEventHandler): void {
    this.handlers.delete(handler);
  }

  private notifyHandlers(event: WebSocketEvent): void {
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('WebSocket 事件处理程序出错:', error);
      }
    });
  }

  public sendMessage(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopSimulation();
    if (this.ws) {
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService();