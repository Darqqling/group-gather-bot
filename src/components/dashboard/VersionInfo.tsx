
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon } from "lucide-react";

interface VersionInfoProps {
  version: string;
  lastUpdated: string;
  changes: string;
}

const VersionInfo = ({ version, lastUpdated, changes }: VersionInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon size={20} />
          Current Version
        </CardTitle>
        <CardDescription>
          Information about the current bot version
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Version</h3>
          <span className="text-sm font-bold">{version}</span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Last Updated</h3>
          <span className="text-sm">{lastUpdated}</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Recent Changes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {changes}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionInfo;
