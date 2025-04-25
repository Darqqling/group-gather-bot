
import { Activity, BarChart3, MessageSquare, Users } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import CollectionStats from "@/components/dashboard/CollectionStats";
import CollectionCard from "@/components/collections/CollectionCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Mock data
const recentCollections = [
  {
    id: "col-1",
    title: "Team Lunch",
    description: "Monthly team gathering at a local restaurant",
    creator: {
      name: "Alex Smith",
      avatar: "/placeholder.svg",
    },
    targetAmount: 10000,
    currentAmount: 8500,
    status: "active" as const,
    deadline: "2025-05-10",
    participantsCount: 12,
  },
  {
    id: "col-2",
    title: "Birthday Gift",
    description: "Collecting for Maria's birthday present",
    creator: {
      name: "John Doe",
      avatar: "/placeholder.svg",
    },
    targetAmount: 5000,
    currentAmount: 5000,
    status: "finished" as const,
    deadline: "2025-04-20",
    participantsCount: 8,
  },
];

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => setIsLoading(!isLoading)}>
          {isLoading ? "Stop" : "Refresh Data"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Collections"
          value="243"
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Users"
          value="1,453"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Commands"
          value="32,594"
          icon={MessageSquare}
          description="Since launch"
        />
        <StatsCard
          title="Avg. Collection Amount"
          value="₽3,240"
          icon={BarChart3}
          trend={{ value: 4, isPositive: false }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Collections</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recentCollections.map((collection) => (
              <CollectionCard key={collection.id} {...collection} />
            ))}
          </div>
        </div>

        <div>
          <CollectionStats
            activeCollections={15}
            completedCollections={204}
            canceledCollections={24}
            totalAmount="₽542,800"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
