import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { validateDiscountCode } from "../services/discountService";
import {
  createDummyCheckoutSession,
  processDummyPayment,
  SUBSCRIPTION_PLANS,
  getPlanById,
  formatPrice,
  calculateFinalPrice,
  validateDummyConfig,
  type SubscriptionPlan,
} from "../services/dummyCheckoutService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "../services/supabase";

export interface DummyCheckoutProps {
  onSubscribe?: (planId: string, discountCode?: string) => Promise<void>;
  onComplete?: (transactionDetails: any) => void;
}

export function DummyCheckout({ onSubscribe, onComplete }: DummyCheckoutProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showAnnual, setShowAnnual] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [paymentError, setPaymentError] = useState("");

  // Calculate the final price after discount
  const finalPrice = selectedPlan
    ? calculateFinalPrice(selectedPlan.price, discountAmount).toFixed(2)
    : "0.00";

  // Handle discount code validation
  const handleValidateCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setIsValidatingCode(true);
    setDiscountError("");

    try {
      const discountInfo = await validateDiscountCode(discountCode);

      if (discountInfo) {
        setDiscountAmount(discountInfo.percent_off ?? 0);
        setDiscountError("");
      } else {
        setDiscountAmount(0);
        setDiscountError("Invalid or expired discount code");
      }
    } catch (error) {
      console.error("Error validating discount code:", error);
      setDiscountError("Error validating code. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Handle subscription submission
  const handleSubscribe = async () => {
    if (!selectedPlan || !user) {
      return;
    }

    setIsSubscribing(true);
    setPaymentStatus("idle");
    setPaymentError("");

    try {
      // Validate dummy configuration
      validateDummyConfig();

      // Create dummy checkout session
      const session = await createDummyCheckoutSession(
        selectedPlan.id,
        user.id,
        discountCode || undefined,
      );

      // Show payment modal
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Subscription error:", error);
      setPaymentError(
        error instanceof Error ? error.message : "An error occurred",
      );

      // Fallback to callback if dummy checkout fails
      if (onSubscribe) {
        await onSubscribe(selectedPlan.id, discountCode);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // Process dummy payment
  const handleProcessPayment = async () => {
    if (!selectedPlan || !user) return;

    setIsProcessingPayment(true);
    setPaymentStatus("processing");

    try {
      // Create session first
      const session = await createDummyCheckoutSession(
        selectedPlan.id,
        user.id,
        discountCode || undefined,
      );

      // Process dummy payment
      const paymentResult = await processDummyPayment(session.id, "card");

      if (paymentResult.success) {
        setPaymentStatus("success");

        // Create subscription record in database
        await supabase.from("subscriptions").insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            Date.now() +
              (selectedPlan.period === "month" ? 30 : 365) *
                24 *
                60 *
                60 *
                1000,
          ).toISOString(),
          stripe_subscription_id: paymentResult.transactionId, // Use transaction ID as subscription ID
          discount_code: discountCode || null,
          created_at: new Date().toISOString(),
        });

        // Create commission record if discount code was used
        if (discountCode) {
          try {
            const { data: discountData } = await supabase
              .from("discount_codes")
              .select("employee_id")
              .eq("code", discountCode.toUpperCase())
              .single();

            if (discountData?.employee_id) {
              await supabase.from("commissions").insert({
                employee_id: discountData.employee_id,
                user_id: user.id,
                subscription_id: paymentResult.transactionId,
                plan_id: selectedPlan.id,
                commission_amount: selectedPlan.price * 0.1, // 10% commission
                discount_code: discountCode,
                status: "paid",
                created_at: new Date().toISOString(),
              });

              // Update discount code usage
              await supabase
                .from("discount_codes")
                .update({
                  usage_count: supabase.rpc("increment", { amount: 1 }),
                })
                .eq("code", discountCode.toUpperCase());
            }
          } catch (commissionError) {
            console.error("Error creating commission record:", commissionError);
          }
        }

        // Call completion callback
        if (onComplete) {
          onComplete(paymentResult);
        }

        // Close modal after success
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentStatus("idle");
        }, 3000);
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setPaymentStatus("error");
      setPaymentError(
        error instanceof Error ? error.message : "Payment failed",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filter plans based on period selection
  const filteredPlans = SUBSCRIPTION_PLANS.filter((plan) =>
    showAnnual ? plan.period === "year" : plan.period === "month",
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Choose Your Subscription Plan
        </h2>
        <p className="text-gray-600">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⚠️ Demo Mode - No actual charges
          </span>
        </p>
      </div>

      {/* Period toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-full flex items-center">
          <button
            className={`px-4 py-2 rounded-full ${!showAnnual ? "bg-blue-600 text-white" : "text-gray-700"}`}
            onClick={() => setShowAnnual(false)}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-full ${showAnnual ? "bg-blue-600 text-white" : "text-gray-700"}`}
            onClick={() => setShowAnnual(true)}
          >
            Annual (Save 15%)
          </button>
        </div>
      </div>

      {/* Plans selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedPlan?.id === plan.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold mb-4">
              {formatPrice(plan.price)}
              <span className="text-sm font-normal text-gray-600">
                /{plan.period === "month" ? "month" : "year"}
              </span>
            </p>

            <ul className="mb-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start mb-2">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${selectedPlan?.id === plan.id ? "bg-blue-600" : "bg-gray-200 text-gray-700"}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {selectedPlan?.id === plan.id ? "Selected" : "Select Plan"}
            </Button>
          </div>
        ))}
      </div>

      {/* Discount code section */}
      {selectedPlan && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Have a discount code?</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-grow"
              disabled={isValidatingCode}
              autoComplete="off"
            />
            <Button
              onClick={handleValidateCode}
              disabled={isValidatingCode || !discountCode.trim()}
              className="bg-blue-600"
            >
              {isValidatingCode ? "Validating..." : "Apply"}
            </Button>
          </div>

          {discountError && (
            <p className="text-red-500 mt-2 text-sm">{discountError}</p>
          )}

          {discountAmount > 0 && (
            <p className="text-green-500 mt-2">
              Discount applied: {discountAmount}% off
            </p>
          )}
        </div>
      )}

      {/* Summary and checkout section */}
      {selectedPlan && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Plan:</span>
            <span>
              {selectedPlan.name} ({formatPrice(selectedPlan.price)})
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-center mb-4 text-green-600">
              <span className="font-medium">Discount:</span>
              <span>
                -{formatPrice((selectedPlan.price * discountAmount) / 100)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mb-6 text-lg font-bold">
            <span>Total:</span>
            <span>
              ${finalPrice}/{selectedPlan.period === "month" ? "month" : "year"}
            </span>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing
              ? "Preparing checkout..."
              : `Subscribe Now - $${finalPrice}/${selectedPlan.period === "month" ? "month" : "year"} (Demo)`}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            <strong>Demo Mode:</strong> No actual payment will be processed.
            This is for testing the subscription flow and commission system.
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Demo Payment Processing</h3>

            {paymentStatus === "idle" && (
              <div>
                <p className="mb-6">
                  Processing payment for {selectedPlan.name} plan - $
                  {finalPrice}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment
                      ? "Processing..."
                      : "Complete Demo Payment"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Processing payment...</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <p className="text-green-600 font-medium mb-2">
                  Payment Successful!
                </p>
                <p className="text-sm text-gray-600">Subscription activated</p>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">Payment Failed</p>
                <p className="text-sm text-gray-600 mb-4">{paymentError}</p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleProcessPayment}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DummyCheckout;
