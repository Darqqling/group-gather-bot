
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, MoreHorizontal } from "lucide-react";
import { Collection } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import StatusChangeDialog from "./StatusChangeDialog";

interface CollectionsAdminTableProps {
  collections: Collection[];
  onUpdateCollection: (collection: Collection) => void;
}

const CollectionsAdminTable = ({ collections, onUpdateCollection }: CollectionsAdminTableProps) => {
  const [sortField, setSortField] = useState<keyof Collection>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const { toast } = useToast();

  const handleSort = (field: keyof Collection) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedCollections = [...collections].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === "created_at" || sortField === "deadline" || sortField === "last_updated_at") {
      const dateA = new Date(a[sortField] || "");
      const dateB = new Date(b[sortField] || "");
      comparison = dateA.getTime() - dateB.getTime();
    } else if (sortField === "target_amount" || sortField === "current_amount") {
      comparison = (a[sortField] || 0) - (b[sortField] || 0);
    } else {
      comparison = String(a[sortField]).localeCompare(String(b[sortField]));
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активен</Badge>;
      case "finished":
        return <Badge className="bg-blue-500">Завершен</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Отменен</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleChangeStatus = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowStatusDialog(true);
  };

  const handleStatusChange = async (newStatus: "active" | "finished" | "cancelled") => {
    if (!selectedCollection) return;

    try {
      const { error } = await supabase
        .from("collections")
        .update({ 
          status: newStatus,
          last_updated_at: new Date().toISOString()
        })
        .eq("id", selectedCollection.id);

      if (error) throw error;

      toast({
        title: "Статус обновлен",
        description: `Статус сбора изменен на "${newStatus}"`,
      });

      onUpdateCollection({
        ...selectedCollection,
        status: newStatus,
        last_updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating collection status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус сбора",
        variant: "destructive",
      });
    } finally {
      setShowStatusDialog(false);
      setSelectedCollection(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("title")}>
                  Название
                  {sortField === "title" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("creator_id")}>
                  Создатель
                  {sortField === "creator_id" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                  Статус
                  {sortField === "status" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("current_amount")}>
                  Собрано
                  {sortField === "current_amount" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("target_amount")}>
                  Цель
                  {sortField === "target_amount" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("deadline")}>
                  Дедлайн
                  {sortField === "deadline" && (
                    sortDirection === "asc" ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />
                  )}
                </TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCollections.length > 0 ? (
                sortedCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-medium">{collection.title}</TableCell>
                    <TableCell>{collection.creator_id}</TableCell>
                    <TableCell>{getStatusBadge(collection.status)}</TableCell>
                    <TableCell className="text-right">
                      {collection.current_amount?.toLocaleString() || 0} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      {collection.target_amount.toLocaleString()} ₽
                    </TableCell>
                    <TableCell>
                      {collection.deadline ? format(new Date(collection.deadline), 'dd.MM.yyyy') : 'Не указан'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleChangeStatus(collection)}>
                            Изменить статус
                          </DropdownMenuItem>
                          <DropdownMenuItem>Подробности</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Нет доступных сборов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedCollection && (
        <StatusChangeDialog
          open={showStatusDialog}
          onClose={() => setShowStatusDialog(false)}
          onConfirm={handleStatusChange}
          currentStatus={selectedCollection.status}
        />
      )}
    </>
  );
};

export default CollectionsAdminTable;
