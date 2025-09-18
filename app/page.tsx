"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("Page mounted");
  }, []);

  return (
    <Card>
      <CardHeader>My Page</CardHeader>
      <CardContent>
        <p>Count: {count}</p>
        <Button onClick={() => setCount(count + 1)}>Increment</Button>
        <Input placeholder="Type something..." />
      </CardContent>
    </Card>
  );
}
