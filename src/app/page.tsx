"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "next/navigation";
import { useForm, useFormState } from "react-hook-form";
import z from "zod";
import Button from "@/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/form";
import Input from "@/components/input";
import Logo from "@/components/logo";
import View from "@/components/view";
import { PARSE_ZILLOW_PROPERTY_EVENT } from "@/constants/events";
import useTriggerInngestEvent from "@/hooks/use-trigger-inngest-event";

const formSchema = z.object({
  url: z.string().min(1, { message: "Please enter a URL" }).url({ message: "Please enter a valid URL" }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function Home() {
  const router = useRouter();
  const triggerInngestEvent = useTriggerInngestEvent();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const formState = useFormState(form);

  async function handleSubmit({ url }: FormSchema) {
    const { eventId } = await triggerInngestEvent(PARSE_ZILLOW_PROPERTY_EVENT, { url });
    router.push(`/processing/progress/scraping/${eventId}`);
  }

  return (
    <View className="items-center gap-12">
      <Logo />
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
