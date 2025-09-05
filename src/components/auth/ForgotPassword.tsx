import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setEmailSent(true);
    setIsLoading(false);
    
    toast({
      title: 'Email enviado',
      description: 'Verifique sua caixa de entrada para redefinir sua senha.',
    });
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md shadow-elegant border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Email Enviado</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-elegant border-0">
      <CardHeader className="text-center space-y-4">
        <div>
          <CardTitle className="text-2xl font-bold">Esqueceu a Senha?</CardTitle>
          <CardDescription>
            Digite seu email para receber instruções de redefinição de senha.
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-primary" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Instruções'
            )}
          </Button>
        </form>

        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="w-full mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Login
        </Button>
      </CardContent>
    </Card>
  );
}