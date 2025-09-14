"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import z from "zod";

import Button from "@/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/form";
import Input from "@/components/input";
import Logo from "@/components/logo";
import View from "@/components/view";
import { inngest } from "@/inngest/client";

const formSchema = z.object({
  url: z.string().min(1, { message: "Please enter a URL" }).url({ message: "Please enter a valid URL" }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const formState = useFormState(form);

  async function handleSubmit({ url }: FormSchema) {
    const eventResult = await inngest.send({
      name: "zillow/parse.run",
      data: { url },
    });
    console.log(eventResult);
    router.push(`/processing/${eventResult.ids[0]}`);
  }

  return (
    <View className="items-center gap-12">
      <Logo />
      {error && <p className="text-error-400 text-sm">{error}</p>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 w-full">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} type="url" placeholder="Enter a listing URL" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="primary" size="xl" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Generating Post..." : "Generate Post"}
          </Button>
        </form>
      </Form>
    </View>
  );
}
