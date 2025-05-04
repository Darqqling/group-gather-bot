
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
    // Use the generic supabase.rpc approach which doesn't rely on table types
    const { data, error } = await supabase
      .from('app_versions' as any)
      .select('*')
      .order('release_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching current version:', error);
      return null;
    }
    
    // Transform the data to match our Version interface
    if (data) {
      return {
        id: data.id,
        version: data.version,
        release_date: data.release_date,
        changes: Array.isArray(data.changes) ? data.changes : [],
        created_at: data.created_at,
        created_by: data.created_by
      } as Version;
    }
    
    return null;
  } catch (error) {
    console.error('Exception fetching current version:', error);
    return null;
  }
}

export async function getAllVersions(): Promise<Version[]> {
  try {
    // Use the generic approach to bypass type checking
    const { data, error } = await supabase
      .from('app_versions' as any)
      .select('*')
      .order('release_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
    
    // Transform the data to match our Version interface
    return (data || []).map(item => ({
      id: item.id,
      version: item.version,
      release_date: item.release_date,
      changes: Array.isArray(item.changes) ? item.changes : [],
      created_at: item.created_at,
      created_by: item.created_by
    } as Version));
    
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
    // Use the generic approach to bypass type checking
    const { error } = await supabase
      .from('app_versions' as any)
      .insert({
        version: version,
        release_date: new Date().toISOString(),
        changes: changes,
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
