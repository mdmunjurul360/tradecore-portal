import { ApiProperty } from '@nestjs/swagger';

export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total portfolio value in the base currency (e.g., USD)', example: 10500.50 })
  totalValue: number;

  @ApiProperty({ description: 'Total unrealized profit/loss', example: 500.50 })
  totalUnrealizedPnL: number;

  @ApiProperty({ description: 'Total realized profit/loss', example: 1200.00 })
  totalRealizedPnL: number;

  @ApiProperty({ description: 'Total cost basis of all holdings', example: 10000.00 })
  totalCost: number;
}
