import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { AiUsage } from './entities/ai-usage.entity';
import { Repository } from 'typeorm';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @InjectRepository(AiUsage)
    private aiUsageRepository: Repository<AiUsage>,
  ) {}

  @Get('usage/stats')
  async getGlobalStats(@Query('tenantId') tenantId?: string) {
    const query = this.aiUsageRepository.createQueryBuilder('usage');

    if (tenantId) {
      query.where('usage.tenantId = :tenantId', { tenantId });
    }

    // Aggregate by provider and model
    const stats = await query
      .select('usage.provider', 'provider')
      .addSelect('usage.model', 'model')
      .addSelect('SUM(usage.totalTokens)', 'totalTokens')
      .addSelect('COUNT(usage.id)', 'requestCount')
      .groupBy('usage.provider')
      .addGroupBy('usage.model')
      .getRawMany();

    return stats;
  }

  @Get('usage/history')
  async getUsageHistory(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit: number = 50,
  ) {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.aiUsageRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['tenant'],
    });
  }
}
