import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Define strict JSON schema matching the expected prompt output
const jsonSchemaText = `
{
  "detected_amount": number|null,
  "transaction_reference": string|null,
  "sender_name": string|null,
  "recipient_name": string|null,
  "payment_method": string|null,
  "transaction_datetime": string|null,
  "confidence_score": number,
  "trust_score": number,
  "warnings": [],
  "analysis_summary": string
}
`;

serve(async (req: Request) => {
  try {
    // 1. Get webhook payload
    const payload = await req.json();
    console.log("Webhook payload received:", payload);
    
    // We expect an insert trigger on payment_proofs table
    const record = payload.record;
    if (!record || !record.id || !record.proof_image_url) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch expected purchase amount
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select('*, plans(*)')
      .eq('id', record.purchase_id)
      .single();

    if (purchaseError || !purchaseData) {
      throw new Error(`Failed to fetch purchase data: ${purchaseError?.message}`);
    }

    const expectedAmount = purchaseData.plans?.price || record.submitted_amount;

    // 4. Download image from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('payment_proofs')
      .download(record.proof_image_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download proof image: ${downloadError?.message}`);
    }

    // Convert Blob to Base64 safely
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = encodeBase64(arrayBuffer);

    // 5. Call Gemini API
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in Edge Function secrets.");
    }

    const promptText = `
You are verifying a Pakistani digital payment receipt screenshot for a food ordering platform.

Your task:
1. Extract visible transaction/payment information
2. Analyze screenshot quality and consistency
3. Compare visible payment evidence reliability
4. Return a verification assessment

Rules:
- Do NOT invent missing values
- Do NOT assume information not visible
- If unclear, return null
- If multiple amounts exist, choose most likely paid amount and add warning
- Detect possible inconsistencies
- Return strict JSON only. No markdown formatting, just the raw JSON object.

Required JSON format:
${jsonSchemaText}
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: (fileData.type && fileData.type !== 'application/octet-stream') ? fileData.type : "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
            temperature: 0.2,
            response_mime_type: "application/json",
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiResult = await geminiResponse.json();
    const candidate = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidate) {
      throw new Error("No text response from Gemini API");
    }

    // Clean up potential markdown code block markers
    const jsonString = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(jsonString);

    // 6. Calculate Verification Status
    let matchStatus = 'UNCLEAR';
    let amountMatch = false;

    if (aiData.detected_amount !== null && aiData.detected_amount !== undefined) {
      const detectedAmountNum = Number(aiData.detected_amount);
      const expectedAmountNum = Number(expectedAmount);
      
      amountMatch = detectedAmountNum === expectedAmountNum;
      
      if (amountMatch && aiData.confidence_score > 85 && aiData.trust_score > 8) {
        matchStatus = 'PERFECT_MATCH';
      } else if (amountMatch && (aiData.confidence_score <= 85 || aiData.trust_score <= 8)) {
        matchStatus = 'PARTIAL_MATCH';
      } else {
        matchStatus = 'MISMATCH';
      }
    } else {
      if (aiData.trust_score < 5) {
        matchStatus = 'MISMATCH';
      } else {
        matchStatus = 'UNCLEAR';
      }
    }

    // 7. Store Result in Database
    const { error: insertError } = await supabase
      .from('payment_ai_verifications')
      .insert({
        purchase_id: record.purchase_id,
        payment_proof_id: record.id,
        provider: 'gemini-1.5-flash',
        verification_status: matchStatus,
        confidence_score: aiData.confidence_score || 0,
        trust_score: aiData.trust_score || 0,
        expected_amount: expectedAmount,
        detected_amount: aiData.detected_amount,
        amount_match: amountMatch,
        detected_reference: aiData.transaction_reference,
        detected_sender: aiData.sender_name,
        detected_recipient: aiData.recipient_name,
        detected_method: aiData.payment_method,
        detected_datetime: aiData.transaction_datetime,
        recommendation: aiData.analysis_summary,
        warnings: aiData.warnings || [],
        raw_response: aiData
      });

    if (insertError) {
      throw new Error(`Failed to insert verification result: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ success: true, verification_status: matchStatus }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
