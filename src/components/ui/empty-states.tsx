import { FileX, Search, Users, Building2, CreditCard, UserPlus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-0 shadow-primary">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 p-4 rounded-full bg-muted/30">
          {icon || <FileX className="w-12 h-12 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} className="gradient-primary">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function NoSearchResults({ searchTerm, onClear }: { searchTerm: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="w-12 h-12 text-muted-foreground" />}
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${searchTerm}". Tente ajustar os filtros ou termos de busca.`}
      action={{
        label: "Limpar Busca",
        onClick: onClear
      }}
    />
  );
}

export function NoClients({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Users className="w-12 h-12 text-muted-foreground" />}
      title="Nenhum cliente cadastrado"
      description="Comece adicionando o primeiro cliente ao sistema da ALF Chitumba. É rápido e fácil!"
      action={{
        label: "Novo Cliente",
        onClick: onCreate
      }}
    />
  );
}

export function NoFiliais({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Building2 className="w-12 h-12 text-muted-foreground" />}
      title="Nenhuma filial cadastrada"
      description="Cadastre a primeira filial da ALF Chitumba para começar a organizar seus clientes."
      action={{
        label: "Nova Filial",
        onClick: onCreate
      }}
    />
  );
}

export function NoMensalidades() {
  return (
    <EmptyState
      icon={<CreditCard className="w-12 h-12 text-muted-foreground" />}
      title="Nenhuma mensalidade encontrada"
      description="Não há mensalidades registradas para os critérios de busca selecionados."
    />
  );
}

export function NoUsers({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<UserPlus className="w-12 h-12 text-muted-foreground" />}
      title="Nenhum usuário encontrado"
      description="Não há usuários cadastrados que correspondam aos filtros aplicados."
      action={onCreate ? {
        label: "Novo Usuário",
        onClick: onCreate
      } : undefined}
    />
  );
}

export function NoData({ 
  title = "Nenhum dado disponível", 
  description = "Não há informações para exibir no momento.",
  icon
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
    />
  );
}