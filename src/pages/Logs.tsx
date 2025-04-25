
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LogList from "@/components/logs/LogList";

// Mock data
const logs = [
  {
    id: "log1",
    timestamp: "2025-04-24T14:32:15",
    level: "info" as const,
    message: "User started a new collection",
    userId: "12345678",
    commandType: "/new",
  },
  {
    id: "log2",
    timestamp: "2025-04-24T14:30:22",
    level: "info" as const,
    message: "User completed collection workflow",
    details: "Collection 'Team Lunch' created successfully",
    userId: "12345678",
    commandType: "/new",
  },
  {
    id: "log3",
    timestamp: "2025-04-24T14:28:10",
    level: "warning" as const,
    message: "Invalid date format provided",
    details: "User entered '32/13/2025' which is not a valid date format",
    userId: "87654321",
    commandType: "/new",
  },
  {
    id: "log4",
    timestamp: "2025-04-24T14:25:45",
    level: "error" as const,
    message: "Failed to save collection",
    details: "Database connection error: timeout after 30s",
    userId: "23456789",
    commandType: "/new",
  },
  {
    id: "log5",
    timestamp: "2025-04-24T14:20:18",
    level: "info" as const,
    message: "User viewed collection history",
    userId: "34567890",
    commandType: "/history",
  },
  {
    id: "log6",
    timestamp: "2025-04-24T14:15:33",
    level: "error" as const,
    message: "Command processing failed",
    details: "Unrecognized command: /hlep",
    userId: "45678901",
  },
  {
    id: "log7",
    timestamp: "2025-04-24T14:10:05",
    level: "info" as const,
    message: "New user registration",
    userId: "56789012",
    commandType: "/start",
  },
];

const Logs = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
        <div className="flex gap-2">
          <Button variant="outline">Clear Logs</Button>
          <Button>Export Logs</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Search logs..." />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Command" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Commands</SelectItem>
                  <SelectItem value="/start">/start</SelectItem>
                  <SelectItem value="/new">/new</SelectItem>
                  <SelectItem value="/finish">/finish</SelectItem>
                  <SelectItem value="/cancel">/cancel</SelectItem>
                  <SelectItem value="/paid">/paid</SelectItem>
                  <SelectItem value="/history">/history</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="recent">
                <SelectTrigger>
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <LogList logs={logs} />

      <div className="flex justify-center">
        <Button variant="outline">Load More Logs</Button>
      </div>
    </div>
  );
};

export default Logs;
