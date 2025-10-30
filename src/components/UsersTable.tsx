import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  balance?: number;
}

interface UsersTableProps {
  onUpdate: () => void;
}

export const UsersTable = ({ onUpdate }: UsersTableProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!profiles) return;

      const usersWithBalance = await Promise.all(
        profiles.map(async (profile) => {
          const { data: balance } = await supabase.rpc("get_user_balance", {
            _user_id: profile.id,
          });
          return { ...profile, balance: balance || 0 };
        })
      );

      setUsers(usersWithBalance);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando usuários...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Cadastrado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="font-mono">
                <Coins className="w-3 h-3 mr-1" />
                {user.balance}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString("pt-BR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};