
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export function EmployeeDetailsError() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-4">
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Employee Not Found</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">There was an error loading this employee's information.</p>
          <Button variant="default" asChild className="mt-4">
            <Link to="/employees">Return to Employees List</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
