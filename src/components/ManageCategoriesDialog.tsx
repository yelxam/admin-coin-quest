import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderOpen, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ManageCategoriesDialogProps {
  onSuccess: () => void;
}

export const ManageCategoriesDialog = ({ onSuccess }: ManageCategoriesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const icon = formData.get("icon") as string;
    const color = formData.get("color") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("categories").insert({
        name,
        description,
        icon: icon || "🏆",
        color: color || "#F59E0B",
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Categoria criada com sucesso!");
      e.currentTarget.reset();
      fetchCategories();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar categoria");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;

      toast.success("Categoria excluída com sucesso!");
      fetchCategories();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir categoria");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderOpen className="w-4 h-4 mr-2" />
          Gerenciar Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" />
            Gerenciar Categorias
          </DialogTitle>
          <DialogDescription>Crie e gerencie categorias de moedas</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input id="name" name="name" placeholder="Ex: Desempenho" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone (emoji)</Label>
              <Input id="icon" name="icon" placeholder="🏆" maxLength={2} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor (hex)</Label>
            <Input id="color" name="color" type="color" defaultValue="#F59E0B" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" placeholder="Descrição da categoria" rows={2} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            {isLoading ? "Criando..." : "Criar Categoria"}
          </Button>
        </form>

        <div className="space-y-3 mt-6">
          <h3 className="font-semibold text-sm">Categorias Existentes</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada ainda</p>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};