import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Coins, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RankingUser {
  user_id: string;
  full_name: string;
  balance: number;
  rank: number;
}

const Ranking = () => {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchRanking();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Verificar se o usuário é admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      navigate("/");
      return;
    }

    setCurrentUserId(user.id);
  };

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_ranking");
      
      if (error) throw error;
      
      setRanking(data || []);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank === 2) return "secondary";
    if (rank === 3) return "outline";
    return "secondary";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <Trophy className="w-16 h-16 animate-bounce text-primary" />
          <p className="text-muted-foreground">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-3xl">Ranking de Usuários</CardTitle>
                  <CardDescription>
                    Confira os usuários com mais moedas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-3">
          {ranking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum usuário no ranking ainda</p>
              </CardContent>
            </Card>
          ) : (
            ranking.map((user) => (
              <Card
                key={user.user_id}
                className={`transition-all hover:shadow-lg ${
                  user.user_id === currentUserId
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 flex items-center justify-center">
                        {getRankIcon(user.rank)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg truncate">
                          {user.full_name}
                          {user.user_id === currentUserId && (
                            <span className="ml-2 text-sm text-primary">(Você)</span>
                          )}
                        </p>
                        <Badge variant={getRankBadgeVariant(user.rank)} className="mt-1">
                          {user.rank}º lugar
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                      <Coins className="w-5 h-5 text-primary" />
                      <span className="font-mono font-bold text-lg">
                        {user.balance}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Ranking;
