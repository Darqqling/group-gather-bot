
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, MessageCircle } from "lucide-react";

const Help = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions about the Telegram bot administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  How do I set up the Telegram bot?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    To set up your Telegram bot, go to BotFather on Telegram and create a new bot.
                    Copy the API token and add it to the API Keys section in your admin panel settings.
                    Then configure your webhook URL and enable it to start receiving updates.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  How do users create a new collection?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Users can create a new collection by sending the /new command to the bot.
                    The bot will guide them through a step-by-step process to collect all the necessary information
                    such as collection name, description, target amount, and deadline.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  What happens when a collection is finished?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    When a collection is finished using the /finish command, all participants receive a notification
                    about the completion. The collection status is changed to "finished" and no more payments
                    can be added. The organizer can see a summary of all contributions.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  How can I view error logs?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Error logs are available in the "Error Logs" section of the admin panel.
                    You can filter logs by level (info, warning, error), by command type, 
                    or by time range. This helps you troubleshoot issues with the bot.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>
                  Can I customize the bot messages?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can customize the welcome message and other bot responses in the
                    "Bot Settings" tab under Settings. You can also enable or disable specific
                    commands based on your needs.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Get help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="subject" placeholder="What do you need help with?" />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Access our detailed documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  Getting Started Guide
                </Button>
                <Button variant="outline" className="justify-start">
                  Bot Command Reference
                </Button>
                <Button variant="outline" className="justify-start">
                  Webhook Configuration
                </Button>
                <Button variant="outline" className="justify-start">
                  API Documentation
                </Button>
              </div>
              <div className="pt-2 border-t">
                <Button variant="link" className="p-0 h-auto text-primary">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Join our community chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
