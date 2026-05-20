import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createProjectAction } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-semibold">New project</h1>
      <p className="mb-6 text-sm text-text-secondary">
        A project is the contract or assignment you'll log monthly experience against.
      </p>

      <Card>
        <form action={createProjectAction} className="space-y-4">
          <div>
            <Label htmlFor="project_name">Project name *</Label>
            <Input id="project_name" name="project_name" required maxLength={200} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="client">Client</Label>
              <Input id="client" name="client" maxLength={200} />
            </div>
            <div>
              <Label htmlFor="employer">Employer</Label>
              <Input id="employer" name="employer" maxLength={200} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" maxLength={200} />
            </div>
            <div>
              <Label htmlFor="contract_type">Contract type</Label>
              <Input
                id="contract_type"
                name="contract_type"
                placeholder="e.g. JBCC PBA, FIDIC Red Book, NEC4 ECC"
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div>
              <Label htmlFor="end_date">End date (or leave blank)</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>

          <div>
            <Label htmlFor="user_role">Your role on this project</Label>
            <Input id="user_role" name="user_role" placeholder="e.g. Site Engineer" maxLength={200} />
          </div>

          <div>
            <Label htmlFor="project_value_zar">Project value (ZAR)</Label>
            <Input id="project_value_zar" name="project_value_zar" type="number" min="0" step="0.01" />
          </div>

          <div>
            <Label htmlFor="description">Project description</Label>
            <Textarea id="description" name="description" rows={4} />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Create project</Button>
            <a href="/projects"><Button type="button" variant="secondary">Cancel</Button></a>
          </div>
        </form>
      </Card>
    </div>
  );
}
