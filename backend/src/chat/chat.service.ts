import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createMessage(
    content: string,
    senderId: string | null,
    tenantId: string,
    scope: string = 'INTERNAL',
    targetUserId?: string,
    isAi: boolean = false,
    mediaUrl?: string,
    type: string = 'text',
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      content,
      senderId: senderId || undefined, // Set explicit column value
      sender: senderId ? { id: senderId } : undefined,
      tenantId, // Set explicit column value (requires insert:false removed from entity)
      scope,
      targetUserId,
      isAi,
      mediaUrl,
      type,
    });
    const savedMessage = await this.messagesRepository.save(message);
    
    // Reload to get sender relations
    const fullMessage = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });
    return fullMessage!;
  }

  async getMessages(
    tenantId: string,
    scope: string,
    targetUserId?: string,
    limit: number = 50,
  ): Promise<Message[]> {
    const whereClause: any = { tenantId, scope };

    if (scope === 'CUSTOMER' && targetUserId) {
      whereClause.targetUserId = targetUserId;
    }

    return this.messagesRepository.find({
      where: whereClause,
      order: { createdAt: 'ASC' },
      take: limit,
      relations: ['sender'],
    });
  }

  async getConversations(tenantId: string): Promise<string[]> {
    const result = await this.messagesRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.targetUserId', 'userId')
      .where('message.tenantId = :tenantId', { tenantId })
      .andWhere('message.scope = :scope', { scope: 'CUSTOMER' })
      .andWhere('message.targetUserId IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.userId);
  }

  async markAsRead(
    tenantId: string,
    scope: string,
    userId: string,
    targetUserId?: string,
  ): Promise<void> {
    const query = this.messagesRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('scope = :scope', { scope })
      .andWhere('isRead = :isRead', { isRead: false })
      .andWhere('senderId != :userId', { userId });

    if (scope === 'CUSTOMER' && targetUserId) {
      query.andWhere('targetUserId = :targetUserId', { targetUserId });
    }

    await query.execute();
  }

  async getUnreadCount(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<number> {
    const query = this.messagesRepository
      .createQueryBuilder('message')
      .where('message.tenantId = :tenantId', { tenantId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .andWhere('message.senderId != :userId', { userId });

    if (role === 'user') {
      query.andWhere("message.scope = 'CUSTOMER'");
      query.andWhere('message.targetUserId = :userId', { userId });
    } else if (role === 'staff') {
      query.andWhere("message.scope = 'INTERNAL'");
    }

    return query.getCount();
  }
}
