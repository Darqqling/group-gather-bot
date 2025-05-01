
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: "active" | "finished" | "cancelled") => void;
  currentStatus: string;
}

const StatusChangeDialog = ({
  open,
  onClose,
  onConfirm,
  currentStatus,
}: StatusChangeDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<"active" | "finished" | "cancelled">(
    currentStatus as "active" | "finished" | "cancelled"
  );

  const handleConfirm = () => {
    onConfirm(selectedStatus);
  };

  const handleValueChange = (value: string) => {
    setSelectedStatus(value as "active" | "finished" | "cancelled");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Collection Status</DialogTitle>
          <DialogDescription>
            Select a new status for this collection.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={handleValueChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeDialog;
