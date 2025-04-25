
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CollectionCard from "@/components/collections/CollectionCard";

// Mock data
const collections = [
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
  {
    id: "col-3",
    title: "Office Equipment",
    description: "New coffee machine for the office kitchen",
    creator: {
      name: "Emily Parker",
      avatar: "/placeholder.svg",
    },
    targetAmount: 15000,
    currentAmount: 3200,
    status: "active" as const,
    deadline: "2025-06-15",
    participantsCount: 25,
  },
  {
    id: "col-4",
    title: "Charity Donation",
    description: "Collecting for the local animal shelter",
    creator: {
      name: "Sarah Williams",
      avatar: "/placeholder.svg",
    },
    targetAmount: 20000,
    currentAmount: 12800,
    status: "active" as const,
    deadline: "2025-05-30",
    participantsCount: 32,
  },
  {
    id: "col-5",
    title: "Group Trip",
    description: "Weekend trip to the mountains",
    creator: {
      name: "Michael Brown",
      avatar: "/placeholder.svg",
    },
    targetAmount: 30000,
    currentAmount: 4500,
    status: "cancelled" as const,
    deadline: "2025-04-10",
    participantsCount: 6,
  },
  {
    id: "col-6",
    title: "Wedding Gift",
    description: "For Jessica and David's wedding",
    creator: {
      name: "Thomas Wilson",
      avatar: "/placeholder.svg",
    },
    targetAmount: 25000,
    currentAmount: 25000,
    status: "finished" as const,
    deadline: "2025-03-28",
    participantsCount: 15,
  },
];

const Collections = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
        <Button className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Collection
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input placeholder="Search collections..." />
        </div>
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="finished">Finished</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount-high">Amount (High-Low)</SelectItem>
              <SelectItem value="amount-low">Amount (Low-High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} {...collection} />
        ))}
      </div>
    </div>
  );
};

export default Collections;
