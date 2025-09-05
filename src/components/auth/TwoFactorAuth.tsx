import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Smartphone, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números são permitidos'),
});

type TwoFactorData = z.infer<typeof twoFactorSchema>;

interface TwoFactorAuthProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function TwoFactorAuth({ email, onSuccess, onBack }: TwoFactorAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TwoFactorData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const code = watch('code');

  const onSubmit = async (data: TwoFactorData) => {
    setIsLoading(true);
    
    // Simulate API verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification - accept '123456' as valid code
    if (data.code === '123456') {
      onSuccess();
    } else {
      toast({
        title: 'Código inválido',
        description: 'O código inserido está incorreto. Tente novamente.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Código reenviado',
      description: 'Um novo código foi enviado para seu dispositivo.',
    });
    
    setResendLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-elegant border-0">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">Verificação em Duas Etapas</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos enviado para seu dispositivo
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code || ''}
                onChange={(value) => setValue('code', value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {errors.code && (
              <p className="text-sm text-destructive text-center">{errors.code.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-primary" 
            disabled={isLoading || !code || code.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verificar Código
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <Button 
            onClick={handleResendCode}
            variant="outline" 
            className="w-full"
            disabled={resendLoading}
          >
            {resendLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : (
              'Reenviar Código'
            )}
          </Button>

          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Para teste:</p>
          <div className="text-xs">
            <p><strong>Código válido:</strong> 123456</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}