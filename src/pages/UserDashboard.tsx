import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, LogOut, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TransactionsList } from "@/components/TransactionsList";

interface Profile {
  full_name: string;
  email: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const [profileRes, balanceRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.rpc("get_user_balance", { _user_id: user.id }),
      ]);

      if (profileRes.error) throw profileRes.error;
      
      setProfile(profileRes.data);
      setBalance(balanceRes.data || 0);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logout realizado com sucesso");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-coin-gold rounded-full flex items-center justify-center shadow-coin animate-pulse mb-4">
            <Coins className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-coin-gold rounded-lg flex items-center justify-center shadow-coin">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile?.full_name}</h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="shadow-elevated overflow-hidden relative">
          <div className="absolute inset-0 bg-[var(--gradient-gold)] opacity-10" />
          <CardHeader className="relative">
            <CardDescription className="text-muted-foreground">Seu Saldo</CardDescription>
            <CardTitle className="text-5xl font-bold text-primary flex items-center gap-3">
              <Coins className="w-12 h-12" />
              {balance}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground">
              Moedas acumuladas no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Extrato de Transações
            </CardTitle>
            <CardDescription>Histórico completo de suas moedas conquistadas</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsList />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;