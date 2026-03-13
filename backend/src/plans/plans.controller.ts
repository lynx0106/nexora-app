import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PLANS, PlanKey } from '../common/constants/plans';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  @Get()
  @ApiOperation({ summary: 'Get available plans (public)' })
  getPlans() {
    return Object.entries(PLANS).map(([key, config]) => ({
      key: key as PlanKey,
      maxTenants: config.maxTenants,
      maxUsersPerTenant: config.maxUsersPerTenant,
      priceUsd: config.priceUsd,
      priceCop: config.priceCop,
      features: config.features,
    }));
  }
}
