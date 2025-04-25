
import { useEffect, useState } from "react";
import { Activity, Users, AlertTriangle, MessageSquare } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import CollectionStats from "@/components/dashboard/CollectionStats";
import CollectionCard from "@/components/collections/CollectionCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Collection, Payment, TelegramUser } from "@/types";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCollections: 0,
    completedCollections: 0,
    canceledCollections: 0,
    totalAmount: 0
  });
  const [recentCollections, setRecentCollections] = useState<Collection[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: users } = await supabase
        .from('telegram_users')
        .select('*');

      const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed');

      const activeCount = collections?.filter(c => c.status === 'active').length || 0;
      const completedCount = collections?.filter(c => c.status === 'finished').length || 0;
      const canceledCount = collections?.filter(c => c.status === 'cancelled').length || 0;
      const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalUsers: users?.length || 0,
        activeCollections: activeCount,
        completedCollections: completedCount,
        canceledCollections: canceledCount,
        totalAmount
      });

      if (collections) setRecentCollections(collections);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon={Users}
        />
        <StatsCard
          title="Active Collections"
          value={stats.activeCollections.toString()}
          icon={Activity}
          description="Currently running"
        />
        <StatsCard
          title="Total Amount"
          value={`₽${stats.totalAmount.toLocaleString()}`}
          icon={MessageSquare}
          description="All time"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.completedCollections > 0 
            ? Math.round((stats.completedCollections / (stats.completedCollections + stats.canceledCollections)) * 100)
            : 0}%`}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Collections</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recentCollections.map((collection) => (
              <CollectionCard key={collection.id} {...collection} />
            ))}
          </div>
        </div>
        <CollectionStats
          activeCollections={stats.activeCollections}
          completedCollections={stats.completedCollections}
          canceledCollections={stats.canceledCollections}
          totalAmount={`₽${stats.totalAmount.toLocaleString()}`}
        />
      </div>
    </div>
  );
};

export default Dashboard;
