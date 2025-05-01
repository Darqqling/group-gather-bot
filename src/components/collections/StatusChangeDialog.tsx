
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newStatus: "active" | "finished" | "cancelled") => void;
  currentStatus: "active" | "finished" | "cancelled";
}

const StatusChangeDialog = ({
  open,
  onClose,
  onConfirm,
  currentStatus,
}: StatusChangeDialogProps) => {
  const [status, setStatus] = useState<"active" | "finished" | "cancelled">(currentStatus);

  const handleSave = () => {
    onConfirm(status);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Изменить статус сбора</DialogTitle>
          <DialogDescription>
            Выберите новый статус для сбора. Это действие отобразится всем участникам.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Статус
            </Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as "active" | "finished" | "cancelled")}
              className="col-span-3"
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="finished">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeDialog;
