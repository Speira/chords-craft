"use client";

import { useState } from "react";

import { Note, Section } from "@speira/chordschart-shared/valueObjects";

import { Button, Input } from "~/components";
import { Logger } from "~/lib/logger";

import { useCreateChart } from "./hooks";

export function CreateChart() {
  const { createChart, error, loading } = useCreateChart();
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const chart = await createChart({
        title,
        root: Note.C,
        sections: { [Section.Verse]: [] },
        plan: [Section.Verse],
        tags: [],
        links: [],
      });

      Logger.info("Chart created:", chart);
      // Redirect or show success
    } catch (err) {
      Logger.error("Failed to create chart:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="chart.title"
        required
      />

      {error && <p className="text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Chart"}
      </Button>
    </form>
  );
}
