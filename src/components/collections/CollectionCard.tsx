
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";

type CollectionStatus = "active" | "finished" | "cancelled";

interface CollectionProps {
  id: string;
  title: string;
  description: string;
  creator: {
    name: string;
    avatar?: string;
  };
  targetAmount: number;
  currentAmount: number;
  status: CollectionStatus;
  deadline: string;
  participantsCount: number;
}

const CollectionCard = ({
  id,
  title,
  description,
  creator,
  targetAmount,
  currentAmount,
  status,
  deadline,
  participantsCount,
}: CollectionProps) => {
  const percentage = (currentAmount / targetAmount) * 100;
  
  const statusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><Clock className="mr-1 h-3 w-3" /> Active</Badge>;
      case "finished":
        return <Badge className="bg-blue-500"><Check className="mr-1 h-3 w-3" /> Finished</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500"><X className="mr-1 h-3 w-3" /> Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {description}
            </CardDescription>
          </div>
          {statusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {currentAmount} / {targetAmount} ₽
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Creator: </span>
            <span className="font-medium">{creator.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Deadline: </span>
            <span className="font-medium">{new Date(deadline).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div>
          <span className="text-muted-foreground text-sm">Participants: </span>
          <span className="font-medium text-sm">{participantsCount}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t flex gap-2">
        <Button variant="outline" className="flex-1" size="sm">View Details</Button>
        {status === "active" && (
          <>
            <Button variant="default" className="flex-1" size="sm">Edit</Button>
            <Button variant="destructive" size="sm">Cancel</Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default CollectionCard;
