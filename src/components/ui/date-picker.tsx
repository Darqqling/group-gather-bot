
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onSelect: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Выберите дату",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd.MM.yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          footer={
            date && (
              <div className="flex justify-center py-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(undefined)}
                >
                  Очистить
                </Button>
              </div>
            )
          }
        />
      </PopoverContent>
    </Popover>
  );
}
