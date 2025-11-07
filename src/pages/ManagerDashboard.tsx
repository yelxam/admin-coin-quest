import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Users, LogOut, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Team {
  id: string;
  name: string;
}

interface RankingUser {
  user_id: string;
  full_name: string;
  balance: number;
  rank: number;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, totalCoins: 0 });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: hasManager } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "manager",
    });

    if (!hasManager) {
      toast.error("Acesso negado. Você não é um gerente.");
      navigate("/");
      return;
    }

    await fetchTeamData(user.id);
  };

  const fetchTeamData = async (userId: string) => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("manager_id", userId)
        .single();

      if (teamError || !teamData) {
        toast.error("Você não está gerenciando nenhuma equipe");
        navigate("/");
        return;
      }

      setTeam(teamData);

      const { data: rankingData, error: rankingError } = await supabase.rpc(
        "get_team_ranking",
        { _team_id: teamData.id }
      );

      if (rankingError) throw rankingError;

      setRanking(rankingData || []);

      const totalMembers = rankingData?.length || 0;
      const totalCoins = rankingData?.reduce((sum, user) => sum + user.balance, 0) || 0;

      setStats({ totalMembers, totalCoins });
    } catch (error: any) {
      toast.error("Erro ao carregar dados da equipe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Logout realizado com sucesso");
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 animate-bounce text-primary" />
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
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel do Gerente</h1>
              <p className="text-sm text-muted-foreground">{team?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Moedas da Equipe</CardTitle>
              <Coins className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalCoins}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Ranking da Equipe</CardTitle>
            <CardDescription>
              Desempenho dos membros da sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum membro na equipe ainda
              </p>
            ) : (
              <div className="space-y-4">
                {ranking.map((user) => (
                  <Card key={user.user_id} className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(user.rank)}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.rank}º lugar
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">
                          {user.balance}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagerDashboard;
