import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getActiveWorkspace } from "@/lib/workspace";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createWorkspaceAction } from "./actions";

export default async function OnboardingPage() {
  await requireUser();
  if (await getActiveWorkspace()) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="w-full text-center">
        <h1 className="text-2xl font-semibold">Create your workspace</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your workspace is a private space for your monthly logs, evidence, and reports. You can
          invite colleagues, mentors, or reviewers later.
        </p>
      </div>

      <Card className="w-full">
        <form action={createWorkspaceAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              autoFocus
              placeholder="e.g. My PrEng candidacy"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Usually your name + the registration track. You can rename this later.
            </p>
          </div>

          <div>
            <Label htmlFor="track">Default registration track</Label>
            <Select id="track" name="track" defaultValue="ECSA" required>
              <option value="ECSA">ECSA — Engineering Council of South Africa (PrEng)</option>
              <option value="SACPCMP">SACPCMP — Construction Management (PrCM)</option>
            </Select>
            <p className="mt-1 text-xs text-text-secondary">
              You can switch between tracks per monthly log.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Create workspace
          </Button>
        </form>
      </Card>
    </div>
  );
}
