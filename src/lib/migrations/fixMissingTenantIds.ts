
import { supabase } from "@/integrations/supabase/client";

export const fixMissingTenantIds = async (tenantId: string) => {
  try {
    const { data: assetsWithoutTenant, error: fetchError } = await supabase
      .from('assets')
      .select('id')
      .is('tenant_id', null);

    if (fetchError) throw fetchError;

    if (assetsWithoutTenant && assetsWithoutTenant.length > 0) {
      const { error: updateError } = await supabase
        .from('assets')
        .update({ tenant_id: tenantId })
        .is('tenant_id', null);

      if (updateError) throw updateError;

      console.log(`Updated ${assetsWithoutTenant.length} assets with missing tenant_id`);
      return assetsWithoutTenant.length;
    }

    return 0;
  } catch (error) {
    console.error('Error fixing missing tenant IDs:', error);
    throw error;
  }
};
