
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collection } from "@/types";

type CollectionsAdminTableProps = {
  collections: Collection[];
  onChangeStatus: (id: string, status: 'active' | 'finished' | 'cancelled') => void;
};

const CollectionsAdminTable = ({ collections, onChangeStatus }: CollectionsAdminTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активен</Badge>;
      case 'finished':
        return <Badge className="bg-blue-500">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Отменен</Badge>;
      default:
        return <Badge className="bg-gray-500">Неизвестно</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Не указана";
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return "0 ₽";
    return `${amount.toLocaleString()} ₽`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Организатор</TableHead>
            <TableHead>Цель</TableHead>
            <TableHead>Собрано</TableHead>
            <TableHead>Дедлайн</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection.id}>
              <TableCell className="font-medium">{collection.title}</TableCell>
              <TableCell>{collection.creator_id}</TableCell>
              <TableCell>{formatAmount(collection.target_amount)}</TableCell>
              <TableCell>{formatAmount(collection.current_amount)}</TableCell>
              <TableCell>{formatDate(collection.deadline)}</TableCell>
              <TableCell>{getStatusBadge(collection.status)}</TableCell>
              <TableCell>
                <Select
                  defaultValue={collection.status}
                  onValueChange={(value) => 
                    onChangeStatus(
                      collection.id, 
                      value as 'active' | 'finished' | 'cancelled'
                    )
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Изменить" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="finished">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CollectionsAdminTable;
