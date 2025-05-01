
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CollectionsAdminTable from "@/components/collections/CollectionsAdminTable";
import { Collection } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [creatorFilter, setCreatorFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [amountFilter, setAmountFilter] = useState<number | "">("");
  const [creators, setCreators] = useState<{id: string, name: string}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCollections();
    fetchCreators();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("collections").select("*");
      
      // Apply filters if present
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      
      if (creatorFilter) {
        query = query.eq("creator_id", creatorFilter);
      }
      
      if (dateFilter) {
        // Format date for comparison
        const dateString = dateFilter.toISOString().split('T')[0];
        query = query.gte("deadline", dateString);
      }
      
      if (amountFilter !== "") {
        query = query.gte("target_amount", amountFilter);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Apply search term filter client-side
      let filteredData = data;
      if (searchTerm) {
        filteredData = data.filter(
          (collection) => 
            collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (collection.description && 
             collection.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setCollections(filteredData);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase.from("telegram_users").select("id, first_name, last_name");
      
      if (error) {
        throw error;
      }
      
      setCreators(data.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id
      })));
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
  };

  const handleChangeStatus = async (id: string, status: 'active' | 'finished' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from("collections")
        .update({ status, last_updated_at: new Date().toISOString() })
        .eq("id", id);
        
      if (error) {
        throw error;
      }
      
      // Update local state to reflect the change
      setCollections(collections.map(collection => 
        collection.id === id ? { ...collection, status } : collection
      ));
      
      toast({
        title: "Status Updated",
        description: `Collection status has been updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating collection status:", error);
      toast({
        title: "Error",
        description: "Failed to update collection status",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    fetchCollections();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCreatorFilter("");
    setDateFilter(undefined);
    setAmountFilter("");
    fetchCollections();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter Collections</CardTitle>
          <CardDescription>
            Filter and search through all collections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input 
                id="search" 
                placeholder="Search by title or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creator">Creator</Label>
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger id="creator">
                  <SelectValue placeholder="All creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All creators</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Min Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Minimum amount"
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
          </div>
          
          <div className="flex items-end space-x-4">
            <div className="space-y-2">
              <Label>Deadline After</Label>
              <DatePicker
                date={dateFilter}
                onSelect={setDateFilter}
              />
            </div>
            <div className="space-x-2">
              <Button onClick={applyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-8">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-8">No collections found</div>
      ) : (
        <CollectionsAdminTable collections={collections} onChangeStatus={handleChangeStatus} />
      )}
    </div>
  );
};

export default Collections;
