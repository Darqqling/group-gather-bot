
import { supabase } from "@/integrations/supabase/client";

export interface Version {
  id: string;
  version: string;
  release_date: string;
  changes: string[];
  created_at: string;
  created_by: string;
}

export async function getCurrentVersion(): Promise<Version | null> {
  try {
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching current version:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching current version:', error);
    return null;
  }
}

export async function getAllVersions(): Promise<Version[]> {
  try {
    const { data, error } = await supabase
      .from('app_versions')
      .select('*')
      .order('release_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching versions:', error);
    return [];
  }
}

export async function addNewVersion(
  version: string,
  changes: string[],
  createdBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_versions')
      .insert({
        version,
        release_date: new Date().toISOString(),
        changes,
        created_by: createdBy
      });
    
    if (error) {
      console.error('Error adding new version:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception adding new version:', error);
    return false;
  }
}
