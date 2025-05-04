
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

interface Version {
  version: string;
  release_date: string;
  changes: string[];
}

const AppVersion = () => {
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [previousVersions, setPreviousVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersionData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('app_versions')
          .select('*')
          .order('release_date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setCurrentVersion(data[0]);
          setPreviousVersions(data.slice(1));
        }
      } catch (err) {
        console.error("Error fetching version data:", err);
        setError("Не удалось загрузить информацию о версии");
      } finally {
        setLoading(false);
      }
    };

    fetchVersionData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Версия приложения</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Загрузка информации о версии...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <span>Ошибка</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Версия приложения</CardTitle>
          {currentVersion && (
            <Badge variant="outline" className="text-md py-1">
              v{currentVersion.version}
            </Badge>
          )}
        </div>
        <CardDescription>
          {currentVersion && `Выпущена ${new Date(currentVersion.release_date).toLocaleDateString('ru-RU')}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentVersion && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Текущая версия:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {currentVersion.changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        {previousVersions.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="version-history">
              <AccordionTrigger>История версий</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {previousVersions.map((version, idx) => (
                    <div key={idx} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Версия {version.version}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(version.release_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1">
                        {version.changes.map((change, changeIdx) => (
                          <li key={changeIdx}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default AppVersion;
