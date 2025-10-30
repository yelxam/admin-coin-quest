import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

export const TransactionsList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("transactions")
        .select(`
          *,
          categories (
            name,
            icon,
            color
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setTransactions(data);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando extrato...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Coins className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground">Nenhuma transação registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {transaction.categories ? (
                  <span className="text-2xl">{transaction.categories.icon}</span>
                ) : (
                  <Coins className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{transaction.description}</p>
                  {transaction.categories && (
                    <Badge variant="outline" style={{ borderColor: transaction.categories.color }}>
                      {transaction.categories.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${transaction.amount > 0 ? "text-secondary" : "text-destructive"}`}>
                {transaction.amount > 0 ? "+" : ""}
                {transaction.amount}
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Coins className="w-3 h-3" />
                moedas
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};