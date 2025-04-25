
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserTable from "@/components/users/UserTable";

// Mock data
const users = [
  {
    id: "1",
    username: "alex_s",
    firstName: "Alex",
    lastName: "Smith",
    collections: 4,
    payments: 12,
    joinedAt: "2025-01-15",
    avatar: "/placeholder.svg",
  },
  {
    id: "2",
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    collections: 2,
    payments: 8,
    joinedAt: "2025-02-20",
    avatar: "/placeholder.svg",
  },
  {
    id: "3",
    username: "emily_p",
    firstName: "Emily",
    lastName: "Parker",
    collections: 5,
    payments: 15,
    joinedAt: "2025-02-01",
    avatar: "/placeholder.svg",
  },
  {
    id: "4",
    username: "sarah_w",
    firstName: "Sarah",
    lastName: "Williams",
    collections: 3,
    payments: 9,
    joinedAt: "2025-03-05",
    avatar: "/placeholder.svg",
  },
  {
    id: "5",
    username: "m_brown",
    firstName: "Michael",
    lastName: "Brown",
    collections: 1,
    payments: 6,
    joinedAt: "2025-03-12",
    avatar: "/placeholder.svg",
  },
];

const Users = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <div className="w-full md:w-80">
          <Input placeholder="Search users..." />
        </div>
      </div>

      <UserTable users={users} />

      <div className="flex justify-center">
        <Button variant="outline">Load More</Button>
      </div>
    </div>
  );
};

export default Users;
