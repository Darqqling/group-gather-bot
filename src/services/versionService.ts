
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
    // Use the generic approach with proper type casting
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
    
    // Transform the data to match our Version interface with type assertion
    if (data) {
      const typedData = data as any;
      return {
        id: typedData.id,
        version: typedData.version,
        release_date: typedData.release_date,
        changes: Array.isArray(typedData.changes) ? typedData.changes : [],
        created_at: typedData.created_at,
        created_by: typedData.created_by
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
    // Use the generic approach with proper type casting
    const { data, error } = await supabase
      .from('app_versions' as any)
      .select('*')
      .order('release_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
    
    // Transform the data to match our Version interface with type assertion
    return (data || []).map(item => {
      const typedItem = item as any;
      return {
        id: typedItem.id,
        version: typedItem.version,
        release_date: typedItem.release_date,
        changes: Array.isArray(typedItem.changes) ? typedItem.changes : [],
        created_at: typedItem.created_at,
        created_by: typedItem.created_by
      } as Version;
    });
    
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
