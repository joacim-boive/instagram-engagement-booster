import { Progress } from '@/components/ui/progress';

type TokenUsageChartProps = {
  currentUsage: number;
  limit: number;
  usagePercentage: number;
};

export function TokenUsageChart({
  currentUsage,
  limit,
  usagePercentage,
}: TokenUsageChartProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span>{currentUsage.toLocaleString()} tokens used</span>
        <span>{limit.toLocaleString()} tokens limit</span>
      </div>
      <Progress value={usagePercentage} className="h-2" />
      <div className="text-sm text-muted-foreground">
        {usagePercentage.toFixed(1)}% of monthly limit used
      </div>
    </div>
  );
}
