import { PricingTable } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import billingConfig from "../../../billing.json";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function BillingPage() {
  const { has } = await auth();
  const user = await currentUser();

  const isPro =
    user?.publicMetadata?.plan === "pro" ||
    user?.publicMetadata?.stripeSubscriptionStatus === "active" ||
    user?.publicMetadata?.pro === true ||
    // @ts-ignore
    has?.({ plan: "pro" }) ||
    // @ts-ignore
    has?.({ feature: "pro" }) ||
    has?.({ permission: "pro" }) ||
    has?.({ role: "pro" });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-sidebar/50 overflow-hidden">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      
      <div className="text-center mb-8 space-y-2 mt-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {isPro ? (
            <>Manage your <span className="text-primary">Subscription</span></>
          ) : (
            <>Upgrade to <span className="text-primary">Curate Pro</span></>
          )}
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          {isPro 
            ? "View your current plan features, update your payment details, or switch to a different plan."
            : "Get unlimited projects, advanced AI models, custom domains, and priority support."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
        {billingConfig.plans.map((plan) => (
          <div key={plan.id} className="rounded-xl border bg-card/50 p-6 shadow-sm backdrop-blur-sm flex flex-col">
            <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">/{plan.interval}</span>
            </div>
            <ul className="space-y-2 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckIcon className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl rounded-xl border bg-card/50 p-4 shadow-xl backdrop-blur-sm flex flex-col items-center">
        <div className="mb-2 text-center">
          <h2 className="text-lg font-medium">Select your plan</h2>
        </div>
        <div className="w-full">
          <PricingTable />
        </div>
      </div>
    </div>
  );
}
