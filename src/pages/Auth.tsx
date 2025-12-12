import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Sparkles } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const signInSchema = z.object({
  email: z.string().trim().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

const signUpSchema = z.object({
  email: z.string().trim().email('请输入有效的邮箱地址'),
  password: z.string()
    .min(8, '密码至少需要8个字符')
    .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
    .regex(/[0-9]/, '密码需要包含至少一个数字'),
  displayName: z.string().max(50, '昵称最长50个字符').optional().or(z.literal('')),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});
  const [signUpErrors, setSignUpErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignInErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validate input
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setSignInErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(result.data.email, result.data.password);

    if (error) {
      toast({
        variant: 'destructive',
        title: '登录失败',
        description: error.message === 'Invalid login credentials'
          ? '邮箱或密码错误'
          : error.message,
      });
    } else {
      toast({
        title: '登录成功',
        description: '欢迎回来！',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignUpErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    // Validate input
    const result = signUpSchema.safeParse({ email, password, displayName });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; displayName?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'displayName') fieldErrors.displayName = err.message;
      });
      setSignUpErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(result.data.email, result.data.password, result.data.displayName || '');

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = '该邮箱已被注册';
      }
      toast({
        variant: 'destructive',
        title: '注册失败',
        description: message,
      });
    } else {
      toast({
        title: '注册成功',
        description: '欢迎使用学习资料管理！',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-float opacity-70" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] animate-float opacity-70" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-accent/20 blur-[100px] animate-float opacity-50" style={{ animationDelay: '-2.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 p-4">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-float">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 shadow-glow-lg border border-primary/20 backdrop-blur-sm transition-transform hover:scale-110 duration-500">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight drop-shadow-sm">
            学习资料管理
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="opacity-90">管理你的知识宇宙</span>
          </p>
        </div>

        <Card className="border-0 bg-white/50 dark:bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription className="text-base">开启你的沉浸式学习之旅</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">登录</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">邮箱</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className={`bg-background/50 border-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${signInErrors.email ? 'border-destructive' : ''}`}
                    />
                    {signInErrors.email && (
                      <p className="text-sm text-destructive">{signInErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">密码</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className={`bg-background/50 border-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${signInErrors.password ? 'border-destructive' : ''}`}
                    />
                    {signInErrors.password && (
                      <p className="text-sm text-destructive">{signInErrors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full btn-primary-modern h-12 text-lg" disabled={isLoading}>
                    {isLoading ? '登录中...' : '登 录'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">昵称</Label>
                    <Input
                      id="signup-name"
                      name="displayName"
                      type="text"
                      placeholder="你的昵称"
                      className={`bg-background/50 border-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${signUpErrors.displayName ? 'border-destructive' : ''}`}
                    />
                    {signUpErrors.displayName && (
                      <p className="text-sm text-destructive">{signUpErrors.displayName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">邮箱</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className={`bg-background/50 border-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${signUpErrors.email ? 'border-destructive' : ''}`}
                    />
                    {signUpErrors.email && (
                      <p className="text-sm text-destructive">{signUpErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">密码</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="至少8位，含大写字母和数字"
                      required
                      className={`bg-background/50 border-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 ${signUpErrors.password ? 'border-destructive' : ''}`}
                    />
                    {signUpErrors.password && (
                      <p className="text-sm text-destructive">{signUpErrors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full btn-primary-modern h-12 text-lg" disabled={isLoading}>
                    {isLoading ? '注册中...' : '注 册'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
