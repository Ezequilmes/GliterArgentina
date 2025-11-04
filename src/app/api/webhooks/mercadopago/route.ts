import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function validateWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    console.warn('No signature provided in webhook request');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

async function updateUserPremiumStatus(userId: string, planType: string, paymentId: string) {
  try {
    // Import Firestore dynamically to avoid server-side issues
    const { db } = await import('@/lib/firebase');
    const { doc, updateDoc, Timestamp, serverTimestamp } = await import('firebase/firestore');
    
    let months = 1; // Default to 1 month
    
    // Determine months based on plan type
    switch (planType.toLowerCase()) {
      case 'mensual':
      case 'monthly':
        months = 1;
        break;
      case 'trimestral':
      case 'quarterly':
        months = 3;
        break;
      case 'anual':
      case 'yearly':
        months = 12;
        break;
      default:
        months = 1;
    }
    
    // Calculate premium until date
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + months);
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumUntil: Timestamp.fromDate(premiumUntil),
      lastPaymentAt: serverTimestamp(),
      paymentId: paymentId,
      planType: planType,
      updatedAt: serverTimestamp()
    });
    
    console.log(`User ${userId} premium status updated for ${months} months`);
    return { success: true, months, premiumUntil };
    
  } catch (error) {
    console.error('Error updating user premium status:', error);
    throw error;
  }
}

async function processWebhookData(data: any) {
  try {
    console.log('Processing webhook data:', {
      type: data.type,
      action: data.action,
      data: data.data
    });
    
    // Handle payment webhooks
    if (data.type === 'payment' && data.data) {
      const paymentData = data.data;
      
      // Only process approved payments
      if (paymentData.status === 'approved') {
        // Extract user ID from payment metadata or external reference
        const userId = paymentData.external_reference || 
                      paymentData.metadata?.userId || 
                      paymentData.payer?.email;
        
        if (!userId) {
          console.error('No user ID found in payment data');
          return;
        }
        
        // Extract plan information
        const planType = paymentData.description || 'mensual';
        const paymentId = paymentData.id;
        
        // Update user premium status
        await updateUserPremiumStatus(userId, planType, paymentId);
        
        // Track successful payment
        try {
          const { analyticsService } = await import('@/services/analyticsService');
          analyticsService.trackEvent('premium_purchase_completed', {
            plan_type: planType.toLowerCase().includes('anual') ? 'yearly' : 'monthly',
            price: paymentData.transaction_amount,
            payment_method: 'mercadopago'
          });
        } catch (analyticsError) {
          console.error('Error tracking analytics:', analyticsError);
        }
        
        // Send notification to user
        try {
          const { notificationService } = await import('@/services/notificationService');
          await notificationService.createPremiumNotification(userId, 'activated');
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
        }
      }
    }
    
    // Handle subscription webhooks
    if (data.type === 'subscription' && data.data) {
      const subscriptionData = data.data;
      
      if (subscriptionData.status === 'authorized') {
        // Handle subscription authorization
        console.log('Subscription authorized:', subscriptionData.id);
      }
    }
    
  } catch (error) {
    console.error('Error processing webhook data:', error);
    throw error;
  }
}

/**
 * POST /api/webhooks/mercadopago
 * Recibe notificaciones IPN/Webhook de Mercado Pago.
 * Valida firma y procesa el webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);
    
    // Get signature from headers
    const signature = request.headers.get('x-signature') || 
                     request.headers.get('X-Signature') ||
                     request.headers.get('X-Hub-Signature-256');
    
    // Validate webhook signature in production
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret && process.env.NODE_ENV === 'production') {
      if (!validateWebhookSignature(body, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ 
          error: 'Invalid signature',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      }
    }
    
    console.log('Webhook Mercado Pago recibido:', {
      timestamp: new Date().toISOString(),
      type: data.type,
      action: data.action,
      signature: signature ? 'present' : 'missing',
      data: data
    });

    // Process different webhook types
    switch (data.type) {
      case 'payment':
        await processWebhookData(data);
        break;
      case 'subscription':
        await processWebhookData(data);
        break;
      default:
        console.log('Unknown webhook type:', data.type);
    }
    
    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}