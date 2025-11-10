import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateUserEmailDialogProps {
  userId: string;
  currentEmail: string;
  onSuccess: () => void;
}

export const UpdateUserEmailDialog = ({ userId, currentEmail, onSuccess }: UpdateUserEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || newEmail === currentEmail) {
      toast.error("Digite um novo email válido");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const { error } = await supabase.functions.invoke("update-user-email", {
        body: { user_id: userId, new_email: newEmail },
      });

      if (error) throw error;

      toast.success("Email atualizado com sucesso");
      setOpen(false);
      setNewEmail("");
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao atualizar email:", error);
      toast.error(error.message || "Erro ao atualizar email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mail className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Email</DialogTitle>
          <DialogDescription>
            Email atual: {currentEmail}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">Novo Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="novo@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Atualizando..." : "Atualizar Email"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
