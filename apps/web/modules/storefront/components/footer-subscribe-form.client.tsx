"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@shopvendly/ui/components/button";
import { Input } from "@shopvendly/ui/components/input";

export function FooterSubscribeForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event: FormEvent) => {
    event.preventDefault();
    setSubscribed(true);
    setPhoneNumber("");
  };

  if (subscribed) {
    return <p className="text-sm text-foreground">Thanks for subscribing!</p>;
  }

  return (
    <form onSubmit={handleSubscribe} className="space-y-3">
      <Input
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        placeholder="Your phone number"
        required
        className="w-full px-4 py-3 text-sm rounded border border-border bg-background text-foreground transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      />
      <Button
        type="submit"
        className="w-full h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors duration-200"
      >
        Subscribe
      </Button>
    </form>
  );
}
