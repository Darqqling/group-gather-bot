
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { startPolling, stopPolling, resetPolling } from "@/services/telegramPollingService";
import { useEffect, useState } from "react";
import { Bot, Play, RefreshCw, StopCircle } from "lucide-react";
import AppVersion from "@/components/AppVersion";

export default function Dashboard() {
  const { toast } = useToast();
  const [pollingStatus, setPollingStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if polling is active from localStorage
    const isActive = localStorage.getItem('telegram_polling_active') === 'true';
    setPollingStatus(isActive);
  }, []);

  const handleStartPolling = async () => {
    setLoading(true);
    try {
      const result = await startPolling();
      if (result.success) {
        setPollingStatus(true);
        localStorage.setItem('telegram_polling_active', 'true');
        toast({
          title: "Опрос запущен",
          description: "Telegram бот начал получать обновления",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка запуска",
          description: result.error || "Не удалось запустить опрос",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при запуске опроса",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopPolling = () => {
    setLoading(true);
    try {
      stopPolling();
      setPollingStatus(false);
      localStorage.setItem('telegram_polling_active', 'false');
      toast({
        title: "Опрос остановлен",
        description: "Telegram бот больше не получает обновления",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при остановке опроса",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPolling = async () => {
    setLoading(true);
    try {
      const success = await resetPolling();
      if (success) {
        toast({
          title: "Сброс выполнен",
          description: "Состояние опроса сброшено успешно",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка сброса",
          description: "Не удалось сбросить состояние опроса",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сбросе состояния опроса",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Панель управления</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot size={20} />
              Управление Telegram ботом
            </CardTitle>
            <CardDescription>Запуск и остановка опроса Telegram</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Текущий статус: 
              <span className={`font-bold ml-2 ${pollingStatus ? 'text-green-500' : 'text-red-500'}`}>
                {pollingStatus ? 'Активен' : 'Остановлен'}
              </span>
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Опрос Telegram позволяет боту получать сообщения от пользователей. 
              Вы можете запустить или остановить опрос в любой момент.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            {!pollingStatus ? (
              <Button 
                onClick={handleStartPolling} 
                disabled={loading}
                className="flex gap-2"
              >
                <Play size={16} />
                Запустить опрос
              </Button>
            ) : (
              <Button 
                onClick={handleStopPolling} 
                disabled={loading} 
                variant="destructive"
                className="flex gap-2"
              >
                <StopCircle size={16} />
                Остановить опрос
              </Button>
            )}
            <Button 
              onClick={handleResetPolling} 
              disabled={loading} 
              variant="outline"
              className="flex gap-2"
            >
              <RefreshCw size={16} />
              Сбросить состояние
            </Button>
          </CardFooter>
        </Card>
        
        <AppVersion />
      </div>
    </div>
  );
}
