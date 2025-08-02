import { createClient } from '@supabase/supabase-js';

export async function updateUserProfile({
  token,
  anonKey,
  username,
  email,
  phone,
  pfp_link,
}: {
  token: string;
  anonKey: string;
  username: string;
  email: string;
  phone: string;
  pfp_link: string;
}) {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    anonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { error } = await supabase.rpc('update_user_profile', {
    _username: username,
    _email: email,
    _phone: phone,
    _pfp_link: pfp_link,
  });

  if (error) {
    console.error('❌ Update failed (RPC):', error);
    throw error;
  }

  return true;
}
