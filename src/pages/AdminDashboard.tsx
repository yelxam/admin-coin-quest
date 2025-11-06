import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Users, TrendingUp, LogOut, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AddCoinsDialog } from "@/components/AddCoinsDialog";
import { RemoveCoinsDialog } from "@/components/RemoveCoinsDialog";
import { ManageCategoriesDialog } from "@/components/ManageCategoriesDialog";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { UsersTable } from "@/components/UsersTable";

interface Stats {
  totalUsers: number;
  totalCoins: number;
  totalCategories: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCoins: 0, totalCategories: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      const [usersRes, transactionsRes, categoriesRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("amount"),
        supabase.from("categories").select("*", { count: "exact", head: true }),
      ]);

      const totalCoins = transactionsRes.data?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalCoins,
        totalCategories: categoriesRes.count || 0,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logout realizado com sucesso");
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-coin-gold rounded-lg flex items-center justify-center shadow-coin">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gestão de moedas e usuários</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/ranking")}>
              <Trophy className="w-4 h-4 mr-2" />
              Ranking
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Moedas em Circulação</CardTitle>
              <Coins className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalCoins}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.totalCategories}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <CreateUserDialog onSuccess={handleRefresh} />
          <AddCoinsDialog onSuccess={handleRefresh} />
          <RemoveCoinsDialog onSuccess={handleRefresh} />
          <ResetPasswordDialog />
          <ManageCategoriesDialog onSuccess={handleRefresh} />
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>Gerencie usuários e adicione moedas manualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable key={refreshKey} onUpdate={handleRefresh} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;