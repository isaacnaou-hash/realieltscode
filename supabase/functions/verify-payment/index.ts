import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const handler = async (req: Request): Promise<Response> => {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!secret || !supabaseUrl || !serviceKey) return new Response('missing env', { status: 500 });

  const { reference } = await req.json();
  if (!reference) return new Response('missing reference', { status: 400 });

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const verifyJson = await verifyRes.json();
  if (!verifyRes.ok) return new Response(JSON.stringify(verifyJson), { status: 502 });

  const supabase = createClient(supabaseUrl, serviceKey);
  const status = verifyJson?.data?.status as string | undefined;
  const amount = verifyJson?.data?.amount as number | undefined;

  const update = await supabase
    .from('payment_transactions')
    .update({ status: status === 'success' ? 'verified' : 'failed', paystack_response: verifyJson })
    .eq('reference', reference);

  if (update.error) return new Response(update.error.message, { status: 500 });
  return new Response(JSON.stringify({ status, amount }), { status: 200 });
};

export default handler;
