import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tv, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { TwoFactorAuth } from '@/components/auth/TwoFactorAuth';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'forgot' | '2fa'>('login');
  const [userEmail, setUserEmail] = useState('');
  const { login, verifyTwoFactor, isLoading, loginAttempts, isLocked } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@chitumba.ao',
      password: '123456',
      rememberMe: false,
    }
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    if (isLocked) {
      toast({
        title: 'Conta bloqueada',
        description: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        variant: 'destructive',
      });
      return;
    }

    const result = await login(data.email, data.password, data.rememberMe);
    
    if (result.success) {
      if (result.requiresTwoFactor) {
        setUserEmail(data.email);
        setCurrentView('2fa');
      }
      // If no 2FA required, user will be logged in automatically
    } else {
      const remainingAttempts = 5 - loginAttempts - 1;
      toast({
        title: 'Erro ao fazer login',
        description: remainingAttempts > 0 
          ? `Email ou senha incorretos. ${remainingAttempts} tentativas restantes.`
          : 'Conta será bloqueada após próxima tentativa incorreta.',
        variant: 'destructive',
      });
    }
  };

  const handleTwoFactorSuccess = () => {
    toast({
      title: 'Login realizado',
      description: 'Bem-vindo ao sistema!',
    });
  };

  if (currentView === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4">
        <ForgotPassword onBack={() => setCurrentView('login')} />
      </div>
    );
  }

  if (currentView === '2fa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4">
        <TwoFactorAuth 
          email={userEmail}
          onSuccess={handleTwoFactorSuccess}
          onBack={() => setCurrentView('login')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-elegant border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-primary">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gradient">Chitumba TV</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sistema de Gestão de TV Comunitária
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLocked && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Conta bloqueada por 15 minutos devido a muitas tentativas de login incorretas.
              </AlertDescription>
            </Alert>
          )}

          {loginAttempts > 0 && !isLocked && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {5 - loginAttempts} tentativas restantes antes do bloqueio da conta.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                disabled={isLocked}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isLocked}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...register('rememberMe')}
                  disabled={isLocked}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Lembrar-me
                </Label>
              </div>
              
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={() => setCurrentView('forgot')}
                disabled={isLocked}
              >
                Esqueceu a senha?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary shadow-primary hover:shadow-elegant transition-all duration-200" 
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Credenciais de teste:</p>
            <div className="text-xs space-y-1">
              <p><strong>Admin:</strong> admin@chitumba.ao / 123456</p>
              <p><strong>Gerente:</strong> joao@chitumba.ao / 123456</p>
              <p><strong>Funcionário:</strong> carlos@chitumba.ao / 123456</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}