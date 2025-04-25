
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CollectionStatsProps {
  activeCollections: number;
  completedCollections: number;
  canceledCollections: number;
  totalAmount: string;
}

const CollectionStats = ({
  activeCollections,
  completedCollections,
  canceledCollections,
  totalAmount,
}: CollectionStatsProps) => {
  const total = activeCollections + completedCollections + canceledCollections;
  
  const activePercentage = total > 0 ? (activeCollections / total) * 100 : 0;
  const completedPercentage = total > 0 ? (completedCollections / total) * 100 : 0;
  const canceledPercentage = total > 0 ? (canceledCollections / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Overview</CardTitle>
        <CardDescription>Summary of all money collections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Active</div>
            <div className="text-sm text-muted-foreground">
              {activeCollections} of {total}
            </div>
          </div>
          <Progress value={activePercentage} className="h-2 bg-muted" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Completed</div>
            <div className="text-sm text-muted-foreground">
              {completedCollections} of {total}
            </div>
          </div>
          <Progress value={completedPercentage} className="h-2 bg-muted" />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Canceled</div>
            <div className="text-sm text-muted-foreground">
              {canceledCollections} of {total}
            </div>
          </div>
          <Progress value={canceledPercentage} className="h-2 bg-muted" />
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-sm font-medium">Total Amount Collected</div>
          <div className="text-2xl font-bold mt-1">{totalAmount}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollectionStats;
