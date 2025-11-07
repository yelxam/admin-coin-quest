import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Team {
  id: string;
  name: string;
  company_id: string;
  manager_id: string | null;
  companies: { name: string };
  profiles: { full_name: string } | null;
}

interface Company {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface TeamMember {
  user_id: string;
}

export function ManageTeamsDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({ 
    name: "", 
    company_id: "", 
    manager_id: "" 
  });

  useEffect(() => {
    if (open) {
      fetchTeams();
      fetchCompanies();
      fetchManagers();
      fetchAllUsers();
    }
  }, [open]);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*, companies(name), profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar equipes");
      return;
    }

    setTeams(data || []);
  };

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("id, name");
    setCompanies(data || []);
  };

  const fetchManagers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    setManagers(data || []);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    setAllUsers(data || []);
  };

  const fetchTeamMembers = async (teamId: string) => {
    const { data } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    setTeamMembers(data?.map((m) => m.user_id) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("teams")
          .update({
            name: formData.name,
            company_id: formData.company_id,
            manager_id: formData.manager_id || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Equipe atualizada com sucesso");
      } else {
        const { error } = await supabase.from("teams").insert([{
          name: formData.name,
          company_id: formData.company_id,
          manager_id: formData.manager_id || null,
        }]);

        if (error) throw error;
        toast.success("Equipe criada com sucesso");
      }

      setFormData({ name: "", company_id: "", manager_id: "" });
      setEditingId(null);
      fetchTeams();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setFormData({
      name: team.name,
      company_id: team.company_id,
      manager_id: team.manager_id || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta equipe?")) return;

    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir equipe");
      return;
    }

    toast.success("Equipe excluída com sucesso");
    fetchTeams();
    onSuccess?.();
  };

  const handleManageMembers = async (teamId: string) => {
    setSelectedTeamId(teamId);
    await fetchTeamMembers(teamId);
    setShowMembersDialog(true);
  };

  const handleToggleMember = async (userId: string) => {
    if (!selectedTeamId) return;

    const isMember = teamMembers.includes(userId);

    if (isMember) {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", selectedTeamId)
        .eq("user_id", userId);

      if (error) {
        toast.error("Erro ao remover membro");
        return;
      }

      setTeamMembers(teamMembers.filter((id) => id !== userId));
      toast.success("Membro removido");
    } else {
      const { error } = await supabase
        .from("team_members")
        .insert([{ team_id: selectedTeamId, user_id: userId }]);

      if (error) {
        toast.error("Erro ao adicionar membro");
        return;
      }

      setTeamMembers([...teamMembers, userId]);
      toast.success("Membro adicionado");
    }

    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Gerenciar Equipes
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Equipes</DialogTitle>
            <DialogDescription>
              Crie e gerencie equipes das empresas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Equipe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da equipe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manager">Gerente</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gerente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : editingId ? "Atualizar" : "Criar Equipe"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", company_id: "", manager_id: "" });
                }}
              >
                Cancelar Edição
              </Button>
            )}
          </form>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Equipes Cadastradas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Gerente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.companies.name}</TableCell>
                    <TableCell>{team.profiles?.full_name || "Sem gerente"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageMembers(team.id)}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(team)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(team.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Membros da Equipe</DialogTitle>
            <DialogDescription>
              Adicione ou remova membros desta equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={user.id}
                  checked={teamMembers.includes(user.id)}
                  onCheckedChange={() => handleToggleMember(user.id)}
                />
                <Label htmlFor={user.id} className="cursor-pointer">
                  {user.full_name}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
