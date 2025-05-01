
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CollectionsAdminTable from "@/components/collections/CollectionsAdminTable";
import { DatePicker } from "@/components/ui/date-picker";

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [creators, setCreators] = useState<{id: string, name: string}[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchCollections();
    fetchCreators();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert status strings to match Collection type
      const typedCollections = data.map(collection => {
        let typedStatus: "active" | "finished" | "cancelled" = "active";
        
        if (collection.status === "finished") typedStatus = "finished";
        else if (collection.status === "cancelled") typedStatus = "cancelled";
        
        return {
          ...collection,
          status: typedStatus
        } as Collection;
      });
      
      setCollections(typedCollections);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from("telegram_users")
        .select("*");

      if (error) throw error;

      const creatorsList = data.map(user => ({
        id: user.telegram_id,
        name: user.first_name 
          ? `${user.first_name} ${user.last_name || ''}`
          : user.username || user.telegram_id
      }));
      
      setCreators(creatorsList);
    } catch (error) {
      console.error("Error fetching creators:", error);
    }
  };

  const handleUpdateCollection = (updatedCollection: Collection) => {
    setCollections(collections.map(c => 
      c.id === updatedCollection.id ? updatedCollection : c
    ));
  };

  // Apply filters
  const filteredCollections = collections.filter(collection => {
    // Search term filter (title or description)
    const matchesSearch = searchTerm === "" || 
      (collection.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       collection.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || collection.status === statusFilter;
    
    // Creator filter
    const matchesCreator = creatorFilter === "all" || collection.creator_id === creatorFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter) {
      const collectionDate = new Date(collection.created_at || "");
      matchesDate = collectionDate.toDateString() === dateFilter.toDateString();
    }
    
    return matchesSearch && matchesStatus && matchesCreator && matchesDate;
  });

  const getCreatorName = (creatorId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    return creator ? creator.name : creatorId;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Сборы</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>Фильтрация сборов по разным параметрам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Поиск</label>
              <Input
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="finished">Завершенные</SelectItem>
                  <SelectItem value="cancelled">Отмененные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Создатель</label>
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Все создатели" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все создатели</SelectItem>
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Дата создания</label>
              <DatePicker 
                date={dateFilter} 
                onSelect={setDateFilter}
                placeholder="Выберите дату" 
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCreatorFilter("all");
                setDateFilter(undefined);
              }}
              className="mr-2"
            >
              Сбросить
            </Button>
            <Button onClick={fetchCollections}>Обновить</Button>
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Список сборов</h2>
        {isLoading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : (
          <CollectionsAdminTable 
            collections={filteredCollections}
            onUpdateCollection={handleUpdateCollection}
          />
        )}
      </div>
    </div>
  );
};

export default Collections;
