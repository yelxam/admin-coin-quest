import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Coins } from "lucide-react";

interface AddCoinsDialogProps {
  onSuccess: () => void;
}

export const AddCoinsDialog = ({ onSuccess }: AddCoinsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const [usersRes, categoriesRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("categories").select("*"),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const userId = formData.get("user") as string;
    const categoryId = formData.get("category") as string;
    const amount = parseInt(formData.get("amount") as string);
    const description = formData.get("description") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        category_id: categoryId || null,
        amount,
        description,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Moedas adicionadas com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar moedas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Moedas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Adicionar Moedas
          </DialogTitle>
          <DialogDescription>Adicione moedas manualmente para um usuário</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário</Label>
            <Select name="user" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Select name="category">
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantidade de Moedas</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="100"
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Ex: Conquista especial por desempenho"
              required
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adicionando..." : "Adicionar Moedas"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};