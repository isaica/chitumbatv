import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Settings, Lock, Shield, Activity, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface UserProfileProps {
  onClose: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Perfil atualizado',
      description: 'Suas informações foram atualizadas com sucesso.',
    });
    
    setIsLoading(false);
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Senha alterada',
      description: 'Sua senha foi alterada com sucesso.',
    });
    
    passwordForm.reset();
    setIsLoading(false);
  };

  const recentActivities = [
    { action: 'Login realizado', timestamp: '2024-01-15 10:30', ip: '192.168.1.100' },
    { action: 'Cliente adicionado', timestamp: '2024-01-14 15:45', ip: '192.168.1.100' },
    { action: 'Relatório exportado', timestamp: '2024-01-14 09:20', ip: '192.168.1.100' },
    { action: 'Senha alterada', timestamp: '2024-01-13 14:15', ip: '192.168.1.100' },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'gerente': return 'secondary';
      case 'funcionario': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Perfil do Usuário</CardTitle>
                <CardDescription>Gerencie suas informações e configurações</CardDescription>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant={getRoleBadgeVariant(user?.role || '')} className="mt-1">
                      {user?.role === 'admin' ? 'Administrador' : 
                       user?.role === 'gerente' ? 'Gerente' : 'Funcionário'}
                    </Badge>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        {...profileForm.register('name')}
                        className={profileForm.formState.errors.name ? 'border-destructive' : ''}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register('email')}
                        className={profileForm.formState.errors.email ? 'border-destructive' : ''}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Alterar Senha</h3>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...passwordForm.register('newPassword')}
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...passwordForm.register('confirmPassword')}
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4 mr-2" />
                      )}
                      Alterar Senha
                    </Button>
                  </form>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Autenticação de Duas Etapas</h4>
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações por Email</h4>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre atividades importantes
                    </p>
                  </div>
                  <Switch
                    checked={emailNotificationsEnabled}
                    onCheckedChange={setEmailNotificationsEnabled}
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Informações da Conta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Membro desde:</span>
                      <span>{user?.createdAt.toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último login:</span>
                      <span>Hoje, 10:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Atividade Recente</h3>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">IP: {activity.ip}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}